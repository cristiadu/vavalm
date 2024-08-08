"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Game, PlayerGameStats, Tournament } from "../../../../api/models/Tournament"
import TournamentsApi from "../../../../api/TournamentsApi"
import { handleBackClick } from '../../../../base/LinkUtils'
import Image from 'next/image'
import { getWinOrLossColor } from "../../../../api/models/Team"

interface ViewGameLogsProps {
  tourneyId: string
  gameId: string
}

export default function ViewGameLogs({ params }: { params: ViewGameLogsProps }) {
  const [game, setGame] = useState<Game | null>(null)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchGameData = async () => {
      await TournamentsApi.fetchTournament(Number(params.tourneyId), (data: Tournament) => {
        const game = data.schedule?.find((game) => game.id === Number(params.gameId)) || null
        setGame(game)
        setTournament(data)
      })
    }

    fetchGameData()
  }, [params.gameId, params.tourneyId])

  const orderPlayersByStats = (p1: PlayerGameStats, p2: PlayerGameStats): number => {
    if (p1.kills > p2.kills) {
      return -1
    } else if (p1.kills < p2.kills) {
      return 1
    } else {
      if (p1.assists > p2.assists) {
        return -1
      } else if (p1.assists < p2.assists) {
        return 1
      } else {
        if (p1.deaths > p2.deaths) {
          return 1
        } else if (p1.deaths < p2.deaths) {
          return -1
        } else {
          return 0
        }
      }
    }
  }

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
        <div className="w-full flex items-center justify-between bg-blue-400 p-4 rounded mb-4">
          <div key="team1Header" className="flex items-center">
            <span className={`text-4xl font-bold text-center mr-7 px-2 py-2 ${getWinOrLossColor(game.stats.team1, game.stats)}`}>
              {game.stats.team1_score}
            </span>
            <Image
              src={game.stats.team1.logo_image_file ? URL.createObjectURL(game.stats.team1.logo_image_file) : "/images/nologo.svg"}
              alt={game.stats.team1.short_name}
              width={72}
              height={72}
              className="inline-block mr-2"
            />
            <span className="text-4xl font-bold text-center text-white">{game.stats.team1.short_name}</span>
          </div>
          <span className="text-4xl font-bold text-center text-white">X</span>
          <div key="team2Header" className="flex items-center">
            <span className="text-4xl font-bold text-center text-white">{game.stats.team2.short_name}</span>
            <Image
              src={game.stats.team2.logo_image_file ? URL.createObjectURL(game.stats.team2.logo_image_file) : "/images/nologo.svg"}
              alt={game.stats.team2.short_name}
              width={72}
              height={72}
              className="inline-block ml-2"
            />
            <span className={`text-4xl font-bold text-center ml-7 px-2 py-2 ${getWinOrLossColor(game.stats.team2, game.stats)}`}>
              {game.stats.team2_score}
            </span>
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
            <strong>Tournament:</strong> {tournament?.name}
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
          <div className="overflow-x-auto mt-4">
            <h2 className="text-xl font-bold mb-4">{game.stats.team1.short_name}</h2>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Player</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Kills</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Deaths</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Assists</th>
                </tr>
              </thead>
              <tbody>
                {game.stats.players_stats_team1.sort(orderPlayersByStats).map((playerStats, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b border-gray-200">{playerStats.player.nickname}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{playerStats.kills}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{playerStats.deaths}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{playerStats.assists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto mt-4">
            <h2 className="text-xl font-bold mb-4">{game.stats.team2.short_name}</h2>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Player</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Kills</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Deaths</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Assists</th>
                </tr>
              </thead>
              <tbody>
                {game.stats.players_stats_team2.sort(orderPlayersByStats).map((playerStats, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b border-gray-200">{playerStats.player.nickname}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{playerStats.kills}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{playerStats.deaths}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{playerStats.assists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}