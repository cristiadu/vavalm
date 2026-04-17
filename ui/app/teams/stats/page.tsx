"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchTeamsStats } from '@/api/TeamsApi'
import { fetchCountries } from '@/api/CountryApi'
import { useRouter } from 'next/navigation'
import { getBgColorBasedOnThreshold } from '@/common/UIUtils'
import Pagination from '@/components/common/Pagination'
import SectionHeader from '@/components/common/SectionHeader'
import ImageAutoSize from '@/components/common/ImageAutoSize'
import { DEFAULT_TEAM_LOGO_IMAGE_PATH } from '@/api/models/constants'
import { TeamStats } from '@/api/generated'
import { Threshold } from '@/common/CommonModels'

const thresholds: Record<string, Threshold> = {
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

const LIMIT_VALUE_TEAM_LIST = 15

const TeamsStatsPage = (): React.ReactNode => {
  const router = useRouter()
  const [teamsStats, setTeamsStats] = useState<TeamStats[]>([])
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async (limit: number = LIMIT_VALUE_TEAM_LIST, offset: number = 0) => {
    setIsLoading(true)
    try {
      const [countries, statsData] = await Promise.all([
        fetchCountries(() => {}),
        fetchTeamsStats(() => {}, limit, offset),
      ])

      if (countries) {
        const flagMap: Record<string, string> = {}
        countries.forEach((country) => {
          flagMap[country.name] = country.flag
        })
        setCountriesToFlagMap(flagMap)
      }

      if (statsData && statsData.total > 0) {
        setTotalItems(statsData.total)
        setTeamsStats(statsData.items)
      }
    } catch (error) {
      console.error('Error loading team stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleView = useCallback((teamId: number): void => {
    router.push(`/teams/${teamId}`)
  }, [router])

  const handlePageChange = useCallback((limit: number, offset: number): void => {
    loadData(limit, offset)
  }, [loadData])

  // Stat columns configuration to reduce JSX repetition
  const statColumns = useMemo(() => [
    { key: 'tournamentsWon', label: 'T. Won', format: (s: TeamStats) => String(s.tournamentsWon), threshold: thresholds.tournamentsWon, value: (s: TeamStats) => s.tournamentsWon },
    { key: 'tournamentsParticipated', label: 'T. Played', format: (s: TeamStats) => String(s.tournamentsParticipated), threshold: thresholds.tournamentsParticipated, value: (s: TeamStats) => s.tournamentsParticipated },
    { key: 'winrate', label: 'Win%', format: (s: TeamStats) => `${s.winrate}%`, threshold: thresholds.winrate, value: (s: TeamStats) => s.winrate },
    { key: 'mapWinrate', label: 'Map%', format: (s: TeamStats) => `${s.mapWinrate}%`, threshold: thresholds.mapWinrate, value: (s: TeamStats) => s.mapWinrate },
    { key: 'totalMatchesWon', label: 'MW', format: (s: TeamStats) => String(s.totalMatchesWon), threshold: thresholds.totalMatchesWon, value: (s: TeamStats) => s.totalMatchesWon, total: (s: TeamStats) => s.totalMatchesPlayed },
    { key: 'totalMatchesLost', label: 'ML', format: (s: TeamStats) => String(s.totalMatchesLost), threshold: thresholds.totalMatchesLost, value: (s: TeamStats) => s.totalMatchesLost, total: (s: TeamStats) => s.totalMatchesPlayed },
    { key: 'totalMatchesPlayed', label: 'MP', format: (s: TeamStats) => String(s.totalMatchesPlayed), threshold: thresholds.totalMatchesPlayed, value: (s: TeamStats) => s.totalMatchesPlayed },
    { key: 'totalMapsWon', label: 'GW', format: (s: TeamStats) => String(s.totalMapsWon), threshold: thresholds.totalMapsWon, value: (s: TeamStats) => s.totalMapsWon, total: (s: TeamStats) => s.totalMapsPlayed },
    { key: 'totalMapsLost', label: 'GL', format: (s: TeamStats) => String(s.totalMapsLost), threshold: thresholds.totalMapsLost, value: (s: TeamStats) => s.totalMapsLost, total: (s: TeamStats) => s.totalMapsPlayed },
    { key: 'totalMapsPlayed', label: 'GP', format: (s: TeamStats) => String(s.totalMapsPlayed), threshold: thresholds.totalMapsPlayed, value: (s: TeamStats) => s.totalMapsPlayed },
  ], [])

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <SectionHeader title="Teams Stats" />
      <div className="w-full overflow-x-auto rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Team</th>
              {statColumns.map(col => (
                <th key={col.key} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider">{col.label}</th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={statColumns.length + 2} className="py-12 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-500">Loading stats...</span>
                  </div>
                </td>
              </tr>
            ) : teamsStats.length === 0 ? (
              <tr>
                <td colSpan={statColumns.length + 2} className="py-12 text-center text-gray-400">No team stats available</td>
              </tr>
            ) : (
              teamsStats.map(stats => (
                <tr key={`team-stats-${stats.team.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {stats.team.country && countriesToFlagMap[stats.team.country] && (
                        <ImageAutoSize src={countriesToFlagMap[stats.team.country]} alt={stats.team.country} width={20} height={14} className="shrink-0" />
                      )}
                      <ImageAutoSize
                        imageFile={stats.team.logo_image_file as File}
                        fallbackSrc={DEFAULT_TEAM_LOGO_IMAGE_PATH}
                        alt={stats.team.short_name ?? ''}
                        width={28}
                        height={28}
                        className="shrink-0 rounded"
                      />
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-sm font-semibold text-gray-900 truncate">{stats.team.short_name}</span>
                        <span className="text-[11px] text-gray-400 truncate">{stats.team.full_name}</span>
                      </div>
                    </div>
                  </td>
                  {statColumns.map(col => (
                    <td
                      key={col.key}
                      className={`px-3 py-3 text-center text-sm font-medium whitespace-nowrap ${getBgColorBasedOnThreshold(col.value(stats), col.threshold, col.total ? col.total(stats) : 0)}`}
                    >
                      {col.format(stats)}
                    </td>
                  ))}
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <button onClick={() => stats.team.id && handleView(stats.team.id)} title="View" className="p-1.5 rounded hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination totalItems={totalItems} onPageChange={handlePageChange} limitValue={LIMIT_VALUE_TEAM_LIST} />
    </div>
  )
}

export default TeamsStatsPage
