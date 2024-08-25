import { AllPlayerStats, ItemsWithPagination } from "../base/types"
import GameStats from "../models/GameStats"
import Player from "../models/Player"
import PlayerGameStats from "../models/PlayerGameStats"

export const getAllStatsForPlayer = async (playerId: number): Promise<AllPlayerStats> => {
  const playerStats = await PlayerGameStats.findAll({
    where: { player_id: playerId },
    include: [
      {
        model: Player,
        as: 'player',
      },
    ],
  })

  const player = playerStats[0].player
  const totalWins = player ? await GameStats.count({ where: { winner_id: player.team_id } }) : 0
  const totalGames = playerStats.length
  const totalKills = playerStats.reduce((acc, stats) => acc + stats.kills, 0)
  const totalDeaths = playerStats.reduce((acc, stats) => acc + stats.deaths, 0)
  const totalAssists = playerStats.reduce((acc, stats) => acc + stats.assists, 0)
  const kda = parseFloat(((totalKills + totalAssists) / totalDeaths).toFixed(2))
  const winrate = parseFloat((totalWins / totalGames).toFixed(2))

  return {
    player,
    kda,
    winrate,
    totalGames,
    totalWins,
    totalKills,
    totalDeaths,
    totalAssists,
  }
}

export const getAllStatsForAllPlayers = async (limit: number, offset: number): Promise<ItemsWithPagination<AllPlayerStats>> => {
  const playerCount = await Player.count()
  const players = await Player.findAll(
    {
      limit,
      offset,
      order: [['id', 'DESC']],
    }
  )

  const playerStats = await Promise.all(players.map(player => getAllStatsForPlayer(player.id)))
    
  return {
    items: playerStats,
    total: playerCount,
  }
}
