import { Op } from "sequelize"

import { downloadPNGImage } from '@/base/FileUtils'

import { ItemsWithPagination, TeamStats } from '@/base/types'
import { VlrTeam } from '@/models/Vlr'
import Tournament from '@/models/Tournament'
import Match from '@/models/Match'
import Game from '@/models/Game'
import GameStats from '@/models/GameStats'
import Team from '@/models/Team'
import CacheService from '@/services/CacheService'
import { CACHE_TTL, CACHE_KEYS } from '@/base/CacheConstants'
import { fetchTeamStatsTotals, TeamStatsTotals } from '@/services/StatsAggregationService'

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


/**
 * Fetches stats for every team, ordered for the leaderboard and paginated.
 *
 * Totals come from one aggregate query rather than one query per team, and
 * only the requested page is hydrated into api models — the cached value is a
 * small array of counts, not a list of teams carrying their logos.
 *
 * @param limit - The number of items to fetch.
 * @param offset - The number of items to skip.
 * @returns {Promise<ItemsWithPagination<TeamStats>>} - The requested page of team stats.
 */
export const getAllStatsForAllTeams = async (limit: number, offset: number): Promise<ItemsWithPagination<TeamStats>> => {
  const cacheKey = CACHE_KEYS.ALL_TEAM_STATS
  let totals = CacheService.get<TeamStatsTotals[]>(cacheKey)

  if (!totals) {
    totals = await fetchTeamStatsTotals()
    CacheService.set(cacheKey, totals, CACHE_TTL.ALL_STATS)
  }

  const page = totals.slice(offset, offset + limit)
  const teams = await Team.findAll({ where: { id: page.map(entry => entry.teamId) } })
  const teamsById = new Map(teams.map(team => [team.id, team]))

  const items = page
    .map(entry => {
      const team = teamsById.get(entry.teamId)
      return team ? buildTeamStats(team, entry) : null
    })
    .filter((stats): stats is TeamStats => stats !== null)

  return new ItemsWithPagination<TeamStats>(items, totals.length)
}

/**
 * Builds the api-facing stats object from a team and its aggregated totals.
 *
 * @param team  The team the totals belong to
 * @param totals  Aggregated counts for that team
 * @returns {TeamStats} - The team statistics.
 */
const buildTeamStats = (team: Team, totals: TeamStatsTotals): TeamStats => {
  const winrate = totals.matchesPlayed === 0
    ? 0
    : parseFloat(((totals.matchesWon / totals.matchesPlayed) * 100).toFixed(2))
  const mapWinrate = totals.mapsPlayed === 0
    ? 0
    : parseFloat(((totals.mapsWon / totals.mapsPlayed) * 100).toFixed(2))

  return new TeamStats(
    team.toApiModel(),
    totals.tournamentsWon,
    totals.tournamentsPlayed,
    winrate,
    totals.matchesPlayed,
    totals.matchesWon,
    totals.matchesPlayed - totals.matchesWon,
    mapWinrate,
    totals.mapsPlayed,
    totals.mapsWon,
    totals.mapsPlayed - totals.mapsWon,
  )
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
