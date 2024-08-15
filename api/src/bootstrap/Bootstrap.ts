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

      // Create standings for each team in the tournament
      for (const teamId of teamIds) {
        await Standings.create({ team_id: teamId, tournament_id: tournament.id, wins: 0, losses: 0, maps_won: 0, maps_lost: 0, rounds_won: 0, rounds_lost: 0 })
      }

      // Create games for the tournament, all teams play against each other
      teamIds.forEach((team1Id: number, index: number) => {
        teamIds.slice(index + 1).forEach(async (team2Id: number) => {
          const maps = Object.values(GameMap)
          const randomMap = maps[Math.floor(Math.random() * maps.length)]

          const game = await Game.create({
            date: getRandomDateThisYear(),
            map: randomMap,
            tournament_id: tournament.id,
            stats: {
              team1_id: team1Id,
              team2_id: team2Id,
              team1_score: 0,
              team2_score: 0,
            },
          }, {
            include: [
              { model: GameStats, as: 'stats', include: [{ model: PlayerGameStats, as: 'players_stats_team1' }, { model: PlayerGameStats, as: 'players_stats_team2' }] },
            ],
          })
        })
      })
    }
  } else {
    console.warn('Initial tournament data already exists')
  }
}

export default setupTestData
