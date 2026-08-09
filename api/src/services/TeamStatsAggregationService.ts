import { QueryTypes } from 'sequelize'

import db from '@/models/db'
import Team from '@/models/Team'
import Game from '@/models/Game'
import Match from '@/models/Match'
import Tournament from '@/models/Tournament'
import GameStats from '@/models/GameStats'

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

interface TeamTotalsRow {
  team_id: number
  maps_played: string
  maps_won: string
  matches_played: string
  matches_won: string
  tournaments_played: string
  tournaments_won: string
}


// Table names come from the models so the SQL below tracks any rename.
const teams = Team.getTableName()
const games = Game.getTableName()
const matches = Match.getTableName()
const tournaments = Tournament.getTableName()
const gameStats = GameStats.getTableName()

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

