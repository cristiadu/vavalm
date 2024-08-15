import { GameMap, PlayerRole, TournamentType } from "../models/enums"
import Player, { PlayerAttributes } from "../models/Player"
import Team from "../models/Team"
import Tournament from "../models/Tournament"
import Standings from "../models/Standings"
import Game from "../models/Game"
import { env } from "process"
import GameStats from "../models/GameStats"
import PlayerGameStats from "../models/PlayerGameStats"
import { getRandomDateThisYear } from "../base/DateUtils"
import TournamentService from "../services/TournamentService"
import GameService from "../services/GameService"

const forceBootstrap: boolean = env.FORCE_BOOTSTRAP === 'true' ?? false

const setupTestData = async () => {
  const teams = await Team.findAll()
  if (teams.length === 0 || forceBootstrap) {
    // Read JSON file with teams data and create them
    const teamsData: Team[] = require('./json/bootstrap_teams.json')
    for (const teamData of teamsData) {
      console.debug('Creating team with data:', teamData)
      await Team.create({ ...teamData })
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
        started: false,
        ended: false,
        schedule: [],
        standings: [],
      })

      await tournament.addTeams(teamIds)
      await TournamentService.createStandingsForTeamsIfNeeded(teamIds, tournament.id as number)
      await GameService.createTeamGamesForTournamentIfNeeded(teamIds, tournament.id as number)
    }
  } else {
    console.warn('Initial tournament data already exists')
  }
}

export default setupTestData
