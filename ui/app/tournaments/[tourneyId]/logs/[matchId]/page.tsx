"use client"

import { use, useCallback, useEffect, useMemo, useState } from "react"
import { Match } from "../../../../api/models/Tournament"
import { fetchCountries } from "../../../../api/CountryApi"
import { Country } from "../../../../api/models/Country"
import { getMatch } from "../../../../api/GameApi"
import GamePicker from "./games/GamePicker"
import SectionHeader from "../../../../base/SectionHeader"
import MatchHeader from "./MatchHeader"
import GameView from "./games/GameView"

// Create a simple cache to store match data
const matchCache = new Map<number, Match>()

type ViewMatchParams = Promise<{
  tourneyId: string
  matchId: string
}>

export default function ViewMatch(props: { params: ViewMatchParams }): React.ReactNode {
  const params = use(props.params)
  const matchId = Number(params.matchId)
  const [match, setMatch] = useState<Match | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedGameId, setSelectedGameId] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Fetch country data only once
  useEffect(() => {
    fetchCountries((countryData) => {
      setCountries(countryData)
    })
  }, [])

  const fetchMatchData = useCallback(async (matchIdRequest: number) => {
    // Check if we have the data in the cache
    if (matchCache.has(matchIdRequest)) {
      const cachedMatch = matchCache.get(matchIdRequest)
      setMatch(cachedMatch || null)
      return
    }
    
    setIsLoading(true)
    
    try {
      // Fetch match data with the signal
      const data = await getMatch(matchIdRequest, () => {})
      
      if (data) {
        setMatch(data)
        
        // Cache the result
        matchCache.set(matchIdRequest, data)
        
        // If there are games, select the first one if none is selected
        if (data?.games?.length && selectedGameId === 0) {
          setSelectedGameId(data.games[0].id)
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Match fetch aborted')
      } else {
        console.error('Error fetching match data:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedGameId])

  // Effect to fetch match data when the matchId changes
  useEffect(() => {
    fetchMatchData(matchId)
  }, [matchId, fetchMatchData])

  const handleGameSelection = useCallback((gameId: number) => {
    if (gameId === selectedGameId) return
    setSelectedGameId(gameId)
  }, [selectedGameId])

  const updateMatchInfo = useCallback((newMatchData: Match) => {
    setMatch(newMatchData)
    
    // Update the cache
    matchCache.set(newMatchData.id, newMatchData)
  }, [])

  // Function to force refresh match data from server
  const refreshMatchData = useCallback(async () => {
    // Clear the cache entry to force a fresh fetch
    matchCache.delete(matchId)
    
    // Fetch fresh data
    await fetchMatchData(matchId)
  }, [matchId, fetchMatchData])

  const team1Country = useMemo(() => 
    countries.find(c => c.name === match?.team1?.country), 
  [countries, match],
  )
  
  const team2Country = useMemo(() => 
    countries.find(c => c.name === match?.team2?.country), 
  [countries, match],
  )

  if (isLoading || !match) {
    return (
      <div className="flex min-h-screen flex-col items-center p-24">
        <div className="bg-white p-8 rounded shadow w-full max-w-6xl">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-4 text-xl">Loading match data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <SectionHeader title="Match Logs" />
      <div className="bg-white p-8 rounded shadow w-full max-w-6xl">
        <MatchHeader match={match} team1Country={team1Country} team2Country={team2Country} />
        <GamePicker games={match.games} selectedGameId={selectedGameId} onClick={handleGameSelection} matchWinnerId={match.winner_id} />
        {selectedGameId > 0 ? (
          <GameView 
            key={`game-${selectedGameId}`} // Key helps with proper component recreation
            gameId={selectedGameId} 
            team1Country={team1Country} 
            team2Country={team2Country} 
            match={match} 
            countries={countries} 
            updateMatchInfo={updateMatchInfo} 
            refreshMatchData={refreshMatchData}
          />
        ) : (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading game data...</span>
          </div>
        )}
      </div>
    </div>
  )
}
