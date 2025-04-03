import { importTeamsAndPlayersFromVLR } from '@/services/VlrService'
import { Controller, OperationId, Post, Route } from 'tsoa'
import { VlrImportResponse } from '@/models/Vlr'


/**
 * @route POST /api/vlr
 * @description Fetches teams' information from VLR and imports new teams and players into the database.
 */
@Route("vlr")
export class VlrImportController extends Controller {
  @Post()
  @OperationId("importTeamsAndPlayersFromVLR")
  public async importTeamsAndPlayersFromVLR(): Promise<VlrImportResponse> {
    try {
      const teamsData = await importTeamsAndPlayersFromVLR()
      this.setStatus(200)
      return { message: 'Teams and players imported successfully', teamsData }
    } catch (error) {
      this.setStatus(500)
      return { error: 'Failed to import teams and players. Error: ' + error, teamsData: [] }
    }
  }
}

