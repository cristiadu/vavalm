import React from 'react'
import { Game } from '../../../../../api/models/Tournament'

interface GamePickerProps {
  games: Game[]
  selectedGameId: number
  onClick: (id: number) => void
}

const GameSelector: React.FC<GamePickerProps> = ({ games, selectedGameId, onClick }) => {
  return (
    <div className="flex justify-center mb-4">
      {games.sort((g1, g2) => g1.id - g2.id).map((game) => (
        <button
          key={game.id}
          onClick={() => onClick(game.id)}
          className={`px-4 py-2 mx-2 rounded ${selectedGameId === game.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          {game.map}
        </button>
      ))}
    </div>
  )
}

export default GameSelector
