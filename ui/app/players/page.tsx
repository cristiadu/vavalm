"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import CountryApi from '../calls/CountryApi'
import Link from 'next/link'
import PlayersApi, { Player } from '../calls/PlayersApi'
import 'react-quill/dist/quill.snow.css'
import NewPlayerModal from './NewPlayerModal'

export default function ListPlayers() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerModalOpened, setNewPlayerModalOpened] = useState<boolean>(false)
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})

  useEffect(() => {
    CountryApi.fetchCountries((countries) => {
      const countriesToFlagMap: Record<string, string> = {}
      countries.forEach((country) => {
        countriesToFlagMap[country.name] = country.flag
      })
      setCountriesToFlagMap(countriesToFlagMap)
    })

    PlayersApi.fetchPlayers(setPlayers)
  }, [])

  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()
    const referrer = document.referrer
    const isInternal = referrer && referrer.includes(window.location.hostname)
    if (isInternal && referrer !== '') {
      router.back()
    } else {
      router.push('/')
    }
  }

  const openNewPlayerModal = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()
    setNewPlayerModalOpened(true)
  }

  const closeNewPlayerModal = () => {
    setNewPlayerModalOpened(false)
    PlayersApi.fetchPlayers(setPlayers)
  }

  // List all players in a table/grid
  return (
    <>
      <NewPlayerModal isOpen={newPlayerModalOpened} onClose={closeNewPlayerModal} />
      <div className="flex min-h-screen flex-col items-center p-24">
        <header className="w-full flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Players</h1>
          <div className="space-x-4">
            <Link href="#" onClick={handleBackClick} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
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
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nickname
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Full Name
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team ID
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attributes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.map((player) => (
              <tr key={player.id}>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.id}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.nickname}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.full_name}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.age}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {player.country && (
                    <span className="flex items-center">
                      <Image src={countriesToFlagMap[player.country]} alt={player.country} width={30} height={30} className="mr-2" />
                      {player.country}
                    </span>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.team_id}</td>
                <td className="px-3 py-4 whitespace-normal text-sm font-medium text-gray-500">
                  <div className="ql-container ql-snow" style={{ border: "0" }}>
                    {Object.entries(player.player_attributes).map(([key, value]) => (
                      <div key={key}>{`${key}: ${value}`}</div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}