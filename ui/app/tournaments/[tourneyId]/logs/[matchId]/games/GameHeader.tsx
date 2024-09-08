import React from 'react'
import Image from 'next/image'
import { getWinOrLossColor } from '../../../../../api/models/Team'
import { Country } from '../../../../../api/models/Country'
import { Game } from '../../../../../api/models/Tournament'

interface GameHeaderProps {
  game: Game
  team1Country: Country | undefined
  team2Country: Country | undefined
}

const GameHeader: React.FC<GameHeaderProps> = ({ game: currentGame, team1Country, team2Country }) => {
  return (
    <div className="flex items-center justify-between bg-blue-200 p-2 rounded mb-4">
      <div key="team1HeaderGame" className="flex items-center">
        <span className={`text-4xl font-bold text-center mr-7 px-2 py-2 ${getWinOrLossColor(currentGame.stats.team1, currentGame.stats)}`}>
          {currentGame.stats.team1_score}
        </span>
        {team1Country && (<Image src={team1Country.flag} alt={team1Country.name} width={60} height={60} className="inline-block mx-2" />)}
        <Image
          src={currentGame.stats.team1.logo_image_file ? URL.createObjectURL(currentGame.stats.team1.logo_image_file) : "/images/nologo.svg"}
          alt={currentGame.stats.team1.short_name}
          width={72}
          height={72}
          className="inline-block mr-2"
        />
        <span className="text-4xl font-bold text-center text-white">{currentGame.stats.team1.short_name}</span>
      </div>
      <span className="text-4xl font-bold text-center text-white mx-4">X</span>
      <div key="team2HeaderGame" className="flex items-center">
        <span className="text-4xl font-bold text-center text-white">{currentGame.stats.team2.short_name}</span>
        <Image
          src={currentGame.stats.team2.logo_image_file ? URL.createObjectURL(currentGame.stats.team2.logo_image_file) : "/images/nologo.svg"}
          alt={currentGame.stats.team2.short_name}
          width={72}
          height={72}
          className="inline-block ml-2"
        />
        {team2Country && (<Image src={team2Country.flag} alt={team2Country.name} width={60} height={60} className="inline-block mx-2" />)}
        <span className={`text-4xl font-bold text-center ml-7 px-2 py-2 ${getWinOrLossColor(currentGame.stats.team2, currentGame.stats)}`}>
          {currentGame.stats.team2_score}
        </span>
      </div>
    </div>
  )
}

export default GameHeader
