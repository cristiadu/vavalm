import { Router } from 'express'
import Tournament from '../models/Tournament'
import Game from '../models/Game'
import Team from '../models/Team'
import Standings from '../models/Standings'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.findAll({ order: [['id', 'ASC']], include: [
      { model: Game, as: 'schedule' },
      { model: Standings, as: 'standings' },
      { model: Team, as: 'teams', attributes: ['id', 'short_name', 'logo_image_file'] }] })
    res.json(tournaments)
  } catch (err) {
    console.error('Error executing query', (err as Error).stack)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Fetch tournament
router.get('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const tournament = await Tournament.findByPk(id, { include: [
      { model: Game, as: 'schedule' },
      { model: Standings, as: 'standings', include: [{model: Team, as: 'team'}] },
      { model: Team, as: 'teams', attributes: ['id', 'short_name', 'logo_image_file'] }] } )
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
    console.log('Creating team with data:', { type, name, description, country, teams, start_date })
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
      await tournament.addTeams(teams.map((team: any) => team.id))
    }

    const tournamentCreated = await Tournament.findByPk(tournament.id, { include: [
      { model: Game, as: 'schedule' },
      { model: Standings, as: 'standings' },
      { model: Team, as: 'teams', attributes: ['id', 'short_name'] }] }) as Tournament
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
