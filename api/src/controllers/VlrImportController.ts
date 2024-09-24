import { Router } from 'express'

import { importTeamsAndPlayersFromVLR } from '../services/VlrService'

const router = Router()

/**
 * Fetches teams' information from VLR and imports new teams and players into the database.
 */
router.post('/', async (_req, res) => {
  try {
    const teamsData = await importTeamsAndPlayersFromVLR()
    res.status(200).json({ message: 'Teams and players imported successfully', teamsData })
  } catch (error) {
    console.error('Error importing teams and players:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
