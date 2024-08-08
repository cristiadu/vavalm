import { GameMap, PlayerRole, TournamentType } from "../models/enums"
import Player, { PlayerAttributes } from "../models/Player"
import Team from "../models/Team"
import Tournament from "../models/Tournament"
import Standings from "../models/Standings"
import Game from "../models/Game"
import { env } from "process"
import GameStats from "../models/GameStats"
import PlayerGameStats from "../models/PlayerGameStats"

const defaultPlayerAttributes: PlayerAttributes = {
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

const forceBootstrap: boolean = env.FORCE_BOOTSTRAP === 'true' ?? false

const setupTestData = async () => {
  const teams = await Team.findAll()
  if (teams.length === 0 || forceBootstrap) {
    await Team.create({full_name: 'Team 1', description: 'Description for Team 1', short_name: 'T1', country: 'Canada'})
    await Team.create({full_name: 'Team 2', description: 'Description for Team 2', short_name: 'T2', country: 'Brazil'})
    await Team.create({full_name: 'Team 3', description: 'Description for Team 3', short_name: 'T3', country: 'China'})
  } else {
    console.log('Initial teams data already exists')
  }

  const players = await Player.findAll()
  if (players.length === 0 || forceBootstrap) {
    await Player.create({full_name: 'Player 1', nickname: 'P1', age: 22, country: 'Eswatini', team_id: 1, role: PlayerRole.Duelist, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Player 2', nickname: 'P2', age: 23, country: 'France', team_id: 1, role: PlayerRole.Controller, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Player 3', nickname: 'P3', age: 24, country: 'Germany', team_id: 1, role: PlayerRole.Initiator, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Player 4', nickname: 'P4', age: 25, country: 'Honduras', team_id: 1, role: PlayerRole.Sentinel, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Player 5', nickname: 'P5', age: 26, country: 'India', team_id: 1, role: PlayerRole.Duelist, player_attributes: defaultPlayerAttributes})
    
    await Player.create({full_name: 'Player 6', nickname: 'P6', age: 27, country: 'Japan', team_id: 2, role: PlayerRole.Controller, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Player 7', nickname: 'P7', age: 28, country: 'South Korea', team_id: 2, role: PlayerRole.Initiator, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Player 8', nickname: 'P8', age: 29, country: 'Laos', team_id: 2, role: PlayerRole.Sentinel, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Player 9', nickname: 'P9', age: 30, country: 'Mexico', team_id: 2, role: PlayerRole.Duelist, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Player 10', nickname: 'P10', age: 31, country: 'Nigeria', team_id: 2, role: PlayerRole.Controller, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Player 11', nickname: 'P11', age: 32, country: 'Oman', team_id: 2, role: PlayerRole.Initiator, player_attributes: defaultPlayerAttributes})
  } else {
    console.log('Initial players data already exists')
  }

  const tournaments = await Tournament.findAll()
  if (tournaments.length === 0 || forceBootstrap) {
    await Tournament.create({name: 'Tournament 1', description: 'Description for Tournament 1', start_date: new Date(), started: false, ended: false, country: 'Canada', type: TournamentType.SINGLE_GROUP, schedule: [], standings: [] })
    await Tournament.create({name: 'Tournament 2', description: 'Description for Tournament 2', start_date: new Date(), started: false, ended: false, country: 'Brazil', type: TournamentType.SINGLE_GROUP, schedule: [], standings: [] })
    await Tournament.create({name: 'Tournament 3', description: 'Description for Tournament 3', start_date: new Date(), started: false, ended: false, country: 'China', type: TournamentType.SINGLE_GROUP, schedule: [], standings: [] })
    await Tournament.create({name: 'Tournament 4', description: 'Description for Tournament 4', start_date: new Date(), started: false, ended: false, country: 'Denmark', type: TournamentType.SINGLE_GROUP, schedule: [], standings: [] })
  } else {
    console.log('Initial tournament data already exists')
  }

  const standings = await Standings.findAll()
  if (standings.length === 0 || forceBootstrap) {
    const tournament = await Tournament.findByPk(1)
    await tournament?.addTeams([1, 2])
    await Standings.create({team_id: 1, tournament_id: 1, wins: 10, losses: 2, maps_won: 15, maps_lost: 3, rounds_won: 80, rounds_lost: 25})
    await Standings.create({team_id: 2, tournament_id: 1, wins: 4, losses: 8, maps_won: 6, maps_lost: 15, rounds_won: 30, rounds_lost: 45})
  } else {
    console.log('Initial standing data already exists')
  }

  const schedules = await Game.findAll()
  if (schedules.length === 0 || forceBootstrap) {
    const tournament = await Tournament.findByPk(1)
    await tournament?.addTeams([1, 2])
  
    const gamesData = [
      { date: new Date(), map: GameMap.BIND, tournament_id: 1, stats: { team1_score: 13, team2_score: 5, team1_id: 1, team2_id: 2, winner_id: 1, players_stats_team1: [], players_stats_team2: [] } },
      { date: new Date(), map: GameMap.SPLIT, tournament_id: 1, stats: { team1_score: 13, team2_score: 5, team1_id: 1, team2_id: 2, winner_id: 1, players_stats_team1: [], players_stats_team2: [] } },
      { date: new Date(), map: GameMap.ASCENT, tournament_id: 1, stats: { team1_score: 8, team2_score: 13, team1_id: 1, team2_id: 2, winner_id: 2, players_stats_team1: [], players_stats_team2: [] } },
      {date: new Date(), map: GameMap.ABYSS, tournament_id: 1, stats: { team1_id: 1, team2_id: 2, winner_id: 1, team1_score: 13, team2_score: 5 , players_stats_team1: [
        { player_id: 1, game_stats_id: 1, kills: 10, deaths: 5, assists: 3 },
        { player_id: 2, game_stats_id: 1, kills: 5, deaths: 10, assists: 3 },
        { player_id: 3, game_stats_id: 1, kills: 3, deaths: 5, assists: 10 },
        { player_id: 4, game_stats_id: 1, kills: 5, deaths: 3, assists: 10 },
        { player_id: 5, game_stats_id: 1, kills: 3, deaths: 5, assists: 10 },
      ], players_stats_team2: [
        { player_id: 6, game_stats_id: 1, kills: 10, deaths: 5, assists: 3 },
        { player_id: 7, game_stats_id: 1, kills: 5, deaths: 10, assists: 3 },
        { player_id: 8, game_stats_id: 1, kills: 3, deaths: 5, assists: 10 },
        { player_id: 9, game_stats_id: 1, kills: 5, deaths: 3, assists: 10 },
        { player_id: 10, game_stats_id: 1, kills: 3, deaths: 5, assists: 10 },
      ]}},
    ]
  
    for (const gameData of gamesData) {
      console.log('Creating game with data:', gameData)
      await Game.create(gameData, { 
        include: [
          { model: GameStats, as: 'stats', include: [{ model: PlayerGameStats, as: 'players_stats_team1' }, { model: PlayerGameStats, as: 'players_stats_team2' }]},
        ],
      })
    } 
  } else {
    console.log('Initial schedule data already exists')
  }
}

export default setupTestData
