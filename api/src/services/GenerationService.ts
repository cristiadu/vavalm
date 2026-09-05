import { randomInt, randomUUID } from 'node:crypto'
import { ValidateError } from '@tsoa/runtime'
import db from '@/models/db'
import Team from '@/models/Team'
import Player, { PlayerAttributes } from '@/models/Player'
import Tournament from '@/models/Tournament'
import { MatchType, PlayerRole, TournamentType } from '@/models/enums'
import { GenerateDataRequest, GenerateDataResult } from '@/models/contract/GenerateDataRequest'
import TournamentService from '@/services/TournamentService'
import MatchService from '@/services/MatchService'

const countries = ['Brazil', 'Canada', 'France', 'Japan', 'Portugal', 'United States']
const adjectives = ['Crimson', 'Azure', 'Silent', 'Lunar', 'Golden', 'Neon']
const mascots = ['Falcons', 'Wolves', 'Dragons', 'Vipers', 'Titans', 'Foxes']
const firstNames = ['Alex', 'Sam', 'Kai', 'Morgan', 'Robin', 'Jordan']
const lastNames = ['Silva', 'Martin', 'Costa', 'Sato', 'Lee', 'Taylor']
const roles = [PlayerRole.DUELIST, PlayerRole.INITIATOR, PlayerRole.CONTROLLER, PlayerRole.SENTINEL, PlayerRole.IGL]

/** Picks one value from a nonempty collection. */
const pick = (values: string[]): string => values[randomInt(values.length)]

/** Generates all sixteen attributes independently in the inclusive range 0–3. */
export const generatePlayerAttributes = (): PlayerAttributes => new PlayerAttributes(
  randomInt(4), randomInt(4), randomInt(4), randomInt(4),
  randomInt(4), randomInt(4), randomInt(4), randomInt(4),
  randomInt(4), randomInt(4), randomInt(4), randomInt(4),
  randomInt(4), randomInt(4), randomInt(4), randomInt(4),
)

/** Creates complete five-player rosters and round-robin tournaments atomically. */
export const generateData = async (request: GenerateDataRequest): Promise<GenerateDataResult> => {
  if (!Number.isInteger(request.teamCount) || request.teamCount < 2 || request.teamCount > 32
    || !Number.isInteger(request.tournamentCount) || request.tournamentCount < 0 || request.tournamentCount > 10) {
    throw new ValidateError({ request: { message: 'Choose 2–32 teams and 0–10 tournaments' } }, 'Invalid generation counts')
  }
  const start = new Date(request.start_date ?? '')
  const end = new Date(request.end_date ?? '')
  if (request.tournamentCount > 0 && (!Number.isFinite(start.getTime())
    || !Number.isFinite(end.getTime()) || end <= start)) {
    throw new ValidateError({
      dates: { message: 'Valid start and end dates are required, with the end after the start' },
    }, 'Invalid tournament dates')
  }
  return db.sequelize.transaction(async transaction => {
    const result: GenerateDataResult = { teamIds: [], playerIds: [], tournamentIds: [] }
    for (let index = 0; index < request.teamCount; index++) {
      const country = pick(countries)
      const team = await Team.create({
        short_name: `GEN-${randomUUID().slice(0, 8)}`,
        full_name: `${pick(adjectives)} ${pick(mascots)}`,
        description: 'Generated team with a five-player roster.',
        country,
      }, { transaction })
      if (!team.id) throw new Error('Generated team has no ID')
      result.teamIds.push(team.id)
      const players = await Player.bulkCreate(roles.map(role => ({
        nickname: `${pick(adjectives)}-${randomUUID().slice(0, 8)}`,
        full_name: `${pick(firstNames)} ${pick(lastNames)}`,
        age: randomInt(18, 36),
        country,
        team_id: team.id,
        role,
        player_attributes: generatePlayerAttributes(),
      })), { transaction })
      result.playerIds.push(...players.map(player => player.id))
    }

    for (let index = 0; index < request.tournamentCount; index++) {
      const tournament = await Tournament.create({
        name: `${pick(adjectives)} Cup ${randomUUID().slice(0, 8)}`,
        description: 'Generated round-robin tournament.',
        country: pick(countries),
        type: TournamentType.SINGLE_GROUP,
        start_date: start,
        end_date: end,
        started: false,
        ended: false,
      }, { transaction })
      if (!tournament.id) throw new Error('Generated tournament has no ID')
      result.tournamentIds.push(tournament.id)
      await tournament.addTeams(result.teamIds, { transaction })
      await TournamentService.createStandingsForTeamsIfNeeded(result.teamIds, tournament.id, transaction)
      await MatchService.createTeamMatchesForTournamentIfNeeded(result.teamIds, tournament, MatchType.BO3, transaction)
    }
    return result
  })
}
