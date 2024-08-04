import { Router } from 'express'
import Multer from 'multer'
import Team from '../models/Team'

const router = Router()
const upload = Multer({ storage: Multer.memoryStorage() })

// Fetch all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.findAll()
    const teamsWithBlob = teams.map(team => {
      if (team.logo_image_file) {
        team.logo_image_file = new Blob([team.logo_image_file], { type: 'image/png' })
      }
      return team
    })
    res.json(teamsWithBlob)
  } catch (err) {
    console.error('Error executing query', (err as Error).stack)
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