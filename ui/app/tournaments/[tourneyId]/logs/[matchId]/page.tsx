"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ASSISTS_HALF_MULTIPLIER, Game, GameLog, Match, sortPlayersByStats, Tournament } from "../../../../api/models/Tournament"
import Image from 'next/image'
import { getWinOrLossColor } from "../../../../api/models/Team"
import { fetchCountries } from "../../../../api/CountryApi"
import { Country } from "../../../../api/models/Country"
import { playFullGame, getMatch, getGame } from "../../../../api/GameApi"
import { getRoleBgColor } from "../../../../api/models/Player"
import { playFullRound } from "../../../../api/RoundApi"
import { getLastDuel, playSingleDuel } from "../../../../api/DuelApi"
import GameLogsTable from "./games/GameLogsTable"
import React from "react"
import AlertMessage, { AlertType } from "../../../../base/AlertMessage"
import GamePicker from "./games/GamePicker"
import GameDetails from "./games/GameDetails"
import SectionHeader from "../../../../base/SectionHeader"
import { sortByDate } from "../../../../base/UIUtils"

interface ViewGameLogsProps {
  tourneyId: string
  matchId: string
}

export default function ViewGameLogs({ params }: { params: ViewGameLogsProps }) {
  const matchId = Number(params.matchId)
  const [match, setMatch] = useState<Match | null>(null)
  const [currentGame, setCurrentGame] = useState<Game | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [lastRoundPlayed, setLastRoundPlayed] = useState<number>(0)
  const [selectedGameId, setSelectedGameId] = useState<number>(0)
  const [refreshNumber, setRefreshNumber] = useState<number>(0)
  const [gameBeingPlayedMessage, setGameBeingPlayedMessage] = useState<string | null>(null)

  const fetchGameData = useCallback(async () => {
    if (selectedGameId === 0) return

    await getGame(selectedGameId, (data: Game) => {
      setCurrentGame(data)
    })

    await getLastDuel(selectedGameId, (data: GameLog) => {
      setLastRoundPlayed(data?.round_state?.round || 0)
    })
  }, [selectedGameId])

  useEffect(() => {
    const fetchInitialData = async () => {
      fetchCountries((countryData) => {
        setCountries(countryData)
      })

      await getMatch(matchId, (data: Match) => {
        setMatch(data)
        setSelectedGameId(data.games.sort(sortByDate)[0].id)
      })
    }

    fetchInitialData()
  }, [matchId])

  useEffect(() => {
    fetchGameData()
  }, [selectedGameId, fetchGameData])

  const handlePlayRound = () => {
    setGameBeingPlayedMessage('Round is being played...')
    playFullRound(selectedGameId, lastRoundPlayed + 1, (roundState) => {
      console.debug('Full Round Execution, Round State:', roundState)
      fetchGameData()
      setRefreshNumber(refreshNumber + 1)
      setGameBeingPlayedMessage(null)
    })
  }

  const handlePlayDuel = () => {
    setGameBeingPlayedMessage('Duel is being played...')
    const round = lastRoundPlayed == 0 ? 1 : lastRoundPlayed
    playSingleDuel(selectedGameId, round, (roundState) => {
      console.debug('Single Duel Execution, Round State:', roundState)
      fetchGameData()
      setRefreshNumber(refreshNumber + 1)
      setGameBeingPlayedMessage(null)
    })
  }

  const handlePlayFullGame = () => {
    setGameBeingPlayedMessage('Map is being played...')
    playFullGame(selectedGameId, (message) => {
      console.debug('Full Game Execution, Message:', message)
      fetchGameData()
      setRefreshNumber(refreshNumber + 1)
      setGameBeingPlayedMessage(null)
    })
  }

  const handleGameSelection = (gameId: number) => {
    setSelectedGameId(gameId)
    setRefreshNumber(refreshNumber + 1)
    setGameBeingPlayedMessage(null)
  }

  const tournament = useMemo(() => match?.tournament, [match])
  const tournamentCountry = useMemo(() => countries.find(c => c.name === tournament?.country), [countries, tournament])
  const team1Country = useMemo(() => countries.find(c => c.name === match?.team1.country), [countries, match])
  const team2Country = useMemo(() => countries.find(c => c.name === match?.team2.country), [countries, match])

  if (!currentGame || !match) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <SectionHeader title="Match Logs" />
      <div className="max-w-6 bg-white p-8 rounded shadow">
        <div className="flex items-center justify-between bg-blue-400 p-4 rounded mb-4">
          <div key="team1Header" className="flex items-center">
            <span className={`text-4xl font-bold text-center mr-7 px-2 py-2 ${getWinOrLossColor(match.team1, match)}`}>
              {match.team1_score}
            </span>
            {team1Country && (<Image src={team1Country.flag} alt={team1Country.name} width={60} height={60} className="inline-block mx-2" />)}
            <Image
              src={match.team1.logo_image_file ? URL.createObjectURL(match.team1.logo_image_file) : "/images/nologo.svg"}
              alt={match.team1.short_name}
              width={72}
              height={72}
              className="inline-block mr-2"
            />
            <span className="text-4xl font-bold text-center text-white">{match.team1.short_name}</span>
          </div>
          <span className="text-4xl font-bold text-center text-white mx-4">X</span>
          <div key="team2Header" className="flex items-center">
            <span className="text-4xl font-bold text-center text-white">{match.team2.short_name}</span>
            <Image
              src={match.team2.logo_image_file ? URL.createObjectURL(match.team2.logo_image_file) : "/images/nologo.svg"}
              alt={match.team2.short_name}
              width={72}
              height={72}
              className="inline-block ml-2"
            />
            {team2Country && (<Image src={team2Country.flag} alt={team2Country.name} width={60} height={60} className="inline-block mx-2" />)}
            <span className={`text-4xl font-bold text-center ml-7 px-2 py-2 ${getWinOrLossColor(match.team2, match)}`}>
              {match.team2_score}
            </span>
          </div>
        </div>
        <GamePicker games={match.games} selectedGameId={selectedGameId} onClick={handleGameSelection} />
        <div className="mx-4">
          <div className="flex items-center justify-between bg-blue-200 p-2 rounded mb-4">
            <div key="team1HeaderGame" className="flex items-center">
              <span className={`text-4xl font-bold text-center mr-7 px-2 py-2 ${getWinOrLossColor(currentGame.stats.team1, currentGame.stats)}`}>
                {currentGame.stats.team1_score}
              </span>
              {team1Country && (<Image src={team1Country.flag} alt={team1Country.name} width={60} height={60} className="inline-block mx-2" />)}
              <Image
                src={currentGame.stats.team1.logo_image_file ? URL.createObjectURL(currentGame.stats.team1.logo_image_file) : "/images/nologo.svg"}
                alt={currentGame.stats.team1.short_name}
                width={72}
                height={72}
                className="inline-block mr-2"
              />
              <span className="text-4xl font-bold text-center text-white">{currentGame.stats.team1.short_name}</span>
            </div>
            <span className="text-4xl font-bold text-center text-white mx-4">X</span>
            <div key="team2HeaderGame" className="flex items-center">
              <span className="text-4xl font-bold text-center text-white">{currentGame.stats.team2.short_name}</span>
              <Image
                src={currentGame.stats.team2.logo_image_file ? URL.createObjectURL(currentGame.stats.team2.logo_image_file) : "/images/nologo.svg"}
                alt={currentGame.stats.team2.short_name}
                width={72}
                height={72}
                className="inline-block ml-2"
              />
              {team2Country && (<Image src={team2Country.flag} alt={team2Country.name} width={60} height={60} className="inline-block mx-2" />)}
              <span className={`text-4xl font-bold text-center ml-7 px-2 py-2 ${getWinOrLossColor(currentGame.stats.team2, currentGame.stats)}`}>
                {currentGame.stats.team2_score}
              </span>
            </div>
          </div>
          <AlertMessage message={gameBeingPlayedMessage} type={AlertType.INFO} />
          {tournament && tournamentCountry && <GameDetails game={currentGame} tournament={tournament} tournamentCountry={tournamentCountry} />}
          <div className="flex justify-center mt-8">
            <button onClick={handlePlayRound} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 mx-2 disabled:bg-blue-300 disabled:cursor-not-allowed" disabled={currentGame?.stats.winner_id !== null || match.winner_id !== null}>Play Round</button>
            <button onClick={handlePlayDuel} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 mx-2 disabled:bg-green-300 disabled:cursor-not-allowed" disabled={currentGame?.stats.winner_id !== null || match.winner_id !== null}>Play Duel</button>
            <button onClick={handlePlayFullGame} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 mx-2 disabled:bg-red-300 disabled:cursor-not-allowed" disabled={currentGame?.stats.winner_id !== null || match.winner_id !== null}>Play Full Game</button>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold mb-2">Stats</h3>
            <hr className="mb-2" />
            <div className="overflow-x-auto mt-4">
              <h2 className="text-xl font-bold mb-4">{match.team1.short_name}</h2>
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 pl-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Country</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Player</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Role</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Rating</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Kills</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Deaths</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Assists</th>
                  </tr>
                </thead>
                <tbody>
                  {currentGame.stats.players_stats_team1.sort(sortPlayersByStats).map((playerStats, index) => (
                    <tr key={index}>
                      <td className="py-2 pl-4 border-b border-gray-200">
                        {playerStats.player.country && (() => {
                          const country = countries.find(c => c.name === playerStats.player.country)
                          return country ? (
                            <Image
                              src={country.flag}
                              alt={playerStats.player.country}
                              width={30}
                              height={30}
                              className="inline-block mr-2"
                            />
                          ) : null
                        })()}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200">{playerStats.player.nickname}</td>
                      <td className="py-2 px-4 border-b border-gray-200"><span className={getRoleBgColor(playerStats.player.role)}>{playerStats.player.role}</span></td>
                      <td className="py-2 px-4 border-b border-gray-200">{((playerStats.kills + playerStats.assists * ASSISTS_HALF_MULTIPLIER) / playerStats.deaths).toFixed(2)}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{playerStats.kills}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{playerStats.deaths}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{playerStats.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto mt-4">
              <h2 className="text-xl font-bold mb-4">{currentGame.stats.team2.short_name}</h2>
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 pl-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Country</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Player</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Role</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Rating</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Kills</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Deaths</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Assists</th>
                  </tr>
                </thead>
                <tbody>
                  {currentGame.stats.players_stats_team2.sort(sortPlayersByStats).map((playerStats, index) => (
                    <tr key={index}>
                      <td className="py-2 pl-4 border-b border-gray-200">
                        {playerStats.player.country && (() => {
                          const country = countries.find(c => c.name === playerStats.player.country)
                          return country ? (
                            <Image
                              src={country.flag}
                              alt={playerStats.player.country}
                              width={30}
                              height={30}
                            />
                          ) : null
                        })()}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200">{playerStats.player.nickname}</td>
                      <td className="py-2 px-4 border-b border-gray-200"><span className={getRoleBgColor(playerStats.player.role)}>{playerStats.player.role}</span></td>
                      <td className="py-2 px-4 border-b border-gray-200">{((playerStats.kills + playerStats.assists * ASSISTS_HALF_MULTIPLIER) / playerStats.deaths).toFixed(2)}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{playerStats.kills}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{playerStats.deaths}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{playerStats.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {lastRoundPlayed != 0 && (<GameLogsTable gameId={selectedGameId} initialRound={lastRoundPlayed} maxRoundNumber={lastRoundPlayed} refresh={refreshNumber}/> )}
        </div>
      </div>
    </div>
  )
}
