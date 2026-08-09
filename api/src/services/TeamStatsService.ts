import { QueryTypes } from 'sequelize'

import db from '@/models/db'
import Team from '@/models/Team'
import Game from '@/models/Game'
import Match from '@/models/Match'
import Tournament from '@/models/Tournament'
import GameStats from '@/models/GameStats'
import { ItemsWithPagination, TeamStats } from '@/base/types'

/**
 * Per-team totals as returned by the aggregate query. Counts arrive from
 * postgres as strings because they are bigints, so every field is normalised
 * through Number() before it leaves this module.
 */
export interface TeamStatsTotals {
  teamId: number
  mapsPlayed: number
  mapsWon: number
  matchesPlayed: number
  matchesWon: number
  tournamentsPlayed: number
  tournamentsWon: number
}

/**
 * One row of the team aggregate query, before the bigint counts are converted.
 */
interface TeamTotalsRow {
  team_id: number
  maps_played: string
  maps_won: string
  matches_played: string
  matches_won: string
  tournaments_played: string
  tournaments_won: string
}


/**
 * Table names read from the models, so this SQL tracks any rename.
 */
const table = {
  teams: Team.getTableName(),
  games: Game.getTableName(),
  matches: Match.getTableName(),
  tournaments: Tournament.getTableName(),
  gameStats: GameStats.getTableName(),
}

/**
 * Ordering for the teams leaderboard, evaluated in the database so only the
 * page being requested has to be hydrated. team_id breaks ties so paging is
 * stable across requests.
 */
const TEAM_ORDER_BY = `
  tournaments_won DESC,
  match_winrate DESC,
  map_winrate DESC,
  matches_won DESC,
  maps_won DESC,
  (matches_played - matches_won) ASC,
  (maps_played - maps_won) ASC,
  matches_played DESC,
  maps_played DESC,
  team_id ASC
`

/**
 * A team's maps are the decided game stats rows on either side of the fixture.
 * Matches and tournaments are derived from those rows, so a team that has not
 * played anything still appears with zeroes thanks to the outer joins.
 */
const teamTotalsSql = (teamFilter: string): string => `
  WITH totals AS (
    SELECT
      t.id AS team_id,
      COUNT(gs.id) AS maps_played,
      COUNT(gs.id) FILTER (WHERE gs.winner_id = t.id) AS maps_won,
      COUNT(DISTINCT g.match_id) AS matches_played,
      COUNT(DISTINCT g.match_id) FILTER (WHERE m.winner_id = t.id) AS matches_won,
      COUNT(DISTINCT m.tournament_id) AS tournaments_played,
      COUNT(DISTINCT m.tournament_id) FILTER (WHERE tr.winner_id = t.id) AS tournaments_won
    FROM "${table.teams}" t
    LEFT JOIN "${table.gameStats}" gs
      ON (gs.team1_id = t.id OR gs.team2_id = t.id) AND gs.winner_id IS NOT NULL
    LEFT JOIN "${table.games}" g ON g.id = gs.game_id
    LEFT JOIN "${table.matches}" m ON m.id = g.match_id
    LEFT JOIN "${table.tournaments}" tr ON tr.id = m.tournament_id
    ${teamFilter}
    GROUP BY t.id
  )
  SELECT
    totals.*,
    CASE WHEN matches_played = 0 THEN 0
         ELSE ROUND(matches_won * 100.0 / matches_played, 2) END AS match_winrate,
    CASE WHEN maps_played = 0 THEN 0
         ELSE ROUND(maps_won * 100.0 / maps_played, 2) END AS map_winrate
  FROM totals
  ORDER BY ${TEAM_ORDER_BY}
`

/**
 * Aggregates team map, match and tournament totals in one query, already
 * ordered for the leaderboard.
 *
 * @param teamId - Restrict to a single team; omit for every team.
 * @returns {Promise<TeamStatsTotals[]>} One entry per team, including teams with no games played.
 */
export const fetchTeamStatsTotals = async (teamId?: number): Promise<TeamStatsTotals[]> => {
  const rows = await db.sequelize.query<TeamTotalsRow>(
    teamTotalsSql(teamId === undefined ? '' : 'WHERE t.id = :teamId'),
    { type: QueryTypes.SELECT, replacements: { teamId } },
  )

  return rows.map(row => ({
    teamId: Number(row.team_id),
    mapsPlayed: Number(row.maps_played),
    mapsWon: Number(row.maps_won),
    matchesPlayed: Number(row.matches_played),
    matchesWon: Number(row.matches_won),
    tournamentsPlayed: Number(row.tournaments_played),
    tournamentsWon: Number(row.tournaments_won),
  }))
}

/**
 * Fetches stats for every team, ordered for the leaderboard and paginated.
 *
 * Totals come from one aggregate query rather than one query per team, and
 * only the requested page is hydrated into api models.
 *
 * @param limit - The number of items to fetch.
 * @param offset - The number of items to skip.
 * @returns {Promise<ItemsWithPagination<TeamStats>>} - The requested page of team stats.
 */
export const getAllStatsForAllTeams = async (limit: number, offset: number): Promise<ItemsWithPagination<TeamStats>> => {
  const totals = await fetchTeamStatsTotals()
  const items = await hydrateTeamStatsPage(totals, limit, offset)

  return new ItemsWithPagination<TeamStats>(items, totals.length)
}

/**
 * Loads the entities for one page of aggregated totals and builds their stats.
 *
 * @param totals  The full ordered totals
 * @param limit  Page size
 * @param offset  Rows to skip
 * @returns {Promise<TeamStats[]>} - Stats for the teams on that page that still exist.
 */
const hydrateTeamStatsPage = async (totals: TeamStatsTotals[], limit: number, offset: number): Promise<TeamStats[]> => {
  const page = totals.slice(offset, offset + limit)
  const teams = await Team.findAll({ where: { id: page.map(entry => entry.teamId) } })
  const teamsById = new Map(teams.map(team => [team.id, team]))

  return page
    .map(entry => {
      const team = teamsById.get(entry.teamId)
      return team ? buildTeamStats(team, entry) : null
    })
    .filter((stats): stats is TeamStats => stats !== null)
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
 * Get all statistics for a single team, from the same aggregate query that
 * builds the leaderboard so the two can never disagree.
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

  const [totals] = await fetchTeamStatsTotals(teamId)

  return buildTeamStats(team, totals)
}
