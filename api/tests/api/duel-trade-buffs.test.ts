import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { apiClient } from '@tests/setup'
import { cleanupPlayer, givenPlayerExists } from '@tests/api/common-players'
import { cleanupTeam, givenTeamExists } from '@tests/api/common-teams'
import { cleanupTournament, givenTournamentExists } from '@tests/api/common-tournaments'
import {
  GameLogApiModel,
  ItemsWithPagination_MatchApiModel_,
  MatchApiModel,
  PlayerAttributesApiModel,
  PlayerRole,
} from '@tests/generated/api'

interface TeamFixture {
  teamId: number
  playerIds: number[]
}

interface MatchFixture {
  tournamentId: number
  matchId: number
  gameId: number
  team1: TeamFixture
  team2: TeamFixture
}

const DUEL_WIN_BUFF_BY_ROLE: Record<PlayerRole, number> = {
  [PlayerRole.DUELIST]: 0.30,
  [PlayerRole.CONTROLLER]: 0.05,
  [PlayerRole.FLEX]: 0.15,
  [PlayerRole.INITIATOR]: 0.25,
  [PlayerRole.IGL]: 0.0,
  [PlayerRole.SENTINEL]: 0.05,
}

const TRADE_WIN_BUFF_BY_ROLE: Record<PlayerRole, number> = {
  [PlayerRole.DUELIST]: 0.40,
  [PlayerRole.CONTROLLER]: 0.15,
  [PlayerRole.FLEX]: 0.35,
  [PlayerRole.INITIATOR]: 0.20,
  [PlayerRole.IGL]: 0.10,
  [PlayerRole.SENTINEL]: 0.20,
}

const ALL_MAX_ATTRIBUTES: PlayerAttributesApiModel = {
  clutch: 3,
  awareness: 3,
  aim: 3,
  positioning: 3,
  game_reading: 3,
  resilience: 3,
  confidence: 3,
  strategy: 3,
  adaptability: 3,
  communication: 3,
  unpredictability: 3,
  game_sense: 3,
  decision_making: 3,
  rage_fuel: 3,
  teamwork: 3,
  utility_usage: 3,
}

const ALL_MID_ATTRIBUTES: PlayerAttributesApiModel = {
  clutch: 2,
  awareness: 2,
  aim: 2,
  positioning: 2,
  game_reading: 2,
  resilience: 2,
  confidence: 2,
  strategy: 2,
  adaptability: 2,
  communication: 2,
  unpredictability: 2,
  game_sense: 2,
  decision_making: 2,
  rage_fuel: 2,
  teamwork: 2,
  utility_usage: 2,
}

const ALL_LOW_ATTRIBUTES: PlayerAttributesApiModel = {
  clutch: 0,
  awareness: 0,
  aim: 0,
  positioning: 0,
  game_reading: 0,
  resilience: 0,
  confidence: 0,
  strategy: 0,
  adaptability: 0,
  communication: 0,
  unpredictability: 0,
  game_sense: 0,
  decision_making: 0,
  rage_fuel: 0,
  teamwork: 0,
  utility_usage: 0,
}

const createTeamWithPlayers = async (
  teamLabel: string,
  playerRoleAndAttributes: Array<{ role: PlayerRole; attributes: PlayerAttributesApiModel }>,
): Promise<TeamFixture> => {
  const team = await givenTeamExists({
    short_name: teamLabel,
    full_name: `${teamLabel} Full Name`,
    country: 'Brazil',
  })

  const playerIds: number[] = []
  for (let index = 0; index < playerRoleAndAttributes.length; index += 1) {
    const player = await givenPlayerExists(team.id!, {
      nickname: `${teamLabel.toLowerCase()}_p${index + 1}`,
      role: playerRoleAndAttributes[index].role,
      player_attributes: playerRoleAndAttributes[index].attributes,
    })
    playerIds.push(player.id!)
  }

  return { teamId: team.id!, playerIds }
}

