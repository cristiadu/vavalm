import { downloadPNGImage } from '@/base/FileUtils'

import { VlrTeam } from '@/models/Vlr'
import Team from '@/models/Team'

/**
 * Upserts a team entry based on the team data.
 * @param vlrTeamData team data from VLR
 * @returns {Promise<Team>} - The team created or updated.
 */
export const upsertTeamData = async (teamData: VlrTeam): Promise<Team> => {
  // Upsert a team entry
  const logoFile = await downloadPNGImage(teamData.logo_url)

  const [team, created] = await Team.upsert({
    short_name: teamData.short_name,
    full_name: teamData.full_name,
    country: teamData.country,
    logo_image_file: logoFile,
  }, {
    returning: true,
    conflictFields: ['short_name'], // Ensure upsert is based on unique constraint
  })

  console.log(`Team ${team.short_name} ${created ? 'created' : 'updated'}`)
  return team
}









