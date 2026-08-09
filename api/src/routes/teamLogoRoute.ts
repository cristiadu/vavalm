import express from 'express'

import Team from '@/models/Team'

/** Logos are immutable per team edit, so let clients hold them for a day. */
const LOGO_CACHE_SECONDS = 60 * 60 * 24

/**
 * Serves a team's logo as an image.
 *
 * This is a plain express route rather than a tsoa controller because tsoa
 * serialises handler return values as JSON, which would base64 the bytes again
 * and defeat the point. Keeping it out of the generated client is fine: the ui
 * consumes it as an image URL, not as a typed call.
 *
 * @param app - The express application to register the route on.
 */
export const registerTeamLogoRoute = (app: express.Application): void => {
  app.get('/api/teams/:teamId/logo', async (req: express.Request, res: express.Response): Promise<void> => {
    const teamId = Number(req.params.teamId)

    if (!Number.isInteger(teamId)) {
      res.status(400).json({ status: 400, message: 'Invalid team id', code: 'BAD_REQUEST' })
      return
    }

    try {
      const team = await Team.findByPk(teamId, { attributes: ['id', 'logo_image_file'] })

      if (!team?.logo_image_file) {
        res.status(404).json({ status: 404, message: 'Team logo not found', code: 'NOT_FOUND' })
        return
      }

      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', `public, max-age=${LOGO_CACHE_SECONDS}`)
      res.send(Buffer.from(team.logo_image_file))
    } catch (error) {
      console.error(`Error serving logo for team ${teamId}:`, error)
      res.status(500).json({ status: 500, message: 'Could not read team logo', code: 'INTERNAL_SERVER_ERROR' })
    }
  })
}
