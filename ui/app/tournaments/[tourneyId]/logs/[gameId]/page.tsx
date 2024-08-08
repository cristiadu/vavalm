"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Game, Tournament } from "../../../../api/models/Tournament"
import TournamentsApi from "../../../../api/TournamentsApi"
import { handleBackClick } from '../../../../base/LinkUtils'
import Image from 'next/image'

interface ViewGameLogsProps {
  tourneyId: string
  gameId: string
}

export default function ViewGameLogs({ params }: { params: ViewGameLogsProps}) {
  const [game, setGame] = useState<Game | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchGameData = async () => {
      await TournamentsApi.fetchTournament(Number(params.tourneyId), (data: Tournament) => {
        const game = data.schedule?.find((game) => game.id === Number(params.gameId)) || null
        setGame(game)
      })
    }

    fetchGameData()
  }, [params.gameId, params.tourneyId])

  if (!game) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <header className="w-full flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Game Logs</h1>
        <Link href="#" onClick={(e) => handleBackClick(e, router)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
          Back
        </Link>
      </header>
      <div className="w-full max-w-3xl bg-white p-8 rounded shadow">
        <div className="w-full flex items-center justify-center bg-blue-300 p-4 rounded mb-4">
          <div className="flex items-center space-x-4">
            <Image 
              src={game.stats.team1.logo_image_file ? URL.createObjectURL(game.stats.team1.logo_image_file) : "/images/nologo.svg"} 
              alt={game.stats.team1.short_name} 
              width={60} 
              height={60} 
              className="inline-block mr-2" 
            />
            <span className="text-3xl font-bold text-center text-white">{game.stats.team1.short_name}</span>
            <span className="text-3xl font-bold text-center text-white">X</span>
            <span className="text-3xl font-bold text-center text-white">{game.stats.team2.short_name}</span>
            <Image 
              src={game.stats.team2.logo_image_file ? URL.createObjectURL(game.stats.team2.logo_image_file) : "/images/nologo.svg"} 
              alt={game.stats.team2.short_name} 
              width={60} 
              height={60} 
              className="inline-block ml-2" 
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-lg">
            <strong>Game ID:</strong> {game.id}
          </div>
          <div className="text-lg">
            <strong>Date:</strong> {new Date(game.date).toLocaleDateString()}
          </div>
          <div className="text-lg">
            <strong>Map:</strong> {game.map}
          </div>
          <div className="text-lg">
            <strong>Tournament ID:</strong> {game.tournament_id}
          </div>
        </div>
        <div className="text-lg mb-4">
          <strong>Logs:</strong>
          <ul className="list-disc pl-5">
            {game.logs && game.logs.map((log, index) => (
              <li key={index}>{log.toString()}</li>
            ))}
          </ul>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Stats</h3>
          <hr className="mb-2" />
          <ul className="list-disc pl-5">
            <li>Team 1: {game.stats.team1.short_name}</li>
            <li>Team 2: {game.stats.team2.short_name}</li>
            <li>Team 1 Score: {game.stats.team1_score}</li>
            <li>Team 2 Score: {game.stats.team2_score}</li>
            <li>Winner: {game.stats.winner.short_name}</li>
            <li>Players Stats Team 1:
              <ul className="list-disc pl-5">
                {game.stats.players_stats_team1.map((playerStats, index) => (
                  <li key={index}>{playerStats.player.nickname} - Kills: {playerStats.kills}, Deaths: {playerStats.deaths}, Assists: {playerStats.assists}</li>
                ))}
              </ul>
            </li>
            <li>Players Stats Team 2:
              <ul className="list-disc pl-5">
                {game.stats.players_stats_team2.map((playerStats, index) => (
                  <li key={index}>{playerStats.player.nickname} - Kills: {playerStats.kills}, Deaths: {playerStats.deaths}, Assists: {playerStats.assists}</li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}