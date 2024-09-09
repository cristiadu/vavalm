import React, { useState, useEffect, useCallback } from 'react'
import { getRound } from '../../../../../api/RoundApi'
import { GameLog } from '../../../../../api/models/Tournament'

type GameLogsTableProps = {
  gameId: number
  initialRound: number
  maxRoundNumber: number
};

const GameLogsTable = ({ gameId, initialRound, maxRoundNumber }: GameLogsTableProps) => {
  const [state, setState] = useState({
    currentRound: initialRound,
    maxRound: maxRoundNumber,
    logs: [] as GameLog[],
    loading: true,
    error: null as string | null,
  })

  const fetchLogs = useCallback(async (round: number) => {
    try {
      const fetchedLogs = await getRound(gameId, round, () => {})
      setState((prevState) => ({
        ...prevState,
        logs: fetchedLogs || [],
        loading: false,
        error: null,
      }))
    } catch (error) {
      console.error('Error fetching logs:', error)
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: 'Failed to fetch logs',
      }))
    }
  }, [gameId])

  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      currentRound: initialRound,
      maxRound: maxRoundNumber,
      loading: true,
    }))
    fetchLogs(initialRound)
  }, [gameId, initialRound, maxRoundNumber, fetchLogs])

  const handlePreviousRound = () => {
    setState((prevState) => {
      const newRound = Math.max(prevState.currentRound - 1, 1)
      fetchLogs(newRound)
      return {
        ...prevState,
        currentRound: newRound,
        loading: true,
      }
    })
  }

  const handleNextRound = () => {
    setState((prevState) => {
      const newRound = Math.min(prevState.currentRound + 1, prevState.maxRound)
      fetchLogs(newRound)
      return {
        ...prevState,
        currentRound: newRound,
        loading: true,
      }
    })
  }

  if (state.loading) {
    return <div>Loading...</div>
  }

  if (state.error) {
    return <div>{state.error}</div>
  }

  return (
    <div className="text-lg mb-4">
      <h3 className="text-xl font-bold my-2">Logs</h3>
      <hr className="mb-2" />
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePreviousRound}
          disabled={state.currentRound === 1}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-500 disabled:bg-gray-100"
        >
          Previous
        </button>
        <span className="text-lg font-semibold">Round {state.currentRound}</span>
        <button
          onClick={handleNextRound}
          disabled={state.currentRound === state.maxRound}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-500 disabled:bg-gray-100"
        >
          Next
        </button>
      </div>
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="py-2 px-4 border-b border-gray-200">Round</th>
            <th className="py-2 px-4 border-b border-gray-200">Action</th>
            <th className="py-2 px-4 border-b border-gray-200">Duel Buff</th>
            <th className="py-2 px-4 border-b border-gray-200">Trade Buff</th>
          </tr>
        </thead>
        <tbody>
          {state.logs.map((log, index) => (
            <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-2 px-4">{log.round_state.round}</td>
              <td className="py-2 px-4">
                {log.player_killed_id === log.team1_player.id ? (
                  <>
                    <span className="font-semibold text-red-500">{log.team2_player.nickname}</span> <em>{log.trade ? 'traded' : 'killed'}</em> <span className="font-semibold text-blue-500">{log.team1_player.nickname}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-blue-500">{log.team1_player.nickname}</span> <em>{log.trade ? 'traded' : 'killed'}</em> <span className="font-semibold text-red-500">{log.team2_player.nickname}</span>
                  </>
                )}
                &nbsp;with a {log.weapon}
              </td>
              <td className="py-2 px-6">{log.duel_buff * 100}%</td>
              <td className="py-2 px-6">{log.trade_buff * 100}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default GameLogsTable