import { env } from "process"

import Player from "@/models/Player"
import Team from "@/models/Team"
import Tournament from "@/models/Tournament"
import { MatchType } from "@/models/enums"

import TournamentService from "@/services/TournamentService"
import MatchService from "@/services/MatchService"
import { downloadPNGImage } from "@/base/FileUtils"
import bootstrapPlayers from "./json/bootstrap_players.json"
import bootstrapTeams from "./json/bootstrap_teams.json"
import bootstrapTournaments from "./json/bootstrap_tournaments.json"

const forceBootstrap: boolean = env.FORCE_BOOTSTRAP === 'true' || false

const setupTestData = async (): Promise<void> => {
  const teams = await Team.findAll()
  if (teams.length === 0 || forceBootstrap) {
    for (const teamData of bootstrapTeams) {
      console.debug('Creating team with data:', teamData)

      // Fetch the image from the URL as a Buffer
      const logoBuffer = await downloadPNGImage(teamData.imageLogo)

      if (!logoBuffer) {
        console.warn('Failed to download image for team:', teamData.short_name)
      }
  
      // Create the team with the logo image buffer
      await Team.create({ 
        ...teamData, 
        logo_image_file: logoBuffer, 
      })
    }
  } else {
    console.warn('Initial teams data already exists')
  }

  const players = await Player.findAll()
  if (players.length === 0 || forceBootstrap) {
    for (const playerData of bootstrapPlayers) {
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
    // Since tournament JSON loaded has team_ids and not teams, we need to associate the teams with the tournament
    for (const tournamentData of bootstrapTournaments) {
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
