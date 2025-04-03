import { Router, Request, Response, RequestHandler } from 'express'
import { importTeamsAndPlayersFromVLR } from '@/services/VlrService'

const router = Router()

/**
 * @route POST /api/vlr
 * @description Fetches teams' information from VLR and imports new teams and players into the database.
 */
router.post('/', (async (_req: Request, res: Response) => {
  try {
    const teamsData = await importTeamsAndPlayersFromVLR()
    res.status(200).json({ message: 'Teams and players imported successfully', teamsData })
  } catch (error) {
    console.error('Error importing teams and players:', error)
    res.status(500).json({ error: 'Failed to import teams and players' })
  }
}) as RequestHandler)

export default router
