import { Router } from 'express'
import Team from '../models/Team'
import Player from '../models/Player'
import { downloadImage } from '../base/FileUtils'
import { fetchTeamsDataFromVLR } from '../services/VlrService'

const router = Router()

/**
 * Fetches teams' information from VLR and imports new teams and players into the database.
 */
router.post('/', async (_req, res) => {
  try {
    const teamsData = await fetchTeamsDataFromVLR()

    for (const teamData of teamsData) {
      // Upsert a team entry
      const logoBlob = await downloadImage(teamData.logo_url)

      const [team, created] = await Team.upsert({
        short_name: teamData.short_name,
        full_name: teamData.full_name,
        country: teamData.country,
        logo_image_file: logoBlob,
      },  {
        returning: true,
        conflictFields: ['short_name'], // Ensure upsert is based on unique constraint
      })

      console.log(`Team ${team.short_name} ${created ? 'created' : 'updated'}`)
    

      for (const playerData of teamData.players) {
        // Upsert a player entry and associate it with the team
        const [player, playerCreated] = await Player.upsert({
          nickname: playerData.nickname,
          full_name: playerData.full_name,
          country: playerData.country,
          team_id: team.id,
        },{
          returning: true,
          conflictFields: ['nickname'], // Ensure upsert is based on unique constraint
        })

        console.log(`Player ${player.nickname} ${playerCreated ? 'created' : 'updated'} and associated with team ${team.short_name}`)

      }
    }

    res.status(200).json({ message: 'Teams and players imported successfully', teamsData })
  } catch (error) {
    console.error('Error importing teams and players:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
