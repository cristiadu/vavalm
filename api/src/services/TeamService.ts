import { Op } from "sequelize"

import { downloadImage } from '@/base/FileUtils'

import { ItemsWithPagination, TeamStats } from '@/base/types'
import { VlrTeam } from '@/models/Vlr'
import Tournament from '@/models/Tournament'
import Match from '@/models/Match'
import Game from '@/models/Game'
import GameStats from '@/models/GameStats'
import Team from '@/models/Team'

/**
 * Upserts a team entry based on the team data.
 * @param vlrTeamData team data from VLR
 * @returns {Promise<Team>} - The team created or updated.
 */
export const upsertTeamData = async (teamData: VlrTeam): Promise<Team> => {
  // Upsert a team entry
  const logoFile = await downloadImage(teamData.logo_url)

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


export const getAllStatsForAllTeams = async (limit: number, offset: number): Promise<ItemsWithPagination<TeamStats>> => {
  const teams = await Team.findAll()

  const teamsStats = (await Promise.all(teams.map(team => getAllStatsForTeam(team.id as number)))).sort(sortTeamsByStats)
  const paginatedTeamsStats = teamsStats.slice(offset, offset + limit)

  return new ItemsWithPagination<TeamStats>(paginatedTeamsStats, teams.length)
}

/**
 * Get all statistics for a team.
 * 
 * @param teamId  The id of the team
 * @returns {Promise<TeamStats>} - The team statistics.
 * @throws {Error} - If the team is not found.
  */
export const getAllStatsForTeam = async (teamId: number): Promise<TeamStats> => {
  const team = await Team.findByPk(teamId)

  if (!team) {
    throw new Error('Team not found')
  }

  const mapsPlayedForTeam = await GameStats.findAll({
    where: {
      [Op.or]: [
        { team1_id: teamId },
        { team2_id: teamId },
      ],
      winner_id: {
        [Op.not]: null,
      },
    },
    include: [
      {
        model: Game,
        as: 'game',
        include: [
          {
            model: Match,
            as: 'match',
            include: [
              { model: Tournament, as: 'tournament' },
            ],
          },
        ],
      },
    ],
  })

  if (mapsPlayedForTeam.length === 0) {
    return new TeamStats(
      team.toApiModel(),
      0,
      0,
      0.0,
      0,
      0,
      0,
      0.0,
      0,
      0,
      0,
    )
  }

  const totalMapsPlayed = mapsPlayedForTeam.length
  const totalMapsWon = mapsPlayedForTeam.filter(map => map.winner_id === teamId).length
  const totalMapsLost = totalMapsPlayed - totalMapsWon
  const distinctMatches = mapsPlayedForTeam
    .map(stats => stats.game.match)
    .filter((match, index, self) => match && index === self.findIndex(t => t?.id === match.id))
  const totalMatchesPlayed = distinctMatches.length
  const totalMatchesWon = distinctMatches.filter(match => match.winner_id === teamId).length
  const totalMatchesLost = distinctMatches.filter(match => match.winner_id !== teamId).length

  // tournaments stats
  const distinctTournaments = distinctMatches
    .map(match => match.tournament)
    .filter((tournament, index, self) => tournament && index === self.findIndex(t => t?.id === tournament.id))
  const tournamentsWon = distinctTournaments.filter(tournament => tournament.winner_id === teamId).length

  return new TeamStats(
    team.toApiModel(),
    tournamentsWon,
    distinctTournaments.length,
    parseFloat(((totalMatchesWon / totalMatchesPlayed) * 100).toFixed(2)),
    totalMatchesPlayed,
    totalMatchesWon,
    totalMatchesLost,
    parseFloat(((totalMapsWon / totalMapsPlayed) * 100).toFixed(2)),
    totalMapsPlayed,
    totalMapsWon,
    totalMapsLost,
  )
}

/**
 * Sorts teams by their statistics.
 * 
 * @param a  The first team statistics
 * @param b  The second team statistics
 * @returns {number} - The comparison result.
  */
export const sortTeamsByStats = (a: TeamStats, b: TeamStats): number => {
  // Sort by following criteria:
  const criteria: [keyof TeamStats, boolean][] = [
    ['tournamentsWon', false],
    ['winrate', false],
    ['mapWinrate', false],
    ['totalMatchesWon', false],
    ['totalMapsWon', false],
    ['totalMatchesLost', true],
    ['totalMapsLost', true],
    ['totalMatchesPlayed', false],
    ['totalMapsPlayed', false],
  ]

  for (const [key, reverse] of criteria) {
    if (a[key] !== b[key]) {
      return reverse ? Number(a[key]) - Number(b[key]) : Number(b[key]) - Number(a[key])
    }
  }

  return 0
}
