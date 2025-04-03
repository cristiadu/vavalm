import Team from '@/models/Team'
import Player from '@/models/Player'
import PlayerGameStats from '@/models/PlayerGameStats'
import { VlrPlayer } from '@/models/Vlr'
import Match from '@/models/Match'
import Game from '@/models/Game'
import GameStats from '@/models/GameStats'
import { AllPlayerStats, ItemsWithPagination } from '@/base/types'

/**
 * Updates or creates a player based on the player data and team.
 * @param playerData player data from VLR
 * @param team team data saved in the database
 */
export const updateOrCreatePlayer = async (playerData: VlrPlayer, team: Team) => {
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
    return {
      player: await Player.findByPk(playerId) as Player,
      kda: parseFloat(0.00.toFixed(2)),
      winrate: parseFloat(0.00.toFixed(2)),
      mapWinrate: parseFloat(0.00.toFixed(2)),
      totalMapsPlayed: 0,
      totalMapsWon: 0,
      totalMapsLost: 0,
      totalMatchesWon: 0,
      totalMatchesLost: 0,
      totalMatchesPlayed: 0,
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0,
    }
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
  const kda = parseFloat(((totalKills + totalAssists) / totalDeaths).toFixed(2))

  const winrate = parseFloat((totalMatchesWon / distinctMatches.length).toFixed(2)) * 100
  const mapWinrate = parseFloat((totalMapWins / totalMaps).toFixed(2)) * 100

  return {
    player: playerStats[0].player,
    kda,
    winrate,
    mapWinrate,
    totalMapsPlayed: totalMaps,
    totalMapsWon: totalMapWins,
    totalMapsLost: totalMaps - totalMapWins,
    totalMatchesWon: totalMatchesWon,
    totalMatchesLost: distinctMatches.length - totalMatchesWon,
    totalMatchesPlayed: distinctMatches.length,
    totalKills,
    totalDeaths,
    totalAssists,
  }
}

/**
 * Fetches all player stats for all players.
 * @param limit - The number of items to fetch.
 * @param offset - The number of items to skip.
 * @returns {Promise<ItemsWithPagination<AllPlayerStats>>} - A promise that resolves to an array of player stats.
 * 
**/
export const getAllStatsForAllPlayers = async (limit: number, offset: number): Promise<ItemsWithPagination<AllPlayerStats>> => {
  const players = await Player.findAll()
  const playerStats = (await Promise.all(players.map(player => getAllStatsForPlayer(player.id)))).sort(sortPlayersByStats)

  // Apply limit and offset
  const paginatedPlayerStats = playerStats.slice(offset, offset + limit)

  return {
    items: paginatedPlayerStats,
    total: players.length,
  }
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
