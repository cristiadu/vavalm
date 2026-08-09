import { QueryTypes } from 'sequelize'

import db from '@/models/db'
import Team from '@/models/Team'
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


// Table names come from the models so the SQL below tracks any rename.
const players = Player.getTableName()
const games = Game.getTableName()
const matches = Match.getTableName()
const gameStats = GameStats.getTableName()
const playerGameStats = PlayerGameStats.getTableName()

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
const PLAYER_TOTALS_SQL = `
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
    FROM "${playerGameStats}" pgs
    LEFT JOIN "${gameStats}" gs1 ON gs1.id = pgs.game_stats_player1_id
    LEFT JOIN "${gameStats}" gs2 ON gs2.id = pgs.game_stats_player2_id
    LEFT JOIN "${games}" g1 ON g1.id = gs1.game_id
    LEFT JOIN "${games}" g2 ON g2.id = gs2.game_id
    LEFT JOIN "${matches}" m1 ON m1.id = g1.match_id
    LEFT JOIN "${matches}" m2 ON m2.id = g2.match_id
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
    FROM "${players}" p
    LEFT JOIN player_games pg ON pg.player_id = p.id
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
 * Aggregates every player's map, match and combat totals in one query,
 * already ordered for the leaderboard.
 * @returns {Promise<PlayerStatsTotals[]>} One entry per player, including players with no games played.
 */
export const fetchPlayerStatsTotals = async (): Promise<PlayerStatsTotals[]> => {
  const rows = await db.sequelize.query<PlayerTotalsRow>(PLAYER_TOTALS_SQL, { type: QueryTypes.SELECT })

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
 * Updates or creates a player based on the player data and team.
 * @param playerData player data from VLR
 * @param team team data saved in the database
 * @returns {Promise<Player>} - The player created or updated.
 * 
**/
export const getAllStatsForPlayer = async (playerId: number): Promise<AllPlayerStats> => {
  const playerStats = await PlayerGameStats.findAll({
    where: { player_id: playerId },
    include: [
      {
        model: Player,
        as: 'player',
        include: [{ model: Team, as: 'team' }],
      },
      {
        model: GameStats,
        as: 'game_stats_player1',
        include: [{
          model: Game,
          as: 'game',
          include: [{
            model: Match,
            as: 'match',
          }],
        }],
      },
      {
        model: GameStats,
        as: 'game_stats_player2',
        include: [{
          model: Game,
          as: 'game',
          include: [{
            model: Match,
            as: 'match',
          }],
        }],
      },
    ],
  })

  if (playerStats.length === 0) {
    const playerWithTeam = await Player.findByPk(playerId, {
      include: [{ model: Team, as: 'team' }],
    }) as Player
    return new AllPlayerStats(
      playerWithTeam.toApiModel(),
      parseFloat(0.00.toFixed(2)),
      parseFloat(0.00.toFixed(2)),
      parseFloat(0.00.toFixed(2)),
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      playerWithTeam.team?.toApiModel(),
    )
  }

  // Results are credited to the side the player took in each game, not to the
  // team they belong to now, so a transfer does not rewrite their history.
  const totalMapWins = playerStats.filter(stats => {
    const teamId = stats.playedForTeamId()
    return teamId !== undefined && stats.playedGameStats()?.winner_id === teamId
  }).length
  const totalMaps = playerStats.length

  // A match spans several games, so collapse to distinct matches, keeping the
  // side the player took in each one.
  const matchesPlayed = new Map<number, { match: Match, teamId: number }>()
  for (const stats of playerStats) {
    const match = stats.playedGameStats()?.game?.match
    const matchId = match?.id
    const teamId = stats.playedForTeamId()
    if (match && matchId !== undefined && teamId !== undefined && !matchesPlayed.has(matchId)) {
      matchesPlayed.set(matchId, { match, teamId })
    }
  }
  const totalMatchesPlayed = matchesPlayed.size
  const totalMatchesWon = Array.from(matchesPlayed.values())
    .filter(({ match, teamId }) => match.winner_id === teamId).length

  const totalKills = playerStats.reduce((acc, stats) => acc + stats.kills, 0)
  const totalDeaths = playerStats.reduce((acc, stats) => acc + stats.deaths, 0)
  const totalAssists = playerStats.reduce((acc, stats) => acc + stats.assists, 0)
  const kda = totalDeaths === 0 ? 0 : parseFloat(((totalKills + totalAssists) / totalDeaths).toFixed(2))

  const winrate = parseFloat(((totalMatchesWon / totalMatchesPlayed) * 100).toFixed(2))
  const mapWinrate = parseFloat(((totalMapWins / totalMaps) * 100).toFixed(2))

  return new AllPlayerStats(
    playerStats[0].player.toApiModel(),
    kda,
    winrate,
    mapWinrate,
    totalMatchesPlayed,                    // totalMatchesPlayed
    totalMatchesWon,                       // totalMatchesWon
    totalMatchesPlayed - totalMatchesWon,  // totalMatchesLost
    totalMaps,                            // totalMapsPlayed
    totalMapWins,                         // totalMapsWon
    totalMaps - totalMapWins,             // totalMapsLost
    totalKills,
    totalDeaths,
    totalAssists,
    playerStats[0].player.team?.toApiModel(),
  )
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
    include: [{ model: Team, as: 'team' }],
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
