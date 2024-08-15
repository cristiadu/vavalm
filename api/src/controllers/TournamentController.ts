import { Router } from 'express'
import Tournament from '../models/Tournament'
import Game from '../models/Game'
import Team from '../models/Team'
import Standings from '../models/Standings'
import GameStats from '../models/GameStats'
import TournamentService from '../services/TournamentService'
import GameService from '../services/GameService'
import { ItemsWithPagination } from '../base/types'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const limit_value = Number(req.query.limit)
    const offset_value = Number(req.query.offset)

    const countAllTournaments = await Tournament.count()
    const tournaments = await Tournament.findAll({
      order: [['id', 'ASC']],
      limit: limit_value > 0 ? limit_value : undefined,
      offset: offset_value > 0 ? offset_value : undefined,
      include: [
        { model: Team, as: 'teams', attributes: ['id', 'short_name', 'logo_image_file', 'country'] },
      ],
    })

    const tournamentsWithPagination: ItemsWithPagination<Tournament> = {
      total: countAllTournaments,
      items: tournaments,
    }
    res.json(tournamentsWithPagination)
  } catch (err) {
    console.error('Error executing query', (err as Error).stack)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Fetch tournament
router.get('/:id', async (req, res) => {
  const { id } = req.params
  const limit_value = Number(req.query.limit)
  const offset_value = Number(req.query.offset)

  try {
    // Step 1: Fetch the primary keys of the Game model
    const gameIds = await Game.findAll({
      attributes: ['id'],
      where: { tournament_id: id },
      limit: limit_value > 0 ? limit_value : undefined,
      offset: offset_value > 0 ? offset_value : undefined,
      raw: true,
    })

    // Step 2: Extract the IDs from the result
    const gameIdsArray = gameIds.map(game => game.id)

    // Step 3: Fetch the Tournament with the included Game models using the fetched IDs
    const tournament = await Tournament.findByPk(id, {
      include: [
        {
          model: Game,
          as: 'schedule',
          where: { id: gameIdsArray },
          include: [
            {
              model: GameStats,
              as: 'stats',
              include: [
                { model: Team, as: 'team1' },
                { model: Team, as: 'team2' },
                { model: Team, as: 'winner' },
              ],
            },
          ],
        },
        {
          model: Standings,
          as: 'standings',
          include: [{ model: Team, as: 'team' }],
        },
        { model: Team, as: 'teams' },
      ],
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

// Add a new tournament
router.post('/', async (req, res) => {
  const { type, name, description, country, teams, start_date } = req.body

  // Validate input data
  if (!type || !name || !teams || !country || !start_date) {
    return res.status(400).json({ error: "Please provide type, name, teams, country and start date." })
  }

  try {
    console.debug('Creating team with data:', { type, name, description, country, teams, start_date })
    let tournament = await Tournament.create({
      type,
      name,
      description,
      country,
      start_date,
      started: false,
      ended: false,
      schedule: [],
      standings: [],
    }, {
      include: [
        { model: Game, as: 'schedule' },
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
      await GameService.createTeamGamesForTournamentIfNeeded(teamIds, tournament.id as number)
    }

    const tournamentCreated = await Tournament.findByPk(tournament.id, {
      include: [
        { model: Game, as: 'schedule' },
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
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { type, name, description, country, teams, start_date } = req.body

  // Validate input data
  if (!type || !name || !teams || !country || !start_date) {
    return res.status(400).json({ error: "Please provide type, name, teams, country and start date." })
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


    console.debug('Updating tournament with data:', { type, name, description, country, teams, start_date })
    await tournament.update({
      type,
      name,
      description,
      country,
      start_date,
    })

    // Associate existing teams with the new tournament
    await tournament.setTeams(teamIds)

    // Create standings object for teams if they don't exist
    await TournamentService.createStandingsForTeamsIfNeeded(teamIds, tournament.id as number)

    // Create games for the tournament if they don't exist
    await GameService.createTeamGamesForTournamentIfNeeded(teamIds, tournament.id as number)

    // Remove standings for teams that were removed from the tournament
    await TournamentService.removeStandingsForRemovedTeams(removedTeamIds, tournament.id as number)

    // Remove games for teams that were removed from the tournament
    await GameService.deleteTeamsGamesFromTournament(removedTeamIds, tournament.id as number)
    const tournamentUpdated = await Tournament.findByPk(tournament.id) as Tournament
    res.json(tournamentUpdated)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


// Delete a tournament
router.delete('/:id', async (req, res) => {
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
