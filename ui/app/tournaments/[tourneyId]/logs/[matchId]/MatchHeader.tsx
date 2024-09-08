import React, { useMemo } from 'react'
import Image from 'next/image'
import { Match } from '../../../../api/models/Tournament'
import { Country } from '../../../../api/models/Country'
import { getWinOrLossColor } from '../../../../api/models/Team'

interface MatchHeaderProps {
  match: Match;
  team1Country: Country | undefined;
  team2Country: Country | undefined;
}

const MatchHeader: React.FC<MatchHeaderProps> = ({ match, team1Country, team2Country }) => {
  const team1LogoUrl = useMemo(() => {
    return match.team1.logo_image_file
      ? URL.createObjectURL(match.team1.logo_image_file)
      : "/images/nologo.svg"
  }, [match.team1.logo_image_file])

  const team2LogoUrl = useMemo(() => {
    return match.team2.logo_image_file
      ? URL.createObjectURL(match.team2.logo_image_file)
      : "/images/nologo.svg"
  }, [match.team2.logo_image_file])

  return (
    <div className="flex items-center justify-between bg-blue-400 p-4 rounded mb-4">
      <div key="team1Header" className="flex items-center">
        <span className={`text-4xl font-bold text-center mr-7 px-2 py-2 ${getWinOrLossColor(match.team1, match)}`}>
          {match.team1_score}
        </span>
        {team1Country && (
          <Image src={team1Country.flag} alt={team1Country.name} width={60} height={60} className="inline-block mx-2" />
        )}
        <Image
          src={team1LogoUrl}
          alt={match.team1.short_name}
          width={72}
          height={72}
          className="inline-block mr-2"
        />
        <span className="text-4xl font-bold text-center text-white">{match.team1.short_name}</span>
      </div>
      <span className="text-4xl font-bold text-center text-white mx-4">X</span>
      <div key="team2Header" className="flex items-center">
        <span className="text-4xl font-bold text-center text-white">{match.team2.short_name}</span>
        <Image
          src={team2LogoUrl}
          alt={match.team2.short_name}
          width={72}
          height={72}
          className="inline-block ml-2"
        />
        {team2Country && (
          <Image src={team2Country.flag} alt={team2Country.name} width={60} height={60} className="inline-block mx-2" />
        )}
        <span className={`text-4xl font-bold text-center ml-7 px-2 py-2 ${getWinOrLossColor(match.team2, match)}`}>
          {match.team2_score}
        </span>
      </div>
    </div>
  )
}

export default MatchHeader