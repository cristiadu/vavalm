import Team from '@/models/Team'
import Player from '@/models/Player'
import PlayerGameStats from '@/models/PlayerGameStats'
import { VlrPlayer } from '@/models/Vlr'
import Match from '@/models/Match'
import Game from '@/models/Game'
import GameStats from '@/models/GameStats'
import { AllPlayerStats, ItemsWithPagination } from '@/base/types'
import CacheService from '@/services/CacheService'
import { CACHE_TTL, CACHE_KEYS } from '@/base/CacheConstants'

/**
 * Updates or creates a player based on the player data and team.
 * @param playerData player data from VLR
 * @param team team data saved in the database
 */
export const updateOrCreatePlayer = async (playerData: VlrPlayer, team: Team): Promise<void> => {
  // Get player first to check if it exists
  const player = await Player.findOne({
    where: {
      nickname: playerData.nickname,
    },
  })

  if (player) {
    // Update only team if player exists
    await player.update({
      team_id: team.id,
      full_name: playerData.full_name ?? player.full_name,
    })

    console.log(`Player ${player.nickname} updated`)
    return
  }

  // Create player if it doesn't exist
  const playerCreated = await Player.create({
    nickname: playerData.nickname,
    full_name: playerData.full_name,
    country: playerData.country,
    role: playerData.role,
    team_id: team.id,
  }, {
    returning: true,
  })

  console.log(`Player ${playerCreated.nickname} created`)
}

/**
 * Returns the game stats row a player's per-game record belongs to, whichever
 * side they played on.
 * @param stats the player's stats row for a single game
 */
const gameStatsForPlayer = (stats: PlayerGameStats): GameStats | undefined =>
  stats.game_stats_player1 ?? stats.game_stats_player2

/**
 * Returns the id of the team the player actually played for in that game,
 * taken from the side they were recorded on rather than their current team.
 * @param stats the player's stats row for a single game
 */
const teamIdForGame = (stats: PlayerGameStats): number | undefined =>
  stats.game_stats_player1?.team1_id ?? stats.game_stats_player2?.team2_id

/**
 * Aggregates every recorded game into a single stats summary for one player.
 * @param playerId the player to summarise
 * @returns {Promise<AllPlayerStats>} - The player's aggregated statistics.
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

  // Which side a player took is recorded per game: a row linked through
  // game_stats_player1 was played for that game's team1, one linked through
  // game_stats_player2 for its team2. Reading the side rather than the player's
  // current team_id keeps historical stats correct after a transfer.
  const totalMapWins = playerStats.filter(stats => {
    const teamId = teamIdForGame(stats)
    return teamId !== undefined && gameStatsForPlayer(stats)?.winner_id === teamId
  }).length
  const totalMaps = playerStats.length

  // A match spans several games, so collapse to distinct matches, remembering
  // the side the player took in each one.
  const matchesPlayed = new Map<number, { match: Match, teamId: number }>()
  for (const stats of playerStats) {
    const match = gameStatsForPlayer(stats)?.game?.match
    const matchId = match?.id
    const teamId = teamIdForGame(stats)
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
  const cacheKey = CACHE_KEYS.ALL_PLAYER_STATS
  let allSorted = CacheService.get<AllPlayerStats[]>(cacheKey)

  if (!allSorted) {
    const players = await Player.findAll()
    allSorted = (await Promise.all(players.map(player => getAllStatsForPlayer(player.id)))).sort(sortPlayersByStats)
    CacheService.set(cacheKey, allSorted, CACHE_TTL.ALL_STATS)
  }

  const paginatedPlayerStats = allSorted.slice(offset, offset + limit)

  return new ItemsWithPagination<AllPlayerStats>(
    paginatedPlayerStats,
    allSorted.length,
  )
}

/**
 *  Sorts players by their statistics.
 * 
 * @param a  The first player statistics
 * @param b  The second player statistics
 * @returns {number} - The comparison result.
**/
export const sortPlayersByStats = (a: AllPlayerStats, b: AllPlayerStats): number => {
  // Sort by following criteria:
  const criteria: [keyof AllPlayerStats, boolean][] = [
    ['kda', false],
    ['totalKills', false],
    ['winrate', false],
    ['mapWinrate', false],
    ['totalAssists', false],
    ['totalMatchesWon', false],
    ['totalMapsWon', false],
    ['totalDeaths', true],
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
