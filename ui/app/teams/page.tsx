
"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchCountries } from '@/api/CountryApi'
import { fetchTeams, deleteTeam } from '@/api/TeamsApi'
import TeamActionModal from '@/components/TeamActionModal'
import { getRoleBgColor } from '@/api/models/helpers'
import Pagination from '@/components/common/Pagination'
import { DEFAULT_TEAM_LOGO_IMAGE_PATH, PAGE_OFFSET_INITIAL_VALUE } from '@/api/models/constants'
import SectionHeader from '@/components/common/SectionHeader'
import ImageAutoSize from '@/components/common/ImageAutoSize'
import { Country, PlayerWithFlag } from '@/api/models/types'
import { PlayerApiModel, TeamApiModel } from '@/api/generated'

export default function ListTeams(): React.ReactNode {
  const LIMIT_VALUE_TEAM_LIST = 5

  const router = useRouter()
  const [teams, setTeams] = useState<TeamApiModel[]>([])
  const [teamActionModalOpened, setTeamActionModalOpened] = useState<boolean>(false)
  const [isEditActionOpened, setIsEditActionOpened] = useState<boolean>(false)
  const [teamToEdit, setTeamToEdit] = useState<TeamApiModel | null>(null)
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

      // Players are now embedded in each team via the getTeams endpoint
      const teamsWithPlayersFlags = teamsData.items.map((team: TeamApiModel) => {
        const playersWithFlags = (team.players || []).map((player: PlayerApiModel) => ({
          ...player,
          countryFlag: countriesToFlagMap[player.country] || null,
        } as PlayerWithFlag))
        return { ...team, players: playersWithFlags }
      })

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

  const handleView = (team: TeamApiModel): void => {
    // Send user to player details page
    router.push(`/teams/${team.id}`)
  }

  const handleEdit = (team: TeamApiModel): void => {
    // Use same modal as NewPlayerModal but with prefilled data'
    console.debug('Editing team:', team)
    setIsEditActionOpened(true)
    setTeamToEdit(team)
    setTeamActionModalOpened(true)
  }

  const handleDelete = (team: TeamApiModel): void => {
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
        <div className="w-full overflow-x-auto rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Team</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Country</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Players</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Description</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teams.map((team) => (
                <tr key={`team-row-${team.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center">
                      <ImageAutoSize
                        width={48}
                        height={48}
                        imageFile={team.logo_image_file as File}
                        fallbackSrc={DEFAULT_TEAM_LOGO_IMAGE_PATH}
                        alt={`${team.short_name} logo`}
                        className="rounded-lg shadow-sm mr-3"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{team.short_name}</span>
                        <span className="text-xs text-gray-500">{team.full_name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {team.country && (
                      <span className="flex items-center text-sm text-gray-700">
                        <ImageAutoSize src={countriesToFlagMap[team.country]} alt={team.country} width={24} height={16} className="mr-2" />
                        {team.country}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {team.players && team.players.map((player: PlayerWithFlag) => (
                        <div key={`team-${team.id}-player-${player.id}`} className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center w-[82px] px-1.5 py-0.5 rounded text-xs font-medium text-white text-center shrink-0 ${getRoleBgColor(player.role)}`}>
                            {player.role}
                          </span>
                          {player.countryFlag && <ImageAutoSize src={player.countryFlag} alt={player.country} width={20} height={14} className="shrink-0 self-center" />}
                          <div className="flex flex-col leading-tight min-w-0">
                            <span className="text-sm font-semibold text-gray-900 truncate">{player.nickname}</span>
                            <span className="text-[11px] text-gray-400 truncate">{player.full_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 max-w-xs">
                    <span className="line-clamp-2">{team.description?.replace(/<[^>]*>/g, '') || ''}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleView(team)} title="View" className="p-1.5 rounded hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button onClick={() => handleEdit(team)} title="Edit" className="p-1.5 rounded hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(team)} title="Delete" className="p-1.5 rounded hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination totalItems={totalItems} onPageChange={handlePageChange} limitValue={LIMIT_VALUE_TEAM_LIST} />
      </div>
    </>
  )
}
