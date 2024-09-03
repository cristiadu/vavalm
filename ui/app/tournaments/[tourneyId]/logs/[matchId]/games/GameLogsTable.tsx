import React, { useState, useEffect, useCallback } from 'react'
import { getRound } from '../../../../../api/RoundApi'
import { GameLog, orderLogsByRoundAndId, randomValorantWeapon } from '../../../../../api/models/Tournament'

type GameLogsTableProps = {
  gameId: number
  initialRound: number
  maxRoundNumber: number
  refresh: number
}

const GameLogsTable = ({ gameId, initialRound, maxRoundNumber, refresh }: GameLogsTableProps) => {
  const [currentRound, setCurrentRound] = useState(initialRound)
  const [maxRound, setMaxRound] = useState(maxRoundNumber)
  const [logs, setLogs] = useState<GameLog[]>([])

  const fetchLogs = useCallback(async () => {
    const fetchedLogs = await getRound(gameId, currentRound, (roundLogs) => console.debug('Round logs:', roundLogs))
    setLogs(fetchedLogs || [])
  }, [gameId, currentRound])
  
  useEffect(() => {
    fetchLogs()
  }, [fetchLogs, gameId])

  useEffect(() => {
    setCurrentRound(initialRound)
  }, [initialRound])

  useEffect(() => {
    setMaxRound(maxRoundNumber)
  }, [maxRoundNumber])

  useEffect(() => {
    if (currentRound === initialRound) {
      fetchLogs()
    }
  }, [currentRound, fetchLogs, initialRound, refresh])

  const handlePreviousRound = () => {
    setCurrentRound((prevRound) => Math.max(prevRound - 1, 1))
  }

  const handleNextRound = () => {
    setCurrentRound((prevRound) => prevRound + 1)
  }

  return (
    <div className="text-lg mb-4">
      <h3 className="text-xl font-bold my-2">Logs</h3>
      <hr className="mb-2" />
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePreviousRound}
          disabled={currentRound === 1}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-500 disabled:bg-gray-100"
        >
          Previous
        </button>
        <span className="text-lg font-semibold">Round {currentRound}</span>
        <button
          onClick={handleNextRound}
          disabled={currentRound === maxRound}
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
          {logs.sort(orderLogsByRoundAndId).map((log, index) => (
            <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-2 px-4">{log.round_state.round}</td>
              <td className="py-2 px-4">
                {log.player_killed.id === log.team1_player.id ? (
                  <>
                    <span className="font-semibold text-red-500">{log.team2_player.nickname}</span> <em>{log.trade ? 'traded' : 'killed'}</em> <span className="font-semibold text-blue-500">{log.team1_player.nickname}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-blue-500">{log.team1_player.nickname}</span> <em>{log.trade ? 'traded' : 'killed'}</em> <span className="font-semibold text-red-500">{log.team2_player.nickname}</span>
                  </>
                )}
                &nbsp;with a {randomValorantWeapon()}
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
