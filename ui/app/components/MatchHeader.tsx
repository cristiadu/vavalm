import React, { useMemo } from 'react'
import { MatchApiModel, TeamApiModel } from '@/api/generated'
import { Country } from '@/api/models/types'
import { getWinOrLossColor, teamLogoURLObjectOrDefault } from '@/api/models/helpers'
import ImageAutoSize from '@/components/common/ImageAutoSize'

interface MatchHeaderProps {
  match: MatchApiModel;
  team1Country: Country | undefined;
  team2Country: Country | undefined;
}

const MatchHeader: React.FC<MatchHeaderProps> = ({ match, team1Country, team2Country }) => {
  const team1LogoUrl = useMemo(() => {
    return teamLogoURLObjectOrDefault(match.team1 as TeamApiModel)
  }, [match.team1?.logo_image_file])

  const team2LogoUrl = useMemo(() => {
    return teamLogoURLObjectOrDefault(match.team2 as TeamApiModel)
  }, [match.team2?.logo_image_file])

  return (
    <div className="flex items-center justify-between bg-blue-400 p-4 rounded mb-4">
      <div key="team1Header" className="flex items-center">
        <span className={`text-4xl font-bold text-center mr-7 px-2 py-2 ${match.team1 && getWinOrLossColor(match.team1, match)}`}>
          {match.team1_score}
        </span>
        {team1Country && (
          <ImageAutoSize src={team1Country.flag} alt={team1Country.name} width={64} height={32} className="inline-block mx-2" />
        )}
        <ImageAutoSize
          src={team1LogoUrl}
          alt={match.team1?.short_name || ''}
          width={80}
          height={80}
          className="inline-block mr-2"
        />
        <span className="text-4xl font-bold text-center text-white">{match.team1?.short_name}</span>
      </div>
      <span className="text-4xl font-bold text-center text-white mx-4">X</span>
      <div key="team2Header" className="flex items-center">
        <span className="text-4xl font-bold text-center text-white">{match.team2?.short_name}</span>
        <ImageAutoSize
          src={team2LogoUrl}
          alt={match.team2?.short_name || ''}
          width={80}
          height={80}
          className="inline-block ml-2"
        />
        {team2Country && (
          <ImageAutoSize src={team2Country.flag} alt={team2Country.name} width={64} height={32} className="inline-block mx-2" />
        )}
        <span className={`text-4xl font-bold text-center ml-7 px-2 py-2 ${match.team2 && getWinOrLossColor(match.team2, match)}`}>
          {match.team2_score}
        </span>
      </div>
    </div>
  )
}

export default MatchHeader
