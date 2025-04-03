import { Router, Response, Request } from 'express'

import { ItemsWithPagination } from '@/base/types'
import Player from '@/models/Player'

import { getAllStatsForAllPlayers, getAllStatsForPlayer } from '@/services/PlayerService'

const router = Router() 

// Fetch all players
router.get('/', async (req: Request, res: Response) => {
  const limit_value = Number(req.query.limit)
  const offset_value = Number(req.query.offset)

  try {
    const playersWithFindAllAndCount = await Player.findAndCountAll({
      order: [['id', 'ASC']],
      limit: limit_value > 0 ? limit_value : undefined,
      offset: offset_value > 0 ? offset_value : undefined,
    })

    const playersWithPagination: ItemsWithPagination<Player> = {
      total: playersWithFindAllAndCount.count,
      items: playersWithFindAllAndCount.rows,
    }
    
    res.json(playersWithPagination)
  } catch (err) {
    console.error('Error executing query', (err as Error).stack)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Fetch all players stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const allPlayersStats = await getAllStatsForAllPlayers(Number(req.query.limit), Number(req.query.offset))
    res.json(allPlayersStats)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Fetch player
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const player = await Player.findByPk(id)
    if (!player) {
      res.status(404).json({ error: 'Player not found' })
      return
    }
    res.json(player)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Fetch player stats
router.get('/:id/stats', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const playerStats = await getAllStatsForPlayer(Number(id))
    res.json(playerStats)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Add a new player
router.post('/', async (req: Request, res: Response) => {
  const { nickname, full_name, age, country, team_id, player_attributes, role } = req.body

  // Validate input data
  if (!nickname || !full_name || !age || !country || !player_attributes || !role) {
    res.status(400).json({ error: 'nickname, full_name, age, country, role, and player_attributes are required' })
    return
  }

  try {
    console.debug('Creating player with data:', { nickname, full_name, age, country, team_id, player_attributes })
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
router.post('/bulk', async (req: Request, res: Response) => {
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
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const { nickname, full_name, age, country, team_id, player_attributes, role } = req.body

  // Validate input data
  if (!nickname || !full_name || !age || !country || !player_attributes || !role) {
    res.status(400).json({ error: 'nickname, full_name, age, country, role, and player_attributes are required' })
    return
  }

  try {
    const player = await Player.findByPk(id)
    if (!player) {
      res.status(404).json({ error: 'Player not found' })
      return
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
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const player = await Player.findByPk(id)
    if (!player) {
      res.status(404).json({ error: 'Player not found' })
      return
    }

    await player.destroy()
    res.json({ message: 'Player deleted successfully' })
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
