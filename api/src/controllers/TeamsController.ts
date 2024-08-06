import { Router } from 'express'
import Multer from 'multer'
import Team from '../models/Team'

const router = Router()
const upload = Multer({ storage: Multer.memoryStorage() })

// Fetch all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.findAll({ order: [['id', 'ASC']] })
    res.json(teams)
  } catch (err) {
    console.error('Error executing query', (err as Error).stack)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Fetch team
router.get('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const team = await Team.findByPk(id)
    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }
    res.json(team)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Add a new team
router.post('/', upload.single('logo_image_file'), async (req, res) => {
  const { short_name, full_name, description, country } = req.body
  const logo_image_file = req.file ? req.file.buffer : null

  // Validate input data
  if (!short_name || !full_name || !country) {
    return res.status(400).json({ error: 'short_name, country and full_name are required' })
  }

  try {
    console.log('Creating team with data:', { short_name, full_name, logo_image_file, description, country })
    const team = await Team.create({
      short_name,
      full_name,
      logo_image_file,
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
