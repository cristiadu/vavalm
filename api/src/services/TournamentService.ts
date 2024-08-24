import { Op } from "sequelize"
import Standings from "../models/Standings"
import Game from "../models/Game"
import GameStats from "../models/GameStats"
import Tournament from "../models/Tournament"
import Match from "../models/Match"
import MatchService from "./MatchService"

const TournamentService = {
  getTournamentByMatchId: async (matchId: number) => {
    const tournament = await Tournament.findOne({
      include: [
        {
          model: Match,
          as: "schedule",
          where: { id: matchId },
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
  createStandingsForTeamsIfNeeded: async (
    teamIds: number[],
    tournamentId: number
  ) => {
    for (const teamId of teamIds) {
      const standings = await Standings.findOne({
        where: { tournament_id: tournamentId, team_id: teamId },
      })
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
    const matches = await Match.findAll({
      where: {
        tournament_id: tournamentId,
        included_on_standings: false,
      },
      include: [
        {
          model: Game,
          as: "games",
          where: { included_on_standings: false },
          include: [
            {
              model: GameStats,
              as: "stats",
              where: { winner_id: { [Op.not]: null } },
            },
          ],
        },
      ],
    })

    // Update standings for each based on the matches
    for (const match of matches) {
      const games = match.games
      const team1Id = match.team1_id
      const team2Id = match.team2_id

      const team1Standings = await Standings.findOne({
        where: { tournament_id: tournamentId, team_id: team1Id },
      })
      const team2Standings = await Standings.findOne({
        where: { tournament_id: tournamentId, team_id: team2Id },
      })

      if (team1Standings && team2Standings) {
        for (const game of games) {
          team1Standings.rounds_won += game.stats.team1_score
          team1Standings.rounds_lost += game.stats.team2_score
          team2Standings.rounds_won += game.stats.team2_score
          team2Standings.rounds_lost += game.stats.team1_score

          if (game.stats.winner_id === team1Id) {
            match.team1_score += 1
            team1Standings.maps_won = match.team1_score
            team2Standings.maps_lost = match.team1_score
          } else if (game.stats.winner_id === team2Id) {
            match.team2_score += 1
            team2Standings.maps_won = match.team2_score
            team1Standings.maps_lost = match.team2_score
          } else {
            console.info("No winner found for game:", game.id)
          }

          game.included_on_standings = true
          await game.save()
        }

        // Check if the match has a winner
        const matchWinner = await MatchService.getWinnerForMatchType(match)
        console.log("matchWinner", matchWinner)
        if(matchWinner != null) {
          if (matchWinner === team1Id) {
            team1Standings.wins += 1
            team2Standings.losses += 1
          } else if (matchWinner === team2Id) {
            team2Standings.wins += 1
            team1Standings.losses += 1
          } else {
            console.info("No proper winner found for match:", match.id)
          }

          match.winner_id = matchWinner
          match.included_on_standings = true
        }

        await team1Standings.save()
        await team2Standings.save()
        await match.save()
      }
    }
  },

  /**
   * Remove standings for teams that have been removed from the tournament.
   *
   * @param teamIds ids of the teams that have been removed from the tournament
   * @param tournamentId id of the tournament
   */
  removeStandingsForRemovedTeams: async (
    teamIds: number[],
    tournamentId: number
  ) => {
    await Standings.destroy({
      where: { tournament_id: tournamentId, team_id: { [Op.in]: teamIds } },
    })
  },
}

export default TournamentService
