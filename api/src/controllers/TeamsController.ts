import { Router, Request, Response } from 'express'
import Multer from 'multer'

import { ItemsWithPagination } from '@/base/types'
import Team from '@/models/Team'
import Player from '@/models/Player'

import { getAllStatsForAllTeams, getAllStatsForTeam } from '@/services/TeamService'

const router = Router()
const upload = Multer({ storage: Multer.memoryStorage() })

// Fetch all teams
router.get('/', async (req: Request, res: Response) => {
  const limit_value = Number(req.query.limit)
  const offset_value = Number(req.query.offset)

  try {
    const teamsWithFindAllAndCount = await Team.findAndCountAll({
      order: [['id', 'ASC']],
      limit: limit_value > 0 ? limit_value : undefined,
      offset: offset_value > 0 ? offset_value : undefined,
    })

    const teamsWithPagination: ItemsWithPagination<Team> = {
      total: teamsWithFindAllAndCount.count,
      items: teamsWithFindAllAndCount.rows,
    }
    
    res.json(teamsWithPagination)
  } catch (err) {
    console.error('Error executing query', (err as Error).stack)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const allTeamsStats = await getAllStatsForAllTeams(Number(req.query.limit), Number(req.query.offset))
    res.json(allTeamsStats)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Add new teams from JSON file
router.post('/bulk', async (req: Request, res: Response) => {
  const teams = req.body

  try {
    const newTeams = await Team.bulkCreate(teams)
    res.status(201).json(newTeams)
  } catch (err) {
    console.error('Error executing query:', err)
    if (err instanceof Error) {
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
    }
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Fetch team
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const team = await Team.findByPk(id)
    if (!team) {
      res.status(404).json({ error: 'Team not found' })
      return
    }
    res.json(team)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Fetch team stats
router.get('/:id/stats', async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    const teamStats = await getAllStatsForTeam(Number(id))
    res.json(teamStats)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Add a new team
router.post('/', upload.single('logo_image_file'), async (req: Request, res: Response) => {
  const { short_name, full_name, description, country } = req.body
  const logo_image_file = req.file ? req.file.buffer : null

  // Validate input data
  if (!short_name || !full_name || !country) {
    res.status(400).json({ error: 'short_name, country and full_name are required' })
    return
  }

  try {
    console.debug('Creating team with data:', { short_name, full_name, logo_image_file, description, country })
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

// Update a team
router.put('/:id', upload.single('logo_image_file'), async (req: Request, res: Response) => {
  const { id } = req.params
  const { short_name, full_name, description, country } = req.body
  const logo_image_file = req.file ? req.file.buffer : null

  try {
    const team = await Team.findByPk(id)
    if (!team) {
      res.status(404).json({ error: 'Team not found' })
      return
    }

    console.debug('Updating team with data:', { short_name, full_name, logo_image_file, description, country })
    team.short_name = short_name
    team.full_name = full_name
    team.logo_image_file = logo_image_file
    team.description = description
    team.country = country
    await team.save()

    res.json(team)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Delete a team
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const team = await Team.findByPk(id)
    if (!team) {
      res.status(404).json({ error: 'Team not found' })
      return
    }

    await team.destroy()
    res.json({ message: 'Team deleted successfully' })
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Fetch players by team
router.get('/:id/players', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const team = await Team.findByPk(id, {include: [{ model: Player, as: 'players' }]})
    if (!team) {
      res.status(404).json({ error: 'Team not found' })
      return
    }

    res.json(team.players)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
