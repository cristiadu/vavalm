import { getApiBaseUrl } from "../models/constants"
import { VavalMApi } from "./VavalMApi"

// Create client with correct configuration
export const VavalMClient = new VavalMApi({
  BASE: getApiBaseUrl(),
})