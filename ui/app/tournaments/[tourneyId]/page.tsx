"use client"

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchCountries } from '@/api/CountryApi'
import { fetchTournamentMatchSchedule, getTournament, getTournamentStandings } from '@/api/TournamentsApi'
import 'react-quill-new/dist/quill.snow.css'
import { asFormattedDate, asSafeHTML } from '@/common/StringUtils'
import { getWinOrLossColor, urlObjectLogoOrDefault } from '@/api/models/helpers'
import SectionHeader from '@/components/common/SectionHeader'
import { sortByDate } from '@/common/UIUtils'
import Pagination from '@/components/common/Pagination'
import { DEFAULT_TEAM_LOGO_IMAGE_PATH, LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE } from '@/api/models/constants'
import ImageAutoSize from '@/components/common/ImageAutoSize'
import { Country } from '@/api/models/types'
import { MatchApiModel, TournamentApiModel, TeamApiModel, StandingsApiModel } from '@/api/generated'

type Params = Promise<{ tourneyId: string }>
export default function ViewTournament(props: { params: Params }): React.ReactNode {
  const params = use(props.params)
  const [tournament, setTournament] = useState<TournamentApiModel | null>(null)
  const [tournamentStandings, setTournamentStandings] = useState<StandingsApiModel[] | null>(null)
  const [countryFlag, setCountryFlag] = useState<string | null>(null)
  const [totalMatches, setTotalMatches] = useState<number>(0)
  const [matches, setMatches] = useState<MatchApiModel[] | null>(null)
  const router = useRouter()

  const fetchTournamentMatches = useCallback(async (limit: number, offset: number) => {
    await fetchTournamentMatchSchedule(Number(params.tourneyId), (data) => {
      // Use the tournament data to set the teams objects
      const dataWithTeams = data.items.map((match: MatchApiModel) => {
        const team1 = tournament?.teams?.find(team => 
          team instanceof Number ? team === match.team1_id : (team as TeamApiModel).id === match.team1_id,
        )
        
        const team2 = tournament?.teams?.find(team => 
          team instanceof Number ? team === match.team2_id : (team as TeamApiModel).id === match.team2_id,
        )
        
        return { ...match, team1, team2 }
      })

      setMatches(dataWithTeams as MatchApiModel[])
      setTotalMatches(data.total)
    }, limit, offset)
  }, [params.tourneyId, tournament?.teams])

  const fetchTournamentData = useCallback(async () => {
    const tournamentData = await getTournament(Number(params.tourneyId), (data) => {
      setTournament(data)
    })

    await getTournamentStandings(Number(params.tourneyId), (data) => {
      setTournamentStandings(data)
    })

    const countries = await fetchCountries(() => {})
    if (tournamentData?.country) {
      setCountryFlag(countries?.find((c: Country) => c.name === tournamentData.country)?.flag || null)
    }
  }, [params.tourneyId])

  useEffect(() => {
    fetchTournamentData()
  }, [fetchTournamentData])

  useEffect(() => {
    fetchTournamentMatches(LIMIT_PER_PAGE_INITIAL_VALUE, PAGE_OFFSET_INITIAL_VALUE)
  }, [fetchTournamentMatches])

  const handleSchedulePageChange = (limit: number, offset: number): void => {
    fetchTournamentMatches(limit, offset)
  }

  if (!tournament) {
    return <div>Loading...</div>
  }

  const showGameLogs = (matchId: number): void => {
    router.push(`/tournaments/${tournament.id}/logs/${matchId}`)
  }

  const teamsToLogoSrc: Map<number, string> = new Map(
    tournament.teams?.filter(team => typeof team === 'object' && team !== null)
      .map(team => [(team as TeamApiModel).id!, urlObjectLogoOrDefault(team as TeamApiModel)]) || [],
  )

  const tournamentWinner = tournament.winner_id ? 
    tournament.teams?.find(team => 
      typeof team === 'object' && team !== null && (team as TeamApiModel).id === tournament.winner_id,
    ) || null : 
    null

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
            {countryFlag && <ImageAutoSize src={countryFlag} alt={tournament.country} width={32} height={16} className="inline-block ml-2 mr-2" />}
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
            {tournament.teams && tournament.teams.map(team => {
              if (typeof team === 'number') return null
              team = team as TeamApiModel
              return (
                <div key={`tournament-${tournament.id}-team-${team.id}`} className="flex items-center space-x-2">
                  <ImageAutoSize 
                    src={team.id && teamsToLogoSrc.get(team.id) ? teamsToLogoSrc.get(team.id) ?? DEFAULT_TEAM_LOGO_IMAGE_PATH : DEFAULT_TEAM_LOGO_IMAGE_PATH} 
                    alt={team.short_name || ""} 
                    width={32} 
                    height={32} 
                    className="inline-block mr-2" 
                  />
                  <span className="text-lg">{team.short_name}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Winner</h3>
          <hr className="mb-2" />
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <ImageAutoSize 
                src={typeof tournamentWinner === 'number' ? DEFAULT_TEAM_LOGO_IMAGE_PATH :
                  tournamentWinner && (tournamentWinner as TeamApiModel).id && tournament.ended ? 
                    ((tournamentWinner as TeamApiModel).id && teamsToLogoSrc.get((tournamentWinner as TeamApiModel).id!) || DEFAULT_TEAM_LOGO_IMAGE_PATH) : 
                    DEFAULT_TEAM_LOGO_IMAGE_PATH
                } 
                alt={tournamentWinner && typeof tournamentWinner === 'object' ? 
                  (tournamentWinner as TeamApiModel).short_name || "No Team Yet" : "No Team Yet"} 
                width={32} 
                height={32} 
                className="inline-block mr-2" 
              />
              <span className="text-lg">
                {tournamentWinner && typeof tournamentWinner === 'object' ? 
                  (tournamentWinner as TeamApiModel).short_name || "No Team Yet" : "No Team Yet"}
              </span>
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
                {tournamentStandings && tournamentStandings.map((standing: StandingsApiModel) => (
                  <tr key={`tournament-${tournament.id}-standing-${standing.id}`}>
                    <td className="py-2 px-2 border-b text-center bg-gray-100">{standing.position}</td>
                    <td className="py-2 px-2 border-b items-center bg-gray-100">
                      <ImageAutoSize 
                        src={standing.team_id && teamsToLogoSrc.get(standing.team_id) ? teamsToLogoSrc.get(standing.team_id) ?? DEFAULT_TEAM_LOGO_IMAGE_PATH : DEFAULT_TEAM_LOGO_IMAGE_PATH} 
                        alt={(tournament.teams?.find(team => team instanceof Number ? team === standing.team_id : (team as TeamApiModel).id === standing.team_id) as TeamApiModel)?.short_name || "No Team Yet"} 
                        width={32} 
                        height={32} 
                        className="inline-block mr-2" 
                      />
                      <span>{(tournament.teams?.find(team => team instanceof Number ? team === standing.team_id : (team as TeamApiModel).id === standing.team_id) as TeamApiModel)?.short_name || "No Team Yet"}</span>
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
                {matches && matches.sort((a, b) => sortByDate(new Date(a.date), new Date(b.date))).map((match) => 
                  (match.team1 && match.team2) && (
                    <tr key={`tournament-${tournament.id}-match-${match.id || 0}`} onClick={() => match.id && showGameLogs(match.id)} className='cursor-pointer bg-gray-100 hover:bg-gray-200'>
                      <td className="py-2 border-b text-center">
                        {asFormattedDate(new Date(match.date))}
                      </td>
                      <td className="py-2 border-b text-center">{match.type}</td>
                      <td className="py-2 border-b items-center">
                        <div className="flex items-center space-x-2">
                          <ImageAutoSize 
                            src={match.team1_id && teamsToLogoSrc.get(match.team1_id) ? teamsToLogoSrc.get(match.team1_id) ?? DEFAULT_TEAM_LOGO_IMAGE_PATH : DEFAULT_TEAM_LOGO_IMAGE_PATH}
                            alt={match.team1?.short_name || ""} 
                            width={32} 
                            height={32} 
                            className="inline-block mr-2" 
                          />
                          <span>{match.team1?.short_name}</span>
                        </div>
                      </td>
                      <td className="py-2 border-b items-center">
                        <div className="flex items-center space-x-2">
                          <ImageAutoSize 
                            src={match.team2_id && teamsToLogoSrc.get(match.team2_id) ? teamsToLogoSrc.get(match.team2_id) ?? DEFAULT_TEAM_LOGO_IMAGE_PATH : DEFAULT_TEAM_LOGO_IMAGE_PATH}
                            alt={match.team2?.short_name || ""} 
                            width={32} 
                            height={32} 
                            className="inline-block mr-2" 
                          />
                          <span>{match.team2?.short_name}</span>
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