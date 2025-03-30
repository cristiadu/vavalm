import { Request, Response, Router } from 'express'

import { ItemsWithPagination } from '../base/types'
import Team from '../models/Team'
import Tournament from '../models/Tournament'
import Standings from '../models/Standings'
import Match from '../models/Match'
import { MatchType } from '../models/enums'

import TournamentService from '../services/TournamentService'
import MatchService from '../services/MatchService'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<any> => {
  const { limit, offset } = req.query
  const limit_value = Number(limit) || 10 // Default limit
  const offset_value = Number(offset) || 0 // Default offset

  try {
    // Use a single findAndCountAll query with distinct:true
    const { count, rows } = await Tournament.findAndCountAll({
      distinct: true,
      subQuery: false,
      limit: Math.min(limit_value, 100),
      offset: offset_value,
      order: [['id', 'ASC']],
      include: [
        { 
          model: Team, 
          as: 'teams', 
          attributes: ['id', 'short_name', 'logo_image_file', 'country'],
        },
      ],
    })
    
    // If no results but offset was requested, check if offset exceeds total
    if (rows.length === 0 && offset_value > 0) {
      if (offset_value >= count) {
        return res.json({
          total: count,
          items: [],
        })
      }
    }

    return res.json({
      total: count,
      items: rows,
    })
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return res.status(500).json({ error: 'Failed to fetch tournaments' })
  }
})

// Fetch tournament
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params

  try {
    // Step 1: Fetch the Tournament with the included Game models using the fetched IDs
    const tournament = await Tournament.findByPk(id, {
      include: [
        {
          model: Standings,
          as: 'standings',
        },
        { model: Team, as: 'teams' },
      ],
      order: [[{ model: Standings, as: 'standings' }, 'position', 'ASC']],
    })

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    res.json(tournament)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Fetch match schedule from tournament
router.get('/:id/schedule', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const limit_value = Number(req.query.limit)
  const offset_value = Number(req.query.offset)

  try {
    const matches = await MatchService.getMatchesFromTournament(Number(id), limit_value, offset_value)
    res.json(matches)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Add a new tournament
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { type, name, description, country, teams, start_date, end_date } = req.body

  // Validate input data
  if (!type || !name || !teams || !country || !start_date || !end_date) {
    return res.status(400).json({ error: "Please provide type, name, teams, country and start/end date." })
  }

  try {
    console.debug('Creating team with data:', { type, name, description, country, teams, start_date })
    let tournament = await Tournament.create({
      type,
      name,
      description,
      country,
      start_date,
      end_date, 
      started: false,
      ended: false,
      schedule: [],
      standings: [],
    }, {
      include: [
        { model: Match, as: 'schedule' },
        { model: Standings, as: 'standings' },
        { model: Team, as: 'teams' },
      ],
    })

    // Associate existing teams with the new tournament
    if (teams && teams.length > 0) {
      const teamIds = teams.map((team: any) => team.id)
      await tournament.addTeams(teamIds)

      // Create standings object for teams if they don't exist
      await TournamentService.createStandingsForTeamsIfNeeded(teamIds, tournament.id as number)
      await MatchService.createTeamMatchesForTournamentIfNeeded(teamIds, tournament, MatchType.BO3)
    }

    const tournamentCreated = await Tournament.findByPk(tournament.id, {
      include: [
        { model: Match, as: 'schedule' },
        { model: Standings, as: 'standings' },
        { model: Team, as: 'teams', attributes: ['id', 'short_name'] }],
    }) as Tournament
    res.status(201).json(tournamentCreated)
  } catch (err) {
    console.error('Error executing query:', err)
    if (err instanceof Error) {
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
    }
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Update a tournament
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { type, name, description, country, teams, start_date, end_date } = req.body

  // Validate input data
  if (!type || !name || !teams || !country || !start_date || !end_date) {
    return res.status(400).json({ error: "Please provide type, name, teams, country and start/end date." })
  }

  try {
    const tournament = await Tournament.findByPk(id, {
      include: [
        { model: Team, as: 'teams' },
      ],
    })

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    const teamIds = teams.map((team: any) => team.id)
    const removedTeamIds = tournament.teams
      .filter((team: Team) => !teamIds.includes(team.id))
      .map((team: Team) => team.id) as number[]


    console.debug('Updating tournament with data:', { type, name, description, country, teams, start_date, end_date })
    await tournament.update({
      type,
      name,
      description,
      country,
      start_date,
      end_date,
    })

    // Associate existing teams with the new tournament
    await tournament.setTeams(teamIds)

    // Create standings object for teams if they don't exist
    await TournamentService.createStandingsForTeamsIfNeeded(teamIds, tournament.id as number)

    // Create games for the tournament if they don't exist
    await MatchService.createTeamMatchesForTournamentIfNeeded(teamIds, tournament, MatchType.BO3)

    // Remove standings for teams that were removed from the tournament
    await TournamentService.removeStandingsForRemovedTeams(removedTeamIds, tournament.id as number)

    // Remove games for teams that were removed from the tournament
    await MatchService.deleteTeamsMatchesFromTournament(removedTeamIds, tournament.id as number)
    const tournamentUpdated = await Tournament.findByPk(tournament.id) as Tournament
    res.json(tournamentUpdated)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


// Delete a tournament
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params

  try {
    const team = await Tournament.findByPk(id)
    if (!team) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    await team.destroy()
    res.json({ message: 'Tournament deleted successfully' })
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
