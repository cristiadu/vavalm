"use client"

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { fetchTournaments, deleteTournament } from '@/api/TournamentsApi'
import { fetchCountries } from '@/api/CountryApi'
import TournamentActionModal from '@/components/TournamentActionModal'
import { ItemsWithPagination } from '@/api/models/types'
import Pagination from '@/components/common/Pagination'
import { DEFAULT_TEAM_LOGO_IMAGE_PATH, LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from '@/api/models/constants'
import SectionHeader from '@/components/common/SectionHeader'
import ImageAutoSize from '@/components/common/ImageAutoSize'
import { TeamApiModel, TournamentApiModel } from '@/api/generated'
import { stripHtmlTags } from '@/common/StringUtils'

export default function ListTournaments(): React.ReactNode {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<ItemsWithPagination<TournamentApiModel> | null>(null)
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})
  const [tournamentActionModalOpened, setTournamentActionModalOpened] = useState<boolean>(false)
  const [isEditActionOpened, setIsEditActionOpened] = useState<boolean>(false)
  const [tournamentToEdit, setTournamentToEdit] = useState<TournamentApiModel | null>(null)
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

  const handleView = (tournament: TournamentApiModel): void => {
    router.push(`/tournaments/${tournament.id}`)
  }

  const handleEdit = (tournament: TournamentApiModel): void => {
    console.debug('Editing tournament:', tournament)
    setIsEditActionOpened(true)
    setTournamentToEdit(tournament)
    setTournamentActionModalOpened(true)
  }

  const handleDelete = (tournament: TournamentApiModel): void => {
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

  const formatTournamentType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <>
      <TournamentActionModal isOpen={tournamentActionModalOpened} onClose={closeTournamentActionModal} isEdit={isEditActionOpened} object={tournamentToEdit} />
      <div className="flex min-h-screen flex-col items-center p-24">
        <SectionHeader title="Tournaments" action={openNewTournamentModal} actionText="New Tournament" />
        <div className="w-full overflow-x-auto rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Tournament</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Country</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Result</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Teams</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tournaments && tournaments.items.map((tournament) => (
                <tr key={`tournament-${tournament.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">{tournament.name}</span>
                      <span className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tournament.description ? stripHtmlTags(tournament.description) : ''}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {formatTournamentType(tournament.type)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {tournament.country && (
                      <span className="flex items-center text-sm text-gray-700">
                        <ImageAutoSize src={countriesToFlagMap[tournament.country]} alt={tournament.country} width={24} height={16} className="mr-2" />
                        {tournament.country}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(tournament.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {tournament.ended ? (() => {
                      const winner = tournament.teams?.find(
                        (t): t is TeamApiModel => typeof t !== 'number' && t.id === tournament.winner_id,
                      )
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          🏆
                          {winner ? (
                            <>
                              <ImageAutoSize
                                imageFile={winner.logo_image_file as File}
                                fallbackSrc={DEFAULT_TEAM_LOGO_IMAGE_PATH}
                                alt={winner.short_name || ''}
                                width={16} height={16}
                                className="rounded"
                              />
                              {winner.short_name}
                            </>
                          ) : 'Finished'}
                        </span>
                      )
                    })() : tournament.started ? (
                      <span className="inline-block px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">In Progress</span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Not Started</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 items-center">
                      {tournament.teams?.map((team: TeamApiModel | number) => {
                        if (typeof team === 'number') return null
                        return (
                          <div key={`tournament-${tournament.id}-team-${team.id}`} title={team.short_name || ''} className="flex items-center bg-gray-100 rounded-full pl-1 pr-2.5 py-0.5">
                            <ImageAutoSize
                              imageFile={team.logo_image_file as File}
                              fallbackSrc={DEFAULT_TEAM_LOGO_IMAGE_PATH}
                              alt={team.short_name || ""}
                              width={20} height={20}
                              className="mr-1.5" />
                            <span className="text-xs font-medium text-gray-700">{team.short_name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleView(tournament)} title="View" className="p-1.5 rounded hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button onClick={() => handleEdit(tournament)} title="Edit" className="p-1.5 rounded hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(tournament)} title="Delete" className="p-1.5 rounded hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination totalItems={totalItems} onPageChange={handlePageChange} />
      </div>
    </>
  )
}
