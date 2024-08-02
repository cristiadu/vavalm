import { Router } from 'express'
import Team from '../models/Team'

const router = Router()

// Fetch all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.findAll()
    res.json(teams)
  } catch (err) {
    console.error('Error executing query', (err as Error).stack)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Add a new team
router.post('/', async (req, res) => {
  const { short_name, full_name, logo_url, description, country } = req.body

  // Validate input data
  if (!short_name || !full_name || !country) {
    return res.status(400).json({ error: 'short_name, country and full_name are required' })
  }

  try {
    console.log('Creating team with data:', { short_name, full_name, logo_url, description, country })
    const team = await Team.create({
      short_name,
      full_name,
      logo_url,
      description,
      country,
    })
    res.status(201).json(team)
  } catch (err) {
    console.error('Error executing query:', err)
    if (err instanceof Error) {
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
    }
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
