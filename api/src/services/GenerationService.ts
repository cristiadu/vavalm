import { randomInt } from 'node:crypto'
import { ValidateError } from '@tsoa/runtime'
import db from '@/models/db'
import Team from '@/models/Team'
import Player, { PlayerAttributes, PlayerAttributesContract } from '@/models/Player'
import Tournament from '@/models/Tournament'
import { MatchType, PlayerRole, TournamentType } from '@/models/enums'
import { GenerateDataRequest, GenerateDataResult } from '@/models/contract/GenerateDataRequest'
import TournamentService from '@/services/TournamentService'
import MatchService from '@/services/MatchService'
import data from '@/models/generation-data.json'
import { generatePlayerNickname, generateTeamLogo, generateTeamName, generateTeamShortName, generateTournamentName, pickGenerationValue, reserveGeneratedName } from '@/services/GenerationIdentityService'

const roles = [PlayerRole.DUELIST, PlayerRole.INITIATOR, PlayerRole.CONTROLLER, PlayerRole.SENTINEL, PlayerRole.IGL]

/** Gives each player one or two signature strengths, matching generate_data.py. */
export const generatePlayerAttributes = (): PlayerAttributes => {
  const attributes = new PlayerAttributes(
    randomInt(3), randomInt(3), randomInt(3), randomInt(3),
    randomInt(3), randomInt(3), randomInt(3), randomInt(3),
    randomInt(3), randomInt(3), randomInt(3), randomInt(3),
    randomInt(3), randomInt(3), randomInt(3), randomInt(3),
  )
  const remaining = Object.keys(attributes) as (keyof PlayerAttributesContract)[]
  const signatureCount = randomInt(1, 3)
  for (let index = 0; index < signatureCount; index++) {
    const [key] = remaining.splice(randomInt(remaining.length), 1)
    attributes[key] = randomInt(2, 4)
  }
  return attributes
}

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
    const existingTeams = await Team.findAll({ attributes: ['short_name', 'full_name'], transaction })
    const shortNames = new Set(existingTeams.map(team => team.short_name))
    const teamNames = new Set(existingTeams.map(team => team.full_name))
    const nicknames = new Set((await Player.findAll({ attributes: ['nickname'], transaction })).map(player => player.nickname))
    const tournamentNames = new Set((await Tournament.findAll({ attributes: ['name'], transaction })).map(tournament => tournament.name))
    for (let index = 0; index < request.teamCount; index++) {
      const country = pickGenerationValue(data.COUNTRIES)
      const fullName = reserveGeneratedName(generateTeamName, teamNames)
      const team = await Team.create({
        short_name: reserveGeneratedName(() => generateTeamShortName(fullName), shortNames),
        full_name: fullName,
        description: `${fullName} is a professional esports organization.`,
        logo_image_file: generateTeamLogo(),
        country,
      }, { transaction })
      if (!team.id) throw new Error('Generated team has no ID')
      result.teamIds.push(team.id)
      const players = await Player.bulkCreate(roles.map(role => ({
        nickname: reserveGeneratedName(generatePlayerNickname, nicknames),
        full_name: `${pickGenerationValue(data.FIRST_NAMES)} ${pickGenerationValue(data.LAST_NAMES)}`,
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
        name: reserveGeneratedName(() => generateTournamentName(start.getUTCFullYear()), tournamentNames),
        description: 'Generated round-robin tournament.',
        country: pickGenerationValue(data.COUNTRIES),
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
