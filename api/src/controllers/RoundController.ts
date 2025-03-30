import { Router, Request, Response } from 'express'

import TournamentService from '../services/TournamentService'
import MatchService from '../services/MatchService'
import GameStatsService from '../services/GameStatsService'
import RoundService from '../services/RoundService'
import DuelService from '../services/DuelService'

const router = Router({ mergeParams: true })

// Trigger the round to start
router.post('/:round/play', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, round } = req.params as { id: string, round: string }
    const gameId = Number(id)
    const roundFinishedState = await RoundService.playFullRound(gameId, Number(round))
    await GameStatsService.updateAllStats(gameId)
    
    const match = await MatchService.getMatchByGameId(gameId)
    if (!match || !match.id) {
      throw new Error('Match not found')
    }

    await TournamentService.updateStandingsAndWinner(match.tournament_id)
    const sanitizedId = id.replace(/\n|\r/g, "")
    console.debug('Game stats updated for game_id:', sanitizedId)
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
router.post('/:round/duel', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, round } = req.params as { id: string, round: string }
    const gameId = Number(id)
    const roundState = await RoundService.playRoundStep(gameId, Number(round))
    await GameStatsService.updateAllStats(gameId)

    const match = await MatchService.getMatchByGameId(gameId)
    if (!match || !match.id) {
      throw new Error('Match not found')
    }

    await TournamentService.updateStandingsAndWinner(match.tournament_id)
    const sanitizedId = id.replace(/\n|\r/g, "")
    console.debug('Game stats updated for game_id:', sanitizedId)
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
router.get('/last/duel', async (req: Request, res: Response): Promise<any> => {
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
router.get('/last', async (req: Request, res: Response): Promise<any> => {
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
router.get('/:round', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, round } = req.params as { id: string, round: string }
    
    const gameLogsFromRound = await RoundService.getRound(
      Number(id), 
      Number(round),
    )
    
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
