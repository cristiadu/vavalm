import { Router } from 'express'
import RoundService from '../services/RoundService'
import RoundController from './RoundController'

const router = Router()

// Trigger the game to start
router.post('/:id/play', async (req, res) => {
  try {
    const { id } = req.params
    RoundService.playFullGame(Number(id))
    console.log('Starting game with id:', id)
    res.status(201).json({ message: 'Game started' })
  } catch (err) {
    console.error('Error executing query:', err)
    if (err instanceof Error) {
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
    }
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// /games/:id/rounds endpoints
// send parameter id to RoundController
router.use('/:id/rounds', RoundController)

export default router
