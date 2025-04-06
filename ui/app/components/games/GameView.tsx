"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Country } from "@/api/models/types"
import { getGame, getGameStats, playFullGame, getMatch } from "@/api/GameApi"
import { getLastDuel } from "@/api/DuelApi"
import { playFullRound } from "@/api/RoundApi"
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
  
  // Using refs for component state tracking
  const isMounted = useRef(true)
  const isFetching = useRef(false)
  
  // Fetch game data function - no caching, direct fetch
  const fetchGameData = useCallback(async () => {
    // Don't start another fetch if one is in progress
    if (isFetching.current) return
    
    isFetching.current = true
    setFetchError(null)
    
    try {
      setIsLoading(true)
      
      // Simple sequential fetching to avoid race conditions
      const gameData = await getGame(gameId, () => {})
      const gameStats = await getGameStats(gameId, () => {})
      // Only continue if component is still mounted
      if (!isMounted.current) return
      
      if (gameData && gameStats) {
        setGame(gameData)
        setGameStats(gameStats)
        // After game data is fetched, get the last duel
        try {
          const duelData = await getLastDuel(gameId, () => {})
          
          if (isMounted.current && duelData) {
            setLastDuel(duelData)
            setLastRoundPlayed(duelData?.round_state?.round || 0)
          }
        } catch (duelError) {
          console.log('Failed to fetch duel data, but game data is available. Error: ', duelError)
        }
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
        isFetching.current = false
      }
    }
  }, [gameId])

  // Effect to fetch game data when the gameId changes
  useEffect(() => {
    // Set mounted flag to true
    isMounted.current = true
    
    // Simple fetch without debounce or caching
    fetchGameData()
    
    // Cleanup function
    return (): void => {
      isMounted.current = false
    }
  }, [gameId, fetchGameData])

  // Handle playing a round
  const handlePlayRound = useCallback(() => {
    setGameBeingPlayedMessage('Round is being played...')
    playFullRound(gameId, lastRoundPlayed + 1, async () => {
      await fetchGameData()
      // Get the fresh match data from the server
      const freshMatch = await getMatch(match.id || 0, () => {})
      if (freshMatch) {
        updateMatchInfo(freshMatch)
      }
      setGameBeingPlayedMessage(null)
    })
  }, [gameId, lastRoundPlayed, fetchGameData, match.id, updateMatchInfo])

  // Handle playing a duel
  const handlePlayDuel = useCallback(() => {
    setGameBeingPlayedMessage('Duel is being played...')
    const round = lastRoundPlayed == 0 ? 1 : lastRoundPlayed
    playSingleDuel(gameId, round, async () => {
      await fetchGameData()
      // Get the fresh match data from the server
      const freshMatch = await getMatch(match.id || 0, () => {})
      if (freshMatch) {
        updateMatchInfo(freshMatch)
      }
      setGameBeingPlayedMessage(null)
    })
  }, [gameId, lastRoundPlayed, fetchGameData, match.id, updateMatchInfo])

  // Handle playing the full game
  const handlePlayFullGame = useCallback(() => {
    setGameBeingPlayedMessage('Game is being played...')
    playFullGame(gameId, async () => {
      await fetchGameData()
      // Get the fresh match data from the server
      const freshMatch = await getMatch(match.id || 0, () => {})
      if (freshMatch) {
        updateMatchInfo(freshMatch)
      }
      setGameBeingPlayedMessage(null)
    })
  }, [gameId, fetchGameData, match.id, updateMatchInfo])

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    if (!isFetching.current) {
      fetchGameData()
    }
  }, [fetchGameData])

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
            disabled={isFetching.current}
          >
            {isFetching.current ? 'Refreshing...' : 'Try Again'}
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
            disabled={isFetching.current}
          >
            {isFetching.current ? 'Refreshing...' : 'Try Again'}
          </button>
        </div>
      </div>
    )
  }

  // Determine if buttons should be disabled
  const buttonsDisabled = gameStats?.winner_id !== null || match?.winner_id !== null || isFetching.current || !!gameBeingPlayedMessage

  // Determine the last round from the game data
  const lastRound = lastDuel?.round_state?.round || 1


  return (
    <div className="py-4">
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
          disabled={isFetching.current}
        >
          {isFetching.current ? 'Refreshing...' : 'Refresh'}
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
          key={`game-logs-${gameId}-${lastRound}`}
          gameId={gameId}
          initialRound={lastRound}
          maxRoundNumber={lastRound}
        />
      </div>
    </div>
  )
}
