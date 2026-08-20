import { LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "@/api/models/constants"
import { TeamWithLogoImageData } from "@/api/models/types"
import { ItemsWithPagination_TeamApiModel_, ItemsWithPagination_TeamStats_, TeamApiModel, TeamStats } from "@/api/generated"
import { VavalMApiClient } from "@/api/client"

/** Page size used to walk the paginated teams endpoint. */
const ALL_TEAMS_PAGE_SIZE = 100

/**
 * Fetches every team, for the selectors that offer a team to pick.
 *
 * The endpoint pages and defaults to ten, so requesting it without a limit
 * returned only the first ten teams — the rest were simply absent from the
 * dropdowns, with nothing to indicate they had been cut off.
 */
export const fetchAllTeams = async (closure: (_teamData: TeamApiModel[]) => void): Promise<TeamApiModel[]> => {
  const teams: TeamApiModel[] = []

  try {
    for (;;) {
      const response = await VavalMApiClient.default.getTeams(undefined, ALL_TEAMS_PAGE_SIZE, teams.length)
      const page = response?.items ?? []
      teams.push(...page)

      if (page.length < ALL_TEAMS_PAGE_SIZE) {
        break
      }
    }

    closure(teams)
    return teams
  } catch (error) {
    console.error("Error fetching all teams:", error)
    closure(teams)
    return teams
  }
}


export const fetchTeams = async (closure: (_teamData: ItemsWithPagination_TeamApiModel_) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE): Promise<ItemsWithPagination_TeamApiModel_> => {
  try {
    const response = await VavalMApiClient.default.getTeams(undefined, limit, offset)
    
    if (!response || !response.items) {
      throw new Error("No teams data received")
    }
    
    const teamsWithParsedLogos = response.items
    
    const result = { total: response.total || 0, items: teamsWithParsedLogos }
    closure(result)
    return result
  } catch (error) {
    console.error("Error fetching teams:", error)
    const emptyResult = { total: 0, items: [] }
    closure(emptyResult)
    return emptyResult
  }
}

export const fetchTeamsStats = async (closure: (_teamData: ItemsWithPagination_TeamStats_) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE): Promise<ItemsWithPagination_TeamStats_> => {
  try {
    const response = await VavalMApiClient.default.getTeamsStats(limit, offset)
    
    if (!response || !response.items) {
      throw new Error("No teams stats data received")
    }
    
    const teamsWithParsedLogos = response.items.map((item: TeamStats) => {
      return item
    })
    
    const result = { total: response.total || 0, items: teamsWithParsedLogos }
    closure(result)
    return result
  } catch (error) {
    console.error("Error fetching teams stats:", error)
    const emptyResult = { total: 0, items: [] }
    closure(emptyResult)
    return emptyResult
  }
}

export const fetchTeam = async (teamId: number, closure: (_teamData: TeamApiModel) => void): Promise<TeamApiModel | null> => {
  try {
    const response = await VavalMApiClient.default.getTeam(teamId)
    
    if (!response) {
      console.error("No team data received")
      closure({} as TeamApiModel)
      return null
    }
    
    const team = response
    closure(team)
    return team
  } catch (error) {
    console.error(`Error fetching team with id ${teamId}:`, error)
    closure({} as TeamApiModel)
    return null
  }
}

export const fetchTeamStats = async (teamId: number, closure: (_teamData: TeamStats) => void): Promise<TeamStats | null> => {
  try {
    const response = await VavalMApiClient.default.getTeamStats(teamId)
    
    if (!response || !response.team) {
      console.error("No team stats data received")
      closure({} as TeamStats)
      return null
    }
    
    const teamWithLogoImageData = response.team
    const result = { ...response, team: teamWithLogoImageData }
    closure(result)
    return result
  } catch (error) {
    console.error(`Error fetching team stats for team ${teamId}:`, error)
    closure({} as TeamStats)
    return null
  }
}
  
/**
 * Names the required team fields that are still empty, so the message can say
 * which one rather than that something is missing.
 */
const missingTeamFields = (team: TeamWithLogoImageData): string[] => {
  const required: [string, unknown][] = [
    ['full name', team.full_name],
    ['short name', team.short_name],
    ['country', team.country],
    ['logo', team.logo_image_file],
  ]
  return required.filter(([, value]) => !value).map(([label]) => label)
}

export const newTeam = async (team: TeamWithLogoImageData, closure: (_teamData: TeamApiModel) => void): Promise<TeamApiModel | null> => {
  try {
    // The logo is required in practice, not just by this check: toApiModel always
    // hands the ui a logo_url, so a team stored without one renders an <img> that
    // the endpoint cannot answer.
    if (!team.short_name || !team.full_name || !team.country || !team.logo_image_file) {
      throw new Error(`Missing required fields: ${missingTeamFields(team).join(', ')}`)
    }

    const response = await VavalMApiClient.default.createTeam({
      short_name: team.short_name,
      full_name: team.full_name,
      description: team.description || '',
      country: team.country,
      logo_image_file: team.logo_image_file ?? undefined,
    })

    closure(response)
    return response
  } catch (error) {
    console.error('Error creating team:', error)
    return null
  }
}
  
export const editTeam = async (team: TeamWithLogoImageData, closure: (_teamData: TeamApiModel) => void): Promise<TeamApiModel | null> => {
  if (!team.id) {
    throw new Error('Team ID is required')
  }

  if (!team.short_name || !team.full_name || !team.country || !team.logo_image_file) {
    throw new Error(`Missing required fields: ${missingTeamFields(team).join(', ')}`)
  }

  try {
    const response = await VavalMApiClient.default.updateTeam(team.id, {
      short_name: team.short_name,
      full_name: team.full_name,
      description: team.description || '',
      country: team.country,
      logo_image_file: team.logo_image_file ?? undefined,
    })

    closure(response)
    return response
  } catch (error) {
    console.error('Error updating team:', error)
    return null
  }
}

export const deleteTeam = async (team: TeamApiModel, closure: (_result: {message: string}) => void): Promise<{message: string} | null> => {
  try {
    if (!team.id) {
      throw new Error('Team ID is required')
    }

    await VavalMApiClient.default.deleteTeam(team.id)
    closure({message: 'Team deleted successfully'})
    return {message: 'Team deleted successfully'}
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}
