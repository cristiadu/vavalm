import { Router } from 'express'
import Tournament from '../models/Tournament'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.findAll({ order: [['id', 'ASC']] })
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
    const tournament = await Tournament.findByPk(id, { include: [{all: true}] })
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }
    res.json(tournament)
  } catch (err) {
    console.error('Error executing query:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
