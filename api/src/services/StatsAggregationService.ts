import { QueryTypes } from 'sequelize'

import db from '@/models/db'
import Team from '@/models/Team'
import Player from '@/models/Player'
import Game from '@/models/Game'
import Match from '@/models/Match'
import Tournament from '@/models/Tournament'
import GameStats from '@/models/GameStats'
import PlayerGameStats from '@/models/PlayerGameStats'

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

interface TeamTotalsRow {
  team_id: number
  maps_played: string
  maps_won: string
  matches_played: string
  matches_won: string
  tournaments_played: string
  tournaments_won: string
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
const teams = Team.getTableName()
const players = Player.getTableName()
const games = Game.getTableName()
const matches = Match.getTableName()
const tournaments = Tournament.getTableName()
const gameStats = GameStats.getTableName()
const playerGameStats = PlayerGameStats.getTableName()

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
 * A team's maps are the decided game stats rows on either side of the fixture.
 * Matches and tournaments are derived from those rows, so a team that has not
 * played anything still appears with zeroes thanks to the outer joins.
 */
const TEAM_TOTALS_SQL = `
  WITH totals AS (
    SELECT
      t.id AS team_id,
      COUNT(gs.id) AS maps_played,
      COUNT(gs.id) FILTER (WHERE gs.winner_id = t.id) AS maps_won,
      COUNT(DISTINCT g.match_id) AS matches_played,
      COUNT(DISTINCT g.match_id) FILTER (WHERE m.winner_id = t.id) AS matches_won,
      COUNT(DISTINCT m.tournament_id) AS tournaments_played,
      COUNT(DISTINCT m.tournament_id) FILTER (WHERE tr.winner_id = t.id) AS tournaments_won
    FROM "${teams}" t
    LEFT JOIN "${gameStats}" gs
      ON (gs.team1_id = t.id OR gs.team2_id = t.id) AND gs.winner_id IS NOT NULL
    LEFT JOIN "${games}" g ON g.id = gs.game_id
    LEFT JOIN "${matches}" m ON m.id = g.match_id
    LEFT JOIN "${tournaments}" tr ON tr.id = m.tournament_id
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
 * Aggregates every team's map, match and tournament totals in one query,
 * already ordered for the leaderboard.
 * @returns {Promise<TeamStatsTotals[]>} One entry per team, including teams with no games played.
 */
export const fetchTeamStatsTotals = async (): Promise<TeamStatsTotals[]> => {
  const rows = await db.sequelize.query<TeamTotalsRow>(TEAM_TOTALS_SQL, { type: QueryTypes.SELECT })

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
