import React, { useState, useEffect, useCallback, memo } from 'react'
import { getRound } from '@/api/RoundApi'
import { GameLogWithPlayers } from '@/api/models/types'

type GameLogsTableProps = {
  gameId: number
  initialRound: number
  maxRoundNumber: number
}

// Memoize individual table rows to reduce rendering
const GameLogRow = memo(({ log }: { log: GameLogWithPlayers }) => (
  <tr className="border-b border-gray-200 hover:bg-gray-100">
    <td className="py-2 px-4">{log.round_state.round}</td>
    <td className="py-2 px-4">
      {log.player_killed_id === log.team1_player_id ? (
        <>
          <span className="font-semibold text-red-500">{log.player2.nickname}</span> <em>{log.trade ? 'traded' : 'killed'}</em> <span className="font-semibold text-blue-500">{log.player1.nickname}</span>
        </>
      ) : (
        <>
          <span className="font-semibold text-blue-500">{log.player1.nickname}</span> <em>{log.trade ? 'traded' : 'killed'}</em> <span className="font-semibold text-red-500">{log.player2.nickname}</span>
        </>
      )}
      &nbsp;with a {log.weapon}
    </td>
    <td className="py-2 px-6">{log.duel_buff * 100}%</td>
    <td className="py-2 px-6">{log.trade_buff * 100}%</td>
  </tr>
))

// Add display name for debugging
GameLogRow.displayName = 'GameLogRow'

const GameLogsTable = ({ gameId, initialRound, maxRoundNumber }: GameLogsTableProps): React.ReactNode => {
  const [state, setState] = useState({
    currentRound: initialRound,
    maxRound: maxRoundNumber,
    logs: [] as GameLogWithPlayers[],
    loading: true,
    error: null as string | null,
  })

  // Simple function to fetch logs for a given round
  const fetchLogs = useCallback(async (round: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const fetchedLogs = await getRound(gameId, round, () => {})
      
      setState(prev => ({
        ...prev,
        logs: fetchedLogs || [],
        loading: false,
        currentRound: round,
      }))
    } catch (error) {
      console.error('Error fetching logs:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch logs. Please try again.',
      }))
    }
  }, [gameId])

  // Effect to initialize and update when props change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      maxRound: maxRoundNumber,
      currentRound: initialRound,
    }))
    
    fetchLogs(initialRound)
  }, [gameId, initialRound, maxRoundNumber, fetchLogs])

  const handlePreviousRound = useCallback(() => {
    if (state.currentRound > 1) {
      fetchLogs(state.currentRound - 1)
    }
  }, [state.currentRound, fetchLogs])

  const handleNextRound = useCallback(() => {
    if (state.currentRound < state.maxRound) {
      fetchLogs(state.currentRound + 1)
    }
  }, [state.currentRound, state.maxRound, fetchLogs])

  return (
    <div className="text-lg mb-4">
      <h3 className="text-xl font-bold my-2">Logs</h3>
      <hr className="mb-2" />
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePreviousRound}
          disabled={state.currentRound === 1 || state.loading}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-500 disabled:bg-gray-100 transition-colors"
        >
          Previous
        </button>
        <span className="text-lg font-semibold">
          Round {state.currentRound} of {state.maxRound}
        </span>
        <button
          onClick={handleNextRound}
          disabled={state.currentRound === state.maxRound || state.loading}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-500 disabled:bg-gray-100 transition-colors"
        >
          Next
        </button>
      </div>
      
      {state.loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading logs...</span>
        </div>
      ) : state.error ? (
        <div className="text-center text-red-500 p-4">{state.error}</div>
      ) : state.logs.length === 0 ? (
        <div className="text-center p-4">No logs available for this round</div>
      ) : (
        <div className="overflow-auto max-h-[60vh]">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-800 text-white sticky top-0">
              <tr>
                <th className="py-2 px-4 border-b border-gray-200">Round</th>
                <th className="py-2 px-4 border-b border-gray-200">Action</th>
                <th className="py-2 px-4 border-b border-gray-200">Duel Buff</th>
                <th className="py-2 px-4 border-b border-gray-200">Trade Buff</th>
              </tr>
            </thead>
            <tbody>
              {state.logs.map((log, index) => (
                <GameLogRow key={`tournament-${gameId}-round-${log.round_state.round}-${log.id || index}`} log={log} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default memo(GameLogsTable)