const createMatchFixture = async (
  fixtureLabel: string,
  team1Players: Array<{ role: PlayerRole; attributes: PlayerAttributesApiModel }>,
  team2Players: Array<{ role: PlayerRole; attributes: PlayerAttributesApiModel }>,
): Promise<MatchFixture> => {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`
  const team1 = await createTeamWithPlayers(`${fixtureLabel}A${suffix}`.slice(-20), team1Players)
  const team2 = await createTeamWithPlayers(`${fixtureLabel}B${suffix}`.slice(-20), team2Players)

  const tournament = await givenTournamentExists([team1.teamId, team2.teamId], {
    name: `${fixtureLabel} Tournament ${suffix}`,
    description: `${fixtureLabel} integration fixture`,
    start_date: '2026-01-01T00:00:00.000Z',
    end_date: '2026-12-31T00:00:00.000Z',
  })

  const schedule = await apiClient.default.getTournamentSchedule(tournament.id!, 10, 0) as ItemsWithPagination_MatchApiModel_
  const match = schedule.items[0] as MatchApiModel
  const games = await apiClient.default.getGamesByMatch(match.id!)

  return {
    tournamentId: tournament.id!,
    matchId: match.id!,
    gameId: games[0].id!,
    team1,
    team2,
  }
}

const cleanupFixture = async (fixture: MatchFixture | null): Promise<void> => {
  if (!fixture) {
    return
  }

  await cleanupTournament(fixture.tournamentId)

  for (const playerId of fixture.team1.playerIds) {
    await cleanupPlayer(playerId)
  }

  for (const playerId of fixture.team2.playerIds) {
    await cleanupPlayer(playerId)
  }

  await cleanupTeam(fixture.team1.teamId)
  await cleanupTeam(fixture.team2.teamId)
}

const winnerTeamIdForLog = (
  log: GameLogApiModel,
  team1PlayerIds: Set<number>,
  team2PlayerIds: Set<number>,
  team1Id: number,
  team2Id: number,
): number => {
  if (team2PlayerIds.has(log.player_killed_id)) {
    return team1Id
  }

  if (team1PlayerIds.has(log.player_killed_id)) {
    return team2Id
  }

  throw new Error(`Could not determine winner team for log ${log.id}`)
}

describe('Duel and trade mechanics (integration)', () => {
  describe('Attribute counters', () => {
    let fixture: MatchFixture | null = null

    beforeAll(async () => {
      fixture = await createMatchFixture(
        'AttrCounter',
        Array(5).fill({ role: PlayerRole.IGL, attributes: ALL_MAX_ATTRIBUTES }),
        Array(5).fill({ role: PlayerRole.IGL, attributes: ALL_LOW_ATTRIBUTES }),
      )
    })

    afterAll(async () => {
      await cleanupFixture(fixture)
    })

    it('team with strong counter-attribute profile dominates duel and round outcomes', async () => {
      const roundsToPlay = 10
      const team1PlayerIds = new Set(fixture!.team1.playerIds)
      const team2PlayerIds = new Set(fixture!.team2.playerIds)
      let team1DuelWins = 0
      let totalDuels = 0
      let team1RoundWins = 0

      for (let round = 1; round <= roundsToPlay; round += 1) {
        const roundState = await apiClient.default.playRound(fixture!.gameId, round)
        const roundLogs = await apiClient.default.getRound(fixture!.gameId, round)

        for (const log of roundLogs) {
          const winnerTeamId = winnerTeamIdForLog(log, team1PlayerIds, team2PlayerIds, fixture!.team1.teamId, fixture!.team2.teamId)
          if (winnerTeamId === fixture!.team1.teamId) {
            team1DuelWins += 1
          }
          totalDuels += 1
        }

        if (roundState.team_won?.id === fixture!.team1.teamId) {
          team1RoundWins += 1
        }
      }

      const team1DuelWinRate = team1DuelWins / totalDuels
      const team1RoundWinRate = team1RoundWins / roundsToPlay

      expect(totalDuels).toBeGreaterThan(0)
      expect(team1DuelWinRate).toBeGreaterThanOrEqual(0.85)
      expect(team1RoundWinRate).toBeGreaterThanOrEqual(0.85)
    }, 120000)
  })

  describe('Duel select buff', () => {
    let fixture: MatchFixture | null = null
    let team1DuelistId = 0

    beforeAll(async () => {
      fixture = await createMatchFixture(
        'DuelSelect',
        [
          { role: PlayerRole.DUELIST, attributes: ALL_MID_ATTRIBUTES },
          { role: PlayerRole.IGL, attributes: ALL_MID_ATTRIBUTES },
          { role: PlayerRole.IGL, attributes: ALL_MID_ATTRIBUTES },
          { role: PlayerRole.IGL, attributes: ALL_MID_ATTRIBUTES },
          { role: PlayerRole.IGL, attributes: ALL_MID_ATTRIBUTES },
        ],
        Array(5).fill({ role: PlayerRole.IGL, attributes: ALL_MID_ATTRIBUTES }),
      )
      team1DuelistId = fixture.team1.playerIds[0]
    })

    afterAll(async () => {
      await cleanupFixture(fixture)
    })

    it('higher duel-select role is chosen more often on first duel of each round', async () => {
      const roundsToPlay = 20
      let firstDuelCount = 0
      let team1DuelistSelectedCount = 0

      for (let round = 1; round <= roundsToPlay; round += 1) {
        await apiClient.default.playRound(fixture!.gameId, round)
        const roundLogs = await apiClient.default.getRound(fixture!.gameId, round)
        const firstDuelLog = roundLogs[roundLogs.length - 1]

        if (firstDuelLog.team1_player_id === team1DuelistId) {
          team1DuelistSelectedCount += 1
        }
        firstDuelCount += 1
      }

      const duelistPickRate = team1DuelistSelectedCount / firstDuelCount
      expect(firstDuelCount).toBe(roundsToPlay)
      expect(duelistPickRate).toBeGreaterThanOrEqual(0.50)
    }, 120000)
  })

  describe('Trade select and trade win buffs', () => {
    let fixture: MatchFixture | null = null
    let team2DuelistId = 0

    beforeAll(async () => {
      fixture = await createMatchFixture(
        'TradeBuff',
        Array(5).fill({ role: PlayerRole.DUELIST, attributes: ALL_MAX_ATTRIBUTES }),
        [
          { role: PlayerRole.DUELIST, attributes: ALL_MAX_ATTRIBUTES },
          { role: PlayerRole.IGL, attributes: ALL_LOW_ATTRIBUTES },
          { role: PlayerRole.IGL, attributes: ALL_LOW_ATTRIBUTES },
          { role: PlayerRole.IGL, attributes: ALL_LOW_ATTRIBUTES },
          { role: PlayerRole.IGL, attributes: ALL_LOW_ATTRIBUTES },
        ],
      )
      team2DuelistId = fixture.team2.playerIds[0]
    })

    afterAll(async () => {
      await cleanupFixture(fixture)
    })

    it('trade duels reflect select-buff bias and winning-buff dominance in outcomes', async () => {
      const roundsToPlay = 60
      const team1PlayerIds = new Set(fixture!.team1.playerIds)
      const team2PlayerIds = new Set(fixture!.team2.playerIds)
      const roleByPlayerId = new Map<number, PlayerRole>()

      for (const playerId of fixture!.team1.playerIds) {
        roleByPlayerId.set(playerId, PlayerRole.DUELIST)
      }
      roleByPlayerId.set(team2DuelistId, PlayerRole.DUELIST)
      for (const playerId of fixture!.team2.playerIds.slice(1)) {
        roleByPlayerId.set(playerId, PlayerRole.IGL)
      }

      let totalTradeDuels = 0
      let team1TradeWins = 0
      let team1InitiatedTradeDuels = 0
      let team2DuelistSelectionOpportunities = 0
      let team2DuelistSelectedOnTeam1InitiatedTrades = 0
      let accumulatedExpectedTeam2DuelistSelectionRate = 0

      for (let round = 1; round <= roundsToPlay; round += 1) {
        await apiClient.default.playRound(fixture!.gameId, round)
        const roundLogs = await apiClient.default.getRound(fixture!.gameId, round)
        const roundLogsChronological = [...roundLogs].reverse()
        const team1AlivePlayerIds = new Set(fixture!.team1.playerIds)
        const team2AlivePlayerIds = new Set(fixture!.team2.playerIds)

        for (const log of roundLogsChronological) {
          const isTradeDuel = Boolean(log.round_state.previous_duel?.startedTradeDuel)
          if (!isTradeDuel) {
            team1AlivePlayerIds.delete(log.player_killed_id)
            team2AlivePlayerIds.delete(log.player_killed_id)
            continue
          }

          totalTradeDuels += 1
          const winnerTeamId = winnerTeamIdForLog(log, team1PlayerIds, team2PlayerIds, fixture!.team1.teamId, fixture!.team2.teamId)
          if (winnerTeamId === fixture!.team1.teamId) {
            team1TradeWins += 1
          }

          const winnerPlayerId = log.player_killed_id === log.team1_player_id ? log.team2_player_id : log.team1_player_id
          const winnerRole = roleByPlayerId.get(winnerPlayerId)
          if (!winnerRole) {
            throw new Error(`Winner role missing for player ${winnerPlayerId}`)
          }

          expect(log.trade_buff).toBe(TRADE_WIN_BUFF_BY_ROLE[winnerRole])
          expect(log.duel_buff).toBe(DUEL_WIN_BUFF_BY_ROLE[winnerRole])

          const previousWinnerTeamId = log.round_state.previous_duel?.winner?.team_id
          if (previousWinnerTeamId === fixture!.team1.teamId) {
            team1InitiatedTradeDuels += 1
            if (team2AlivePlayerIds.has(team2DuelistId)) {
              const team2AliveIglCount = fixture!.team2.playerIds
                .slice(1)
                .filter(playerId => team2AlivePlayerIds.has(playerId)).length
              const expectedDuelistSelectionRate = 0.40 / (0.40 + team2AliveIglCount * 0.15)

              team2DuelistSelectionOpportunities += 1
              accumulatedExpectedTeam2DuelistSelectionRate += expectedDuelistSelectionRate
              if (log.team2_player_id === team2DuelistId) {
                team2DuelistSelectedOnTeam1InitiatedTrades += 1
              }
            }
          }

          team1AlivePlayerIds.delete(log.player_killed_id)
          team2AlivePlayerIds.delete(log.player_killed_id)
        }
      }

      const team1TradeWinRate = team1TradeWins / totalTradeDuels
      const team2DuelistTradeSelectionRate = team2DuelistSelectedOnTeam1InitiatedTrades / team2DuelistSelectionOpportunities
      const expectedTeam2DuelistSelectionRate = accumulatedExpectedTeam2DuelistSelectionRate / team2DuelistSelectionOpportunities

      expect(totalTradeDuels).toBeGreaterThanOrEqual(20)
      expect(team1TradeWinRate).toBeGreaterThanOrEqual(0.70)
      expect(team1InitiatedTradeDuels).toBeGreaterThanOrEqual(10)
      expect(team2DuelistSelectionOpportunities).toBeGreaterThanOrEqual(10)
      expect(team2DuelistTradeSelectionRate).toBeGreaterThanOrEqual(expectedTeam2DuelistSelectionRate - 0.15)
    }, 120000)
  })
})
