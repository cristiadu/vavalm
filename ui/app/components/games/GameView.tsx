"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Country } from "@/api/models/types"
import { getGame, getGameStats, playFullGame, getMatch } from "@/api/GameApi"
import { getLastDuel } from "@/api/DuelApi"
import { playFullRound, clearRoundCacheForGame } from "@/api/RoundApi"
import { playSingleDuel } from "@/api/DuelApi"
import GameHeader from "@/components/games/GameHeader"
import GameLogsTable from "@/components/games/GameLogsTable"
import GameTeamStats from "@/components/games/GameTeamStats"
import { GameApiModel, GameLogApiModel, GameStatsApiModel, MatchApiModel } from "@/api/generated"

type GameViewProps = {
  gameId: number
  team1Country?: Country
  team2Country?: Country
  match: MatchApiModel
  countries: Country[]
  updateMatchInfo: (_match: MatchApiModel) => void
  refreshMatchData: () => Promise<void>
}

export enum AlertType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

export default function GameView(props: GameViewProps): React.ReactNode {
  const { gameId, team1Country, team2Country, match, countries, updateMatchInfo } = props
  const [game, setGame] = useState<GameApiModel | null>(null)
  const [gameStats, setGameStats] = useState<GameStatsApiModel | null>(null)
  const [lastDuel, setLastDuel] = useState<GameLogApiModel | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [gameBeingPlayedMessage, setGameBeingPlayedMessage] = useState<string | null>(null)
  const [lastRoundPlayed, setLastRoundPlayed] = useState<number>(0)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [dataVersion, setDataVersion] = useState<number>(0)

  // Track if component is still mounted to avoid state updates after unmount
  const isMounted = useRef(true)

  /** Fetch game data, stats, and last duel in parallel */
  const fetchGameData = useCallback(async () => {
    setIsFetching(true)
    setFetchError(null)
    setIsLoading(true)

    try {
      const [gameData, statsData, duelData] = await Promise.all([
        getGame(gameId),
        getGameStats(gameId),
        getLastDuel(gameId),
      ])

      if (!isMounted.current) return

      if (gameData && statsData) {
        setGame(gameData)
        setGameStats(statsData)
        setLastDuel(duelData)
        setLastRoundPlayed(duelData?.round_state?.round || 0)
      } else {
        setFetchError('Failed to load game data or game stats')
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('Error fetching game data:', error)
        setFetchError('Failed to load game data. Please try refreshing.')
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
        setIsFetching(false)
      }
    }
  }, [gameId])

  // Effect to fetch game data when the gameId changes
  useEffect(() => {
    isMounted.current = true
    fetchGameData()
    return (): void => {
      isMounted.current = false
    }
  }, [gameId, fetchGameData])

  /** Shared post-play logic: clear round cache, refetch game data, update match */
  const afterPlayAction = useCallback(async () => {
    try {
      clearRoundCacheForGame(gameId)
      await fetchGameData()
    } catch (error) {
      console.error('Error refreshing game data after play action:', error)
    }

    // Always bump data version so GameLogsTable remounts with fresh data
    setDataVersion(prev => prev + 1)

    // Refresh match data separately — don't let a failure here block the rest
    try {
      const freshMatch = await getMatch(match.id || 0)
      if (freshMatch) {
        updateMatchInfo(freshMatch)
      }
    } catch (error) {
      console.error('Error refreshing match data after play action:', error)
    }

    setGameBeingPlayedMessage(null)
  }, [gameId, fetchGameData, match.id, updateMatchInfo])

  /** Handle playing a round */
  const handlePlayRound = useCallback(async () => {
    setGameBeingPlayedMessage('Round is being played...')
    try {
      await playFullRound(gameId, lastRoundPlayed + 1)
      await afterPlayAction()
    } catch (error) {
      console.error('Error playing round:', error)
      setGameBeingPlayedMessage(null)
    }
  }, [gameId, lastRoundPlayed, afterPlayAction])

  /** Handle playing a duel */
  const handlePlayDuel = useCallback(async () => {
    setGameBeingPlayedMessage('Duel is being played...')
    try {
      const round = lastRoundPlayed === 0 ? 1 : lastRoundPlayed
      await playSingleDuel(gameId, round)
      await afterPlayAction()
    } catch (error) {
      console.error('Error playing duel:', error)
      setGameBeingPlayedMessage(null)
    }
  }, [gameId, lastRoundPlayed, afterPlayAction])

  /** Handle playing the full game */
  const handlePlayFullGame = useCallback(async () => {
    setGameBeingPlayedMessage('Game is being played...')
    try {
      await playFullGame(gameId)
      await afterPlayAction()
    } catch (error) {
      console.error('Error playing full game:', error)
      setGameBeingPlayedMessage(null)
    }
  }, [gameId, afterPlayAction])

  /** Handle manual refresh */
  const handleRefresh = useCallback(() => {
    if (!isFetching) {
      clearRoundCacheForGame(gameId)
      fetchGameData()
    }
  }, [gameId, fetchGameData, isFetching])

  if (isLoading && !game) {
    return (
      <div className="py-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-xl">Loading game data...</span>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="py-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {fetchError}</span>
          <button 
            onClick={handleRefresh}
            className="mt-3 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing...' : 'Try Again'}
          </button>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="py-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          <strong className="font-bold">No data!</strong>
          <span className="block sm:inline"> Failed to load game data.</span>
          <button 
            onClick={handleRefresh}
            className="mt-3 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing...' : 'Try Again'}
          </button>
        </div>
      </div>
    )
  }

  const buttonsDisabled = !!gameStats?.winner_id || !!match?.winner_id || isFetching || !!gameBeingPlayedMessage

  const lastRound = lastDuel?.round_state?.round || 1

  return (
    <div className="py-4 relative">
      {isLoading && game && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      <GameHeader
        stats={gameStats as GameStatsApiModel}
        team1Country={team1Country}
        team2Country={team2Country}
      />

      {gameBeingPlayedMessage && (
        <div className="my-4 p-3 bg-blue-100 text-blue-700 rounded">
          {gameBeingPlayedMessage}
        </div>
      )}
      
      <div className="flex justify-center mt-4 mb-6">
        <button
          onClick={handlePlayRound}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 mx-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          disabled={buttonsDisabled}
        >
          Play Round
        </button>
        <button
          onClick={handlePlayDuel}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 mx-2 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
          disabled={buttonsDisabled}
        >
          Play Duel
        </button>
        <button
          onClick={handlePlayFullGame}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 mx-2 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
          disabled={buttonsDisabled}
        >
          Play Full Game
        </button>
        <button
          onClick={handleRefresh}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 mx-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          disabled={isFetching}
        >
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="mt-4">
        <h3 className="text-xl font-bold mb-2">Stats</h3>
        <hr className="mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GameTeamStats
            teamName={gameStats?.team1?.short_name || ''}
            playerStats={gameStats?.players_stats_team1 || []}
            countries={countries}
          />
          <GameTeamStats
            teamName={gameStats?.team2?.short_name || ''}
            playerStats={gameStats?.players_stats_team2 || []}
            countries={countries}
          />
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Game Logs</h3>
        <GameLogsTable
          key={`game-logs-${gameId}-${lastRound}-${dataVersion}`}
          gameId={gameId}
          initialRound={lastRound}
          maxRoundNumber={lastRound}
        />
      </div>
    </div>
  )
}
