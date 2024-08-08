import e from "express"
import { PlayerRole, TournamentType } from "../models/enums"
import Player, { PlayerAttributes } from "../models/Player"
import Team from "../models/Team"
import Tournament from "../models/Tournament"

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

const setupTestData = async () => {
  const teams = await Team.findAll()
  if (teams.length === 0) {
    await Team.create({full_name: 'Team 1', description: 'Description for Team 1', short_name: 'T1', country: 'Canada'})
    await Team.create({full_name: 'Team 2', description: 'Description for Team 2', short_name: 'T2', country: 'Brazil'})
    await Team.create({full_name: 'Team 3', description: 'Description for Team 3', short_name: 'T3', country: 'China'})
  } else {
    console.log('Initial teams data already exists')
  }

  const players = await Player.findAll()
  if (players.length === 0) {
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
  if (tournaments.length === 0) {
    await Tournament.create({name: 'Tournament 1', description: 'Description for Tournament 1', start_date: new Date(), started: false, ended: false, country: 'Canada', type: TournamentType.SINGLE_GROUP, schedule: [], standings: [] })
    await Tournament.create({name: 'Tournament 2', description: 'Description for Tournament 2', start_date: new Date(), started: false, ended: false, country: 'Brazil', type: TournamentType.SINGLE_GROUP, schedule: [], standings: [] })
    await Tournament.create({name: 'Tournament 3', description: 'Description for Tournament 3', start_date: new Date(), started: false, ended: false, country: 'China', type: TournamentType.SINGLE_GROUP, schedule: [], standings: [] })
    await Tournament.create({name: 'Tournament 4', description: 'Description for Tournament 4', start_date: new Date(), started: false, ended: false, country: 'Denmark', type: TournamentType.SINGLE_GROUP, schedule: [], standings: [] })
  }  else {
    console.log('Initial tournament data already exists')
  }
}

export default setupTestData
