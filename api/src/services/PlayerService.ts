import Team from '@/models/Team'
import Player from '@/models/Player'
import { VlrPlayer } from '@/models/Vlr'

/**
 * Updates or creates a player based on the player data and team.
 * @param playerData player data from VLR
 * @param team team data saved in the database
 */
export const updateOrCreatePlayer = async (playerData: VlrPlayer, team: Team): Promise<void> => {
  // Get player first to check if it exists
  const player = await Player.findOne({
    where: {
      nickname: playerData.nickname,
    },
  })

  if (player) {
    // Update only team if player exists
    await player.update({
      team_id: team.id,
      full_name: playerData.full_name ?? player.full_name,
    })

    console.log(`Player ${player.nickname} updated`)
    return
  }

  // Create player if it doesn't exist
  const playerCreated = await Player.create({
    nickname: playerData.nickname,
    full_name: playerData.full_name,
    country: playerData.country,
    role: playerData.role,
    team_id: team.id,
  }, {
    returning: true,
  })

  console.log(`Player ${playerCreated.nickname} created`)
}








