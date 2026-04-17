"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { fetchCountries } from '@/api/CountryApi'
import { fetchPlayers, deletePlayer } from '@/api/PlayersApi'
import { getAttributeBgColor, getRoleBgColor } from '@/api/models/helpers'
import PlayerActionModal from '@/components/PlayerActionModal'
import { fetchTeam } from '@/api/TeamsApi'
import { asWord } from '@/common/StringUtils'
import Pagination from '@/components/common/Pagination'
import { ItemsWithPagination } from '@/api/models/types'
import SectionHeader from '@/components/common/SectionHeader'
import ImageAutoSize from '@/components/common/ImageAutoSize'
import { DEFAULT_TEAM_LOGO_IMAGE_PATH } from '@/api/models/constants'
import { PlayerApiModel, TeamApiModel } from '@/api/generated'

const DEFAULT_LIMIT_VALUE_PLAYER_LIST = 5 // Return to original value

export default function ListPlayers(): React.ReactNode {
  const router = useRouter()
  const [players, setPlayers] = useState<PlayerApiModel[]>([])
  const [playerToEdit, setPlayerToEdit] = useState<PlayerApiModel | null>(null)
  const [playerToTeam, setPlayerToTeam] = useState<Record<string, TeamApiModel>>({})
  const [actionPlayerModalOpened, setActionPlayerModalOpened] = useState<boolean>(false)
  const [isEditActionOpened, setIsEditActionOpened] = useState<boolean>(false)
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [limitValue, setLimitValue] = useState(DEFAULT_LIMIT_VALUE_PLAYER_LIST)

  // Simplify the refreshListData function
  const refreshListData = useCallback(async (data: ItemsWithPagination<PlayerApiModel>) => {
    setIsLoading(true)

    try {
      const playerToTeam: Record<string, TeamApiModel> = {}

      // Deduplicate team IDs so players sharing a team only trigger one fetch
      const distinctTeamIds = [...new Set(data.items.map(p => p.team_id).filter(Boolean))]

      await Promise.all(
        distinctTeamIds.map(teamId =>
          fetchTeam(teamId, team => {
            data.items
              .filter(p => p.team_id === teamId)
              .forEach(p => {
                if (p.id) playerToTeam[p.id] = team
              })
          }),
        ),
      )

      setPlayerToTeam(playerToTeam)
      setTotalItems(data.total)
      setPlayers(data.items)
    } catch (error) {
      console.error("Error refreshing player data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCountries((countries) => {
      const countriesToFlagMap: Record<string, string> = {}
      countries.forEach((country) => {
        countriesToFlagMap[country.name] = country.flag
      })
      setCountriesToFlagMap(countriesToFlagMap)
    })
    
    fetchPlayers(refreshListData, limitValue)
  }, [refreshListData, limitValue])

  const openNewPlayerModal = useCallback((e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()
    setActionPlayerModalOpened(true)
  }, [])

  const closeActionPlayerModal = useCallback(() => {
    setIsEditActionOpened(false)
    setPlayerToEdit(null)
    setActionPlayerModalOpened(false)
    fetchPlayers(refreshListData, limitValue)
  }, [refreshListData, limitValue])

  const handleView = useCallback((player: PlayerApiModel) => {
    router.push(`/players/${player.id}`)
  }, [router])

  const handleEdit = useCallback((player: PlayerApiModel) => {
    setPlayerToEdit(player)
    setIsEditActionOpened(true)
    setActionPlayerModalOpened(true)
  }, [])

  const handleDelete = useCallback((player: PlayerApiModel) => {
    const confirmed = confirm(`Are you sure you want to delete player '${player.nickname}'?`)
    if(!confirmed) return

    deletePlayer(player, () => {
      fetchPlayers(refreshListData, limitValue)
    })
  }, [refreshListData, limitValue])

  const handlePageChange = useCallback((limit: number, offset: number) => {
    setLimitValue(limit)
    setIsLoading(true)
    fetchPlayers(refreshListData, limit, offset)
  }, [refreshListData])

  return (
    <>
      <PlayerActionModal 
        isOpen={actionPlayerModalOpened} 
        isEdit={isEditActionOpened} 
        object={playerToEdit} 
        onClose={closeActionPlayerModal} 
      />
      <div className="flex min-h-screen flex-col items-center p-24">
        <SectionHeader 
          title="Players" 
          action={openNewPlayerModal} 
          actionText="New Player" 
        />
        
        <div className="w-full overflow-x-auto rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Player</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Age</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Country</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Team</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Attributes</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`row-loading-${index}`}>
                    <td colSpan={7}>
                      <div className="animate-pulse h-16 bg-gray-100 my-1"></div>
                    </td>
                  </tr>
                ))
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    No players found
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr key={`player-row-${player.id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{player.nickname}</span>
                        <span className="text-xs text-gray-500">{player.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{player.age}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {player.country && (
                        <span className="flex items-center text-sm text-gray-700">
                          <ImageAutoSize src={countriesToFlagMap[player.country]} alt={player.country} width={24} height={16} className="mr-2" />
                          {player.country}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {playerToTeam && playerToTeam[String(player.id)] ? (
                        <span className="flex items-center text-sm text-gray-700">
                          <ImageAutoSize
                            imageFile={playerToTeam[String(player.id)].logo_image_file as File}
                            fallbackSrc={DEFAULT_TEAM_LOGO_IMAGE_PATH}
                            alt={playerToTeam[String(player.id)].short_name || ''}
                            width={24} height={24}
                            className="mr-2" />
                          {playerToTeam[String(player.id)].short_name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No Team</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`p-1 rounded text-white ${getRoleBgColor(player.role)}`}>
                        {player.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="grid grid-cols-4 gap-1">
                        {Object.entries(player.player_attributes).map(([key, value]) => (
                          <div key={`player-attributes-${key}`} className="flex items-center space-x-1">
                            <span className={`w-5 h-5 flex items-center justify-center rounded text-xs text-white ${getAttributeBgColor(value)}`}>{value}</span>
                            <span className="text-xs text-gray-600 truncate">{asWord(key)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleView(player)} title="View" className="p-1.5 rounded hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => handleEdit(player)} title="Edit" className="p-1.5 rounded hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(player)} title="Delete" className="p-1.5 rounded hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          totalItems={totalItems} 
          onPageChange={handlePageChange} 
          limitValue={limitValue} 
        />
      </div>
    </>
  )
}
