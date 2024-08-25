"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { fetchPlayer, fetchPlayerStats } from '../../api/PlayersApi'
import { AllPlayerStats, getAttributeBgColor, getRoleBgColor, Player } from '../../api/models/Player'
import { fetchCountries } from '../../api/CountryApi'
import { fetchTeam } from '../../api/TeamsApi'
import { Team } from '../../api/models/Team'
import Link from 'next/link'
import { handleBackClick } from '../../base/LinkUtils'
import { asWord } from '../../base/StringUtils'
import { getBgColorBasedOnThreshold } from '../../base/UIUtils'

export default function ViewPlayer({ params }: { params: { playerId: string } }) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [playerStats, setPlayerStats] = useState<AllPlayerStats | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [countryFlag, setCountryFlag] = useState<string | null>(null)
  const router = useRouter()

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

  useEffect(() => {
    const fetchPlayerData = async () => {
      const playerData = await fetchPlayer(Number(params.playerId), (data) => {
        setPlayer(data)
      })

      await fetchPlayerStats(Number(params.playerId), (data) => {
        setPlayerStats(data)
      })

      if (playerData.team_id) {
        await fetchTeam(playerData.team_id, (data) => {
          setTeam(data)
        })
      }

      if (playerData.country) {
        await fetchCountries((data) => {
          setCountryFlag(data.find(c => c.name === playerData.country)?.flag || null)
        })
      }
    }

    fetchPlayerData()
  }, [params.playerId])

  if (!player) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <header className="w-full flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Player Details</h1>
        <Link href="#" onClick={(e) => handleBackClick(e, router)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
      Back
        </Link>
      </header>
      <div className="w-full max-w-3xl bg-white p-8 rounded shadow">
        <div className="bg-blue-300 p-4 rounded mb-4">
          <h2 className="text-3xl font-bold text-center text-white">{player.nickname}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-lg"><strong>Full Name:</strong> {player.full_name}</div>
          <div className="text-lg"><strong>Age:</strong> {player.age}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-lg">
            <strong>Country:</strong> 
            {countryFlag && <Image src={countryFlag} alt={player.country} width={30} height={30} className="inline-block ml-2 mr-2" />}
            {player.country}
          </div>
          <div className="text-lg flex items-center">
            <strong>Team:</strong> {team ? (
              <span className="flex items-center ml-2">
                <Image src={team.logo_image_file ? URL.createObjectURL(team.logo_image_file as Blob) : "/images/nologo.svg"} alt={team.short_name} width={30} height={30} className="mr-2" />
                {team.short_name}
              </span>
            ) : (
              'No Team'
            )}
          </div>
        </div>
        <div className="text-lg mb-4">
          <strong>Role:</strong> 
          <span className={getRoleBgColor(player.role)}>
            {player.role}
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Player Attributes</h3>
          <hr className="mb-2" />
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-4 gap-1">
            {Object.entries(player.player_attributes).map(([key, value]) => {
              return (
                <div key={key} className="flex items-center space-x-1">
                  <span className={`w-6 h-6 flex items-center justify-center rounded text-xs text-white ${getAttributeBgColor(value)}`}>{value}</span>
                  <span className="text-xs text-gray-900 truncate">{asWord(key)}</span>
                </div>
              )
            })}
          </div>
        </div>
        {playerStats && (
          <div className="mt-4">
            <h3 className="text-xl font-bold mb-2">Player Stats</h3>
            <hr className="mb-2" />
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white text-center">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-sm font-semibold text-gray-700">Stat</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-sm font-semibold text-gray-700">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">KDA</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(playerStats.kda, thresholds.kda)}`}>{playerStats.kda}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Total Kills</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(playerStats.totalKills, thresholds.totalKills, playerStats.totalDeaths)}`}>{playerStats.totalKills}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Total Deaths</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(playerStats.totalDeaths, thresholds.totalDeaths, playerStats.totalKills)}`}>{playerStats.totalDeaths}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Total Assists</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(playerStats.totalAssists, thresholds.totalAssists, playerStats.totalDeaths)}`}>{playerStats.totalAssists}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Winrate</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(playerStats.winrate, thresholds.winrate)}`}>{playerStats.winrate}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Map Winrate</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(playerStats.mapWinrate, thresholds.mapWinrate)}`}>{playerStats.mapWinrate}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Matches Won</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(playerStats.totalMatchesWon, thresholds.totalMatchesWon, playerStats.totalMatchesPlayed)}`}>{playerStats.totalMatchesWon}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Matches Lost</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(playerStats.totalMatchesLost, thresholds.totalMatchesLost, playerStats.totalMatchesPlayed)}`}>{playerStats.totalMatchesLost}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Matches Played</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(playerStats.totalMatchesPlayed, thresholds.totalMatchesPlayed)}`}>{playerStats.totalMatchesPlayed}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Maps Won</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(playerStats.totalMapsWon, thresholds.totalMapsWon, playerStats.totalMapsPlayed)}`}>{playerStats.totalMapsWon}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Maps Lost</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(playerStats.totalMapsLost, thresholds.totalMapsLost, playerStats.totalMapsPlayed)}`}>{playerStats.totalMapsLost}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Maps Played</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(playerStats.totalMapsPlayed, thresholds.totalMapsPlayed)}`}>{playerStats.totalMapsPlayed}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
