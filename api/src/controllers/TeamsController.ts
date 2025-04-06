import { Body, Controller, Delete, FormField, Get, OperationId, Path, Post, Put, Query, Route, SuccessResponse, UploadedFile } from "tsoa"
import { ItemsWithPagination } from "@/base/types"
import { TeamApiModel } from "@/models/contract/TeamApiModel"
import { PlayerApiModel } from "@/models/contract/PlayerApiModel"
import { TeamStats } from "@/base/types"
import Team from "@/models/Team"
import Player from "@/models/Player"
import { getAllStatsForAllTeams, getAllStatsForTeam } from "@/services/TeamService"
import { Op } from "sequelize"

@Route("teams")
export class TeamsController extends Controller {
  /**
   * Get all teams with optional filtering
   * @param country Optional country filter
   * @param limit Maximum number of teams to return
   * @param offset Number of teams to skip
   */
  @Get()
  @OperationId("getTeams")
  public async getTeams(
    @Query() country?: string,
    @Query() limit = 10, 
    @Query() offset = 0,
  ): Promise<ItemsWithPagination<TeamApiModel>> {
    const filter = {}
    if (country) {
      Object.assign(filter, { country: { [Op.like]: `%${country}%` } })
    }

    const teams = await Team.findAndCountAll({
      where: filter,
      limit: Math.min(limit, 100),
      offset,
      order: [["id", "ASC"]],
    })
    
    const result = new ItemsWithPagination(teams.rows, teams.count)
    return result.toApiModel(new ItemsWithPagination<TeamApiModel>([], 0))
  }

  /**
   * Retrieves stats for all teams
   * @param limit Maximum number of teams to include
   * @param offset Number of teams to skip
   */
  @Get("stats")
  @OperationId("getTeamsStats")
  public async getTeamsStats(
    @Query() limit: number = 10,
    @Query() offset: number = 0,
  ): Promise<ItemsWithPagination<TeamStats>> {
    const result = await getAllStatsForAllTeams(limit, offset)
    return result.toApiModel(new ItemsWithPagination<TeamStats>([], 0))
  }

  /**
   * Creates multiple teams from a bulk upload
   * @param requestBody Array of team data to create
   */
  @Post("bulk")
  @OperationId("createTeamsBulk")
  @SuccessResponse("201", "Teams created successfully")
  public async createTeamsBulk(
    @Body() requestBody: TeamApiModel[],
  ): Promise<TeamApiModel[]> {
    const newTeams = await Team.bulkCreate(await Promise.all(requestBody.map(team => team.toEntityModelBulk())))
    
    this.setStatus(201)
    return newTeams.map(team => team.toApiModel())
  }

  /**
   * Get a specific team by ID
   * @param teamId The ID of the team to retrieve
   */
  @Get("{teamId}")
  @OperationId("getTeam")
  public async getTeam(@Path() teamId: number): Promise<TeamApiModel> {
    const team = await Team.findByPk(teamId, {
      include: [
        { model: Player, as: "players" },
      ],
    })
    
    if (!team) {
      this.setStatus(404)
      throw new Error("Team not found")
    }
    
    return team.toApiModel()
  }

  /**
   * Retrieves stats for a specific team
   * @param teamId The ID of the team to retrieve stats for
   */
  @Get("{teamId}/stats")
  @OperationId("getTeamStats")
  public async getTeamStats(@Path() teamId: number): Promise<TeamStats> {
    return (await getAllStatsForTeam(teamId)).toApiModel()
  }

  /**
   * Creates a new team
   * @param requestBody The team data to create
   */
  @Post()
  @OperationId("createTeam")
  @SuccessResponse("201", "Team created")
  public async createTeam(
    @FormField() short_name: string,
    @FormField() full_name: string,
    @FormField() description: string,
    @FormField() country: string,
    @UploadedFile() logo_image_file?: File,
  ): Promise<TeamApiModel> {
    if (!short_name || !full_name || !country) {
      this.setStatus(400)
      throw new Error("short_name, full_name, and country are required")
    }

    const team = await Team.create({
      short_name,
      full_name,
      description,
      country,
      logo_image_file,
    })
    
    this.setStatus(201)
    return team.toApiModel()
  }

  /**
   * Updates an existing team
   * @param teamId The ID of the team to update
   */
  @Put("{teamId}")
  @OperationId("updateTeam")
  public async updateTeam(
    @Path() teamId: number,
    @FormField() short_name: string,
    @FormField() full_name: string,
    @FormField() description: string,
    @FormField() country: string,
    @UploadedFile() logo_image_file?: File,
  ): Promise<TeamApiModel> {
    const team = await Team.findByPk(teamId)
    if (!team) {
      this.setStatus(404)
      throw new Error("Team not found")
    }

    team.short_name = short_name
    team.full_name = full_name
    team.description = description
    team.country = country
    if (logo_image_file) {
      const arrayBuffer = await logo_image_file.arrayBuffer()
      team.logo_image_file = new File([arrayBuffer], logo_image_file.name || `logo-team-${teamId}.png`, { type: 'image/png' })
    }
    
    await team.save()
    
    return team.toApiModel()
  }

  /**
   * Deletes a team
   * @param teamId The ID of the team to delete
   */
  @Delete("{teamId}")
  @OperationId("deleteTeam")
  public async deleteTeam(@Path() teamId: number): Promise<void> {
    const team = await Team.findByPk(teamId)
    if (!team) {
      this.setStatus(404)
      throw new Error("Team not found")
    }

    await team.destroy()
  }

  /**
   * Retrieves all players for a specific team
   * @param teamId The ID of the team to retrieve players for
   */
  @Get("{teamId}/players")
  @OperationId("getTeamPlayers")
  public async getTeamPlayers(@Path() teamId: number): Promise<PlayerApiModel[]> {
    const team = await Team.findByPk(teamId, { include: [{ model: Player, as: "players" }] })
    if (!team) {
      this.setStatus(404)
      throw new Error("Team not found")
    }

    if (!team.players) {
      return []
    }

    return team.players.map(player => player.toApiModel())
  }
}
