import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { apiClient } from '@tests/setup'
import { cleanupPlayer, givenPlayerExists } from '@tests/api/common-players'
import { cleanupTeam, givenTeamExists } from '@tests/api/common-teams'
import { cleanupTournament, givenTournamentExists } from '@tests/api/common-tournaments'
import {
  GameStatsApiModel,
  GameLogApiModel,
  ItemsWithPagination_MatchApiModel_,
  MatchApiModel,
  PlayerApiModel,
  PlayerAttributesApiModel,
  PlayerRole,
  RoundStateApiModel,
  Weapon,
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

interface LogValidationContext {
  expectedGameId: number
  expectedRound: number
  allPlayerIds: Set<number>
  playerTeamById: Map<number, number>
  playerRoleById: Map<number, PlayerRole>
}

const PLAYER_ATTRIBUTE_KEYS: Array<keyof PlayerAttributesApiModel> = [
  'clutch',
  'awareness',
  'aim',
  'positioning',
  'game_reading',
  'resilience',
  'confidence',
  'strategy',
  'adaptability',
  'communication',
  'unpredictability',
  'game_sense',
  'decision_making',
  'rage_fuel',
  'teamwork',
  'utility_usage',
]

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

const assertPlayerAttributesPayload = (attributes: PlayerAttributesApiModel): void => {
  for (const attributeKey of PLAYER_ATTRIBUTE_KEYS) {
    expect(Number.isFinite(attributes[attributeKey])).toBe(true)
    expect(attributes[attributeKey]).toBeGreaterThanOrEqual(0)
    expect(attributes[attributeKey]).toBeLessThanOrEqual(3)
  }
}

const assertPlayerPayload = (
  player: PlayerApiModel,
  expectedPlayerId: number,
  expectedTeamId: number,
  expectedRole: PlayerRole,
): void => {
  expect(player.id).toBe(expectedPlayerId)
  expect(player.team_id).toBe(expectedTeamId)
  expect(player.role).toBe(expectedRole)
  expect(player.nickname.length).toBeGreaterThan(0)
  expect(player.full_name.length).toBeGreaterThan(0)
  expect(player.age).toBeGreaterThan(0)
  expect(player.country.length).toBeGreaterThan(0)
  assertPlayerAttributesPayload(player.player_attributes)
}

const assertRoundStatePayload = (
  roundState: RoundStateApiModel,
  expectedRound: number,
  fixture: MatchFixture,
  allPlayerIds: Set<number>,
): void => {
  expect(roundState.round).toBe(expectedRound)
  expect(roundState.finished).toBe(true)
  expect(roundState.team_won).not.toBeNull()
  expect(roundState.team_won?.id).toBeDefined()
  expect([fixture.team1.teamId, fixture.team2.teamId]).toContain(roundState.team_won?.id)

  const totalAlivePlayers = roundState.team1_alive_players.length + roundState.team2_alive_players.length
  expect(totalAlivePlayers).toBeGreaterThanOrEqual(1)
  expect(totalAlivePlayers).toBeLessThanOrEqual(9)
  expect(
    roundState.team1_alive_players.length === 0 || roundState.team2_alive_players.length === 0,
  ).toBe(true)

  for (const alivePlayer of roundState.team1_alive_players) {
    expect(alivePlayer.id).toBeDefined()
    expect(allPlayerIds.has(alivePlayer.id!)).toBe(true)
    assertPlayerAttributesPayload(alivePlayer.player_attributes)
  }
  for (const alivePlayer of roundState.team2_alive_players) {
    expect(alivePlayer.id).toBeDefined()
    expect(allPlayerIds.has(alivePlayer.id!)).toBe(true)
    assertPlayerAttributesPayload(alivePlayer.player_attributes)
  }

  expect(roundState.duel.winner).not.toBeNull()
  expect(roundState.duel.loser).not.toBeNull()
  expect(typeof roundState.duel.startedTradeDuel).toBe('boolean')
  expect(roundState.previous_duel).toBeDefined()
}

const assertGameLogPayload = (
  log: GameLogApiModel,
  context: LogValidationContext,
): number => {
  expect(log.id).toBeDefined()
  expect(log.id).toBeGreaterThan(0)
  expect(log.game_id).toBe(context.expectedGameId)
  expect(log.round_state.round).toBe(context.expectedRound)
  expect(typeof log.trade).toBe('boolean')
  expect(typeof log.included_on_player_stats).toBe('boolean')
  expect(typeof log.included_on_team_stats).toBe('boolean')
  expect(Object.values(Weapon)).toContain(log.weapon)
  expect(Number.isFinite(log.duel_buff)).toBe(true)
  expect(Number.isFinite(log.trade_buff)).toBe(true)

  expect(context.allPlayerIds.has(log.team1_player_id)).toBe(true)
  expect(context.allPlayerIds.has(log.team2_player_id)).toBe(true)
  expect(context.allPlayerIds.has(log.player_killed_id)).toBe(true)
  expect(log.team1_player_id).not.toBe(log.team2_player_id)
  expect([log.team1_player_id, log.team2_player_id]).toContain(log.player_killed_id)

  expect(log.team1_player).toBeDefined()
  expect(log.team2_player).toBeDefined()
  if (!log.team1_player || !log.team2_player) {
    throw new Error(`Missing embedded player payload in game log ${log.id}`)
  }

  const team1PlayerTeamId = context.playerTeamById.get(log.team1_player_id)
  const team2PlayerTeamId = context.playerTeamById.get(log.team2_player_id)
  const team1PlayerRole = context.playerRoleById.get(log.team1_player_id)
  const team2PlayerRole = context.playerRoleById.get(log.team2_player_id)

  if (!team1PlayerTeamId || !team2PlayerTeamId || !team1PlayerRole || !team2PlayerRole) {
    throw new Error(`Missing team/role mapping for game log ${log.id}`)
  }

  assertPlayerPayload(log.team1_player, log.team1_player_id, team1PlayerTeamId, team1PlayerRole)
  assertPlayerPayload(log.team2_player, log.team2_player_id, team2PlayerTeamId, team2PlayerRole)

  const duelWinner = log.round_state.duel.winner
  const duelLoser = log.round_state.duel.loser
  if (!duelWinner || !duelLoser || !duelWinner.id || !duelLoser.id) {
    throw new Error(`Missing duel winner/loser payload in game log ${log.id}`)
  }

  expect(duelLoser.id).toBe(log.player_killed_id)
  const expectedWinnerId = duelLoser.id === log.team1_player_id ? log.team2_player_id : log.team1_player_id
  expect(duelWinner.id).toBe(expectedWinnerId)
  expect(context.allPlayerIds.has(duelWinner.id)).toBe(true)
  expect(context.allPlayerIds.has(duelLoser.id)).toBe(true)
  expect(typeof log.round_state.duel.startedTradeDuel).toBe('boolean')

  const winnerRole = context.playerRoleById.get(duelWinner.id)
  if (!winnerRole) {
    throw new Error(`Missing winner role for player ${duelWinner.id}`)
  }

  expect(log.duel_buff).toBe(DUEL_WIN_BUFF_BY_ROLE[winnerRole])
  expect(log.trade_buff).toBe(TRADE_WIN_BUFF_BY_ROLE[winnerRole])
  return duelWinner.id
}

const assertGameStatsPayload = async (
  fixture: MatchFixture,
  allPlayerIds: Set<number>,
  expectedRoundsPlayed: number,
  expectedDuelsPlayed: number,
): Promise<void> => {
  const gameStats = await apiClient.default.getGameStats(fixture.gameId) as GameStatsApiModel
  expect(gameStats.game_id).toBe(fixture.gameId)
  expect([fixture.team1.teamId, fixture.team2.teamId]).toContain(gameStats.team1_id)
  expect([fixture.team1.teamId, fixture.team2.teamId]).toContain(gameStats.team2_id)
  expect(gameStats.team1?.id).toBe(gameStats.team1_id)
  expect(gameStats.team2?.id).toBe(gameStats.team2_id)
  expect(gameStats.team1?.short_name?.length).toBeGreaterThan(0)
  expect(gameStats.team2?.short_name?.length).toBeGreaterThan(0)

  expect(gameStats.players_stats_team1).toBeDefined()
  expect(gameStats.players_stats_team2).toBeDefined()
  expect(gameStats.players_stats_team1).toHaveLength(5)
  expect(gameStats.players_stats_team2).toHaveLength(5)
  if (!gameStats.players_stats_team1 || !gameStats.players_stats_team2) {
    throw new Error(`Missing player stats payload for game ${fixture.gameId}`)
  }

  const allPlayerStats = [
    ...gameStats.players_stats_team1,
    ...gameStats.players_stats_team2,
  ]

  let totalKills = 0
  let totalDeaths = 0
  for (const playerStats of allPlayerStats) {
    expect(allPlayerIds.has(playerStats.player_id)).toBe(true)
    expect(playerStats.kills).toBeGreaterThanOrEqual(0)
    expect(playerStats.deaths).toBeGreaterThanOrEqual(0)
    expect(playerStats.assists).toBeGreaterThanOrEqual(0)
    expect(playerStats.player?.id).toBe(playerStats.player_id)
    expect(playerStats.player?.nickname.length).toBeGreaterThan(0)
    totalKills += playerStats.kills
    totalDeaths += playerStats.deaths
  }

  expect(totalKills).toBe(expectedDuelsPlayed)
  expect(totalDeaths).toBe(expectedDuelsPlayed)
  expect(gameStats.team1_score + gameStats.team2_score).toBe(expectedRoundsPlayed)
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
      const allPlayerIds = new Set([...fixture!.team1.playerIds, ...fixture!.team2.playerIds])
      const playerTeamById = new Map<number, number>([
        ...fixture!.team1.playerIds.map(playerId => [playerId, fixture!.team1.teamId] as const),
        ...fixture!.team2.playerIds.map(playerId => [playerId, fixture!.team2.teamId] as const),
      ])
      const playerRoleById = new Map<number, PlayerRole>([
        ...fixture!.team1.playerIds.map(playerId => [playerId, PlayerRole.IGL] as const),
        ...fixture!.team2.playerIds.map(playerId => [playerId, PlayerRole.IGL] as const),
      ])
      let team1DuelWins = 0
      let totalDuels = 0
      let team1RoundWins = 0

      for (let round = 1; round <= roundsToPlay; round += 1) {
        const roundState = await apiClient.default.playRound(fixture!.gameId, round)
        assertRoundStatePayload(roundState, round, fixture!, allPlayerIds)

        const roundLogs = await apiClient.default.getRound(fixture!.gameId, round)
        expect(roundLogs.length).toBeGreaterThanOrEqual(5)
        expect(roundLogs.length).toBeLessThanOrEqual(9)

        const lastDuel = await apiClient.default.getLastDuel(fixture!.gameId)
        expect(lastDuel).not.toBeNull()
        if (!lastDuel) {
          throw new Error(`Missing last duel for game ${fixture!.gameId}`)
        }
        expect(lastDuel.id).toBe(roundLogs[0].id)

        for (const log of roundLogs) {
          assertGameLogPayload(log, {
            expectedGameId: fixture!.gameId,
            expectedRound: round,
            allPlayerIds,
            playerTeamById,
            playerRoleById,
          })

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
      await assertGameStatsPayload(fixture!, allPlayerIds, roundsToPlay, totalDuels)
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
      const allPlayerIds = new Set([...fixture!.team1.playerIds, ...fixture!.team2.playerIds])
      const playerTeamById = new Map<number, number>([
        ...fixture!.team1.playerIds.map(playerId => [playerId, fixture!.team1.teamId] as const),
        ...fixture!.team2.playerIds.map(playerId => [playerId, fixture!.team2.teamId] as const),
      ])
      const playerRoleById = new Map<number, PlayerRole>([
        [fixture!.team1.playerIds[0], PlayerRole.DUELIST],
        ...fixture!.team1.playerIds.slice(1).map(playerId => [playerId, PlayerRole.IGL] as const),
        ...fixture!.team2.playerIds.map(playerId => [playerId, PlayerRole.IGL] as const),
      ])
      let firstDuelCount = 0
      let team1DuelistSelectedCount = 0
      let totalDuels = 0

      for (let round = 1; round <= roundsToPlay; round += 1) {
        const roundState = await apiClient.default.playRound(fixture!.gameId, round)
        assertRoundStatePayload(roundState, round, fixture!, allPlayerIds)

        const roundLogs = await apiClient.default.getRound(fixture!.gameId, round)
        expect(roundLogs.length).toBeGreaterThanOrEqual(5)
        expect(roundLogs.length).toBeLessThanOrEqual(9)

        const lastDuel = await apiClient.default.getLastDuel(fixture!.gameId)
        expect(lastDuel).not.toBeNull()
        if (!lastDuel) {
          throw new Error(`Missing last duel for game ${fixture!.gameId}`)
        }
        expect(lastDuel.id).toBe(roundLogs[0].id)

        for (const log of roundLogs) {
          assertGameLogPayload(log, {
            expectedGameId: fixture!.gameId,
            expectedRound: round,
            allPlayerIds,
            playerTeamById,
            playerRoleById,
          })
        }

        const firstDuelLog = roundLogs[roundLogs.length - 1]

        if (firstDuelLog.team1_player_id === team1DuelistId) {
          team1DuelistSelectedCount += 1
        }
        firstDuelCount += 1
        totalDuels += roundLogs.length
      }

      const duelistPickRate = team1DuelistSelectedCount / firstDuelCount
      expect(firstDuelCount).toBe(roundsToPlay)
      expect(duelistPickRate).toBeGreaterThanOrEqual(0.50)
      await assertGameStatsPayload(fixture!, allPlayerIds, roundsToPlay, totalDuels)
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
      const allPlayerIds = new Set([...fixture!.team1.playerIds, ...fixture!.team2.playerIds])
      const playerTeamById = new Map<number, number>([
        ...fixture!.team1.playerIds.map(playerId => [playerId, fixture!.team1.teamId] as const),
        ...fixture!.team2.playerIds.map(playerId => [playerId, fixture!.team2.teamId] as const),
      ])
      const roleByPlayerId = new Map<number, PlayerRole>([
        ...fixture!.team1.playerIds.map(playerId => [playerId, PlayerRole.DUELIST] as const),
        [team2DuelistId, PlayerRole.DUELIST],
        ...fixture!.team2.playerIds.slice(1).map(playerId => [playerId, PlayerRole.IGL] as const),
      ])

      let totalTradeDuels = 0
      let team1TradeWins = 0
      let team1InitiatedTradeDuels = 0
      let team2DuelistSelectionOpportunities = 0
      let team2DuelistSelectedOnTeam1InitiatedTrades = 0
      let accumulatedExpectedTeam2DuelistSelectionRate = 0
      let totalDuels = 0

      for (let round = 1; round <= roundsToPlay; round += 1) {
        const roundState = await apiClient.default.playRound(fixture!.gameId, round)
        assertRoundStatePayload(roundState, round, fixture!, allPlayerIds)

        const roundLogs = await apiClient.default.getRound(fixture!.gameId, round)
        expect(roundLogs.length).toBeGreaterThanOrEqual(5)
        expect(roundLogs.length).toBeLessThanOrEqual(9)

        const lastDuel = await apiClient.default.getLastDuel(fixture!.gameId)
        expect(lastDuel).not.toBeNull()
        if (!lastDuel) {
          throw new Error(`Missing last duel for game ${fixture!.gameId}`)
        }
        expect(lastDuel.id).toBe(roundLogs[0].id)

        const roundLogsChronological = [...roundLogs].reverse()
        const team1AlivePlayerIds = new Set(fixture!.team1.playerIds)
        const team2AlivePlayerIds = new Set(fixture!.team2.playerIds)

        for (const log of roundLogsChronological) {
          assertGameLogPayload(log, {
            expectedGameId: fixture!.gameId,
            expectedRound: round,
            allPlayerIds,
            playerTeamById,
            playerRoleById: roleByPlayerId,
          })

          const isTradeDuel = Boolean(log.round_state.previous_duel?.startedTradeDuel)
          if (!isTradeDuel) {
            team1AlivePlayerIds.delete(log.player_killed_id)
            team2AlivePlayerIds.delete(log.player_killed_id)
            totalDuels += 1
            continue
          }

          totalTradeDuels += 1
          const winnerTeamId = winnerTeamIdForLog(log, team1PlayerIds, team2PlayerIds, fixture!.team1.teamId, fixture!.team2.teamId)
          if (winnerTeamId === fixture!.team1.teamId) {
            team1TradeWins += 1
          }

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
          totalDuels += 1
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
      await assertGameStatsPayload(fixture!, allPlayerIds, roundsToPlay, totalDuels)
    }, 120000)
  })
})
