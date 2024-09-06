import React from 'react'
import Image from 'next/image'
import { Game, Tournament } from '../../../../../api/models/Tournament'
import { Country } from '../../../../../api/models/Country'
import { asFormattedDate } from '../../../../../base/StringUtils'

interface GameDetailsProps {
    game: Game
    tournament: Tournament
    tournamentCountry: Country
}

const GameDetails: React.FC<GameDetailsProps> = ({game, tournament, tournamentCountry}) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="text-lg">
        <strong>Game ID:</strong> {game.id}
      </div>
      <div className="text-lg">
        <strong>Date:</strong> {asFormattedDate(game.date)}
      </div>
      <div className="text-lg">
        <strong>Map:</strong> {game.map}
      </div>
      <div className="text-lg">
        <strong>Tournament:</strong>
        {tournamentCountry && (<Image src={tournamentCountry.flag} alt={tournamentCountry.name} width={30} height={30} className="inline-block mx-2" />)}
        <span>{tournament?.name}</span>
      </div>
    </div>
  )
}

export default GameDetails
