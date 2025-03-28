"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchCountries } from '../api/CountryApi'
import { fetchPlayers, deletePlayer } from '../api/PlayersApi'
import { getAttributeBgColor, getRoleBgColor, Player } from '../api/models/Player'
import 'react-quill-new/dist/quill.snow.css'
import PlayerActionModal from './PlayerActionModal'
import { fetchTeam } from '../api/TeamsApi'
import { Team } from '../api/models/Team'
import { asWord } from '../base/StringUtils'
import Pagination from '../base/Pagination'
import { ItemsWithPagination } from '../api/models/types'
import SectionHeader from '../base/SectionHeader'
import ImageAutoSize from '../base/ImageAutoSize'

export default function ListPlayers() {
  const LIMIT_VALUE_PLAYER_LIST = 5
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null)
  const [playerToTeam, setPlayerToTeam] = useState<Record<string, Team>>({})
  const [actionPlayerModalOpened, setActionPlayerModalOpened] = useState<boolean>(false)
  const [isEditActionOpened, setIsEditActionOpened] = useState<boolean>(false)
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    fetchCountries((countries) => {
      const countriesToFlagMap: Record<string, string> = {}
      countries.forEach((country) => {
        countriesToFlagMap[country.name] = country.flag
      })
      setCountriesToFlagMap(countriesToFlagMap)
    })

    fetchPlayers(refreshListData, LIMIT_VALUE_PLAYER_LIST) 
  }, [])

  const refreshListData = async (data: ItemsWithPagination<Player>) => {
    const playerToTeam: Record<number, Team> = {}

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
  }

  const openNewPlayerModal = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()
    setActionPlayerModalOpened(true)
  }

  const closeActionPlayerModal = () => {
    setIsEditActionOpened(false)
    setPlayerToEdit(null)
    setActionPlayerModalOpened(false)
    fetchPlayers(refreshListData, LIMIT_VALUE_PLAYER_LIST)
  }

  const handleView = (player: Player) => {
    // Send user to player details page
    router.push(`/players/${player.id}`)
  }

  const handleEdit = (player: Player) => {
    // Use same modal as NewPlayerModal but with prefilled data
    setPlayerToEdit(player)
    setIsEditActionOpened(true)
    setActionPlayerModalOpened(true)
  }

  const handleDelete = (player: Player) => {
    // Show confirm dialog and if confirmed delete player
    const confirmed = confirm(`Are you sure you want to delete player '${player.nickname}'?`)
    if(!confirmed) return

    deletePlayer(player, () => {
      fetchPlayers(refreshListData)
    })
    
  }

  const handlePageChange = (limit: number, offset: number) => {
    fetchPlayers(refreshListData, limit, offset)
  }

  // List all players in a table/grid
  return (
    <>
      <PlayerActionModal isOpen={actionPlayerModalOpened} isEdit={isEditActionOpened} object={playerToEdit} onClose={closeActionPlayerModal} />
      <div className="flex min-h-screen flex-col items-center p-24">
        <SectionHeader title="Players" action={openNewPlayerModal} actionText="New Player" />
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
            {players.map((player) => (
              <tr key={player.id}>
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
                        imageBlob={playerToTeam[String(player.id)].logo_image_file as Blob}
                        fallbackSrc="/images/nologo.svg"
                        alt={playerToTeam[String(player.id)].short_name} 
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
                        <div key={key} className="flex items-center space-x-1">
                          <span className={`w-6 h-6 flex items-center justify-center rounded text-xs text-white ${getAttributeBgColor(value)}`}>{value}</span>
                          <span className="text-xs text-gray-900 truncate">{asWord(key)}</span>
                        </div>
                      )
                    })}
                  </div>
                </td>
                <td className="py-4 whitespace-nowrap text-sm text-left text-gray-900 w-auto">
                  <button onClick={() => handleView(player)} className="text-blue-600 hover:text-blue-900 p0">👀</button>
                  <button onClick={() => handleEdit(player)} className="text-blue-600 hover:text-blue-900 p0">✏️</button>
                  <button onClick={() => handleDelete(player)} className="text-red-600 hover:text-red-900 p0">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination totalItems={totalItems} onPageChange={handlePageChange} limitValue={LIMIT_VALUE_PLAYER_LIST} />
      </div>
    </>
  )
}
