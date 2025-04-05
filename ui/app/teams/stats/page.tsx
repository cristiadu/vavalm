"use client"

import React, { useEffect, useState } from 'react'
import { fetchTeamsStats } from '@/api/TeamsApi'
import { fetchCountries } from '@/api/CountryApi'
import { ItemsWithPagination } from '@/api/models/types'
import { useRouter } from 'next/navigation'
import { getBgColorBasedOnThreshold } from '@/base/UIUtils'
import Pagination from '@/base/Pagination'
import { parseLogoImageFile, Team, TeamStats, TeamWithLogoImageData } from '@/api/models/Team'
import SectionHeader from '@/base/SectionHeader'
import ImageAutoSize from '@/base/ImageAutoSize'
import { DEFAULT_TEAM_LOGO_IMAGE_PATH } from '@/api/models/constants'

const thresholds = {
  tournamentsWon: { high: 1 },
  tournamentsParticipated: { noColor: true },
  winrate: { high: 60, medium: 40 },
  totalMatchesPlayed: { noColor: true },
  totalMatchesWon: { high: 60, medium: 40, percentageCalculation: true },
  totalMatchesLost: { high: 60, medium: 40, higherIsWorse: true, percentageCalculation: true },
  mapWinrate: { high: 60, medium: 40 },
  totalMapsPlayed: { noColor: true },
  totalMapsWon: { high: 60, medium: 40, percentageCalculation: true },
  totalMapsLost: { high: 60, medium: 40, higherIsWorse: true, percentageCalculation: true },
}

const TeamsStatsPage = (): React.ReactNode => {
  const router = useRouter()
  const [teamsStats, setTeamsStats] = useState<TeamStats[]>([])
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})
  const [totalItems, setTotalItems] = useState(0)
  const LIMIT_VALUE_TEAM_LIST = 15

  useEffect(() => {
    fetchCountries((countries) => {
      const countriesToFlagMap: Record<string, string> = {}
      countries.forEach((country) => {
        countriesToFlagMap[country.name] = country.flag
      })
      setCountriesToFlagMap(countriesToFlagMap)
    })

    fetchTeamsStats(refreshListData, LIMIT_VALUE_TEAM_LIST)
  }, [])

  const refreshListData = async (data: ItemsWithPagination<TeamStats>): Promise<void> => {
    if (data.total > 0) {
      setTotalItems(data.total)
      const items = data.items.map((item: TeamStats) => {
        return { ...item, team: parseLogoImageFile<Team>(item.team) }
      })
      setTeamsStats(items)
    }
  }

  const handleView = (teamId: number): void => {
    // Send user to team details page
    router.push(`/teams/${teamId}`)
  }

  const handlePageChange = (limit: number, offset: number): void => {
    fetchTeamsStats(refreshListData, limit, offset)
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <SectionHeader title="Teams Stats" />
      <table className=" divide-y divide-gray-200 text-center">
        <thead>
          <tr>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Tournaments Won</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Tournaments Played</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Winrate</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Map Winrate</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Matches Won</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Matches Lost</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Matches Played</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Maps Won</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Maps Lost</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Maps Played</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {teamsStats.map(stats => (
            <tr key={`team-stats-${stats.team.id}`}>
              <td className="py-2 px-4 border-b border-gray-200">
                {stats.team.country && (
                  <span className="flex items-center">
                    <ImageAutoSize src={countriesToFlagMap[stats.team.country]} alt={stats.team.country} width={32} height={16} className="mr-2" />
                  </span>
                )}
              </td>
              <td className="py-2 px-4 border-b border-gray-200">

                <span className="flex items-center">
                  <ImageAutoSize
                    imageBlob={stats.team.logo_image_file as Blob}
                    fallbackSrc={DEFAULT_TEAM_LOGO_IMAGE_PATH}
                    alt={stats.team.short_name}
                    width={32} height={32}
                    className="mr-2" />
                  {stats.team.short_name}
                </span>

              </td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.tournamentsWon, thresholds.tournamentsWon)}`}>{stats.tournamentsWon}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.tournamentsParticipated, thresholds.tournamentsParticipated)}`}>{stats.tournamentsParticipated}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.winrate, thresholds.winrate)}`}>{stats.winrate}%</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.mapWinrate, thresholds.mapWinrate)}`}>{stats.mapWinrate}%</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalMatchesWon, thresholds.totalMatchesWon, stats.totalMatchesPlayed)}`}>{stats.totalMatchesWon}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalMatchesLost, thresholds.totalMatchesLost, stats.totalMatchesPlayed)}`}>{stats.totalMatchesLost}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalMatchesPlayed, thresholds.totalMatchesPlayed)}`}>{stats.totalMatchesPlayed}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalMapsWon, thresholds.totalMapsWon, stats.totalMapsPlayed)}`}>{stats.totalMapsWon}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalMapsLost, thresholds.totalMapsLost, stats.totalMapsPlayed)}`}>{stats.totalMapsLost}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalMapsPlayed, thresholds.totalMapsPlayed)}`}>{stats.totalMapsPlayed}</td>
              <td className="py-4 whitespace-nowrap text-sm text-left text-gray-900 w-auto flex items-center">
                <button onClick={() => stats.team.id && handleView(stats.team.id)} className="text-blue-600 hover:text-blue-900 px-4 py-1">👀</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination totalItems={totalItems} onPageChange={handlePageChange} limitValue={LIMIT_VALUE_TEAM_LIST} />
    </div>
  )
}

export default TeamsStatsPage
