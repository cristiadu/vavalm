"use client"

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { fetchCountries } from '../../api/CountryApi'
import { fetchTournamentMatchSchedule, getTournament } from '../../api/TournamentsApi'
import { Match, Tournament } from '../../api/models/Tournament'
import 'react-quill/dist/quill.snow.css'
import { asFormattedDate, asSafeHTML } from '../../base/StringUtils'
import { getWinOrLossColor } from '../../api/models/Team'
import SectionHeader from '../../base/SectionHeader'
import { sortByDate } from '../../base/UIUtils'
import Pagination from '../../base/Pagination'
import { LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from '../../api/models/constants'

export default function ViewTournament({ params }: { params: { tourneyId: string } }) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [countryFlag, setCountryFlag] = useState<string | null>(null)
  const [totalMatches, setTotalMatches] = useState<number>(0)
  const [matches, setMatches] = useState<Match[] | null>(null)
  const router = useRouter()


  const fetchTournamentMatches = useCallback(async (limit: number, offset: number) => {
    await fetchTournamentMatchSchedule(Number(params.tourneyId), (data) => {
      // Use the tournament data to set the teams objects
      const dataWithTeams = data.items.map((match: Match) => {
        const team1 = tournament?.teams.find(team => team.id === match.team1_id)
        const team2 = tournament?.teams.find(team => team.id === match.team2_id)
        return { ...match, team1, team2 }
      })

      setMatches(dataWithTeams)
      setTotalMatches(data.total)
    }, limit, offset)
  }, [params.tourneyId, tournament?.teams])

  const fetchTournamentData = useCallback(async () => {
    const tournamentData = await getTournament(Number(params.tourneyId), (data) => {
      setTournament(data)
    })

    const countries = await fetchCountries(() => {})
    if (tournamentData.country) {
      setCountryFlag(countries?.find(c => c.name === tournamentData.country)?.flag || null)
    }
  }, [params.tourneyId])

  useEffect(() => {
    fetchTournamentData()
  }, [fetchTournamentData])

  useEffect(() => {
    fetchTournamentMatches(LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE)
  }, [fetchTournamentMatches])

  const handleSchedulePageChange = (limit: number, offset: number) => {
    fetchTournamentMatches(limit, offset)
  }

  if (!tournament) {
    return <div>Loading...</div>
  }

  const showGameLogs = (matchId: number): void => {
    router.push(`/tournaments/${tournament.id}/logs/${matchId}`)
  }

  const teamsToLogoSrc: Map<number, string> = new Map(tournament.teams.map(team => [team.id!, team.logo_image_file ? URL.createObjectURL(team.logo_image_file) : "/images/nologo.svg"]))
  const tournamentWinner = tournament.winner_id ? tournament.teams.find(team => team.id === tournament.winner_id) : null

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <SectionHeader title="Tournament Details" />
      <div className="w-full max-w-3xl bg-white p-8 rounded shadow">
        <div className="bg-blue-300 p-4 rounded mb-4 flex items-center justify-center">
          <h2 className="text-3xl font-bold text-center text-white">{tournament.name}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-lg">
            <strong>Country:</strong> 
            {countryFlag && <Image src={countryFlag} alt={tournament.country} width={30} height={30} className="inline-block ml-2 mr-2" />}
            {tournament.country}
          </div>
          <div className="text-lg">
            <strong>Start Date:</strong> {new Date(tournament.start_date).toLocaleDateString()}
          </div>
        </div>
        <div className="text-lg mb-4">
          <strong>Description:</strong><div className="ql-container ql-snow" style={{ border: "0" }}><div className="ql-editor" dangerouslySetInnerHTML={{ __html: asSafeHTML(tournament.description || "") }} /></div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Teams</h3>
          <hr className="mb-2" />
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
            {tournament.teams && tournament.teams.map(team => (
              <div key={team.id} className="flex items-center space-x-2">
                <Image 
                  src={team.id && teamsToLogoSrc.get(team.id) ? teamsToLogoSrc.get(team.id) ?? "/images/nologo.svg" : "/images/nologo.svg"} 
                  alt={team.short_name} 
                  width={30} 
                  height={30} 
                  className="inline-block mr-2" 
                />
                <span className="text-lg">{team.short_name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Winner</h3>
          <hr className="mb-2" />
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Image 
                src={tournamentWinner?.id && tournament.ended ? teamsToLogoSrc.get(tournamentWinner.id) ?? "/images/nologo.svg" : "/images/nologo.svg"} 
                alt={tournamentWinner?.short_name || "No Team Yet"} 
                width={30} 
                height={30} 
                className="inline-block mr-2" 
              />
              <span className="text-lg">{tournamentWinner?.short_name || "No Team Yet"}</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Standings</h3>
          <hr className="mb-2" />
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white table-fixed">
              <thead>
                <tr>
                  <th className="py-2 px-2 border-b">#</th>
                  <th className="py-2 px-2 border-b">Team</th>
                  <th className="py-2 border-b">Wins</th>
                  <th className="py-2 border-b">Losses</th>
                  <th className="py-2 border-b">Maps Won</th>
                  <th className="py-2 border-b">Maps Lost</th>
                  <th className="py-2 border-b">Rounds Won</th>
                  <th className="py-2 border-b">Rounds Lost</th>
                </tr>
              </thead>
              <tbody>
                {tournament.standings && tournament.standings.map((standing) => (
                  <tr key={standing.id}>
                    <td className="py-2 px-2 border-b text-center bg-gray-100">{standing.position}</td>
                    <td className="py-2 px-2 border-b items-center bg-gray-100">
                      <Image 
                        src={standing.team_id && teamsToLogoSrc.get(standing.team_id) ? teamsToLogoSrc.get(standing.team_id) ?? "/images/nologo.svg" : "/images/nologo.svg"} 
                        alt={standing.team?.short_name} 
                        width={30} 
                        height={30} 
                        className="inline-block mr-2" 
                      />
                      <span>{standing.team?.short_name}</span>
                    </td>
                    <td className="py-2 border-b text-center bg-gray-100">{standing.wins}</td>
                    <td className="py-2 border-b text-center bg-gray-100">{standing.losses}</td>
                    <td className="py-2 border-b text-center">{standing.maps_won}</td>
                    <td className="py-2 border-b text-center">{standing.maps_lost}</td>
                    <td className="py-2 border-b text-center">{standing.rounds_won}</td>
                    <td className="py-2 border-b text-center">{standing.rounds_lost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Matches Schedule</h3>
          <hr className="mb-2" />
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white table-fixed">
              <thead>
                <tr>
                  <th className="py-2 border-b">Date</th>
                  <th className="py-2 border-b">Type</th>
                  <th className="py-2 border-b">Team 1</th>
                  <th className="py-2 border-b">Team 2</th>
                  <th className="py-2 border-b">Score</th>
                </tr>
              </thead>
              <tbody>
                {matches && matches.sort(sortByDate).map((match) => 
                  (match.team1 && match.team2) && (
                    <tr key={match.id} onClick={() => showGameLogs(match.id)} className='cursor-pointer bg-gray-100 hover:bg-gray-200'>
                      <td className="py-2 border-b text-center">
                        {asFormattedDate(match.date)}
                      </td>
                      <td className="py-2 border-b text-center">{match.type}</td>
                      <td className="py-2 border-b items-center">
                        <div className="flex items-center space-x-2">
                          <Image 
                            src={match.team1_id && teamsToLogoSrc.get(match.team1_id) ? teamsToLogoSrc.get(match.team1_id) ?? "/images/nologo.svg" : "/images/nologo.svg"}
                            alt={match.team1.short_name} 
                            width={30} 
                            height={30} 
                            className="inline-block mr-2" 
                          />
                          <span>{match.team1.short_name}</span>
                        </div>
                      </td>
                      <td className="py-2 border-b items-center">
                        <div className="flex items-center space-x-2">
                          <Image 
                            src={match.team2_id && teamsToLogoSrc.get(match.team2_id) ? teamsToLogoSrc.get(match.team2_id) ?? "/images/nologo.svg" : "/images/nologo.svg"}
                            alt={match.team2.short_name} 
                            width={30} 
                            height={30} 
                            className="inline-block mr-2" 
                          />
                          <span>{match.team2.short_name}</span>
                        </div>
                      </td>
                      <td className="py-2 border-b text-center">
                        <strong>
                          <span className={getWinOrLossColor(match.team1, match)}>{match?.team1_score}</span>
                        - 
                          <span className={getWinOrLossColor(match.team2, match)}>{match?.team2_score}</span>
                        </strong>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <Pagination totalItems={totalMatches} onPageChange={handleSchedulePageChange} />
          </div>
        </div>
      </div>
    </div>
  )
}