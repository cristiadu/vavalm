/** Country option returned by the API. */
export class CountryApiModel {
  /** Creates a country option with its stable code, display name, and flag URL. */
  constructor(
    public code: string,
    public name: string,
    public flag: string,
  ) {}
}
