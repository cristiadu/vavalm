"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import PlayersApi, { Player, PlayerWithFlag } from '../../calls/PlayersApi'
import CountryApi from '../../calls/CountryApi'
import TeamsApi, { Team } from '../../calls/TeamsApi'
import Link from 'next/link'
import { handleBackClick } from '../../base/LinkUtils'
import 'react-quill/dist/quill.snow.css'
import { asSafeHTML } from '../../base/StringUtils'

export default function ViewTeam({ params }: { params: { teamId: string } }) {
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<PlayerWithFlag[]>([])
  const [countryFlag, setCountryFlag] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchTeamData = async () => {
      const teamData = await TeamsApi.fetchTeam(Number(params.teamId), (data) => {
        setTeam(data)
      })

      const countries = await CountryApi.fetchCountries(() => {})
      if (teamData.country) {
        setCountryFlag(countries?.find(c => c.name === teamData.country)?.flag || null)
      }
  
      PlayersApi.fetchPlayersByTeam(Number(params.teamId), (data) => {
        const playersWithFlags = data.map(player => ({
          ...player,
          countryFlag: countries?.find(c => c.name === player.country)?.flag || null,
        }))
        setPlayers(playersWithFlags)
      })
    }
  
    fetchTeamData()
  }, [params.teamId])

  if (!team) {
    return <div>Loading...</div>
  }

  const logoSrc = team.logo_image_file ? URL.createObjectURL(team.logo_image_file) : "/images/nologo.svg"

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <header className="w-full flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Team Details</h1>
        <Link href="#" onClick={(e) => handleBackClick(e, router)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
          Back
        </Link>
      </header>
      <div className="w-full max-w-3xl bg-white p-8 rounded shadow">
        <div className="bg-blue-300 p-4 rounded mb-4 flex items-center justify-center">
          {logoSrc && <Image src={logoSrc} alt={`${team.short_name} logo`} width={50} height={50} className="inline-block mr-4" />}
          <h2 className="text-3xl font-bold text-center text-white">{team.short_name}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-lg">
            <strong>Country:</strong> 
            {countryFlag && <Image src={countryFlag} alt={team.country} width={30} height={30} className="inline-block ml-2 mr-2" />}
            {team.country}
          </div>
          <div className="text-lg">
            <strong>Full Name:</strong> {team.full_name}
          </div>
        </div>
        <div className="text-lg mb-4">
          <strong>Description:</strong><div className="ql-container ql-snow" style={{ border: "0" }}><div className="ql-editor" dangerouslySetInnerHTML={{ __html: asSafeHTML(team.description || "") }} /></div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Players</h3>
          <hr className="mb-2" />
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
            {players && players.map(player => (
              <div key={player.id} className="flex items-center space-x-2">
                {player.countryFlag && <Image src={player.countryFlag} alt={player.country} width={30} height={30} className="inline-block ml-2 mr-2" />}
                <span className="text-lg">{player.nickname}</span>
                <span className="text-sm text-gray-600 mt-1">({player.full_name})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
