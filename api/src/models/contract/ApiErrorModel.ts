/**
 * @tsoaModel
 */
export class ApiErrorModel {
  public status: number
  public message: string
  public code?: string
  public details?: Record<string, string>

  constructor(
    status: number,
    message: string,
    code?: string,
    details?: Record<string, string>,
  ) {
    this.status = status
    this.message = message
    this.code = code
    this.details = details
  }
}
