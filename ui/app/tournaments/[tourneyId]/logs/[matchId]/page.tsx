"use client"

import { use, useEffect, useMemo, useState } from "react"
import { Match } from "../../../../api/models/Tournament"
import { fetchCountries } from "../../../../api/CountryApi"
import { Country } from "../../../../api/models/Country"
import { getMatch } from "../../../../api/GameApi"
import GamePicker from "./games/GamePicker"
import SectionHeader from "../../../../base/SectionHeader"
import MatchHeader from "./MatchHeader"
import GameView from "./games/GameView"

type ViewMatchParams = Promise<{
  tourneyId: string
  matchId: string
}>
export default function ViewMatch(props: { params: ViewMatchParams }) {
  const params = use(props.params)
  const matchId = Number(params.matchId)
  const [match, setMatch] = useState<Match | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedGameId, setSelectedGameId] = useState<number>(0)

  useEffect(() => {
    const fetchInitialData = async () => {
      fetchCountries((countryData) => {
        setCountries(countryData)
      })

      await fetchMatchData(matchId)
    }

    fetchInitialData()
  }, [matchId])

  const fetchMatchData = async (matchIdRequest: number) => {
    await getMatch(matchIdRequest, (data: Match) => {
      setMatch(data)
    })
  }

  const handleGameSelection = (gameId: number) => {
    if (gameId === selectedGameId) return
    setSelectedGameId(gameId)
  }

  const updateMatchInfo = (newMatchData: Match) => {
    fetchMatchData(newMatchData.id)
  }

  const team1Country = useMemo(() => countries.find(c => c.name === match?.team1?.country), [countries, match])
  const team2Country = useMemo(() => countries.find(c => c.name === match?.team2?.country), [countries, match])

  if (!match) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <SectionHeader title="Match Logs" />
      <div className="bg-white p-8 rounded shadow">
        <MatchHeader match={match} team1Country={team1Country} team2Country={team2Country} />
        <GamePicker games={match.games} selectedGameId={selectedGameId} onClick={handleGameSelection} matchWinnerId={match.winner_id} />
        <GameView gameId={selectedGameId} team1Country={team1Country} team2Country={team2Country} match={match} countries={countries} updateMatchInfo={updateMatchInfo} />
      </div>
    </div>
  )
}
