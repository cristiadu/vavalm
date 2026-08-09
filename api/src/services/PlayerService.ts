import Team from '@/models/Team'
import Player from '@/models/Player'
import PlayerGameStats from '@/models/PlayerGameStats'
import { VlrPlayer } from '@/models/Vlr'
import Match from '@/models/Match'
import Game from '@/models/Game'
import GameStats from '@/models/GameStats'
import { AllPlayerStats, ItemsWithPagination } from '@/base/types'
import { fetchPlayerStatsTotals, PlayerStatsTotals } from '@/services/PlayerStatsAggregationService'

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

  // Get all maps the specific player has won and played
  const totalMapWins = playerStats.reduce((acc, stats) => {
    if (stats.player.team_id === stats.game_stats_player1?.winner_id || stats.player.team_id === stats.game_stats_player2?.winner_id) {
      return acc + 1
    }
    return acc
  }
  , 0)
  const totalMaps = playerStats.length

  // Get all Matches then filter by distinct matches
  // Compare with the team_id of the player at the time of the match
  const distinctMatches = playerStats
    .map(stats => stats.game_stats_player1?.game.match || stats.game_stats_player2?.game.match)
    .filter((match, index, self) => match && index === self.findIndex(t => t?.id === match.id))
  const totalMatchesWon = distinctMatches.reduce((acc, match) => {
    if (match && playerStats.some(stats => stats.player.team_id === match.winner_id)) {
      return acc + 1
    }
    return acc
  }
  , 0)

  const totalKills = playerStats.reduce((acc, stats) => acc + stats.kills, 0)
  const totalDeaths = playerStats.reduce((acc, stats) => acc + stats.deaths, 0)
  const totalAssists = playerStats.reduce((acc, stats) => acc + stats.assists, 0)
  const kda = totalDeaths === 0 ? 0 : parseFloat(((totalKills + totalAssists) / totalDeaths).toFixed(2))

  const winrate = parseFloat(((totalMatchesWon / distinctMatches.length) * 100).toFixed(2))
  const mapWinrate = parseFloat(((totalMapWins / totalMaps) * 100).toFixed(2))

  return new AllPlayerStats(
    playerStats[0].player.toApiModel(),
    kda,
    winrate,
    mapWinrate,
    distinctMatches.length,               // totalMatchesPlayed
    totalMatchesWon,                       // totalMatchesWon
    distinctMatches.length - totalMatchesWon, // totalMatchesLost
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
