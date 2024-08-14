import { Router } from 'express'
import Player from '../models/Player'

const router = Router()

// Fetch all players
router.get('/', async (req, res) => {
  try {
    const teams = await Player.findAll({ order: [['id', 'ASC']] })
    res.json(teams)
  } catch (err) {
    console.error('Error executing query', (err as Error).stack)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Fetch players
router.get('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const player = await Player.findByPk(id)
    if (!player) {
      return res.status(404).json({ error: 'Player not found' })
    }
    res.json(player)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Add a new player
router.post('/', async (req, res) => {
  const { nickname, full_name, age, country, team_id, player_attributes, role } = req.body

  // Validate input data
  if (!nickname || !full_name || !age || !country || !player_attributes || !role) {
    return res.status(400).json({ error: 'nickname, full_name, age, country, role, and player_attributes are required' })
  }

  try {
    console.log('Creating player with data:', { nickname, full_name, age, country, team_id, player_attributes })
    const player = await Player.create({
      nickname,
      full_name,
      age,
      country,
      role,
      team_id,
      player_attributes,
    })
    res.status(201).json(player)
  } catch (err) {
    console.error('Error executing query:', err)
    if (err instanceof Error) {
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
    }
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Add new players from JSON file
router.post('/bulk', async (req, res) => {
  const players = req.body
  try {
    const newPlayers = await Player.bulkCreate(players)
    res.status(201).json(newPlayers)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Update an existing player
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { nickname, full_name, age, country, team_id, player_attributes, role } = req.body

  // Validate input data
  if (!nickname || !full_name || !age || !country || !player_attributes || !role) {
    return res.status(400).json({ error: 'nickname, full_name, age, country, role, and player_attributes are required' })
  }

  try {
    const player = await Player.findByPk(id)
    if (!player) {
      return res.status(404).json({ error: 'Player not found' })
    }

    player.nickname = nickname
    player.full_name = full_name
    player.age = age
    player.role = role
    player.country = country
    player.team_id = team_id
    player.player_attributes = player_attributes

    await player.save()
    res.json(player)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Delete an existing player
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const player = await Player.findByPk(id)
    if (!player) {
      return res.status(404).json({ error: 'Player not found' })
    }

    await player.destroy()
    res.json({ message: 'Player deleted successfully' })
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
