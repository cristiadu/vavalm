"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import CountryApi from '../api/CountryApi'
import Link from 'next/link'
import PlayersApi from '../api/PlayersApi'
import { getRoleBgColor, Player } from '../api/models/Player'
import 'react-quill/dist/quill.snow.css'
import PlayerActionModal from './PlayerActionModal'
import TeamsApi from '../api/TeamsApi'
import { Team } from '../api/models/Team'
import { handleBackClick } from '../base/LinkUtils'
import { asWord } from '../base/StringUtils'

export default function ListPlayers() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null)
  const [playerToTeam, setPlayerToTeam] = useState<Record<string, Team>>({})
  const [actionPlayerModalOpened, setActionPlayerModalOpened] = useState<boolean>(false)
  const [isEditActionOpened, setIsEditActionOpened] = useState<boolean>(false)
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})

  useEffect(() => {
    CountryApi.fetchCountries((countries) => {
      const countriesToFlagMap: Record<string, string> = {}
      countries.forEach((country) => {
        countriesToFlagMap[country.name] = country.flag
      })
      setCountriesToFlagMap(countriesToFlagMap)
    })

    PlayersApi.fetchPlayers(refreshListData) 
  }, [])

  const refreshListData = async (playerData: Player[]) => {
    const playerToTeam: Record<number, Team> = {}

    const teamFetchPromises = playerData.map((player) =>
      TeamsApi.fetchTeam(player.team_id, team => {
        if (player.id) {
          playerToTeam[player.id] = team
        }
      })
    )

    await Promise.all(teamFetchPromises)

    setPlayerToTeam(playerToTeam)
    setPlayers(playerData)
  }

  const openNewPlayerModal = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()
    setActionPlayerModalOpened(true)
  }

  const closeActionPlayerModal = () => {
    setIsEditActionOpened(false)
    setPlayerToEdit(null)
    setActionPlayerModalOpened(false)
    PlayersApi.fetchPlayers(refreshListData)
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

    PlayersApi.deletePlayer(player, () => {
      PlayersApi.fetchPlayers(refreshListData)
    })
    
  }

  // List all players in a table/grid
  return (
    <>
      <PlayerActionModal isOpen={actionPlayerModalOpened} isEdit={isEditActionOpened} object={playerToEdit} onClose={closeActionPlayerModal} />
      <div className="flex min-h-screen flex-col items-center p-24">
        <header className="w-full flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Players</h1>
          <div className="space-x-4">
            <Link href="#" onClick={(e) => handleBackClick(e, router)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
              Back
            </Link>
            <Link href="#" onClick={openNewPlayerModal} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">
              New Player
            </Link>
          </div>
        </header>
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
                      <Image src={countriesToFlagMap[player.country]} alt={player.country} width={30} height={30} className="mr-2" />
                      {player.country}
                    </span>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {playerToTeam && playerToTeam[String(player.id)] ? (
                    <span className="flex items-center">
                      <Image src={playerToTeam[String(player.id)].logo_image_file ? URL.createObjectURL(playerToTeam[String(player.id)].logo_image_file as Blob) : "/images/nologo.svg"} alt={playerToTeam[String(player.id)].short_name} width={30} height={30} className="mr-2" />
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
                      let bgColor = "bg-gray-200" // Default background color
                      if (value === 3) bgColor = "bg-green-600"
                      else if (value === 2) bgColor = "bg-yellow-600"
                      else if (value === 1) bgColor = "bg-gray-500"

                      return (
                        <div key={key} className="flex items-center space-x-1">
                          <span className={`w-6 h-6 flex items-center justify-center rounded text-xs text-white ${bgColor}`}>{value}</span>
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
      </div>
    </>
  )
}
