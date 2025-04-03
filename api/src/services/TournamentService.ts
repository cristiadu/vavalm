import { Op } from "sequelize"

import Tournament from '@/models/Tournament'
import Standings from '@/models/Standings'
import Match from '@/models/Match'
import Game from '@/models/Game'
import GameStats from '@/models/GameStats'

import MatchService from '@/services/MatchService'

const TournamentService = {
  /**
   * Get the winner for a tournament.
   * 
   * @param tournamentId id of the tournament
   * @returns the id of the winning team
  **/
  getWinnerForTournament: async (tournamentId: number): Promise<number | null> => {
    const standings = await Standings.findOne({
      where: {
        tournament_id: tournamentId,
        position: 1,
      },
    })

    return standings?.team_id ?? null
  },

  /**
   * Get the tournament based off a match id.
   * 
   * @param matchId id of the match
   * @returns the tournament
   * 
   **/
  getTournamentByMatchId: async (matchId: number): Promise<Tournament | null> => {
    const tournament = await Tournament.findOne({
      include: [
        {
          model: Match,
          as: "schedule",
          where: { id: matchId },
        },
      ],
    })

    return tournament ?? null
  },
  /**
   * Create standings for teams that have been added to the tournament.
   *
   * @param teamIds ids of the teams that have been added to the tournament
   * @param tournamentId id of the tournament
   */
  createStandingsForTeamsIfNeeded: async (
    teamIds: number[],
    tournamentId: number,
  ): Promise<void> => {
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
  updateStandingsAndWinner: async (tournamentId: number): Promise<void> => {
    // Get tournament
    const tournament = await Tournament.findByPk(tournamentId)
    if (!tournament || !tournament.id) {
      throw new Error("Tournament not found")
    }

    if (tournament.ended) {
      return
    }

    if (!tournament.started) {
      tournament.started = true
      tournament.save()
    }

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

      let team1Standings: Standings | null = null
      let team2Standings: Standings | null = null
      
      team1Standings = await Standings.findOne({
        where: { tournament_id: tournamentId, team_id: team1Id },
      })
      team2Standings = await Standings.findOne({
        where: { tournament_id: tournamentId, team_id: team2Id },
      })

      if (team1Standings !== null && team2Standings !== null) {
        for (const game of games) {
          team1Standings.rounds_won += game.stats.team1_score
          team1Standings.rounds_lost += game.stats.team2_score
          team2Standings.rounds_won += game.stats.team2_score
          team2Standings.rounds_lost += game.stats.team1_score

          if (game.stats.winner_id === team1Id) {
            match.team1_score += 1
            team1Standings.maps_won += 1
            team2Standings.maps_lost += 1
            game.included_on_standings = true
          } else if (game.stats.winner_id === team2Id) {
            match.team2_score += 1
            team2Standings.maps_won += 1
            team1Standings.maps_lost += 1
            game.included_on_standings = true
          } else {
            console.info("No winner found for game:", game.id)
          }

          await game.save()
        }

        // Check if the match has a winner
        const matchWinner = await MatchService.getWinnerForMatchType(match)
        if (matchWinner != null) {
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

    // Update standings position for the tournament
    await TournamentService.updateStandingsPositions(tournamentId)

    // Check if the tournament has a winner
    const numberOfNonFinalizedMatches = await Match.count({
      where: { tournament_id: tournament.id, winner_id: { [Op.is]: null } },
    })
    if (numberOfNonFinalizedMatches == 0) {
      const tournament = await Tournament.findByPk(tournamentId)

      if (!tournament || !tournament.id) {
        throw new Error("Tournament not found")
      }

      const winner = await TournamentService.getWinnerForTournament(tournament.id)
      if (winner) {
        tournament.winner_id = winner
        tournament.ended = true
        await tournament.save()
      }
    }
  },

  /**
   * Update standings positions for the tournament.
   * 
   * @param tournamentId id of the tournament
   * 
    **/
  updateStandingsPositions: async (tournamentId: number): Promise<void> => {
    const standings = await Standings.findAll({
      where: { tournament_id: tournamentId },
      order: [
        ["wins", "DESC"],
        ["losses", "ASC"],
        ["maps_won", "DESC"],
        ["maps_lost", "ASC"],
        ["rounds_won", "DESC"],
        ["rounds_lost", "ASC"],
      ],
    })
    let position = 1
    for (const standing of standings) {
      standing.position = position
      await standing.save()
      position += 1
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
    tournamentId: number,
  ): Promise<void> => {
    await Standings.destroy({
      where: { tournament_id: tournamentId, team_id: { [Op.in]: teamIds } },
    })
  },
}

export default TournamentService
