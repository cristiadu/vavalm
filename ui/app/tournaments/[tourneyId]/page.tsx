"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import CountryApi from '../../api/CountryApi'
import TournamentsApi from '../../api/TournamentsApi'
import { orderStandingsByStats, Tournament } from '../../api/models/Tournament'
import { handleBackClick } from '../../base/LinkUtils'
import 'react-quill/dist/quill.snow.css'
import { asSafeHTML } from '../../base/StringUtils'
import { getWinOrLossColor } from '../../api/models/Team'

export default function ViewTournament({ params }: { params: { tourneyId: string } }) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [countryFlag, setCountryFlag] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchTournamentData = async () => {
      const tournamentData = await TournamentsApi.getTournament(Number(params.tourneyId), (data) => {
        setTournament(data)
      })

      const countries = await CountryApi.fetchCountries(() => {})
      if (tournamentData.country) {
        setCountryFlag(countries?.find(c => c.name === tournamentData.country)?.flag || null)
      }
    }

    fetchTournamentData()
  }, [params.tourneyId])

  if (!tournament) {
    return <div>Loading...</div>
  }

  const showGameLogs = (gameId: number): void => {
    router.push(`/tournaments/${tournament.id}/logs/${gameId}`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <header className="w-full flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tournament Details</h1>
        <Link href="#" onClick={(e) => handleBackClick(e, router)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
          Back
        </Link>
      </header>
      <div className="w-full max-w-3xl bg-white p-8 rounded shadow">
        <div className="bg-blue-300 p-4 rounded mb-4 flex items-center justify-center">
          <h2 className="text-3xl font-bold text-center text-white">{tournament.name}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-lg">
            <strong>Country:</strong> 
            {countryFlag && <Image src={countryFlag} alt={tournament.country} width={30} height={30} className="inline-block ml-2 mr-2" />}
            {tournament.country}
          </div>
          <div className="text-lg">
            <strong>Start Date:</strong> {new Date(tournament.start_date).toLocaleDateString()}
          </div>
        </div>
        <div className="text-lg mb-4">
          <strong>Description:</strong><div className="ql-container ql-snow" style={{ border: "0" }}><div className="ql-editor" dangerouslySetInnerHTML={{ __html: asSafeHTML(tournament.description || "") }} /></div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Teams</h3>
          <hr className="mb-2" />
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
            {tournament.teams && tournament.teams.map(team => (
              <div key={team.id} className="flex items-center space-x-2">
                <Image 
                  src={team.logo_image_file ? URL.createObjectURL(team.logo_image_file) : "/images/nologo.svg"} 
                  alt={team.short_name} 
                  width={30} 
                  height={30} 
                  className="inline-block mr-2" 
                />
                <span className="text-lg">{team.short_name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Standings</h3>
          <hr className="mb-2" />
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white table-fixed">
              <thead>
                <tr>
                  <th className="py-2 px-2 border-b">#</th>
                  <th className="py-2 px-2 border-b">Team</th>
                  <th className="py-2 border-b">Wins</th>
                  <th className="py-2 border-b">Losses</th>
                  <th className="py-2 border-b">Maps Won</th>
                  <th className="py-2 border-b">Maps Lost</th>
                  <th className="py-2 border-b">Rounds Won</th>
                  <th className="py-2 border-b">Rounds Lost</th>
                </tr>
              </thead>
              <tbody>
                {tournament.standings && tournament.standings.sort(orderStandingsByStats).map((standing, index) => (
                  <tr key={standing.id}>
                    <td className="py-2 px-2 border-b text-center bg-gray-100">{index + 1}</td>
                    <td className="py-2 px-2 border-b items-center bg-gray-100">
                      <Image 
                        src={standing.team?.logo_image_file ? URL.createObjectURL(standing.team.logo_image_file) : "/images/nologo.svg"} 
                        alt={standing.team?.short_name} 
                        width={30} 
                        height={30} 
                        className="inline-block mr-2" 
                      />
                      <span>{standing.team?.short_name}</span>
                    </td>
                    <td className="py-2 border-b text-center bg-gray-100">{standing.wins}</td>
                    <td className="py-2 border-b text-center bg-gray-100">{standing.losses}</td>
                    <td className="py-2 border-b text-center">{standing.maps_won}</td>
                    <td className="py-2 border-b text-center">{standing.maps_lost}</td>
                    <td className="py-2 border-b text-center">{standing.rounds_won}</td>
                    <td className="py-2 border-b text-center">{standing.rounds_lost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Matches Schedule</h3>
          <hr className="mb-2" />
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white table-fixed">
              <thead>
                <tr>
                  <th className="py-2 border-b">Date</th>
                  <th className="py-2 border-b">Type</th>
                  <th className="py-2 border-b">Team 1</th>
                  <th className="py-2 border-b">Team 2</th>
                  <th className="py-2 border-b">Score</th>
                </tr>
              </thead>
              <tbody>
                {tournament.schedule && tournament.schedule.map((match) => (
                  <tr key={match.id} onClick={() => showGameLogs(match.id)}>
                    <td className="py-2 border-b bg-gray-100 text-center">{new Date(match.date).toLocaleDateString()}</td>
                    <td className="py-2 border-b bg-gray-100 text-center">{match.type}</td>
                    <td className="py-2 border-b bg-gray-100 items-center">
                      <div className="flex items-center space-x-2">
                        <Image 
                          src={match?.team1?.logo_image_file ? URL.createObjectURL(match.team1.logo_image_file) : "/images/nologo.svg"} 
                          alt={match?.team1?.short_name} 
                          width={30} 
                          height={30} 
                          className="inline-block mr-2" 
                        />
                        <span>{match?.team1?.short_name}</span>
                      </div>
                    </td>
                    <td className="py-2 border-b bg-gray-100 items-center">
                      <div className="flex items-center space-x-2">
                        <Image 
                          src={match?.team2?.logo_image_file ? URL.createObjectURL(match.team2.logo_image_file) : "/images/nologo.svg"} 
                          alt={match?.team2?.short_name} 
                          width={30} 
                          height={30} 
                          className="inline-block mr-2" 
                        />
                        <span>{match?.team2?.short_name}</span>
                      </div>
                    </td>
                    <td className="py-2 border-b bg-gray-100 text-center">
                      <strong>
                        <span className={getWinOrLossColor(match?.team1, match)}>{match?.team1_score}</span>
                        - 
                        <span className={getWinOrLossColor(match?.team2, match)}>{match?.team2_score}</span>
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}