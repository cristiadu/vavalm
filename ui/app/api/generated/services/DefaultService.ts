/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AllPlayerStats } from '../models/AllPlayerStats';
import type { GameApiModel } from '../models/GameApiModel';
import type { GameLogApiModel } from '../models/GameLogApiModel';
import type { GameStatsApiModel } from '../models/GameStatsApiModel';
import type { ItemsWithPagination_AllPlayerStats_ } from '../models/ItemsWithPagination_AllPlayerStats_';
import type { ItemsWithPagination_MatchApiModel_ } from '../models/ItemsWithPagination_MatchApiModel_';
import type { ItemsWithPagination_PlayerApiModel_ } from '../models/ItemsWithPagination_PlayerApiModel_';
import type { ItemsWithPagination_TeamApiModel_ } from '../models/ItemsWithPagination_TeamApiModel_';
import type { ItemsWithPagination_TeamStats_ } from '../models/ItemsWithPagination_TeamStats_';
import type { ItemsWithPagination_TournamentApiModel_ } from '../models/ItemsWithPagination_TournamentApiModel_';
import type { MatchApiModel } from '../models/MatchApiModel';
import type { PlayerApiModel } from '../models/PlayerApiModel';
import type { RoundStateApiModel } from '../models/RoundStateApiModel';
import type { StandingsApiModel } from '../models/StandingsApiModel';
import type { TeamApiModel } from '../models/TeamApiModel';
import type { TeamStats } from '../models/TeamStats';
import type { TournamentApiModel } from '../models/TournamentApiModel';
import type { VlrImportResponse } from '../models/VlrImportResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DefaultService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * @returns VlrImportResponse Ok
   * @throws ApiError
   */
  public importTeamsAndPlayersFromVlr(): CancelablePromise<VlrImportResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/vlr',
    });
  }
  /**
   * Retrieves all tournaments with optional pagination
   * @param limit Maximum number of tournaments to return
   * @param offset Number of tournaments to skip
   * @returns ItemsWithPagination_TournamentApiModel_ Ok
   * @throws ApiError
   */
  public getTournaments(
    limit: number = 10,
    offset?: number,
  ): CancelablePromise<ItemsWithPagination_TournamentApiModel_> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/tournaments',
      query: {
        'limit': limit,
        'offset': offset,
      },
    });
  }
  /**
   * Creates a new tournament
   * @param requestBody The tournament data to create
   * @returns TournamentApiModel Tournament created
   * @throws ApiError
   */
  public createTournament(
    requestBody: TournamentApiModel,
  ): CancelablePromise<TournamentApiModel> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/tournaments',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Retrieves a specific tournament by its ID
   * @param tournamentId The ID of the tournament to retrieve
   * @returns TournamentApiModel Ok
   * @throws ApiError
   */
  public getTournament(
    tournamentId: number,
  ): CancelablePromise<TournamentApiModel> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/tournaments/{tournamentId}',
      path: {
        'tournamentId': tournamentId,
      },
    });
  }
  /**
   * Updates an existing tournament
   * @param tournamentId The ID of the tournament to update
   * @param requestBody The tournament data to update
   * @returns TournamentApiModel Ok
   * @throws ApiError
   */
  public updateTournament(
    tournamentId: number,
    requestBody: TournamentApiModel,
  ): CancelablePromise<TournamentApiModel> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/tournaments/{tournamentId}',
      path: {
        'tournamentId': tournamentId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Deletes a tournament
   * @param tournamentId The ID of the tournament to delete
   * @returns void
   * @throws ApiError
   */
  public deleteTournament(
    tournamentId: number,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/tournaments/{tournamentId}',
      path: {
        'tournamentId': tournamentId,
      },
    });
  }
  /**
   * Retrieves the match schedule for a tournament
   * @param tournamentId The ID of the tournament to retrieve the schedule for
   * @param limit Maximum number of matches to return
   * @param offset Number of matches to skip
   * @returns ItemsWithPagination_MatchApiModel_ Ok
   * @throws ApiError
   */
  public getTournamentSchedule(
    tournamentId: number,
    limit: number = 10,
    offset?: number,
  ): CancelablePromise<ItemsWithPagination_MatchApiModel_> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/tournaments/{tournamentId}/schedule',
      path: {
        'tournamentId': tournamentId,
      },
      query: {
        'limit': limit,
        'offset': offset,
      },
    });
  }
  /**
   * Retrieves the standings for a tournament
   * @param tournamentId The ID of the tournament to retrieve standings for
   * @returns StandingsApiModel Ok
   * @throws ApiError
   */
  public getTournamentStandings(
    tournamentId: number,
  ): CancelablePromise<Array<StandingsApiModel>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/tournaments/{tournamentId}/standings',
      path: {
        'tournamentId': tournamentId,
      },
    });
  }
  /**
   * Starts a tournament
   * @param tournamentId The ID of the tournament to start
   * @returns TournamentApiModel Ok
   * @throws ApiError
   */
  public startTournament(
    tournamentId: number,
  ): CancelablePromise<TournamentApiModel> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/tournaments/{tournamentId}/start',
      path: {
        'tournamentId': tournamentId,
      },
    });
  }
  /**
   * Ends a tournament
   * @param tournamentId The ID of the tournament to end
   * @param requestBody
   * @returns TournamentApiModel Ok
   * @throws ApiError
   */
  public endTournament(
    tournamentId: number,
    requestBody: {
      winner_id: number;
    },
  ): CancelablePromise<TournamentApiModel> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/tournaments/{tournamentId}/end',
      path: {
        'tournamentId': tournamentId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Get all teams with optional filtering
   * @param country Optional country filter
   * @param limit Maximum number of teams to return
   * @param offset Number of teams to skip
   * @returns ItemsWithPagination_TeamApiModel_ Ok
   * @throws ApiError
   */
  public getTeams(
    country?: string,
    limit: number = 10,
    offset?: number,
  ): CancelablePromise<ItemsWithPagination_TeamApiModel_> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/teams',
      query: {
        'country': country,
        'limit': limit,
        'offset': offset,
      },
    });
  }
  /**
   * Creates a new team
   * @param formData
   * @returns TeamApiModel Team created
   * @throws ApiError
   */
  public createTeam(
    formData: {
      short_name: string;
      full_name: string;
      description: string;
      country: string;
      logo_image_file?: Blob;
    },
  ): CancelablePromise<TeamApiModel> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/teams',
      formData: formData,
      mediaType: 'multipart/form-data',
    });
  }
  /**
   * Retrieves stats for all teams
   * @param limit Maximum number of teams to include
   * @param offset Number of teams to skip
   * @returns ItemsWithPagination_TeamStats_ Ok
   * @throws ApiError
   */
  public getTeamsStats(
    limit: number = 10,
    offset?: number,
  ): CancelablePromise<ItemsWithPagination_TeamStats_> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/teams/stats',
      query: {
        'limit': limit,
        'offset': offset,
      },
    });
  }
  /**
   * Creates multiple teams from a bulk upload
   * @param requestBody Array of team data to create
   * @returns TeamApiModel Teams created successfully
   * @throws ApiError
   */
  public createTeamsBulk(
    requestBody: Array<TeamApiModel>,
  ): CancelablePromise<Array<TeamApiModel>> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/teams/bulk',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Get a specific team by ID
   * @param teamId The ID of the team to retrieve
   * @returns TeamApiModel Ok
   * @throws ApiError
   */
  public getTeam(
    teamId: number,
  ): CancelablePromise<TeamApiModel> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/teams/{teamId}',
      path: {
        'teamId': teamId,
      },
    });
  }
  /**
   * Updates an existing team
   * @param teamId The ID of the team to update
   * @param formData
   * @returns TeamApiModel Ok
   * @throws ApiError
   */
  public updateTeam(
    teamId: number,
    formData: {
      short_name: string;
      full_name: string;
      description: string;
      country: string;
      logo_image_file?: Blob;
    },
  ): CancelablePromise<TeamApiModel> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/teams/{teamId}',
      path: {
        'teamId': teamId,
      },
      formData: formData,
      mediaType: 'multipart/form-data',
    });
  }
  /**
   * Deletes a team
   * @param teamId The ID of the team to delete
   * @returns void
   * @throws ApiError
   */
  public deleteTeam(
    teamId: number,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/teams/{teamId}',
      path: {
        'teamId': teamId,
      },
    });
  }
  /**
   * Retrieves stats for a specific team
   * @param teamId The ID of the team to retrieve stats for
   * @returns TeamStats Ok
   * @throws ApiError
   */
  public getTeamStats(
    teamId: number,
  ): CancelablePromise<TeamStats> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/teams/{teamId}/stats',
      path: {
        'teamId': teamId,
      },
    });
  }
  /**
   * Retrieves all players for a specific team
   * @param teamId The ID of the team to retrieve players for
   * @returns PlayerApiModel Ok
   * @throws ApiError
   */
  public getTeamPlayers(
    teamId: number,
  ): CancelablePromise<Array<PlayerApiModel>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/teams/{teamId}/players',
      path: {
        'teamId': teamId,
      },
    });
  }
  /**
   * Play a full round in a game
   * @param gameId The ID of the game
   * @param round The round number to play
   * @returns RoundStateApiModel Ok
   * @throws ApiError
   */
  public playRound(
    gameId: number,
    round: number,
  ): CancelablePromise<RoundStateApiModel> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/games/{gameId}/rounds/{round}/play',
      path: {
        'gameId': gameId,
        'round': round,
      },
    });
  }
  /**
   * Play a single duel in a round
   * @param gameId The ID of the game
   * @param round The round number
   * @returns RoundStateApiModel Ok
   * @throws ApiError
   */
  public playDuel(
    gameId: number,
    round: number,
  ): CancelablePromise<RoundStateApiModel> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/games/{gameId}/rounds/{round}/duel',
      path: {
        'gameId': gameId,
        'round': round,
      },
    });
  }
  /**
   * Get the last duel in a game
   * @param gameId The ID of the game
   * @returns any Ok
   * @throws ApiError
   */
  public getLastDuel(
    gameId: number,
  ): CancelablePromise<GameLogApiModel | null> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/games/{gameId}/rounds/last/duel',
      path: {
        'gameId': gameId,
      },
    });
  }
  /**
   * Get logs for the last round in a game
   * @param gameId The ID of the game
   * @returns GameLogApiModel Ok
   * @throws ApiError
   */
  public getLastRound(
    gameId: number,
  ): CancelablePromise<Array<GameLogApiModel>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/games/{gameId}/rounds/last',
      path: {
        'gameId': gameId,
      },
    });
  }
  /**
   * Get logs for a specific round in a game
   * @param gameId The ID of the game
   * @param round The round number
   * @returns GameLogApiModel Ok
   * @throws ApiError
   */
  public getRound(
    gameId: number,
    round: number,
  ): CancelablePromise<Array<GameLogApiModel>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/games/{gameId}/rounds/{round}',
      path: {
        'gameId': gameId,
        'round': round,
      },
    });
  }
  /**
   * Get all players with optional filtering
   * @param teamId Optional team ID to filter by
   * @param limit Maximum number of players to return
   * @param offset Number of players to skip
   * @returns ItemsWithPagination_PlayerApiModel_ Ok
   * @throws ApiError
   */
  public getPlayers(
    teamId?: number,
    limit: number = 10,
    offset?: number,
  ): CancelablePromise<ItemsWithPagination_PlayerApiModel_> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/players',
      query: {
        'teamId': teamId,
        'limit': limit,
        'offset': offset,
      },
    });
  }
  /**
   * Creates a new player
   * @param requestBody The player data to create
   * @returns PlayerApiModel Player created
   * @throws ApiError
   */
  public createPlayer(
    requestBody: PlayerApiModel,
  ): CancelablePromise<PlayerApiModel> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/players',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Retrieves stats for all players
   * @param limit Maximum number of players to include
   * @param offset Number of players to skip
   * @returns ItemsWithPagination_AllPlayerStats_ Ok
   * @throws ApiError
   */
  public getPlayersStats(
    limit: number = 10,
    offset?: number,
  ): CancelablePromise<ItemsWithPagination_AllPlayerStats_> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/players/stats',
      query: {
        'limit': limit,
        'offset': offset,
      },
    });
  }
  /**
   * Get a specific player by ID
   * @param playerId The ID of the player to retrieve
   * @returns PlayerApiModel Ok
   * @throws ApiError
   */
  public getPlayer(
    playerId: number,
  ): CancelablePromise<PlayerApiModel> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/players/{playerId}',
      path: {
        'playerId': playerId,
      },
    });
  }
  /**
   * Updates an existing player
   * @param playerId The ID of the player to update
   * @param requestBody The player data to update
   * @returns PlayerApiModel Ok
   * @throws ApiError
   */
  public updatePlayer(
    playerId: number,
    requestBody: PlayerApiModel,
  ): CancelablePromise<PlayerApiModel> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/players/{playerId}',
      path: {
        'playerId': playerId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Deletes a player
   * @param playerId The ID of the player to delete
   * @returns void
   * @throws ApiError
   */
  public deletePlayer(
    playerId: number,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/players/{playerId}',
      path: {
        'playerId': playerId,
      },
    });
  }
  /**
   * Retrieves stats for a specific player
   * @param playerId The ID of the player to retrieve stats for
   * @returns AllPlayerStats Ok
   * @throws ApiError
   */
  public getPlayerStats(
    playerId: number,
  ): CancelablePromise<AllPlayerStats> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/players/{playerId}/stats',
      path: {
        'playerId': playerId,
      },
    });
  }
  /**
   * Creates multiple players from a bulk upload
   * @param requestBody Array of player data to create
   * @returns PlayerApiModel Players created successfully
   * @throws ApiError
   */
  public createPlayersBulk(
    requestBody: Array<PlayerApiModel>,
  ): CancelablePromise<Array<PlayerApiModel>> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/players/bulk',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Retrieves a specific match by its ID
   * @param matchId The ID of the match to retrieve
   * @returns MatchApiModel Ok
   * @throws ApiError
   */
  public getMatch(
    matchId: number,
  ): CancelablePromise<MatchApiModel> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/matches/{matchId}',
      path: {
        'matchId': matchId,
      },
    });
  }
  /**
   * Retrieves all matches with optional filtering
   * @param tournamentId Filter matches by tournament ID
   * @param limit Maximum number of matches to return
   * @param offset Number of matches to skip
   * @returns ItemsWithPagination_MatchApiModel_ Ok
   * @throws ApiError
   */
  public getMatches(
    tournamentId?: number,
    limit: number = 10,
    offset?: number,
  ): CancelablePromise<ItemsWithPagination_MatchApiModel_> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/matches',
      query: {
        'tournamentId': tournamentId,
        'limit': limit,
        'offset': offset,
      },
    });
  }
  /**
   * Retrieves a specific game by its ID
   * @param gameId The ID of the game to retrieve
   * @returns GameApiModel Ok
   * @throws ApiError
   */
  public getGame(
    gameId: number,
  ): CancelablePromise<GameApiModel> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/games/{gameId}',
      path: {
        'gameId': gameId,
      },
    });
  }
  /**
   * Plays a game and completes it with simulated results
   * @param gameId The ID of the game to play
   * @returns any Game played successfully
   * @throws ApiError
   */
  public playGame(
    gameId: number,
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/games/{gameId}/play',
      path: {
        'gameId': gameId,
      },
    });
  }
  /**
   * Retrieves games for a specific match
   * @param matchId The ID of the match to retrieve games for
   * @returns GameApiModel Ok
   * @throws ApiError
   */
  public getGamesByMatch(
    matchId: number,
  ): CancelablePromise<Array<GameApiModel>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/games/match/{matchId}',
      path: {
        'matchId': matchId,
      },
    });
  }
  /**
   * Retrieves the stats for a specific game
   * @param gameId The ID of the game to retrieve stats for
   * @returns GameStatsApiModel Ok
   * @throws ApiError
   */
  public getGameStats(
    gameId: number,
  ): CancelablePromise<GameStatsApiModel> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/games/{gameId}/stats',
      path: {
        'gameId': gameId,
      },
    });
  }
}
