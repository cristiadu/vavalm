import { Router } from 'express'
import Player from '../models/Player'

const router = Router()

// Fetch all players
router.get('/', async (req, res) => {
  try {
    const teams = await Player.findAll()
    res.json(teams)
  } catch (err) {
    console.error('Error executing query', (err as Error).stack)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Add a new player
router.post('/', async (req, res) => {
  const { nickname, full_name, age, country, team_id, player_attributes } = req.body

  // Validate input data
  if (!nickname || !full_name || !age || !country || !player_attributes) {
    return res.status(400).json({ error: 'nickname, full_name, age, country, and player_attributes are required' })
  }

  try {
    const player = await Player.create({
      nickname,
      full_name,
      age,
      country,
      team_id,
      player_attributes,
    })
    res.status(201).json(player)
  } catch (err) {
    console.error('Error executing query', (err as Error).stack)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
