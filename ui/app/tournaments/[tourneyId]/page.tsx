"use client"

import { use, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchCountries } from '@/api/CountryApi'
import { fetchTournamentMatchSchedule, getTournament, getTournamentStandings } from '@/api/TournamentsApi'
import { asFormattedDate, stripHtmlTags } from '@/common/StringUtils'
import { getWinOrLossColor, teamLogoURLObjectOrDefault } from '@/api/models/helpers'
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

  const sortedMatches = useMemo(() => {
    if (!matches) return null
    return [...matches].sort((a, b) => sortByDate(new Date(a.date), new Date(b.date)))
  }, [matches])

  if (!tournament) {
    return <div>Loading...</div>
  }

  const showGameLogs = (matchId: number): void => {
    router.push(`/tournaments/${tournament.id}/logs/${matchId}`)
  }

  const teamsToLogoSrc: Map<number, string> = new Map(
    tournament.teams?.filter(team => typeof team === 'object' && team !== null)
      .map(team => [(team as TeamApiModel).id!, teamLogoURLObjectOrDefault(team as TeamApiModel)]) || [],
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
          <strong>Description:</strong> <span className="text-gray-600">{tournament.description ? stripHtmlTags(tournament.description) : 'No description'}</span>
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
            <table className="min-w-full rounded-lg overflow-hidden shadow">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wider">#</th>
                  <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wider">Team</th>
                  <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wider">Wins</th>
                  <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wider">Losses</th>
                  <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wider">Maps Won</th>
                  <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wider">Maps Lost</th>
                  <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wider">Rds Won</th>
                  <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wider">Rds Lost</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tournamentStandings && tournamentStandings.map((standing: StandingsApiModel) => (
                  <tr key={`tournament-${tournament.id}-standing-${standing.id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-2 text-center text-sm font-bold text-gray-700">{standing.position}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <ImageAutoSize
                          src={standing.team_id && teamsToLogoSrc.get(standing.team_id) ? teamsToLogoSrc.get(standing.team_id) ?? DEFAULT_TEAM_LOGO_IMAGE_PATH : DEFAULT_TEAM_LOGO_IMAGE_PATH}
                          alt={(tournament.teams?.find(team => team instanceof Number ? team === standing.team_id : (team as TeamApiModel).id === standing.team_id) as TeamApiModel)?.short_name || "No Team Yet"}
                          width={24}
                          height={24}
                          className="shrink-0 rounded"
                        />
                        <span className="text-sm font-semibold text-gray-900">{(tournament.teams?.find(team => team instanceof Number ? team === standing.team_id : (team as TeamApiModel).id === standing.team_id) as TeamApiModel)?.short_name || "No Team Yet"}</span>
                      </div>
                    </td>
                    <td className="py-2 text-center text-sm font-medium text-green-700">{standing.wins}</td>
                    <td className="py-2 text-center text-sm font-medium text-red-600">{standing.losses}</td>
                    <td className="py-2 text-center text-sm">{standing.maps_won}</td>
                    <td className="py-2 text-center text-sm">{standing.maps_lost}</td>
                    <td className="py-2 text-center text-sm">{standing.rounds_won}</td>
                    <td className="py-2 text-center text-sm">{standing.rounds_lost}</td>
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
            <table className="min-w-full rounded-lg overflow-hidden shadow">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="py-2 px-3 text-center text-xs font-semibold uppercase tracking-wider">Date</th>
                  <th className="py-2 px-3 text-center text-xs font-semibold uppercase tracking-wider">Type</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider">Team 1</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider">Team 2</th>
                  <th className="py-2 px-3 text-center text-xs font-semibold uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedMatches && sortedMatches.map((match) =>
                  (match.team1 && match.team2) && (
                    <tr key={`tournament-${tournament.id}-match-${match.id || 0}`} onClick={() => match.id && showGameLogs(match.id)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3 text-center text-sm text-gray-600">
                        {asFormattedDate(new Date(match.date))}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{match.type}</span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <ImageAutoSize
                            src={match.team1_id && teamsToLogoSrc.get(match.team1_id) ? teamsToLogoSrc.get(match.team1_id) ?? DEFAULT_TEAM_LOGO_IMAGE_PATH : DEFAULT_TEAM_LOGO_IMAGE_PATH}
                            alt={match.team1?.short_name || ""}
                            width={24}
                            height={24}
                            className="shrink-0 rounded"
                          />
                          <span className="text-sm font-medium text-gray-900">{match.team1?.short_name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <ImageAutoSize
                            src={match.team2_id && teamsToLogoSrc.get(match.team2_id) ? teamsToLogoSrc.get(match.team2_id) ?? DEFAULT_TEAM_LOGO_IMAGE_PATH : DEFAULT_TEAM_LOGO_IMAGE_PATH}
                            alt={match.team2?.short_name || ""}
                            width={24}
                            height={24}
                            className="shrink-0 rounded"
                          />
                          <span className="text-sm font-medium text-gray-900">{match.team2?.short_name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-sm font-bold ${getWinOrLossColor(match.team1, match)}`}>{match?.team1_score}</span>
                        <span className="mx-1 text-gray-400">-</span>
                        <span className={`inline-block px-2 py-0.5 rounded text-sm font-bold ${getWinOrLossColor(match.team2, match)}`}>{match?.team2_score}</span>
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