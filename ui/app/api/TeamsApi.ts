import { getApiBaseUrl, LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "@/api/models/constants"
import { ItemsWithPagination } from "@/api/models/types"
import { parseLogoImageFile, Team, TeamStats, TeamWithLogoImageData } from "@/api/models/Team"

export const fetchAllTeams = async (closure: (_teamData: Team[]) => void): Promise<Team[]> => {
  const response = await fetch(`${getApiBaseUrl()}/teams`)
  const data = await response.json()
  const teamsWithBlob = data.items.map((team: TeamWithLogoImageData) => {
    return parseLogoImageFile<Team>(team)
  })
  closure(teamsWithBlob)
  return teamsWithBlob as Team[]
}

export const fetchTeams = async (closure: (_teamData: ItemsWithPagination<Team>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE): Promise<ItemsWithPagination<Team>> => {
  const response = await fetch(`${getApiBaseUrl()}/teams?limit=${limit}&offset=${offset}`)
  const data = await response.json()
  const teamsWithBlob = data.items.map((team: TeamWithLogoImageData) => {
    return parseLogoImageFile<Team>(team)
  })
  const result = { total: data.total, items: teamsWithBlob }
  closure(result)
  return result as ItemsWithPagination<Team>
}

export const fetchTeamsStats = async (closure: (_teamData: ItemsWithPagination<TeamStats>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE): Promise<ItemsWithPagination<TeamStats>> => {
  const response = await fetch(`${getApiBaseUrl()}/teams/stats?limit=${limit}&offset=${offset}`)
  const data = await response.json()
  const teamsWithBlob = data.items.map((team: TeamWithLogoImageData) => {
    return parseLogoImageFile<Team>(team)
  })
  const result = { total: data.total, items: teamsWithBlob }
  closure(result)
  return result as ItemsWithPagination<TeamStats>
}

export const fetchTeam = async (teamId: number, closure: (_teamData: Team) => void): Promise<Team | null> => {
  const response = await fetch(`${getApiBaseUrl()}/teams/${teamId}`)
  const data = await response.json() as TeamWithLogoImageData
  const team = parseLogoImageFile<Team>(data)
  closure(team)
  return team as Team
}

export const fetchTeamStats = async (teamId: number, closure: (_teamData: TeamStats) => void): Promise<TeamStats | null> => {
  const response = await fetch(`${getApiBaseUrl()}/teams/${teamId}/stats`)
  const data = await response.json() as TeamStats
  const teamWithLogoImageData = parseLogoImageFile<Team>(data.team)
  const result = { ...data, team: teamWithLogoImageData }
  closure(result)
  return result as TeamStats
}
  
export const newTeam = async (team: Team, closure: (_teamData: Team) => void): Promise<Team | null> => {
  const formData = new FormData()
  if(team.logo_image_file) {
    formData.append('logo_image_file', team.logo_image_file)
  }

  formData.append('full_name', team.full_name)
  formData.append('short_name', team.short_name)
  formData.append('country', team.country)
  formData.append('description', team.description || '')

  try {
    const response = await fetch(`${getApiBaseUrl()}/teams`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      console.error("Network response was not ok: ", formData)
      return null
    }

    const result = await response.json()
    closure(result)
    console.debug('Success:', result)
    return result as Team
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}
  
export const editTeam = async (team: Team, closure: (_teamData: Team) => void): Promise<Team | null> => {
  const formData = new FormData()
  if(team.logo_image_file) {
    formData.append('logo_image_file', team.logo_image_file)
  }

  formData.append('full_name', team.full_name)
  formData.append('short_name', team.short_name)
  formData.append('country', team.country)
  formData.append('description', team.description || '')

  try {
    const response = await fetch(`${getApiBaseUrl()}/teams/${team.id}`, {
      method: 'PUT',
      body: formData,
    })

    if (!response.ok) {
      console.error("Network response was not ok: ", formData)
      return null
    }

    const result = await response.json()
    closure(result)
    console.debug('Success:', result)
    return result as Team
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export const deleteTeam = async (team: Team, closure: (_result: {message: string}) => void): Promise<{message: string} | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/teams/${team.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(team),
    })

    if (!response.ok) {
      console.error("Network response was not ok: ", team)
      return null
    }

    const result = await response.json()
    closure(result)
    console.debug('Success:', result)
    return result as {message: string}
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}
