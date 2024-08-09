"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Game, orderPlayersByStats, randomValorantWeapon, Tournament } from "../../../../api/models/Tournament"
import TournamentsApi from "../../../../api/TournamentsApi"
import { handleBackClick } from '../../../../base/LinkUtils'
import Image from 'next/image'
import { getWinOrLossColor } from "../../../../api/models/Team"
import CountryApi from "../../../../api/CountryApi"
import { Country } from "../../../../api/models/Country"

interface ViewGameLogsProps {
  tourneyId: string
  gameId: string
}

export default function ViewGameLogs({ params }: { params: ViewGameLogsProps }) {
  const [game, setGame] = useState<Game | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
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

    CountryApi.fetchCountries((countryData) => {
      setCountries(countryData)
    })

    fetchGameData()
  }, [params.gameId, params.tourneyId])

  if (!game) {
    return <div>Loading...</div>
  }

  const tournamentCountry = countries.find(c => c.name === tournament?.country)
  const team1Country = countries.find(c => c.name === game.stats.team1.country)
  const team2Country = countries.find(c => c.name === game.stats.team2.country)

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <header className="w-full flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Game Logs</h1>
        <Link href="#" onClick={(e) => handleBackClick(e, router)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
          Back
        </Link>
      </header>
      <div className="max-w-6 bg-white p-8 rounded shadow">
        <div className="flex items-center justify-between bg-blue-400 p-4 rounded mb-4">
          <div key="team1Header" className="flex items-center">
            <span className={`text-4xl font-bold text-center mr-7 px-2 py-2 ${getWinOrLossColor(game.stats.team1, game.stats)}`}>
              {game.stats.team1_score}
            </span>
            {team1Country && (<Image src={team1Country.flag} alt={team1Country.name} width={60} height={60} className="inline-block mx-2" />)}
            <Image
              src={game.stats.team1.logo_image_file ? URL.createObjectURL(game.stats.team1.logo_image_file) : "/images/nologo.svg"}
              alt={game.stats.team1.short_name}
              width={72}
              height={72}
              className="inline-block mr-2"
            />
            <span className="text-4xl font-bold text-center text-white">{game.stats.team1.short_name}</span>
          </div>
          <span className="text-4xl font-bold text-center text-white mx-4">X</span>
          <div key="team2Header" className="flex items-center">
            <span className="text-4xl font-bold text-center text-white">{game.stats.team2.short_name}</span>
            <Image
              src={game.stats.team2.logo_image_file ? URL.createObjectURL(game.stats.team2.logo_image_file) : "/images/nologo.svg"}
              alt={game.stats.team2.short_name}
              width={72}
              height={72}
              className="inline-block ml-2"
            />
            {team2Country && (<Image src={team2Country.flag} alt={team2Country.name} width={60} height={60} className="inline-block mx-2" />)}
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
            <strong>Tournament:</strong>
            {tournamentCountry && (<Image src={tournamentCountry.flag} alt={tournamentCountry.name} width={30} height={30} className="inline-block mx-2" />)}
            <span>{tournament?.name}</span>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Stats</h3>
          <hr className="mb-2" />
          <div className="overflow-x-auto mt-4">
            <h2 className="text-xl font-bold mb-4">{game.stats.team1.short_name}</h2>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 pl-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Country</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Player</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Kills</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Deaths</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Assists</th>
                </tr>
              </thead>
              <tbody>
                {game.stats.players_stats_team1.sort(orderPlayersByStats).map((playerStats, index) => (
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
                  <th className="py-2 pl-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Country</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Player</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Kills</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Deaths</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">Assists</th>
                </tr>
              </thead>
              <tbody>
                {game.stats.players_stats_team2.sort(orderPlayersByStats).map((playerStats, index) => (
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
                    <td className="py-2 px-4 border-b border-gray-200">{playerStats.kills}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{playerStats.deaths}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{playerStats.assists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {game.logs && (
          <div className="text-lg mb-4">
            <h3 className="text-xl font-bold my-2">Logs</h3>
            <hr className="mb-2" />
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
                {game.logs.sort((a, b) => a.round - b.round).map((log, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-2 px-4">{log.round}</td>
                    <td className="py-2 px-4">
                      {log.player_killed.id == log.team1_player.id ? (
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
                    <td className="py-2 px-6">{log.duel_buff*100}%</td>
                    <td className="py-2 px-6">{log.trade_buff*100}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}