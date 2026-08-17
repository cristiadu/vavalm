import { Controller, Get, OperationId, Route } from '@tsoa/runtime'

import { CountryApiModel } from '@/models/contract/CountryApiModel'
import { getCountries } from '@/services/CountryService'

@Route('countries')
export class CountriesController extends Controller {
  /** Retrieves all countries and their flag URLs. */
  @Get()
  @OperationId('getCountries')
  public async getCountries(): Promise<CountryApiModel[]> {
    return await getCountries()
  }
}
