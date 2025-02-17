import React from 'react'
import { Game } from '../../../../../api/models/Tournament'
import { sortByDate } from '../../../../../base/UIUtils'

interface GamePickerProps {
  games: Game[]
  selectedGameId: number
  onClick: (id: number) => void
  matchWinnerId: number | null
}

const GamePicker: React.FC<GamePickerProps> = ({ games, selectedGameId, onClick, matchWinnerId }) => {
  return (
    <div className="flex justify-center mb-4">
      {games.sort(sortByDate).map((game, index) => (
        <button
          key={game.id}
          onClick={() => onClick(game.id)}
          className={`px-4 py-2 mx-2 rounded ${selectedGameId === game.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          disabled={matchWinnerId !== null && game.stats?.winner_id === null}
        >
          <strong>Game {index+1}: </strong>
          {game.map}
        </button>
      ))}
    </div>
  )
}

export default GamePicker
