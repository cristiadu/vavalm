import { Op } from "sequelize"
import { ItemsWithPagination, TeamStats } from "../base/types"
import Match from "../models/Match"
import Team from "../models/Team"
import Game from "../models/Game"
import GameStats from "../models/GameStats"

export const getAllStatsForAllTeams = async (limit: number, offset: number): Promise<ItemsWithPagination<TeamStats>> => {
  const teamsCount = await Team.count()
  const teams = await Team.findAll(
    {
      limit,
      offset,
      order: [['id', 'DESC']],
    }
  )

  const teamsStats = await Promise.all(teams.map(team => getAllStatsForTeam(team.id as number)))

  return {
    items: teamsStats,
    total: teamsCount,
  }
}

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
          },
        ],
      },
    ],
  })

  if (mapsPlayedForTeam.length === 0) {
    return {
      team: team,
      winrate: 0.0,
      totalMatchesPlayed: 0,
      totalMatchesWon: 0,
      totalMatchesLost: 0,
      mapWinrate: 0.0,
      totalMapsPlayed: 0,
      totalMapsWon: 0,
      totalMapsLost: 0,
    }
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

  return {
    team: team,
    winrate: parseFloat(((totalMatchesWon / totalMatchesPlayed) * 100).toFixed(2)),
    totalMatchesPlayed: totalMatchesPlayed,
    totalMatchesWon: totalMatchesWon,
    totalMatchesLost: totalMatchesLost,
    mapWinrate: parseFloat(((totalMapsWon / totalMapsPlayed) * 100).toFixed(2)),
    totalMapsPlayed: totalMapsPlayed,
    totalMapsWon: totalMapsWon,
    totalMapsLost: totalMapsLost,
  }
}
