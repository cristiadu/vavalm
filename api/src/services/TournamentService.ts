import { Op } from "sequelize"
import Standings from "../models/Standings"

const TournamentService = {
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
