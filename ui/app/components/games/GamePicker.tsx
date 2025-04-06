import React from 'react'
import { sortByDate } from '@/common/UIUtils'
import { GameApiModel } from '@/api/generated'

interface GamePickerProps {
  games: GameApiModel[]
  selectedGameId: number
  onClick: (_id: number) => void
  matchWinnerId: number | null
}

const GamePicker: React.FC<GamePickerProps> = ({ games, selectedGameId, onClick, matchWinnerId }) => {
  if (!games || games.length === 0) {
    return null
  }

  const sortedGames = React.useMemo(() =>
    [...games].sort((a, b) => sortByDate(new Date(a.date), new Date(b.date))),
  [games],
  )

  return (
    <div className="flex flex-wrap justify-center mb-4">
      {sortedGames.map((game, index) => (
        <button
          key={`picker-game-${game.id}`}
          onClick={() => onClick(game.id || 0)}
          className={`px-4 py-2 m-1 rounded ${selectedGameId === game.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} transition-colors`}
          disabled={matchWinnerId !== null && game.stats?.winner_id === null}
        >
          <strong>Game {index + 1}: </strong>
          {game.map}
        </button>
      ))}
    </div>
  )
}

export default GamePicker
