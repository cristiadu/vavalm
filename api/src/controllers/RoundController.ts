import { Router } from 'express'
import RoundService from '../services/RoundService'
import GameStats from '../models/GameStats'
import GameService from '../services/GameService'

const router = Router({mergeParams: true})

// Trigger the round to start
router.post('/:round/play', async (req, res) => {
  try {
    const { id, round } = req.params as { id: string, round: string }
    const roundFinishedState = await RoundService.playFullRound(Number(id), Number(round))
    const gameStats = await GameService.getGameFullStatsWithPlayersAndTeams(Number(id))
    if (gameStats) {
      await GameService.updatePlayerStats(gameStats)
      console.log('Game stats updated for game_id:', id)
    } else {
      console.error('GameStats not found for game_id:', id)
    }
    res.status(201).json(roundFinishedState)
  } catch (err) {
    console.error('Error executing query:', err)
    if (err instanceof Error) {
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
    }
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Trigger a single round duel
router.post('/:round/duel', async (req, res) => {
  try {
    const { id, round } = req.params as { id: string, round: string }
    const roundState = await RoundService.playRoundStep(Number(id), Number(round))
    const gameStats = await GameService.getGameFullStatsWithPlayersAndTeams(Number(id))
    if (gameStats) {
      await GameService.updatePlayerStats(gameStats)
      console.log('Game stats updated for game_id:', id)
    } else {
      console.error('GameStats not found for game_id:', id)
    }
    res.status(201).json(roundState)
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
