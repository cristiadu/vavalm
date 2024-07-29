import Team from './models/Team'

// Example of a function that fetches users
async function getTeams(): Promise<any[]> {
  try {
    const teams = await Team.findAll()
    return teams
  } catch (err) {
    console.error('Error executing query', (err as Error).stack)
    return []
  }
}

// Example of a function that adds a new user
async function addTeam(short_name: string, full_name: string, logo_url: string, description: string): Promise<any> {
  try {
    const team = await Team.create({
      short_name: short_name,
      logo_url: logo_url,
      full_name: full_name,
      description: description,
    })
    return team
  } catch (err) {
    console.error('Error executing query', (err as Error).stack)
    return null
  }
}

// Example usage
(async () => {
  await addTeam('FCB', 'FC Barcelona', 'https://tecdn.b-cdn.net/img/new/slides/041.jpg', 'The best team in the world')
  const teams = await getTeams()
  console.log(teams)
})()
