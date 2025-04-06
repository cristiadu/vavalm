"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { fetchCountries } from '@/api/CountryApi'
import { fetchPlayers, deletePlayer } from '@/api/PlayersApi'
import { getAttributeBgColor, getRoleBgColor } from '@/api/models/helpers'
import 'react-quill-new/dist/quill.snow.css'
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
      
      const teamFetchPromises = data.items.map((player) =>
        fetchTeam(player.team_id, team => {
          if (player.id) {
            playerToTeam[player.id] = team
          }
        }),
      )
  
      await Promise.all(teamFetchPromises)
      
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
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                Nickname
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                Full Name
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                Age
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                Country
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                Team
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                Attributes
              </th>
              <th className="py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase w-auto">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              // Display placeholder loading rows
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`row-loading-${index}`}>
                  <td colSpan={9}>
                    <div className="animate-pulse h-16 bg-gray-100 my-1"></div>
                  </td>
                </tr>
              ))
            ) : players.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-center text-gray-500">
                  No players found
                </td>
              </tr>
            ) : (
              // Inline the player rows instead of using a separate component
              players.map((player) => (
                <tr key={`player-row-${player.id}`}>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.id}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.nickname}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.full_name}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.age}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {player.country && (
                      <span className="flex items-center">
                        <ImageAutoSize src={countriesToFlagMap[player.country]} alt={player.country} width={32} height={16} className="mr-2" />
                        {player.country}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {playerToTeam && playerToTeam[String(player.id)] ? (
                      <span className="flex items-center">
                        <ImageAutoSize 
                          imageBlob={playerToTeam[String(player.id)].logo_image_file as unknown as Blob}
                          fallbackSrc={DEFAULT_TEAM_LOGO_IMAGE_PATH}
                          alt={playerToTeam[String(player.id)].short_name || ''} 
                          width={32} 
                          height={32} 
                          className="mr-2" />
                        {playerToTeam[String(player.id)].short_name}
                      </span>
                    ) : (
                      'No Team'
                    )}
                  </td>
                  <td>
                    <span className={getRoleBgColor(player.role)}>
                      {player.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm font-medium text-gray-500">
                    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-4 gap-1">
                      {Object.entries(player.player_attributes).map(([key, value]) => {
                        return (
                          <div key={`player-attributes-${key}`} className="flex items-center space-x-1">
                            <span className={`w-6 h-6 flex items-center justify-center rounded text-xs text-white ${getAttributeBgColor(value)}`}>{value}</span>
                            <span className="text-xs text-gray-900 truncate">{asWord(key)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </td>
                  <td className="py-4 whitespace-nowrap text-sm text-left text-gray-900 w-auto">
                    <button onClick={() => handleView(player)} className="text-blue-600 hover:text-blue-900 p-0 mr-1">👀</button>
                    <button onClick={() => handleEdit(player)} className="text-blue-600 hover:text-blue-900 p-0 mr-1">✏️</button>
                    <button onClick={() => handleDelete(player)} className="text-red-600 hover:text-red-900 p-0">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <Pagination 
          totalItems={totalItems} 
          onPageChange={handlePageChange} 
          limitValue={limitValue} 
        />
      </div>
    </>
  )
}
