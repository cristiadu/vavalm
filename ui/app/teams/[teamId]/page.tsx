"use client"

import { use, useEffect, useState } from 'react'
import { fetchPlayersByTeam } from '../../api/PlayersApi'
import { getRoleBgColor, PlayerWithFlag } from '../../api/models/Player'
import { fetchCountries } from '../../api/CountryApi'
import { fetchTeam, fetchTeamStats } from '../../api/TeamsApi'
import { Team, TeamStats } from '../../api/models/Team'
import 'react-quill-new/dist/quill.snow.css'
import { asSafeHTML } from '../../base/StringUtils'
import { getBgColorBasedOnThreshold } from '../../base/UIUtils'
import SectionHeader from '../../base/SectionHeader'
import ImageAutoSize from '../../base/ImageAutoSize'

type Params = Promise<{ teamId: string }>
export default function ViewTeam(props: { params: Params }) {
  const params = use(props.params)
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<PlayerWithFlag[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [countryFlag, setCountryFlag] = useState<string | null>(null)

  const thresholds = {
    tournamentsParticipated: { noColor: true },
    tournamentsWon: { high: 1 },
    winrate: { high: 60, medium: 40 },
    totalMatchesPlayed: { noColor: true },
    totalMatchesWon: { high: 60, medium: 40, percentageCalculation: true },
    totalMatchesLost: { high: 60, medium: 40, higherIsWorse: true, percentageCalculation: true },
    mapWinrate: { high: 60, medium: 40 },
    totalMapsPlayed: { noColor: true },
    totalMapsWon: { high: 60, medium: 40, percentageCalculation: true },
    totalMapsLost: { high: 60, medium: 40, higherIsWorse: true, percentageCalculation: true },
  }

  useEffect(() => {
    const fetchTeamData = async () => {
      const teamData = await fetchTeam(Number(params.teamId), (data) => {
        setTeam(data)
      })

      await fetchTeamStats(Number(params.teamId), (data) => {
        setTeamStats(data)
      })

      const countries = await fetchCountries(() => {})
      if (teamData.country) {
        setCountryFlag(countries?.find(c => c.name === teamData.country)?.flag || null)
      }
  
      fetchPlayersByTeam(Number(params.teamId), (data) => {
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
      <SectionHeader title="Team Details" />
      <div className="w-full max-w-3xl bg-white p-8 rounded shadow">
        <div className="bg-blue-300 p-4 rounded mb-4 flex items-center justify-center">
          {logoSrc && <ImageAutoSize src={logoSrc} alt={`${team.short_name} logo`} width={64} height={64} className="inline-block mr-4" />}
          <h2 className="text-3xl font-bold text-center text-white">{team.short_name}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-lg">
            <strong>Country:</strong> 
            {countryFlag && <ImageAutoSize src={countryFlag} alt={team.country} width={32} height={16} className="inline-block ml-2 mr-2" />}
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
                <span className={getRoleBgColor(player.role)}>
                  {player.role}
                </span>
                {player.countryFlag && <ImageAutoSize src={player.countryFlag} alt={player.country} width={32} height={16} className="inline-block ml-2 mr-2" />}
                <span className="text-lg">{player.nickname}</span>
                <span className="text-sm text-gray-600 mt-1">({player.full_name})</span>
              </div>
            ))}
          </div>
        </div>
        {teamStats && (
          <div className="mt-4">
            <h3 className="text-xl font-bold mb-2">Team Stats</h3>
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
                    <td className="py-2 px-4 border-b border-gray-200">Tournaments Won</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(teamStats.tournamentsWon, thresholds.tournamentsWon)}`}>{teamStats.tournamentsWon}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Tournaments Played</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(teamStats.tournamentsParticipated, thresholds.tournamentsParticipated)}`}>{teamStats.tournamentsParticipated}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Winrate</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(teamStats.winrate, thresholds.winrate)}`}>{teamStats.winrate}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Map Winrate</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(teamStats.mapWinrate, thresholds.mapWinrate)}`}>{teamStats.mapWinrate}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Matches Won</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(teamStats.totalMatchesWon, thresholds.totalMatchesWon, teamStats.totalMatchesPlayed)}`}>{teamStats.totalMatchesWon}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Matches Lost</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(teamStats.totalMatchesLost, thresholds.totalMatchesLost, teamStats.totalMatchesPlayed)}`}>{teamStats.totalMatchesLost}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Matches Played</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(teamStats.totalMatchesPlayed, thresholds.totalMatchesPlayed)}`}>{teamStats.totalMatchesPlayed}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Maps Won</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(teamStats.totalMapsWon, thresholds.totalMapsWon, teamStats.totalMapsPlayed)}`}>{teamStats.totalMapsWon}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Maps Lost</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(teamStats.totalMapsLost, thresholds.totalMapsLost, teamStats.totalMapsPlayed)}`}>{teamStats.totalMapsLost}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-gray-200">Maps Played</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${getBgColorBasedOnThreshold(teamStats.totalMapsPlayed, thresholds.totalMapsPlayed)}`}>{teamStats.totalMapsPlayed}</td>
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
