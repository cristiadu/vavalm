"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getRoleBgColor } from '@/api/models/helpers'
import { fetchCountries } from '@/api/CountryApi'
import { fetchPlayersStats } from '@/api/PlayersApi'
import { useRouter } from 'next/navigation'
import { getBgColorBasedOnThreshold } from '@/common/UIUtils'
import Pagination from '@/components/common/Pagination'
import SectionHeader from '@/components/common/SectionHeader'
import ImageAutoSize from '@/components/common/ImageAutoSize'
import { DEFAULT_TEAM_LOGO_IMAGE_PATH } from '@/api/models/constants'
import { AllPlayerStats, PlayerApiModel } from '@/api/generated'
import { Threshold } from '@/common/CommonModels'

const thresholds = {
  kda: { high: 1.8, medium: 0.9 },
  winrate: { high: 60, medium: 40 },
  totalMatchesPlayed: { noColor: true },
  totalMatchesWon: { high: 60, medium: 40, percentageCalculation: true },
  totalMatchesLost: { high: 60, medium: 40, higherIsWorse: true, percentageCalculation: true },
  mapWinrate: { high: 60, medium: 40 },
  totalMapsPlayed: { noColor: true },
  totalMapsWon: { high: 60, medium: 40, percentageCalculation: true },
  totalMapsLost: { high: 60, medium: 40, higherIsWorse: true, percentageCalculation: true },
  totalKills: { high: 1.0, medium: 0.7, ratioCalculation: true },
  totalDeaths: { high: 0.8, medium: 0.7, ratioCalculation: true, higherIsWorse: true },
  totalAssists: { high: 0.5, medium: 0.3, ratioCalculation: true },
} as Record<string, Threshold>

const LIMIT_VALUE_PLAYER_LIST = 15

const PlayersStatsPage = (): React.ReactNode => {
  const router = useRouter()
  const [playersStats, setPlayersStats] = useState<AllPlayerStats[]>([])
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async (limit: number = LIMIT_VALUE_PLAYER_LIST, offset: number = 0) => {
    setIsLoading(true)
    try {
      const [countries, statsData] = await Promise.all([
        fetchCountries(() => {}),
        fetchPlayersStats(() => {}, limit, offset),
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
        setPlayersStats(statsData.items)
      }
    } catch (error) {
      console.error('Error loading player stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleView = useCallback((player: PlayerApiModel): void => {
    router.push(`/players/${player.id}`)
  }, [router])

  const handlePageChange = useCallback((limit: number, offset: number): void => {
    loadData(limit, offset)
  }, [loadData])

  // Stat columns configuration to reduce JSX repetition
  const statColumns = useMemo(() => [
    { key: 'kda', label: 'KDA', format: (s: AllPlayerStats) => s.kda.toFixed(2), threshold: thresholds.kda, value: (s: AllPlayerStats) => s.kda },
    { key: 'totalKills', label: 'K', format: (s: AllPlayerStats) => String(s.totalKills), threshold: thresholds.totalKills, value: (s: AllPlayerStats) => s.totalKills, total: (s: AllPlayerStats) => s.totalDeaths },
    { key: 'totalDeaths', label: 'D', format: (s: AllPlayerStats) => String(s.totalDeaths), threshold: thresholds.totalDeaths, value: (s: AllPlayerStats) => s.totalDeaths, total: (s: AllPlayerStats) => s.totalKills },
    { key: 'totalAssists', label: 'A', format: (s: AllPlayerStats) => String(s.totalAssists), threshold: thresholds.totalAssists, value: (s: AllPlayerStats) => s.totalAssists, total: (s: AllPlayerStats) => s.totalDeaths },
    { key: 'winrate', label: 'Win%', format: (s: AllPlayerStats) => `${s.winrate.toFixed(0)}%`, threshold: thresholds.winrate, value: (s: AllPlayerStats) => s.winrate },
    { key: 'mapWinrate', label: 'Map%', format: (s: AllPlayerStats) => `${s.mapWinrate.toFixed(0)}%`, threshold: thresholds.mapWinrate, value: (s: AllPlayerStats) => s.mapWinrate },
    { key: 'totalMatchesWon', label: 'MW', format: (s: AllPlayerStats) => String(s.totalMatchesWon), threshold: thresholds.totalMatchesWon, value: (s: AllPlayerStats) => s.totalMatchesWon, total: (s: AllPlayerStats) => s.totalMatchesPlayed },
    { key: 'totalMatchesLost', label: 'ML', format: (s: AllPlayerStats) => String(s.totalMatchesLost), threshold: thresholds.totalMatchesLost, value: (s: AllPlayerStats) => s.totalMatchesLost, total: (s: AllPlayerStats) => s.totalMatchesPlayed },
    { key: 'totalMatchesPlayed', label: 'MP', format: (s: AllPlayerStats) => String(s.totalMatchesPlayed), threshold: thresholds.totalMatchesPlayed, value: (s: AllPlayerStats) => s.totalMatchesPlayed },
    { key: 'totalMapsWon', label: 'GW', format: (s: AllPlayerStats) => String(s.totalMapsWon), threshold: thresholds.totalMapsWon, value: (s: AllPlayerStats) => s.totalMapsWon, total: (s: AllPlayerStats) => s.totalMapsPlayed },
    { key: 'totalMapsLost', label: 'GL', format: (s: AllPlayerStats) => String(s.totalMapsLost), threshold: thresholds.totalMapsLost, value: (s: AllPlayerStats) => s.totalMapsLost, total: (s: AllPlayerStats) => s.totalMapsPlayed },
    { key: 'totalMapsPlayed', label: 'GP', format: (s: AllPlayerStats) => String(s.totalMapsPlayed), threshold: thresholds.totalMapsPlayed, value: (s: AllPlayerStats) => s.totalMapsPlayed },
  ], [])

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <SectionHeader title="Players Stats" />
      <div className="w-full overflow-x-auto rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Player</th>
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
                <td colSpan={statColumns.length + 3} className="py-12 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-500">Loading stats...</span>
                  </div>
                </td>
              </tr>
            ) : playersStats.length === 0 ? (
              <tr>
                <td colSpan={statColumns.length + 3} className="py-12 text-center text-gray-400">No player stats available</td>
              </tr>
            ) : (
              playersStats.map(stats => (
                <tr key={`player-stats-${stats.player.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {stats.player.country && countriesToFlagMap[stats.player.country] && (
                        <ImageAutoSize src={countriesToFlagMap[stats.player.country]} alt={stats.player.country} width={24} height={16} className="shrink-0" />
                      )}
                      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-medium text-white shrink-0 ${getRoleBgColor(stats.player.role)}`}>
                        {stats.player.role}
                      </span>
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-sm font-semibold text-gray-900 truncate">{stats.player.nickname}</span>
                        <span className="text-[11px] text-gray-400 truncate">{stats.player.full_name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {stats.team ? (
                      <div className="flex items-center gap-2">
                        <ImageAutoSize
                          imageFile={stats.team.logo_image_file as File}
                          fallbackSrc={DEFAULT_TEAM_LOGO_IMAGE_PATH}
                          alt={stats.team.short_name || ''}
                          width={24}
                          height={24}
                          className="shrink-0"
                        />
                        <span className="text-sm text-gray-700 truncate">{stats.team.short_name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No Team</span>
                    )}
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
                    <button onClick={() => handleView(stats.player)} title="View" className="p-1.5 rounded hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination totalItems={totalItems} onPageChange={handlePageChange} limitValue={LIMIT_VALUE_PLAYER_LIST} />
    </div>
  )
}

export default PlayersStatsPage
