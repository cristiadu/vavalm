import { Body, Controller, Delete, Get, OperationId, Path, Post, Put, Query, Route, SuccessResponse } from "tsoa"
import { ItemsWithPagination } from "@/base/types"
import { PlayerApiModel } from "@/models/contract/PlayerApiModel"
import { AllPlayerStats } from "@/base/types"
import Player from "@/models/Player"
import { getAllStatsForPlayer } from "@/services/PlayerService"
import { getAllStatsForAllPlayers } from "@/services/PlayerService"

@Route("players")
export class PlayersController extends Controller {
  /**
   * Get all players with optional filtering
   * @param teamId Optional team ID to filter by
   * @param limit Maximum number of players to return
   * @param offset Number of players to skip
   */
  @Get()
  @OperationId("getPlayers")
  public async getPlayers(
    @Query() teamId?: number,
    @Query() limit = 10,
    @Query() offset = 0,
  ): Promise<ItemsWithPagination<PlayerApiModel>> {
    const filter = teamId ? { team_id: teamId } : {}
    
    const players = await Player.findAndCountAll({
      where: filter,
      limit: Math.min(limit, 100),
      offset,
      order: [["id", "ASC"]],
    })
    
    const result = new ItemsWithPagination<Player>(players.rows, players.count)
    return result.toApiModel(new ItemsWithPagination<PlayerApiModel>([], 0))
  }

  /**
   * Retrieves stats for all players
   * @param limit Maximum number of players to include
   * @param offset Number of players to skip
   */
  @Get("stats")
  @OperationId("getPlayersStats")
  public async getPlayersStats(
    @Query() limit: number = 10,
    @Query() offset: number = 0,
  ): Promise<ItemsWithPagination<AllPlayerStats>> {
    const stats = await getAllStatsForAllPlayers(limit, offset)
    const result = new ItemsWithPagination<AllPlayerStats>(stats.items, stats.total)
    return result.toApiModel(new ItemsWithPagination<AllPlayerStats>([], 0))
  }

  /**
   * Get a specific player by ID
   * @param playerId The ID of the player to retrieve
   */
  @Get("{playerId}")
  @OperationId("getPlayer")
  public async getPlayer(@Path() playerId: number): Promise<PlayerApiModel> {
    const player = await Player.findByPk(playerId)
    
    if (!player) {
      this.setStatus(404)
      throw new Error("Player not found")
    }
    
    return player.toApiModel()
  }

  /**
   * Retrieves stats for a specific player
   * @param playerId The ID of the player to retrieve stats for
   */
  @Get("{playerId}/stats")
  @OperationId("getPlayerStats")
  public async getPlayerStats(@Path() playerId: number): Promise<AllPlayerStats> {
    return (await getAllStatsForPlayer(playerId)).toApiModel()
  }

  /**
   * Creates a new player
   * @param requestBody The player data to create
   */
  @Post()
  @OperationId("createPlayer")
  @SuccessResponse("201", "Player created")
  public async createPlayer(
    @Body() requestBody: PlayerApiModel,
  ): Promise<PlayerApiModel> {
    const { nickname, full_name, age, country, team_id, player_attributes, role } = requestBody
    
    if (!nickname || !full_name || !age || !country || !player_attributes || !role) {
      this.setStatus(400)
      throw new Error("nickname, full_name, age, country, role, and player_attributes are required")
    }

    const player = await Player.create({
      nickname,
      full_name,
      age,
      country,
      role,
      team_id,
      player_attributes,
    })
    
    this.setStatus(201)
    return player.toApiModel()
  }

  /**
   * Creates multiple players from a bulk upload
   * @param requestBody Array of player data to create
   */
  @Post("bulk")
  @OperationId("createPlayersBulk")
  @SuccessResponse("201", "Players created successfully")
  public async createPlayersBulk(
    @Body() requestBody: PlayerApiModel[],
  ): Promise<PlayerApiModel[]> {
    const newPlayers = await Player.bulkCreate(await Promise.all(requestBody.map(player => player.toEntityModelBulk())))
    
    this.setStatus(201)
    return newPlayers.map(player => player.toApiModel())
  }

  /**
   * Updates an existing player
   * @param playerId The ID of the player to update
   * @param requestBody The player data to update
   */
  @Put("{playerId}")
  @OperationId("updatePlayer")
  public async updatePlayer(
    @Path() playerId: number,
    @Body() requestBody: PlayerApiModel,
  ): Promise<PlayerApiModel> {
    const { nickname, full_name, age, country, team_id, player_attributes, role } = requestBody
    
    if (!nickname || !full_name || !age || !country || !player_attributes || !role) {
      this.setStatus(400)
      throw new Error("nickname, full_name, age, country, role, and player_attributes are required")
    }
    
    const player = await Player.findByPk(playerId)
    if (!player) {
      this.setStatus(404)
      throw new Error("Player not found")
    }

    player.nickname = nickname
    player.full_name = full_name
    player.age = age
    player.role = role
    player.country = country
    player.team_id = team_id
    player.player_attributes = await player_attributes.toEntityModel()

    await player.save()
    
    return player.toApiModel()
  }

  /**
   * Deletes a player
   * @param playerId The ID of the player to delete
   */
  @Delete("{playerId}")
  @OperationId("deletePlayer")
  public async deletePlayer(@Path() playerId: number): Promise<void> {
    const player = await Player.findByPk(playerId)
    if (!player) {
      this.setStatus(404)
      throw new Error("Player not found")
    }

    await player.destroy()
  }
}
