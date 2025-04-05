"use client"

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { fetchTournaments, deleteTournament } from '@/api/TournamentsApi'
import { fetchCountries } from '@/api/CountryApi'
import { Tournament } from '@/api/models/Tournament'
import { Team } from '@/api/models/Team'
import TournamentActionModal from '@/components/TournamentActionModal'
import { asSafeHTML } from '@/base/StringUtils'
import { ItemsWithPagination } from '@/api/models/types'
import Pagination from '@/base/Pagination'
import { DEFAULT_TEAM_LOGO_IMAGE_PATH, LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from '@/api/models/constants'
import SectionHeader from '@/base/SectionHeader'
import ImageAutoSize from '@/base/ImageAutoSize'

export default function ListTournaments(): React.ReactNode {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<ItemsWithPagination<Tournament> | null>(null)
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})
  const [tournamentActionModalOpened, setTournamentActionModalOpened] = useState<boolean>(false)
  const [isEditActionOpened, setIsEditActionOpened] = useState<boolean>(false)
  const [tournamentToEdit, setTournamentToEdit] = useState<Tournament | null>(null)
  const [totalItems, setTotalItems] = useState(0)

  const fetchCountriesAndTournaments = useCallback((offset: number, limit: number) => {
    fetchCountries((countries) => {
      const countriesToFlagMap: Record<string, string> = {}
      countries.forEach((country) => {
        countriesToFlagMap[country.name] = country.flag
      })
      setCountriesToFlagMap(countriesToFlagMap)
    })
    
    fetchTournaments((data) => {
      setTournaments(data)
      setTotalItems(data.total)
    }, limit, offset)
  }, [])

  useEffect(() => {
    fetchCountriesAndTournaments(PAGE_OFFSET_INITIAL_VALUE, LIMIT_PER_PAGE_INITIAL_VALUE)
  }, [fetchCountriesAndTournaments])

  const openNewTournamentModal = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void => {
    e.preventDefault()
    setIsEditActionOpened(false)
    setTournamentToEdit(null)
    setTournamentActionModalOpened(true)
  }

  const closeTournamentActionModal = (): void => {
    setIsEditActionOpened(false)
    setTournamentActionModalOpened(false)
    setTournamentToEdit(null)
    fetchCountriesAndTournaments(PAGE_OFFSET_INITIAL_VALUE, LIMIT_PER_PAGE_INITIAL_VALUE)
  }

  const handleView = (tournament: Tournament): void => {
    router.push(`/tournaments/${tournament.id}`)
  }

  const handleEdit = (tournament: Tournament): void => {
    console.debug('Editing tournament:', tournament)
    setIsEditActionOpened(true)
    setTournamentToEdit(tournament)
    setTournamentActionModalOpened(true)
  }

  const handleDelete = (tournament: Tournament): void => {
    const confirmed = confirm(`Are you sure you want to delete tournament '${tournament.name}'?`)
    if (!confirmed) return

    deleteTournament(tournament, (tournamentData) => {
      console.debug('Tournament deleted:', tournamentData)
      fetchTournaments((data) => {
        setTournaments(data)
        setTotalItems(data.total)
      })
    })
  }

  const handlePageChange = (limit: number, offset: number): void => {
    fetchCountriesAndTournaments(offset, limit)
  }
  
  return (
    <>
      <TournamentActionModal isOpen={tournamentActionModalOpened} onClose={closeTournamentActionModal} isEdit={isEditActionOpened} object={tournamentToEdit} />
      <div className="flex min-h-screen flex-col items-center p-24">
        <SectionHeader title="Tournaments" action={openNewTournamentModal} actionText="New Tournament" />
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
            {tournaments && tournaments.items.map((tournament) => (
              <tr key={`tournament-${tournament.id}`}>
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
                    <ImageAutoSize src={countriesToFlagMap[tournament.country]} alt={tournament.country} width={32} height={16} className="mr-2" />
                    {tournament.country}
                  </span>)}
                </td>              
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{new Date(tournament.start_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="grid grid-cols-3">
                    {tournament.teams?.map((team: Team) => (
                      <div key={`tournament-${tournament.id}-team-${team.id}`} className="flex items-center mb-2">
                        <ImageAutoSize 
                          imageBlob={team.logo_image_file as Blob}
                          fallbackSrc={DEFAULT_TEAM_LOGO_IMAGE_PATH}
                          alt={team.short_name} 
                          width={32} height={32} 
                          className="mr-2" />
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
        <Pagination totalItems={totalItems} onPageChange={handlePageChange} />
      </div>
    </>
  )
}
