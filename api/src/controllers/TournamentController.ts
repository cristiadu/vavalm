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

export default router
