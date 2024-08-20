import { Op } from "sequelize"
import Standings from "../models/Standings"
import Game from "../models/Game"
import GameStats from "../models/GameStats"
import Tournament from "../models/Tournament"

const TournamentService = {
  getTournamentByGameId: async (gameId: number) => {
    const tournament = await Tournament.findOne({
      include: [
        {
          model: Game,
          as: 'schedule',
          where: { id: gameId },
        },
      ],
    })

    return tournament
  },
  /**
   * Create standings for teams that have been added to the tournament.
   * 
   * @param teamIds ids of the teams that have been added to the tournament
   * @param tournamentId id of the tournament
   */
  createStandingsForTeamsIfNeeded: async (teamIds: number[], tournamentId: number) => {
    for (const teamId of teamIds) {
      const standings = await Standings.findOne({ where: { tournament_id: tournamentId, team_id: teamId } })
      if (!standings) {
        await Standings.create({
          tournament_id: tournamentId,
          team_id: teamId,
          wins: 0,
          losses: 0,
          maps_won: 0,
          maps_lost: 0,
          rounds_won: 0,
          rounds_lost: 0,
        })
      }
    }
  },

  /**
   * Update standings for the tournament based off finished games.
   * 
   * @param tournamentId id of the tournament
   */
  updateStandings: async (tournamentId: number) => {
    // Get all finished games for the tournament    
    const games = await Game.findAll({
      where: {
        tournament_id: tournamentId,
        included_on_standings: false,
      },
      include: [
        { model: GameStats, as: 'stats', where: { winner_id: { [Op.not]: null } } },
      ],
    })

    // Update standings for each team
    for (const game of games) {
      const stats = game.stats
      const team1Id = stats.team1_id
      const team2Id = stats.team2_id
      const winnerId = stats.winner_id

      const team1Standings = await Standings.findOne({ where: { tournament_id: tournamentId, team_id: team1Id } })
      const team2Standings = await Standings.findOne({ where: { tournament_id: tournamentId, team_id: team2Id } })

      if (team1Standings && team2Standings) {
        team1Standings.rounds_won += stats.team1_score
        team1Standings.rounds_lost += stats.team2_score

        team2Standings.rounds_won += stats.team2_score
        team2Standings.rounds_lost += stats.team1_score

        if (winnerId === team1Id) {
          team1Standings.wins += 1
          team1Standings.maps_won += 1
          team2Standings.maps_lost += 1
          team2Standings.losses += 1
        } else if (winnerId === team2Id) {
          team2Standings.wins += 1
          team2Standings.maps_won += 1
          team1Standings.maps_lost += 1
          team1Standings.losses += 1
        }

        await team1Standings.save()
        await team2Standings.save()
        game.included_on_standings = true
        await game.save()
      }
    }
  },

  /**
   * Remove standings for teams that have been removed from the tournament.
   * 
   * @param teamIds ids of the teams that have been removed from the tournament
   * @param tournamentId id of the tournament
   */
  removeStandingsForRemovedTeams: async (teamIds: number[], tournamentId: number) => {
    await Standings.destroy({ where: { tournament_id: tournamentId, team_id: { [Op.in]: teamIds } } })
  },
}

export default TournamentService
