import { GameMap, PlayerRole, TournamentType } from "../models/enums"
import Player, { PlayerAttributes } from "../models/Player"
import Team from "../models/Team"
import Tournament from "../models/Tournament"
import Standings from "../models/Standings"
import Game from "../models/Game"
import { env } from "process"
import GameStats from "../models/GameStats"
import PlayerGameStats from "../models/PlayerGameStats"
import GameLog from "../models/GameLog"

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
    await Team.create({full_name: 'Sentinels', description: 'Top NA Team', short_name: 'SEN', country: 'United States'})
    await Team.create({full_name: 'Fnatic', description: 'Top EU Team', short_name: 'FNC', country: 'United Kingdom'})
    await Team.create({full_name: 'Vision Strikers', description: 'Top KR Team', short_name: 'VS', country: 'South Korea'})
  } else {
    console.log('Initial teams data already exists')
  }

  const players = await Player.findAll()
  if (players.length === 0 || forceBootstrap) {
    await Player.create({full_name: 'Tyson Ngo', nickname: 'TenZ', age: 20, country: 'Canada', team_id: 1, role: PlayerRole.Duelist, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Hunter Mims', nickname: 'SicK', age: 22, country: 'United States', team_id: 1, role: PlayerRole.Controller, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Shahzeeb Khan', nickname: 'ShahZaM', age: 27, country: 'United States', team_id: 1, role: PlayerRole.Initiator, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Jared Gitlin', nickname: 'zombs', age: 23, country: 'United States', team_id: 1, role: PlayerRole.Sentinel, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Michael Grzesiek', nickname: 'shroud', age: 28, country: 'Canada', team_id: 1, role: PlayerRole.Duelist, player_attributes: defaultPlayerAttributes})
    
    await Player.create({full_name: 'Nikita Sirmitev', nickname: 'Derke', age: 19, country: 'Finland', team_id: 2, role: PlayerRole.Duelist, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'James Cobb', nickname: 'Boaster', age: 26, country: 'United Kingdom', team_id: 2, role: PlayerRole.Controller, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Domagoj Fancev', nickname: 'Doma', age: 21, country: 'Croatia', team_id: 2, role: PlayerRole.Initiator, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Martin Lund', nickname: 'Magnum', age: 20, country: 'Denmark', team_id: 2, role: PlayerRole.Sentinel, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Jake Howlett', nickname: 'Mini', age: 24, country: 'United Kingdom', team_id: 2, role: PlayerRole.Controller, player_attributes: defaultPlayerAttributes})
    
    await Player.create({full_name: 'Kim Gi-seok', nickname: 'stax', age: 24, country: 'South Korea', team_id: 3, role: PlayerRole.Initiator, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Yu Min-soo', nickname: 'Rb', age: 22, country: 'South Korea', team_id: 3, role: PlayerRole.Duelist, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Kim Jung-woo', nickname: 'Meteor', age: 21, country: 'South Korea', team_id: 3, role: PlayerRole.Duelist, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Lee Jae-won', nickname: 'k1Ng', age: 20, country: 'South Korea', team_id: 3, role: PlayerRole.Controller, player_attributes: defaultPlayerAttributes})
    await Player.create({full_name: 'Kim Seung-won', nickname: 'Zest', age: 23, country: 'South Korea', team_id: 3, role: PlayerRole.Sentinel, player_attributes: defaultPlayerAttributes})
  } else {
    console.log('Initial players data already exists')
  }

  const tournaments = await Tournament.findAll()
  if (tournaments.length === 0 || forceBootstrap) {
    await Tournament.create({name: 'Valorant Champions Tour', description: 'Global Valorant Tournament', start_date: new Date(), started: false, ended: false, country: 'Brazil', type: TournamentType.SINGLE_GROUP, schedule: [], standings: [] })
    await Tournament.create({name: 'Masters Reykjavik', description: 'Valorant Masters Tournament', start_date: new Date(), started: false, ended: false, country: 'Iceland', type: TournamentType.SINGLE_GROUP, schedule: [], standings: [] })
    await Tournament.create({name: 'Challengers NA', description: 'North America Challengers', start_date: new Date(), started: false, ended: false, country: 'United States', type: TournamentType.SINGLE_GROUP, schedule: [], standings: [] })
    await Tournament.create({name: 'Challengers EU', description: 'Europe Challengers', start_date: new Date(), started: false, ended: false, country: 'Poland', type: TournamentType.SINGLE_GROUP, schedule: [], standings: [] })
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
      ]}, logs: [
        { round: 1, duel_buff: 0.5, trade_buff: 0.5, trade: false, team1_player_id: 1, team2_player_id: 6, player_killed_id: 6 },
        { round: 1, duel_buff: 0.1, trade_buff: 1.5, trade: true, team1_player_id: 3, team2_player_id: 7, player_killed_id: 3 },
        { round: 1, duel_buff: 0.1, trade_buff: 1.5, trade: false, team1_player_id: 2, team2_player_id: 7, player_killed_id: 7 },
        { round: 2, duel_buff: 0.5, trade_buff: 0.5, trade: true, team1_player_id: 2, team2_player_id: 7, player_killed_id: 7 },
        { round: 3, duel_buff: 0.5, trade_buff: 0.5, trade: false, team1_player_id: 3, team2_player_id: 8, player_killed_id: 8 },
        { round: 4, duel_buff: 1.5, trade_buff: 0.5, trade: true, team1_player_id: 4, team2_player_id: 9, player_killed_id: 9 },
        { round: 5, duel_buff: 0.5, trade_buff: 0.5, trade: true, team1_player_id: 5, team2_player_id: 10, player_killed_id: 10 },
      ]},
    ]
  
    for (const gameData of gamesData) {
      console.log('Creating game with data:', gameData)
      await Game.create(gameData, { 
        include: [
          { model: GameLog, as: 'logs', include: [{ model: Player, as: 'team1_player' }, { model: Player, as: 'team2_player' }, { model: Player, as: 'player_killed' }] },
          { model: GameStats, as: 'stats', include: [{ model: PlayerGameStats, as: 'players_stats_team1' }, { model: PlayerGameStats, as: 'players_stats_team2' }]},
        ],
      })
    } 
  } else {
    console.log('Initial schedule data already exists')
  }
}

export default setupTestData
