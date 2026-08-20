import { Body, Controller, Delete, Get, OperationId, Path, Post, Put, Query, Route, SuccessResponse } from "@tsoa/runtime"
import { ItemsWithPagination } from "@/base/types"
import { TournamentApiModel } from "@/models/contract/TournamentApiModel"
import { MatchApiModel } from "@/models/contract/MatchApiModel"
import { StandingsApiModel } from "@/models/contract/StandingsApiModel"
import Team from "@/models/Team"
import Tournament from "@/models/Tournament"
import Standings from "@/models/Standings"
import { MatchType } from "@/models/enums"
import TournamentService from "@/services/TournamentService"
import MatchService from "@/services/MatchService"
import { toTeamId } from "@/models/contract/TeamApiModel"

@Route("tournaments")
export class TournamentController extends Controller {
  /**
   * Retrieves all tournaments with optional pagination
   * @param limit Maximum number of tournaments to return
   * @param offset Number of tournaments to skip
   */
  @Get()
  @OperationId("getTournaments")
  public async getTournaments(
    @Query() limit = 10,
    @Query() offset = 0,
  ): Promise<ItemsWithPagination<TournamentApiModel>> {
    const count = await Tournament.count()
    
    const rows = await Tournament.findAll({
      limit: Math.min(limit, 100),
      offset,
      order: [["id", "ASC"]],
      include: [
        { 
          model: Team, 
          as: "teams", 
          attributes: ["id", "short_name", "country"],
        },
      ],
    })
    
    const result = new ItemsWithPagination<Tournament>(rows, count)
    return result.toApiModel(new ItemsWithPagination<TournamentApiModel>([], 0))
  }

