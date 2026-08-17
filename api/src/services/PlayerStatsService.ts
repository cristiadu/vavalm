import { QueryTypes } from 'sequelize'

import db from '@/models/db'
import Team, { TEAM_ATTRIBUTES_WITHOUT_LOGO } from '@/models/Team'
import Player from '@/models/Player'
import Game from '@/models/Game'
import Match from '@/models/Match'
import GameStats from '@/models/GameStats'
import PlayerGameStats from '@/models/PlayerGameStats'
import { AllPlayerStats, ItemsWithPagination } from '@/base/types'

/**
 * Per-player totals as returned by the aggregate query.
 */
export interface PlayerStatsTotals {
  playerId: number
  mapsPlayed: number
  mapsWon: number
  matchesPlayed: number
  matchesWon: number
  kills: number
  deaths: number
  assists: number
}

/**
 * One row of the player aggregate query, before the bigint counts are converted.
 */
interface PlayerTotalsRow {
  player_id: number
  maps_played: string
  maps_won: string
  matches_played: string
  matches_won: string
  kills: string
  deaths: string
  assists: string
}


/**
 * Table names read from the models, so this SQL tracks any rename.
 */
const table = {
  players: Player.getTableName(),
  games: Game.getTableName(),
  matches: Match.getTableName(),
  gameStats: GameStats.getTableName(),
  playerGameStats: PlayerGameStats.getTableName(),
}

/**
 * Ordering for the players leaderboard, with player_id breaking ties so paging
 * is stable across requests.
 */
const PLAYER_ORDER_BY = `
  kda DESC,
  kills DESC,
  match_winrate DESC,
  map_winrate DESC,
  assists DESC,
  matches_won DESC,
  maps_won DESC,
  deaths ASC,
  (matches_played - matches_won) ASC,
  (maps_played - maps_won) ASC,
  matches_played DESC,
  maps_played DESC,
  player_id ASC
`

/**
 * A player's per-game row records which side they took: linked through
 * game_stats_player1 means they played for that game's team1, through
 * game_stats_player2 means team2. Results are attributed to that side rather
 * than to the player's current team, so transfers do not rewrite history.
 */
const playerTotalsSql = (playerFilter: string): string => `
  WITH player_games AS (
    SELECT
      pgs.player_id,
      pgs.kills,
      pgs.deaths,
      pgs.assists,
      COALESCE(gs1.team1_id, gs2.team2_id) AS side_team_id,
      COALESCE(gs1.winner_id, gs2.winner_id) AS map_winner_id,
      COALESCE(g1.match_id, g2.match_id) AS match_id,
      COALESCE(m1.winner_id, m2.winner_id) AS match_winner_id
    FROM "${table.playerGameStats}" pgs
    LEFT JOIN "${table.gameStats}" gs1 ON gs1.id = pgs.game_stats_player1_id
    LEFT JOIN "${table.gameStats}" gs2 ON gs2.id = pgs.game_stats_player2_id
    LEFT JOIN "${table.games}" g1 ON g1.id = gs1.game_id
    LEFT JOIN "${table.games}" g2 ON g2.id = gs2.game_id
    LEFT JOIN "${table.matches}" m1 ON m1.id = g1.match_id
    LEFT JOIN "${table.matches}" m2 ON m2.id = g2.match_id
  ),
  totals AS (
    SELECT
      p.id AS player_id,
      COUNT(pg.player_id) AS maps_played,
      COUNT(pg.player_id) FILTER (WHERE pg.map_winner_id = pg.side_team_id) AS maps_won,
      COUNT(DISTINCT pg.match_id) FILTER (WHERE pg.side_team_id IS NOT NULL) AS matches_played,
      COUNT(DISTINCT pg.match_id) FILTER (WHERE pg.match_winner_id = pg.side_team_id) AS matches_won,
      COALESCE(SUM(pg.kills), 0) AS kills,
      COALESCE(SUM(pg.deaths), 0) AS deaths,
      COALESCE(SUM(pg.assists), 0) AS assists
    FROM "${table.players}" p
    LEFT JOIN player_games pg ON pg.player_id = p.id
    ${playerFilter}
    GROUP BY p.id
  )
  SELECT
    totals.*,
    CASE WHEN deaths = 0 THEN 0
         ELSE ROUND((kills + assists) * 1.0 / deaths, 2) END AS kda,
    CASE WHEN matches_played = 0 THEN 0
         ELSE ROUND(matches_won * 100.0 / matches_played, 2) END AS match_winrate,
    CASE WHEN maps_played = 0 THEN 0
         ELSE ROUND(maps_won * 100.0 / maps_played, 2) END AS map_winrate
  FROM totals
  ORDER BY ${PLAYER_ORDER_BY}
`

