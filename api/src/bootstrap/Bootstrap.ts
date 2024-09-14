import Player from "../models/Player"
import Team from "../models/Team"
import Tournament from "../models/Tournament"
import { env } from "process"
import TournamentService from "../services/TournamentService"
import MatchService from "../services/MatchService"
import { MatchType } from "../models/enums"

const forceBootstrap: boolean = env.FORCE_BOOTSTRAP === 'true' ?? false

const setupTestData = async () => {
  const teams = await Team.findAll()
  if (teams.length === 0 || forceBootstrap) {
    // Read JSON file with teams data and create them
    const teamsData: any[] = require('./json/bootstrap_teams.json')
    for (const teamData of teamsData) {
      console.debug('Creating team with data:', teamData)
  
      // Fetch the image from the URL and convert it to an ArrayBuffer
      const response = await fetch(teamData.imageLogo)
      const arrayBuffer = await response.arrayBuffer()
  
      // Convert the ArrayBuffer to a Buffer
      const logoImageBuffer = Buffer.from(arrayBuffer)
  
      // Create the team with the logo image file
      await Team.create({ ...teamData, logo_image_file: logoImageBuffer, id: undefined })
    }
  } else {
    console.warn('Initial teams data already exists')
  }

  const players = await Player.findAll()
  if (players.length === 0 || forceBootstrap) {
    // Read JSON file with players data and create them
    const playersData: Player[] = require('./json/bootstrap_players.json')
    for (const playerData of playersData) {
      console.debug('Creating player with data:', playerData)
      await Player.create({
        ...playerData,
        id: undefined,
      })
    }
  } else {
    console.warn('Initial players data already exists')
  }

  const tournaments = await Tournament.findAll()
  if (tournaments.length === 0 || forceBootstrap) {
    // Read JSON file with tournaments data and create them
    const tournamentsData = require('./json/bootstrap_tournaments.json')

    // Since tournament JSON loaded has team_ids and not teams, we need to associate the teams with the tournament
    for (const tournamentData of tournamentsData) {
      const { team_ids: teamIds, ...rest } = tournamentData
      const tournament = await Tournament.create({
        ...rest,
        id: undefined,
        started: false,
        ended: false,
        schedule: [],
        standings: [],
      })

      await tournament.addTeams(teamIds)
      await TournamentService.createStandingsForTeamsIfNeeded(teamIds, tournament.id as number)
      await MatchService.createTeamMatchesForTournamentIfNeeded(teamIds, tournament, MatchType.BO3)
    }
  } else {
    console.warn('Initial tournament data already exists')
  }
}

export default setupTestData
