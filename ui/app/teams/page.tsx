
"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchCountries } from '@/api/CountryApi'
import { fetchTeams, deleteTeam } from '@/api/TeamsApi'
import { Team } from '@/api/models/Team'
import TeamActionModal from '@/teams/TeamActionModal'
import 'react-quill-new/dist/quill.snow.css'
import { asSafeHTML } from '@/base/StringUtils'
import { fetchPlayersByTeam } from '@/api/PlayersApi'
import { getRoleBgColor, Player } from '@/api/models/Player'
import Pagination from '@/base/Pagination'
import { PAGE_OFFSET_INITIAL_VALUE } from '@/api/models/constants'
import SectionHeader from '@/base/SectionHeader'
import ImageAutoSize from '@/base/ImageAutoSize'
import { Country } from '@/api/models/Country'

export default function ListTeams(): React.ReactNode {
  const LIMIT_VALUE_TEAM_LIST = 5

  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [teamActionModalOpened, setTeamActionModalOpened] = useState<boolean>(false)
  const [isEditActionOpened, setIsEditActionOpened] = useState<boolean>(false)
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null)
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    fetchCountriesAndTeams()
  }, [])

  const fetchCountriesAndTeams = async (limit: number = LIMIT_VALUE_TEAM_LIST, offset: number = PAGE_OFFSET_INITIAL_VALUE): Promise<void> => {
    try {
      const countries = await fetchCountries(() => {
        // handle country data
      }) ?? []

      const countriesToFlagMap: Record<string, string> = {}
      countries.forEach((country: Country) => {
        countriesToFlagMap[country.name] = country.flag
      })
      setCountriesToFlagMap(countriesToFlagMap)

      const teamsData = await fetchTeams(() => {
        // handle team data
      }, limit, offset)

      setTotalItems(teamsData.total)

      const teamsWithPlayersFlags = await Promise.all(
        teamsData.items.map(async (team: Team) => {
          const players = await fetchPlayersByTeam(Number(team.id), () => {
            // handle player data
          })
          const playersWithFlags = players.map((player: Player) => ({
            ...player,
            countryFlag: countriesToFlagMap[player.country] || null,
          }))
          return { ...team, players: playersWithFlags }
        }),
      )

      setTeams(teamsWithPlayersFlags)
    } catch (error) {
      console.error('Error fetching countries or teams:', error)
    }
  }

  const openNewTeamModal = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void => {
    e.preventDefault()
    setIsEditActionOpened(false)
    setTeamActionModalOpened(true)
  }

  const closeTeamActionModal = (): void => {
    setIsEditActionOpened(false)
    setTeamActionModalOpened(false)
    setTeamToEdit(null)
    fetchCountriesAndTeams()
  }

  const handleView = (team: Team): void => {
    // Send user to player details page
    router.push(`/teams/${team.id}`)
  }

  const handleEdit = (team: Team): void => {
    // Use same modal as NewPlayerModal but with prefilled data'
    console.debug('Editing team:', team)
    setIsEditActionOpened(true)
    setTeamToEdit(team)
    setTeamActionModalOpened(true)
  }

  const handleDelete = (team: Team): void => {
    // Show confirm dialog and if confirmed delete player
    const confirmed = confirm(`Are you sure you want to delete team '${team.short_name}'?`)
    if(!confirmed) return

    deleteTeam(team, () => {
      fetchCountriesAndTeams()
    })
    
  }

  const handlePageChange = (limit: number, offset: number): void => {
    fetchCountriesAndTeams(limit, offset)
  }

  // List all teams in a table/grid
  return (
    <>
      <TeamActionModal isOpen={teamActionModalOpened} onClose={closeTeamActionModal} isEdit={isEditActionOpened} object={teamToEdit} />
      <div className="flex min-h-screen flex-col items-center p-24">
        <SectionHeader title="Teams" action={openNewTeamModal} actionText="New Team" />
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Logo
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Full Name
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Players
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase w-auto">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.map((team) => (
              <tr key={`team-row-${team.id}`}>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.id}</td>
                <td className="py-4 whitespace-nowrap text-sm text-gray-500">
                  <ImageAutoSize
                    width={128}
                    height={128}
                    imageBlob={team.logo_image_file as Blob}
                    fallbackSrc="/images/nologo.svg"
                    alt={`${team.short_name} logo`}
                    className='rounded-lg w-24 h-24 shadow-lg'
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.short_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.full_name}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900"> {team.country && (
                  <span className="flex items-center">
                    <ImageAutoSize src={countriesToFlagMap[team.country]} alt={team.country} width={32} height={16} className="mr-2" />
                    {team.country}
                  </span>)}
                </td>
                <td className="py-4 text-sm font-medium text-gray-900 grid grid-cols-2">
                  {team.players && team.players.map(player => (
                    <div key={`team-${team.id}-player-${player.id}`} className="flex items-center space-x-2 mb-2">
                      <span className={getRoleBgColor(player.role)}>
                        {player.role}
                      </span>
                      {player.countryFlag && <ImageAutoSize src={player.countryFlag} alt={player.country} width={32} height={16} className="inline-block ml-2 mr-2" />}
                      <span className="text-lg">{player.nickname}</span>
                      <span className="text-sm text-gray-600 mt-1">({player.full_name})</span>
                    </div>
                  ))}
                </td>
                <td className="px-3 py-4 whitespace-normal text-sm font-medium text-gray-500">
                  <div className="ql-container ql-snow" style={{ border: "0" }}><div className="ql-editor" dangerouslySetInnerHTML={{ __html: asSafeHTML(team.description || "") }} /></div>
                </td>
                <td className="py-4 whitespace-nowrap text-sm text-left text-gray-900 w-auto">
                  <button onClick={() => handleView(team)} className="text-blue-600 hover:text-blue-900 p0">👀</button>
                  <button onClick={() => handleEdit(team)} className="text-blue-600 hover:text-blue-900 p0">✏️</button>
                  <button onClick={() => handleDelete(team)} className="text-red-600 hover:text-red-900 p0">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination totalItems={totalItems} onPageChange={handlePageChange} limitValue={LIMIT_VALUE_TEAM_LIST} />
      </div>
    </>
  )
}
