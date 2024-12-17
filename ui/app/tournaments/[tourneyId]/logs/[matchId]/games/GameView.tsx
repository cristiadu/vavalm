import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Game, Match } from '../../../../../api/models/Tournament'
import { Country } from '../../../../../api/models/Country'
import { playFullGame, getGame } from '../../../../../api/GameApi'
import { playFullRound } from '../../../../../api/RoundApi'
import { getLastDuel, playSingleDuel } from '../../../../../api/DuelApi'
import AlertMessage, { AlertType } from '../../../../../base/AlertMessage'
import GameHeader from './GameHeader'
import GameDetails from './GameDetails'
import GameTeamStats from './GameTeamStats'
import GameLogsTable from './GameLogsTable'

interface GameViewProps {
  team1Country: Country | undefined
  team2Country: Country | undefined
  match: Match
  countries: Country[]
  gameId: number
  updateMatchInfo: (newMatchData: Match) => void
}

const GameView: React.FC<GameViewProps> = ({
  gameId,
  team1Country,
  team2Country,
  match,
  countries,
  updateMatchInfo,
}) => {
  const [lastRoundPlayed, setLastRoundPlayed] = useState<number>(0)
  const [gameBeingPlayedMessage, setGameBeingPlayedMessage] = useState<string | null>(null)
  const [game, setGame] = useState<Game | null>(null)

  const fetchGameData = useCallback(async (gameId: number) => {
    if (gameId === 0) return

    try {
      const gameData = await getGame(gameId, () => {})
      const lastDuelData = await getLastDuel(gameId, () => {})

      if(!gameData) {
        console.error('Game data not found')
        return
      }

      setGame(gameData)
      setLastRoundPlayed(lastDuelData?.round_state?.round || 0)
    } catch (error) {
      console.error('Error fetching game data:', error)
    }
  }, [])

  useEffect(() => {
    fetchGameData(gameId)
  }, [gameId, fetchGameData])

  const handlePlayRound = () => {
    setGameBeingPlayedMessage('Round is being played...')
    playFullRound(gameId, lastRoundPlayed + 1, (roundState) => {
      console.debug('Full Round Execution, Round State:', roundState)
      fetchGameData(gameId)
      setGameBeingPlayedMessage(null)
      updateMatchInfo({ ...match, games: match.games.map(g => g.id === gameId ? { ...g, stats: { ...g.stats, ...roundState } } : g) })
    })
  }

  const handlePlayDuel = () => {
    setGameBeingPlayedMessage('Duel is being played...')
    const round = lastRoundPlayed == 0 ? 1 : lastRoundPlayed
    playSingleDuel(gameId, round, (roundState) => {
      console.debug('Single Duel Execution, Round State:', roundState)
      fetchGameData(gameId)
      setGameBeingPlayedMessage(null)
      updateMatchInfo({ ...match, games: match.games.map(g => g.id === gameId ? { ...g, stats: { ...g.stats, ...roundState } } : g) })
    })
  }

  const handlePlayFullGame = () => {
    setGameBeingPlayedMessage('Game is being played...')
    playFullGame(gameId, (message) => {
      console.debug('Full Game Execution, Message:', message)
      fetchGameData(gameId)
      setGameBeingPlayedMessage(null)
      updateMatchInfo({ ...match, games: match.games.map(g => g.id === gameId ? { ...g, stats: { ...g.stats, message } } : g) })
    })
  }

  const tournament = useMemo(() => match?.tournament, [match])
  const tournamentCountry = useMemo(() => countries.find(c => c.name === tournament?.country), [countries, tournament])

  if (!game) {
    return <div>Loading...</div>
  }

  return (
    <div className="mx-4">
      <GameHeader game={game} team1Country={team1Country} team2Country={team2Country} />
      <AlertMessage message={gameBeingPlayedMessage} type={AlertType.INFO} />
      {tournament && tournamentCountry && (
        <GameDetails game={game} tournament={tournament} tournamentCountry={tournamentCountry} />
      )}
      <div className="flex justify-center mt-8">
        <button
          onClick={handlePlayRound}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 mx-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
          disabled={game?.stats.winner_id !== null || match.winner_id !== null}
        >
          Play Round
        </button>
        <button
          onClick={handlePlayDuel}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 mx-2 disabled:bg-green-300 disabled:cursor-not-allowed"
          disabled={game?.stats.winner_id !== null || match.winner_id !== null}
        >
          Play Duel
        </button>
        <button
          onClick={handlePlayFullGame}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 mx-2 disabled:bg-red-300 disabled:cursor-not-allowed"
          disabled={game?.stats.winner_id !== null || match.winner_id !== null}
        >
          Play Full Game
        </button>
      </div>
      <div className="mt-4">
        <h3 className="text-xl font-bold mb-2">Stats</h3>
        <hr className="mb-2" />
        <GameTeamStats
          teamName={game.stats.team1.short_name}
          playerStats={game.stats.players_stats_team1}
          countries={countries}
        />
        <GameTeamStats
          teamName={game.stats.team2.short_name}
          playerStats={game.stats.players_stats_team2}
          countries={countries}
        />
      </div>
      {lastRoundPlayed != 0 && (
        <GameLogsTable
          gameId={gameId}
          initialRound={lastRoundPlayed}
          maxRoundNumber={lastRoundPlayed}
        />
      )}
    </div>
  )
}

export default GameView
