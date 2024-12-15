import { getApiBaseUrl, LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "./models/constants"
import { ItemsWithPagination } from "./models/types"
import { Team, TeamStats } from "./models/Team"

export const fetchAllTeams = async (closure: (teamData: Team[]) => void) => {
  const response = await fetch(`${getApiBaseUrl()}/teams`)
  const data = await response.json()
  // Convert Buffer to Blob
  const teamsWithBlob = data.items.map((team: any) => {
    if (team.logo_image_file) {
      const blob = new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
      return { ...team, logo_image_file: blob }
    }
    return team
  })
  closure(teamsWithBlob)
  return teamsWithBlob
}

export const fetchTeams = async (closure: (teamData: ItemsWithPagination<Team>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE) => {
  const response = await fetch(`${getApiBaseUrl()}/teams?limit=${limit}&offset=${offset}`)
  const data = await response.json()
  // Convert Buffer to Blob
  const teamsWithBlob = data.items.map((team: any) => {
    if (team.logo_image_file) {
      const blob = new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
      return { ...team, logo_image_file: blob }
    }
    return team
  })
  const result = { total: data.total, items: teamsWithBlob }
  closure(result)
  return result
}

export const fetchTeamsStats = async (closure: (teamData: ItemsWithPagination<TeamStats>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE) => {
  const response = await fetch(`${getApiBaseUrl()}/teams/stats?limit=${limit}&offset=${offset}`)
  const data = await response.json()
  const teamsWithBlob = data.items.map((team: any) => {
    if (team.logo_image_file) {
      const blob = new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
      return { ...team, logo_image_file: blob }
    }
    return team
  })
  const result = { total: data.total, items: teamsWithBlob }
  closure(result)
  return result
}

export const fetchTeam = async (teamId: number, closure: (teamData: Team) => void) => {
  const response = await fetch(`${getApiBaseUrl()}/teams/${teamId}`)
  const data = await response.json()
  // Convert Buffer to Blob
  if (data.logo_image_file) {
    const blob = new Blob([new Uint8Array(data.logo_image_file.data)], { type: 'image/png' })
    const result = { ...data, logo_image_file: blob }
    closure(result)
    return result
  } else {
    closure(data)
    return data
  }
}

export const fetchTeamStats = async (teamId: number, closure: (teamData: TeamStats) => void) => {
  const response = await fetch(`${getApiBaseUrl()}/teams/${teamId}/stats`)
  const data = await response.json()
  // Convert Buffer to Blob
  if (data.team.logo_image_file) {
    const blob = new Blob([new Uint8Array(data.team.logo_image_file.data)], { type: 'image/png' })
    const result = { ...data, team: { ...data.team, logo_image_file: blob } }
    closure(result)
    return result
  } else {
    closure(data)
    return data
  }
}
  
export const newTeam = async (team: Team, closure: (teamData: Team) => void) => {
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
      return
    }

    const result = await response.json()
    closure(result)
    console.debug('Success:', result)
    return result
  } catch (error) {
    console.error('Error:', error)
  }
}
  
export const editTeam = async (team: Team, closure: (teamData: Team) => void) => {
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
      return
    }

    const result = await response.json()
    closure(result)
    console.debug('Success:', result)
    return result
  } catch (error) {
    console.error('Error:', error)
  }
}

export const deleteTeam = async (team: Team, closure: ({message}: {message: string}) => void) => {
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
      return
    }

    const result = await response.json()
    closure(result)
    console.debug('Success:', result)
    return result
  } catch (error) {
    console.error('Error:', error)
  }
}