  /**
   * Retrieves a specific tournament by its ID
   * @param tournamentId The ID of the tournament to retrieve
   */
  @Get("{tournamentId}")
  @OperationId("getTournament")
  public async getTournament(@Path() tournamentId: number): Promise<TournamentApiModel> {
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [
        {
          model: Standings,
          as: "standings",
        },
        { model: Team, as: "teams" },
      ],
      order: [[{ model: Standings, as: "standings" }, "position", "ASC"]],
    })
    
    if (!tournament) {
      this.setStatus(404)
      throw new Error("Tournament not found")
    }
    
    return tournament.toApiModel()
  }

  /**
   * Retrieves the match schedule for a tournament
   * @param tournamentId The ID of the tournament to retrieve the schedule for
   * @param limit Maximum number of matches to return
   * @param offset Number of matches to skip
   */
  @Get("{tournamentId}/schedule")
  @OperationId("getTournamentSchedule")
  public async getTournamentSchedule(
    @Path() tournamentId: number,
    @Query() limit: number = 10,
    @Query() offset: number = 0,
  ): Promise<ItemsWithPagination<MatchApiModel>> {
    const result = await MatchService.getMatchesFromTournament(tournamentId, limit, offset)
    return result.toApiModel(new ItemsWithPagination<MatchApiModel>([], 0))
  }

  /**
   * Retrieves the standings for a tournament
   * @param tournamentId The ID of the tournament to retrieve standings for
   */
  @Get("{tournamentId}/standings")
  @OperationId("getTournamentStandings")
  public async getTournamentStandings(
    @Path() tournamentId: number,
  ): Promise<StandingsApiModel[]> {
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [
        {
          model: Standings,
          as: "standings",
        },
      ],
      order: [[{ model: Standings, as: "standings" }, "position", "ASC"]],
    })
    
    if (!tournament) {
      this.setStatus(404)
      throw new Error("Tournament not found")
    }
    
    if (!tournament.standings) {
      return []
    }
    
    return tournament.standings.map(standing => standing.toApiModel())
  }

  /**
   * Creates a new tournament
   * @param requestBody The tournament data to create
   */
  @Post()
  @OperationId("createTournament")
  @SuccessResponse("201", "Tournament created")
  public async createTournament(
    @Body() requestBody: TournamentApiModel,
  ): Promise<TournamentApiModel> {
    const { type, name, description, country, teams, start_date, end_date } = requestBody
    
    if (!type || !name || !teams || !country || !start_date || !end_date) {
      this.setStatus(400)
      throw new Error("Please provide type, name, teams, country and start/end date.")
    }
    
    const tournament = await Tournament.create({
      type,
      name,
      description,
      country,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      started: false,
      ended: false,
    })
    
    // Associate existing teams with the new tournament
    if (teams && tournament.id && teams.length > 0) {
      const teamIds = teams.map(toTeamId).filter((id): id is number => id != null)
      await tournament.addTeams(teamIds)
      
      // Create standings object for teams if they don't exist
      await TournamentService.createStandingsForTeamsIfNeeded(teamIds, tournament.id)
      await MatchService.createTeamMatchesForTournamentIfNeeded(teamIds, tournament, MatchType.BO3)
    }
    
    this.setStatus(201)
    return tournament.toApiModel()
  }

  /**
   * Updates an existing tournament
   * @param tournamentId The ID of the tournament to update
   * @param requestBody The tournament data to update
   */
  @Put("{tournamentId}")
  @OperationId("updateTournament")
  public async updateTournament(
    @Path() tournamentId: number,
    @Body() requestBody: TournamentApiModel,
  ): Promise<TournamentApiModel> {
    const { type, name, description, country, teams, start_date, end_date } = requestBody
    
    if (!type || !name || !teams || !country || !start_date || !end_date) {
      this.setStatus(400)
      throw new Error("Please provide type, name, teams, country and start/end date.")
    }
    
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [
        { model: Team, as: "teams" },
      ],
    })
    
    if (!tournament) {
      this.setStatus(404)
      throw new Error("Tournament not found")
    }
    
    // Resolve the requested teams once, and capture the current membership before
    // setTeams replaces it — the removed and added sets are both differences
    // against the membership as it was on entry.
    const requestedTeamIds = teams.map(toTeamId).filter((id): id is number => id != null)
    const existingTeamIds = tournament.teams
      .map(team => team?.id)
      .filter((id): id is number => id != null)

    const removedTeamIds = existingTeamIds.filter(id => !requestedTeamIds.includes(id))
    
    await tournament.update({
      type,
      name,
      description,
      country,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
    })
    
    // Associate teams with the tournament
    await tournament.setTeams(requestedTeamIds)
    
    // Update standings and matches
    if (removedTeamIds && removedTeamIds.length > 0) {
      await TournamentService.removeStandingsForRemovedTeams(removedTeamIds, tournamentId)
      await MatchService.deleteTeamsMatchesFromTournament(removedTeamIds, tournamentId)
    }
    
    // Create new standings and matches for new teams
    const newTeamIds = requestedTeamIds.filter(id => !existingTeamIds.includes(id))
    
    if (newTeamIds.length > 0) {
      await TournamentService.createStandingsForTeamsIfNeeded(newTeamIds, tournamentId)
      await MatchService.createTeamMatchesForTournamentIfNeeded(newTeamIds, tournament, MatchType.BO3)
    }
    
    return tournament.toApiModel()
  }
  
  /**
   * Starts a tournament
   * @param tournamentId The ID of the tournament to start
   */
  @Post("{tournamentId}/start")
  @OperationId("startTournament")
  public async startTournament(@Path() tournamentId: number): Promise<TournamentApiModel> {
    const tournament = await Tournament.findByPk(tournamentId)
    
    if (!tournament) {
      this.setStatus(404)
      throw new Error("Tournament not found")
    }
    
    if (tournament.started) {
      this.setStatus(400)
      throw new Error("Tournament has already started")
    }
    
    await tournament.update({ started: true })
    return tournament.toApiModel()
  }
  
  /**
   * Ends a tournament
   * @param tournamentId The ID of the tournament to end
   * @param winnerId The ID of the winning team
   */
  @Post("{tournamentId}/end")
  @OperationId("endTournament")
  public async endTournament(
    @Path() tournamentId: number,
    @Body() requestBody: { winner_id: number },
  ): Promise<TournamentApiModel> {
    const tournament = await Tournament.findByPk(tournamentId)
    
    if (!tournament) {
      this.setStatus(404)
      throw new Error("Tournament not found")
    }
    
    if (!tournament.started) {
      this.setStatus(400)
      throw new Error("Tournament has not started")
    }
    
    if (tournament.ended) {
      this.setStatus(400)
      throw new Error("Tournament has already ended")
    }
    
    await tournament.update({ 
      ended: true,
      winner_id: requestBody.winner_id,
    })
    
    return tournament.toApiModel()
  }

  /**
   * Deletes a tournament
   * @param tournamentId The ID of the tournament to delete
   */
  @Delete("{tournamentId}")
  @OperationId("deleteTournament")
  public async deleteTournament(@Path() tournamentId: number): Promise<void> {
    await TournamentService.deleteTournament(tournamentId)
  }
}
