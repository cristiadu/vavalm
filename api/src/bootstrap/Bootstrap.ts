import { env } from "process"

import Player from "@/models/Player"
import Team from "@/models/Team"
import Tournament from "@/models/Tournament"
import { MatchType } from "@/models/enums"

import TournamentService from "@/services/TournamentService"
import MatchService from "@/services/MatchService"
import { downloadPNGImage } from "@/base/FileUtils"

const forceBootstrap: boolean = env.FORCE_BOOTSTRAP === 'true' || false

const setupTestData = async (): Promise<void> => {
  const teams = await Team.findAll()
  if (teams.length === 0 || forceBootstrap) {
    // Read JSON file with teams data and create them
    const teamsData = await import('./json/bootstrap_teams.json', { assert: { type: 'json' } })
    for (const teamData of teamsData.default) {
      console.debug('Creating team with data:', teamData)

      // Fetch the image from the URL and convert it to an ArrayBuffer
      const file = await downloadPNGImage(teamData.imageLogo)
      const arrayBuffer = await file?.arrayBuffer()

      if (!arrayBuffer) {
        console.warn('Failed to download image for team:', teamData.short_name)
        continue
      }

      const fileTypeBlob = file?.type || 'image/png'
      const fileTypeFile = fileTypeBlob.split('/')[1]
      const fileName = file?.name || `logo-team-${teamData.id}.${fileTypeFile}`

      // Convert the ArrayBuffer to a File
      const logoImageBuffer = new File([arrayBuffer], fileName, { type: fileTypeFile })
  
      // Create the team with the logo image file
      await Team.create({ ...teamData, logo_image_file: logoImageBuffer, id: undefined })
    }
  } else {
    console.warn('Initial teams data already exists')
  }

  const players = await Player.findAll()
  if (players.length === 0 || forceBootstrap) {
    // Read JSON file with players data and create them
    const playersData = await import('./json/bootstrap_players.json', { assert: { type: 'json' } })
    for (const playerData of playersData.default) {
      console.debug('Creating player with data:', playerData)
      await Player.create({
        ...playerData,
        id: undefined,
      })
    }
  } else {
    console.warn('Initial players data already exists')
  }

  const tournaments = await Tournament.findAll()
  if (tournaments.length === 0 || forceBootstrap) {
    // Read JSON file with tournaments data and create them
    const tournamentsData = await import('./json/bootstrap_tournaments.json', { assert: { type: 'json' } })

    // Since tournament JSON loaded has team_ids and not teams, we need to associate the teams with the tournament
    for (const tournamentData of tournamentsData.default) {
      const { team_ids: teamIds, ...rest } = tournamentData
      const tournament = await Tournament.create({
        ...rest,
        id: undefined,
        started: false,
        ended: false,
        schedule: [],
        standings: [],
      })

      await tournament.addTeams(teamIds)
      await TournamentService.createStandingsForTeamsIfNeeded(teamIds, tournament.id as number)
      await MatchService.createTeamMatchesForTournamentIfNeeded(teamIds, tournament, MatchType.BO3)
    }
  } else {
    console.warn('Initial tournament data already exists')
  }
}

export default setupTestData
