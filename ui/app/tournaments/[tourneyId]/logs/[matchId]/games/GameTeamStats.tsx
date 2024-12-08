import React, { useMemo } from 'react'
import { Country } from '../../../../../api/models/Country'
import { PlayerGameStats } from '../../../../../api/models/Tournament'
import { getRoleBgColor } from '../../../../../api/models/Player'
import { ASSISTS_HALF_MULTIPLIER, sortPlayersByStats } from '../../../../../api/models/Tournament'
import ImageAutoSize from '../../../../../base/ImageAutoSize'

interface GameTeamStatsProps {
  teamName: string
  playerStats: PlayerGameStats[]
  countries: Country[]
}

const GameTeamStats: React.FC<GameTeamStatsProps> = ({ teamName, playerStats, countries }) => {
  const playerCountryToFlag = useMemo(() => {
    const countryMap = new Map(countries.map(c => [c.name, c.flag]))
    return function CountryToFlag(country: string) {
      const flag = countryMap.get(country)
      return flag ? (
        <ImageAutoSize
          src={flag}
          alt={country}
          width={32}
          height={16}
          className="inline-block mr-2"
        />
      ) : null
    }
  }, [countries])

  return (
    <div className="overflow-x-auto mt-4">
      <h2 className="text-xl font-bold mb-4">{teamName}</h2>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 pl-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Country</th>
            <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Player</th>
            <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Role</th>
            <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Rating</th>
            <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Kills</th>
            <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Deaths</th>
            <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Assists</th>
          </tr>
        </thead>
        <tbody>
          {playerStats.sort(sortPlayersByStats).map((playerStats, index) => (
            <tr key={index}>
              <td className="py-2 pl-4 border-b border-gray-200">
                {playerStats.player.country && playerCountryToFlag(playerStats.player.country)}
              </td>
              <td className="py-2 px-4 border-b border-gray-200">{playerStats.player.nickname}</td>
              <td className="py-2 px-4 border-b border-gray-200"><span className={getRoleBgColor(playerStats.player.role)}>{playerStats.player.role}</span></td>
              <td className="py-2 px-4 border-b border-gray-200">{((playerStats.kills + playerStats.assists * ASSISTS_HALF_MULTIPLIER) / playerStats.deaths).toFixed(2)}</td>
              <td className="py-2 px-4 border-b border-gray-200">{playerStats.kills}</td>
              <td className="py-2 px-4 border-b border-gray-200">{playerStats.deaths}</td>
              <td className="py-2 px-4 border-b border-gray-200">{playerStats.assists}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default GameTeamStats
