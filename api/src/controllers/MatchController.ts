import { Controller, Get, OperationId, Path, Query, Route } from "tsoa"
import MatchService from "@/services/MatchService"
import { MatchApiModel } from "@/models/contract/MatchApiModel"
import { ItemsWithPagination } from "@/base/types"

@Route("matches")
export class MatchController extends Controller {
  /**
   * Retrieves a specific match by its ID
   * @param matchId The ID of the match to retrieve
   */
  @Get("{matchId}")
  @OperationId("getMatch")
  public async getMatch(@Path() matchId: number): Promise<MatchApiModel> {
    const match = await MatchService.getMatch(matchId)
    if (!match) {
      this.setStatus(404)
      throw new Error("Match not found")
    }
    return match.toApiModel()
  }

  /**
   * Retrieves all matches with optional filtering
   * @param tournamentId Filter matches by tournament ID
   * @param limit Maximum number of matches to return
   * @param offset Number of matches to skip
   */
  @Get()
  @OperationId("getMatches")
  public async getMatches(
    @Query() tournamentId?: number,
    @Query() limit: number = 10,
    @Query() offset: number = 0,
  ): Promise<ItemsWithPagination<MatchApiModel>> {
    if (!tournamentId) {
      throw new Error("Tournament ID is required")
    }

    const matches = await MatchService.getMatchesFromTournament(tournamentId, limit, offset)
    return matches.toApiModel(new ItemsWithPagination<MatchApiModel>([], 0))
  }
}
