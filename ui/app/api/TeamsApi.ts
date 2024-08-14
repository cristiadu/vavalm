import { LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from "./models/constants"
import { Team } from "./models/Team"
import { ItemsWithPagination } from "./models/types"

const TeamsApi = {
  fetchAllTeams: async (closure: (teamData: Team[]) => void) => {
    // Fetch all team pages
    const response = await fetch(`http://localhost:8000/teams`)
    const data = await response.json()
    // Convert Buffer to Blob
    const teamsWithBlob = data.items.map((team: any) => {
      if (team.logo_image_file) {
        const blob = new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
        return { ...team, logo_image_file: blob }
      }
      return team
    })
    closure(teamsWithBlob as Team[])
    return teamsWithBlob as Team[]
  },
  fetchTeams: async (closure: (teamData: ItemsWithPagination<Team>) => void, limit: number = LIMIT_PER_PAGE_INITIAL_VALUE, offset: number = PAGE_OFFSET_INITIAL_VALUE) => {
    const response = await fetch(`http://localhost:8000/teams?limit=${limit}&offset=${offset}`)
    const data = await response.json()
    // Convert Buffer to Blob
    const teamsWithBlob = data.items.map((team: any) => {
      if (team.logo_image_file) {
        const blob = new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
        return { ...team, logo_image_file: blob }
      }
      return team
    })
    closure({ total: data.total, items: teamsWithBlob } as ItemsWithPagination<Team>)
    return { total: data.total, items: teamsWithBlob } as ItemsWithPagination<Team>
  },
  fetchTeam: async (teamId: number, closure: (teamData: Team) => void) => {
    const response = await fetch(`http://localhost:8000/teams/${teamId}`)
    const data = await response.json()
    // Convert Buffer to Blob
    if (data.logo_image_file) {
      const blob = new Blob([new Uint8Array(data.logo_image_file.data)], { type: 'image/png' })
      closure({ ...data, logo_image_file: blob })
      return { ...data, logo_image_file: blob } as Team
    } else {
      closure(data)
      return data
    }
  },
  newTeam: async (team: Team, closure: (teamData: Team) => void) => {
    const formData = new FormData()
    if(team.logo_image_file) {
      formData.append('logo_image_file', team.logo_image_file)
    }

    formData.append('full_name', team.full_name)
    formData.append('short_name', team.short_name)
    formData.append('country', team.country)
    formData.append('description', team.description || '')

    try {
      const response = await fetch('http://localhost:8000/teams', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        console.log("Network response was not ok: ", formData)
        return
      }

      const result = await response.json()
      closure(result)
      console.log('Success:', result)
      return result as Team
    } catch (error) {
      console.error('Error:', error)
    }
  },
  editTeam: async (team: Team, closure: (teamData: Team) => void) => {
    const formData = new FormData()
    if(team.logo_image_file) {
      formData.append('logo_image_file', team.logo_image_file)
    }

    formData.append('full_name', team.full_name)
    formData.append('short_name', team.short_name)
    formData.append('country', team.country)
    formData.append('description', team.description || '')

    try {
      const response = await fetch(`http://localhost:8000/teams/${team.id}`, {
        method: 'PUT',
        body: formData,
      })

      if (!response.ok) {
        console.log("Network response was not ok: ", formData)
        return
      }

      const result = await response.json()
      closure(result)
      console.log('Success:', result)
      return result as Team
    } catch (error) {
      console.error('Error:', error)
    }
  },
  deleteTeam: async (team: Team, closure: ({message}: {message: string}) => void) => {
    try {
      const response = await fetch(`http://localhost:8000/teams/${team.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(team),
      })

      if (!response.ok) {
        console.log("Network response was not ok: ", team)
        return
      }

      const result = await response.json()
      closure(result)
      console.log('Success:', result)
      return result
    } catch (error) {
      console.error('Error:', error)
    }
  },
}

export default TeamsApi
