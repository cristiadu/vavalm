import React, { useMemo } from 'react'
import { Country } from '@/api/models/types'
import { getRoleBgColor } from '@/api/models/helpers'
import { ASSISTS_HALF_MULTIPLIER } from '@/api/models/constants'
import { calculatePlayerRating } from '@/common/NumberUtils'
import { sortPlayersByStats } from '@/api/models/helpers'
import ImageAutoSize from '@/components/common/ImageAutoSize'
import { PlayerGameStatsApiModel } from '@/api/generated'

interface GameTeamStatsProps {
  teamName: string
  playerStats: PlayerGameStatsApiModel[]
  countries: Country[]
}

const GameTeamStats: React.FC<GameTeamStatsProps> = ({ teamName, playerStats, countries }) => {
  const playerCountryToFlag = useMemo(() => {
    const countryMap = new Map(countries.map(c => [c.name, c.flag]))
    return function CountryToFlag(country: string): React.ReactNode {
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
      <table className="min-w-full rounded-lg overflow-hidden shadow">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="py-2 pl-4 text-left text-xs font-semibold uppercase tracking-wider">Country</th>
            <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wider">Player</th>
            <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wider">Role</th>
            <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wider">Rating</th>
            <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wider">Kills</th>
            <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wider">Deaths</th>
            <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wider">Assists</th>
          </tr>
        </thead>
        <tbody>
          {[...(playerStats || [])].sort(sortPlayersByStats).map((playerStats, index) => (
            <tr key={`game-team-stats-${teamName}-player-${playerStats?.player?.id}-${index}`}>
              <td className="py-2 pl-4 border-b border-gray-200">
                {playerStats?.player?.country && playerCountryToFlag(playerStats?.player?.country)}
              </td>
              <td className="py-2 px-4 border-b border-gray-200">{playerStats?.player?.nickname}</td>
              <td className="py-2 px-4 border-b border-gray-200"><span className={playerStats?.player?.role ? `p-1 rounded text-white ml-2 ${getRoleBgColor(playerStats?.player?.role)}` : ''}>{playerStats?.player?.role}</span></td>
              <td className="py-2 px-4 border-b border-gray-200">{calculatePlayerRating(playerStats.kills, playerStats.assists, playerStats.deaths, ASSISTS_HALF_MULTIPLIER).toFixed(2)}</td>
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
