interface Team {
    short_name: string
    logo_image_file?: Blob | null
    full_name: string
    description?: string
    country: string
    id?: number
}

const TeamsApi = {
  fetchTeams: async (closure: (teamData: Team[]) => void) => {
    const response = await fetch('http://localhost:8000/teams')
    const data = await response.json()
    // Convert Buffer to Blob
    const teamsWithBlob = data.map((team: any) => {
      if (team.logo_image_file) {
        const blob = new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
        return { ...team, logo_image_file: blob }
      }
      return team
    })

    closure(teamsWithBlob)
  },
  newTeam: async (team: Team, closure: (teamData: Team[]) => void) => {
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
    } catch (error) {
      console.error('Error:', error)
    }
  },
}

export default TeamsApi
export type { Team }