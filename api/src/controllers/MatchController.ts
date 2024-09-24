import { Router } from "express"

import MatchService from "../services/MatchService"

const router = Router()

// Get a specific match
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const match = await MatchService.getMatch(Number(id))
    res.status(200).json(match)
  } catch (err) {
    console.error("Error executing query:", err)
    if (err instanceof Error) {
      console.error("Error message:", err.message)
      console.error("Error stack:", err.stack)
    }
    res.status(500).json({ error: "Internal Server Error" })
  }
})

export default router
