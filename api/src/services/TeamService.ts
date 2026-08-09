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

/** Logos only change when a team is edited, so clients may hold them for a day. */
export const LOGO_CACHE_SECONDS = 60 * 60 * 24

/**
 * Reads a team's stored logo image.
 *
 * @param teamId  The team whose logo to read
 * @returns {Promise<Buffer>} - The image bytes.
 * @throws {Error} - If the team has no logo.
 */
export const fetchTeamLogo = async (teamId: number): Promise<Buffer> => {
  const team = await Team.findByPk(teamId, { attributes: ['id', 'logo_image_file'] })

  if (!team?.logo_image_file) {
    throw new Error('Team logo not found')
  }

  return Buffer.from(team.logo_image_file)
}

/**
 * Replaces a team's logo image.
 *
 * @param teamId  The team to set the logo on
 * @param image  The image bytes to store
 * @throws {Error} - If the team is not found.
 */
export const replaceTeamLogo = async (teamId: number, image: Buffer): Promise<void> => {
  const team = await Team.findByPk(teamId)

  if (!team) {
    throw new Error('Team not found')
  }

  await team.update({ logo_image_file: image })
}
