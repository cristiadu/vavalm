import React, { useMemo } from 'react'
import { getWinOrLossColor, urlObjectLogoOrDefault } from '@/api/models/helpers'
import { Country } from '@/api/models/types'
import ImageAutoSize from '@/components/common/ImageAutoSize'
import { GameStatsApiModel, TeamApiModel } from '@/api/generated'

interface GameHeaderProps {
  stats: GameStatsApiModel
  team1Country: Country | undefined
  team2Country: Country | undefined
}

const GameHeader: React.FC<GameHeaderProps> = ({ stats, team1Country, team2Country }) => {
  const team1LogoUrl = useMemo(() => {
    return urlObjectLogoOrDefault(stats?.team1 as TeamApiModel)
  }, [stats?.team1?.logo_image_file])

  const team2LogoUrl = useMemo(() => {
    return urlObjectLogoOrDefault(stats?.team2 as TeamApiModel)
  }, [stats?.team2?.logo_image_file])

  return (
    <div className="flex items-center justify-between bg-blue-200 p-2 rounded mb-4">
      <div key="team1HeaderGame" className="flex items-center">
        <span className={`text-4xl font-bold text-center mr-7 px-2 py-2 ${stats?.team1 && getWinOrLossColor(stats?.team1, stats)}`}>
          {stats?.team1_score}
        </span>
        {team1Country && (<ImageAutoSize src={team1Country.flag} alt={team1Country.name} width={64} height={32} className="inline-block mx-2" />)}
        <ImageAutoSize
          src={team1LogoUrl}
          alt={stats?.team1?.short_name || ''}
          width={80}
          height={80}
          className="inline-block mr-2"
        />
        <span className="text-4xl font-bold text-center text-white">{stats?.team1?.short_name}</span>
      </div>
      <span className="text-4xl font-bold text-center text-white mx-4">X</span>
      <div key="team2HeaderGame" className="flex items-center">
        <span className="text-4xl font-bold text-center text-white">{stats?.team2?.short_name}</span>
        <ImageAutoSize
          src={team2LogoUrl}
          alt={stats?.team2?.short_name || ''}
          width={80}
          height={80}
          className="inline-block ml-2"
        />
        {team2Country && (<ImageAutoSize src={team2Country.flag} alt={team2Country.name} width={64} height={32} className="inline-block mx-2" />)}
        <span className={`text-4xl font-bold text-center ml-7 px-2 py-2 ${stats?.team2 && getWinOrLossColor(stats?.team2, stats)}`}>
          {stats?.team2_score}
        </span>
      </div>
    </div>
  )
}

export default GameHeader
