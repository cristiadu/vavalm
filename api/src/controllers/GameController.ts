import { Router, Request, Response } from 'express'

import GameService from '../services/GameService'

import RoundController from './RoundController'

const router = Router()

// Trigger the game to start
router.post('/:id/play', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params
    const sanitizedId = id.replace(/\n|\r/g, "")
    await GameService.playFullGame(Number(sanitizedId))
    console.debug('Starting game with id:', sanitizedId)
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

// Get a specific game
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params
    const game = await GameService.getGame(Number(id))
    res.status(200).json(game)
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