/**
 * Aggregates player map, match and combat totals in one query, already ordered
 * for the leaderboard.
 *
 * @param playerId - Restrict to a single player; omit for every player.
 * @returns {Promise<PlayerStatsTotals[]>} One entry per player, including players with no games played.
 */
export const fetchPlayerStatsTotals = async (playerId?: number): Promise<PlayerStatsTotals[]> => {
  const rows = await db.sequelize.query<PlayerTotalsRow>(
    playerTotalsSql(playerId === undefined ? '' : 'WHERE p.id = :playerId'),
    { type: QueryTypes.SELECT, replacements: { playerId } },
  )

  return rows.map(row => ({
    playerId: Number(row.player_id),
    mapsPlayed: Number(row.maps_played),
    mapsWon: Number(row.maps_won),
    matchesPlayed: Number(row.matches_played),
    matchesWon: Number(row.matches_won),
    kills: Number(row.kills),
    deaths: Number(row.deaths),
    assists: Number(row.assists),
  }))
}

/**
 * Get all statistics for a single player, from the same aggregate query that
 * builds the leaderboard so the two can never disagree.
 *
 * @param playerId  The id of the player
 * @returns {Promise<AllPlayerStats>} - The player's aggregated statistics.
 * @throws {Error} - If the player is not found.
 */
export const getAllStatsForPlayer = async (playerId: number): Promise<AllPlayerStats> => {
  const player = await Player.findByPk(playerId, {
    include: [{ model: Team, as: 'team', attributes: TEAM_ATTRIBUTES_WITHOUT_LOGO }],
  })

  if (!player) {
    throw new Error('Player not found')
  }

  const [totals] = await fetchPlayerStatsTotals(playerId)

  return buildPlayerStats(player, totals)
}

/**
 * Fetches all player stats for all players.
 * @param limit - The number of items to fetch.
 * @param offset - The number of items to skip.
 * @returns {Promise<ItemsWithPagination<AllPlayerStats>>} - A promise that resolves to an array of player stats.
 * 
**/
export const getAllStatsForAllPlayers = async (limit: number, offset: number): Promise<ItemsWithPagination<AllPlayerStats>> => {
  const totals = await fetchPlayerStatsTotals()
  const items = await hydratePlayerStatsPage(totals, limit, offset)

  return new ItemsWithPagination<AllPlayerStats>(items, totals.length)
}

/**
 * Loads the entities for one page of aggregated totals and builds their stats.
 *
 * @param totals  The full ordered totals
 * @param limit  Page size
 * @param offset  Rows to skip
 * @returns {Promise<AllPlayerStats[]>} - Stats for the players on that page that still exist.
 */
const hydratePlayerStatsPage = async (totals: PlayerStatsTotals[], limit: number, offset: number): Promise<AllPlayerStats[]> => {
  const page = totals.slice(offset, offset + limit)
  const players = await Player.findAll({
    where: { id: page.map(entry => entry.playerId) },
    include: [{ model: Team, as: 'team', attributes: TEAM_ATTRIBUTES_WITHOUT_LOGO }],
  })
  const playersById = new Map(players.map(player => [player.id, player]))

  return page
    .map(entry => {
      const player = playersById.get(entry.playerId)
      return player ? buildPlayerStats(player, entry) : null
    })
    .filter((stats): stats is AllPlayerStats => stats !== null)
}

/**
 * Builds the api-facing stats object from a player and their aggregated totals.
 *
 * @param player  The player the totals belong to, with their team loaded
 * @param totals  Aggregated counts for that player
 * @returns {AllPlayerStats} - The player statistics.
 */
const buildPlayerStats = (player: Player, totals: PlayerStatsTotals): AllPlayerStats => {
  const kda = totals.deaths === 0
    ? 0
    : parseFloat(((totals.kills + totals.assists) / totals.deaths).toFixed(2))
  const winrate = totals.matchesPlayed === 0
    ? 0
    : parseFloat(((totals.matchesWon / totals.matchesPlayed) * 100).toFixed(2))
  const mapWinrate = totals.mapsPlayed === 0
    ? 0
    : parseFloat(((totals.mapsWon / totals.mapsPlayed) * 100).toFixed(2))

  return new AllPlayerStats(
    player.toApiModel(),
    kda,
    winrate,
    mapWinrate,
    totals.matchesPlayed,
    totals.matchesWon,
    totals.matchesPlayed - totals.matchesWon,
    totals.mapsPlayed,
    totals.mapsWon,
    totals.mapsPlayed - totals.mapsWon,
    totals.kills,
    totals.deaths,
    totals.assists,
    player.team?.toApiModel(),
  )
}
