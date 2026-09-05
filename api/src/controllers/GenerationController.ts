import { Body, Controller, OperationId, Post, Route, SuccessResponse } from '@tsoa/runtime'
import type { GenerateDataRequest, GenerateDataResult } from '@/models/contract/GenerateDataRequest'
import { generateData } from '@/services/GenerationService'

@Route('generation')
export class GenerationController extends Controller {
  /** Generates teams with random players and optional scheduled tournaments. */
  @Post()
  @OperationId('generateData')
  @SuccessResponse('201', 'Data generated')
  public async generateData(@Body() request: GenerateDataRequest): Promise<GenerateDataResult> {
    const result = await generateData(request)
    this.setStatus(201)
    return result
  }
}
