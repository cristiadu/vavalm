"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import TournamentsApi, { Tournament } from '../calls/TournamentsApi'
import CountryApi from '../calls/CountryApi'
import { Team } from '../calls/TeamsApi'
import TournamentActionModal from './TournamentActionModal'
import { asSafeHTML } from '../base/StringUtils'

export default function ListTournaments() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})
  const [tournamentActionModalOpened, setTournamentActionModalOpened] = useState<boolean>(false)
  const [isEditActionOpened, setIsEditActionOpened] = useState<boolean>(false)
  const [tournamentToEdit, setTournamentToEdit] = useState<Tournament | null>(null)

  useEffect(() => {
    fetchCountriesAndTournaments()
  }, [])

  const fetchCountriesAndTournaments = () => {
    CountryApi.fetchCountries((countries) => {
      const countriesToFlagMap: Record<string, string> = {}
      countries.forEach((country) => {
        countriesToFlagMap[country.name] = country.flag
      })
      setCountriesToFlagMap(countriesToFlagMap)
    })
    
    TournamentsApi.fetchTournaments(setTournaments)
  }

  const openNewTournamentModal = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()
    setIsEditActionOpened(false)
    setTournamentToEdit(null)
    setTournamentActionModalOpened(true)
  }

  const closeTournamentActionModal = () => {
    setIsEditActionOpened(false)
    setTournamentActionModalOpened(false)
    setTournamentToEdit(null)
    fetchCountriesAndTournaments()
  }

  const handleView = (tournament: Tournament) => {
    router.push(`/tournaments/${tournament.id}`)
  }

  const handleEdit = (tournament: Tournament) => {
    console.log('Editing tournament:', tournament)
    setIsEditActionOpened(true)
    setTournamentToEdit(tournament)
    setTournamentActionModalOpened(true)
  }

  const handleDelete = (tournament: Tournament) => {
    const confirmed = confirm(`Are you sure you want to delete tournament '${tournament.name}'?`)
    if (!confirmed) return

    TournamentsApi.deleteTournament(tournament, (tournamentData) => {
      console.log('Tournament deleted:', tournamentData)
      TournamentsApi.fetchTournaments(setTournaments)
    })
  }

  return (
    <>
      <TournamentActionModal isOpen={tournamentActionModalOpened} onClose={closeTournamentActionModal} isEdit={isEditActionOpened} object={tournamentToEdit} />
      <div className="flex min-h-screen flex-col items-center p-24">
        <header className="w-full flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <div className="space-x-4">
            <Link href="#" onClick={() => router.back()} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
            Back
            </Link>
            <Link href="#" onClick={openNewTournamentModal} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">
            New Tournament
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
              Name
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Country
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Start Date
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Teams
              </th>
              <th className="py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase w-auto">
              Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tournaments.map((tournament) => (
              <tr key={tournament.id}>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tournament.id}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tournament.name}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tournament.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="ql-container ql-snow" style={{ border: "0" }}>
                    <div className="ql-editor" dangerouslySetInnerHTML={{ __html: asSafeHTML(tournament.description || "") }} />
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900"> {tournament.country && (
                  <span className="flex items-center">
                    <Image src={countriesToFlagMap[tournament.country]} alt={tournament.country} width={30} height={30} className="mr-2" />
                    {tournament.country}
                  </span>)}
                </td>              
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{new Date(tournament.start_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="grid grid-cols-3">
                    {tournament.teams?.map((team: Team) => (
                      <div key={team.id} className="flex items-center mb-2">
                        <Image src={team.logo_image_file instanceof Blob ? URL.createObjectURL(team.logo_image_file as Blob) : "/images/nologo.svg"} alt={team.short_name} width={30} height={30} className="mr-2" />
                        {team.short_name}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-4 whitespace-nowrap text-sm text-left text-gray-900 w-auto">
                  <button onClick={() => handleView(tournament)} className="text-blue-600 hover:text-blue-900 p0">👀</button>
                  <button onClick={() => handleEdit(tournament)} className="text-blue-600 hover:text-blue-900 p0">✏️</button>
                  <button onClick={() => handleDelete(tournament)} className="text-red-600 hover:text-red-900 p0">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}