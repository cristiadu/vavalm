"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { AllPlayerStats, getRoleBgColor, Player, sortPlayersByStats } from '../../api/models/Player'
import { fetchCountries } from '../../api/CountryApi'
import { fetchPlayersStats } from '../../api/PlayersApi'
import { Team } from '../../api/models/Team'
import { fetchTeam } from '../../api/TeamsApi'
import { ItemsWithPagination } from '../../api/models/types'
import { useRouter } from 'next/navigation'
import { getBgColorBasedOnThreshold } from '../../base/UIUtils'
import Pagination from '../../base/Pagination'
import Link from 'next/link'
import { handleBackClick } from '../../base/LinkUtils'

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
  totalKills: { high: 1.5, medium: 0.9, ratioCalculation: true },
  totalDeaths: { high: 1.0, medium: 0.5, ratioCalculation: true, higherIsWorse: true },
  totalAssists: { high: 0.8, medium: 0.4, ratioCalculation: true },
}

const PlayersStatsPage = () => {
  const router = useRouter()
  const [playersStats, setPlayersStats] = useState<AllPlayerStats[]>([])
  const [playerToTeam, setPlayerToTeam] = useState<Record<string, Team>>({})
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})
  const [totalItems, setTotalItems] = useState(0)
  const LIMIT_VALUE_PLAYER_LIST = 15

  useEffect(() => {
    fetchCountries((countries) => {
      const countriesToFlagMap: Record<string, string> = {}
      countries.forEach((country) => {
        countriesToFlagMap[country.name] = country.flag
      })
      setCountriesToFlagMap(countriesToFlagMap)
    })

    fetchPlayersStats(refreshListData, LIMIT_VALUE_PLAYER_LIST)
  }, [])

  const refreshListData = async (data: ItemsWithPagination<AllPlayerStats>) => {
    if(data.total > 0) {
      const playerToTeam: Record<number, Team> = {}

      const teamFetchPromises = data.items.map((stats: AllPlayerStats) =>
        fetchTeam(stats.player.team_id, team => {
          if (stats.player.id) {
            playerToTeam[stats.player.id] = team
          }
        })
      )

      await Promise.all(teamFetchPromises)

      setPlayerToTeam(playerToTeam)
      setTotalItems(data.total)
      setPlayersStats(data.items)
    }
  }

  const handleView = (player: Player) => {
    // Send user to player details page
    router.push(`/players/${player.id}`)
  }

  const handlePageChange = (offset: number, limit: number) => {
    fetchPlayersStats(refreshListData, limit, offset)
  }


  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <header className="w-full flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Players Stats</h1>
        <div className="space-x-4">
          <Link href="#" onClick={(e) => handleBackClick(e, router)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
            Back
          </Link>
        </div>
      </header>
      <table className="min-w-full divide-y divide-gray-200 text-center">
        <thead>
          <tr>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">KDA</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Winrate</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Total Matches</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Total Matches Won</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Total Matches Lost</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Map Winrate</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Total Maps</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Total Maps Won</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Total Maps Lost</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Total Kills</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Total Deaths</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Total Assists</th>
            <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {playersStats.sort(sortPlayersByStats).map(stats => (
            <tr key={stats.player.id}>
              <td className="py-2 px-4 border-b border-gray-200">
                {stats.player.country && (
                  <span className="flex items-center">
                    <Image src={countriesToFlagMap[stats.player.country]} alt={stats.player.country} width={30} height={30} className="mr-2" />
                  </span>
                )}
              </td>
              <td>
                <span className={getRoleBgColor(stats.player.role)}>
                  {stats.player.role}
                </span>
              </td>
              <td className="py-2 px-4 border-b border-gray-200">{stats.player.nickname}</td>
              <td className="py-2 px-4 border-b border-gray-200">
                {playerToTeam && playerToTeam[String(stats.player.id)] ? (
                  <span className="flex items-center">
                    <Image src={playerToTeam[String(stats.player.id)].logo_image_file
                      ? URL.createObjectURL(playerToTeam[String(stats.player.id)].logo_image_file as Blob)
                      : "/images/nologo.svg"} alt={playerToTeam[String(stats.player.id)].short_name} width={30} height={30} className="mr-2" />
                    {playerToTeam[String(stats.player.id)].short_name}
                  </span>
                ) : (
                  'No Team'
                )}
              </td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.kda, thresholds.kda)}`}>{stats.kda}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.winrate, thresholds.winrate)}`}>{stats.winrate}%</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalMatchesPlayed, thresholds.totalMatchesPlayed)}`}>{stats.totalMatchesPlayed}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalMatchesWon, thresholds.totalMatchesWon, stats.totalMatchesPlayed)}`}>{stats.totalMatchesWon}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalMatchesLost, thresholds.totalMatchesLost, stats.totalMatchesPlayed)}`}>{stats.totalMatchesLost}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.mapWinrate, thresholds.mapWinrate)}`}>{stats.mapWinrate}%</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalMapsPlayed, thresholds.totalMapsPlayed)}`}>{stats.totalMapsPlayed}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalMapsWon, thresholds.totalMapsWon, stats.totalMapsPlayed)}`}>{stats.totalMapsWon}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalMapsLost, thresholds.totalMapsLost, stats.totalMapsPlayed)}`}>{stats.totalMapsLost}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalKills, thresholds.totalKills)}`}>{stats.totalKills}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalDeaths, thresholds.totalDeaths)}`}>{stats.totalDeaths}</td>
              <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(stats.totalAssists, thresholds.totalAssists)}`}>{stats.totalAssists}</td>
              <td className="py-4 whitespace-nowrap text-sm text-left text-gray-900 w-auto flex items-center">
                <button onClick={() => handleView(stats.player)} className="text-blue-600 hover:text-blue-900 px-4 py-1">👀</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination totalItems={totalItems} onPageChange={handlePageChange} limitValue={LIMIT_VALUE_PLAYER_LIST} />
    </div>
  )
}

export default PlayersStatsPage