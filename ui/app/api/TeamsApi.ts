import { LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "@/api/models/constants"
import { parseLogoImageFile } from "@/api/models/helpers"
import { TeamWithLogoImageData } from "@/api/models/types"
import { ItemsWithPagination_TeamApiModel_, ItemsWithPagination_TeamStats_, TeamApiModel, TeamStats } from "@/api/generated"
import { VavalMClient } from "@/api/generated/client"

export const fetchAllTeams = async (closure: (_teamData: TeamApiModel[]) => void): Promise<TeamApiModel[]> => {
  try {
    const response = await VavalMClient.default.getTeams(undefined, undefined, undefined)
    
    if (!response || !response.items) {
      const emptyResult: TeamApiModel[] = []
      closure(emptyResult)
      return emptyResult
    }
    
    const teamsWithBlob = response.items.map((team) => {
      return parseLogoImageFile<TeamApiModel>(team as TeamWithLogoImageData)
    })
    
    closure(teamsWithBlob)
    return teamsWithBlob
  } catch (error) {
    console.error("Error fetching all teams:", error)
    const emptyResult: TeamApiModel[] = []
    closure(emptyResult)
    return emptyResult
  }
}


export const fetchTeams = async (closure: (_teamData: ItemsWithPagination_TeamApiModel_) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE): Promise<ItemsWithPagination_TeamApiModel_> => {
  try {
    const response = await VavalMClient.default.getTeams(undefined, limit, offset)
    
    if (!response || !response.items) {
      throw new Error("No teams data received")
    }
    
    const teamsWithBlob = response.items.map((team) => {
      return parseLogoImageFile<TeamApiModel>(team as TeamWithLogoImageData)
    })
    
    const result = { total: response.total || 0, items: teamsWithBlob }
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
    const response = await VavalMClient.default.getTeamsStats(limit, offset)
    
    if (!response || !response.items) {
      throw new Error("No teams stats data received")
    }
    
    const teamsWithBlob = response.items.map((item: TeamStats) => {
      return { ...item, team: parseLogoImageFile<TeamApiModel>(item.team as TeamWithLogoImageData) }
    })
    
    const result = { total: response.total || 0, items: teamsWithBlob }
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
    const response = await VavalMClient.default.getTeam(teamId)
    
    if (!response) {
      console.error("No team data received")
      closure({} as TeamApiModel)
      return null
    }
    
    const team = parseLogoImageFile<TeamApiModel>(response as TeamWithLogoImageData)
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
    const response = await VavalMClient.default.getTeamStats(teamId)
    
    if (!response || !response.team) {
      console.error("No team stats data received")
      closure({} as TeamStats)
      return null
    }
    
    const teamWithLogoImageData = parseLogoImageFile<TeamApiModel>(response.team as TeamWithLogoImageData)
    const result = { ...response, team: teamWithLogoImageData }
    closure(result)
    return result
  } catch (error) {
    console.error(`Error fetching team stats for team ${teamId}:`, error)
    closure({} as TeamStats)
    return null
  }
}
  
export const newTeam = async (team: TeamApiModel, closure: (_teamData: TeamApiModel) => void): Promise<TeamApiModel | null> => {
  try {
    if (!team.short_name || !team.full_name || !team.country || !team.logo_image_file) {
      throw new Error('Missing required fields')
    }

    const response = await VavalMClient.default.createTeam({
      short_name: team.short_name,
      full_name: team.full_name,
      description: team.description || '',
      country: team.country,
      logo_image_file: team.logo_image_file as Blob,
    })

    closure(response)
    return response
  } catch (error) {
    console.error('Error creating team:', error)
    return null
  }
}
  
export const editTeam = async (team: TeamApiModel, closure: (_teamData: TeamApiModel) => void): Promise<TeamApiModel | null> => {
  if (!team.id) {
    throw new Error('Team ID is required')
  }

  if (!team.short_name || !team.full_name || !team.country || !team.logo_image_file) {
    throw new Error('Missing required fields')
  }

  try {
    const response = await VavalMClient.default.updateTeam(team.id, {
      short_name: team.short_name,
      full_name: team.full_name,
      description: team.description || '',
      country: team.country,
      logo_image_file: team.logo_image_file as Blob,
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

    await VavalMClient.default.deleteTeam(team.id)
    closure({message: 'Team deleted successfully'})
    return {message: 'Team deleted successfully'}
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}
