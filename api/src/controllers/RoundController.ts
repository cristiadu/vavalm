import { Router } from 'express'
import RoundService from '../services/RoundService'
import DuelService from '../services/DuelService'
import GameStatsService from '../services/GameStatsService'
import TournamentService from '../services/TournamentService'

const router = Router({ mergeParams: true })

// Trigger the round to start
router.post('/:round/play', async (req, res) => {
  try {
    const { id, round } = req.params as { id: string, round: string }
    const roundFinishedState = await RoundService.playFullRound(Number(id), Number(round))
    await GameStatsService.updateAllStats(Number(id))
    await TournamentService.updateStandings(Number(id))
    console.debug('Game stats updated for game_id:', id)
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
    await GameStatsService.updateAllStats(Number(id))
    await TournamentService.updateStandings(Number(id))
    console.debug('Game stats updated for game_id:', id)
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

// Get last duel log from a game
router.get('/last/duel', async (req, res) => {
  try {
    const { id } = req.params as { id: string }
    const lastDuelLog = await DuelService.getLastDuel(Number(id))
    res.status(200).json(lastDuelLog)
  } catch (err) {
    console.error('Error executing query:', err)
    if (err instanceof Error) {
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
    }
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Get last round logs from a game
router.get('/last', async (req, res) => {
  try {
    const { id } = req.params as { id: string }
    const lastRoundLogs = await RoundService.getLastRound(Number(id))
    res.status(200).json(lastRoundLogs)
  } catch (err) {
    console.error('Error executing query:', err)
    if (err instanceof Error) {
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
    }
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Get a specific round logs from a game
router.get('/:round', async (req, res) => {
  try {
    const { id, round } = req.params as { id: string, round: string }
    const gameLogsFromRound = await RoundService.getRound(Number(id), Number(round))
    res.status(200).json(gameLogsFromRound)
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
