import GameService from "./GameService"

const ONE_MINUTE_IN_MS = 60000
let executing = false

const fetchGamesThatShouldBePlayed = async (before: Date): Promise<Map<number, Date>> => {
  const games = await GameService.getGamesToBePlayed(before)
  const scheduledGames = new Map<number, Date>()
  for (const game of games) {
    game.started = true
    scheduledGames.set(game.id, game.date)
    game.save()
  }
  return scheduledGames
}

const startScheduler = async(): Promise<void> => {
  setInterval(async () => {
    const now = new Date()
    console.log(`Checking for games to play at ${now.toISOString()}`)

    if (executing) {
      console.log('Scheduler is already executing')
      return
    }

    executing = true
    for (const [gameId, dateTime] of await fetchGamesThatShouldBePlayed(now)) {
      if (dateTime <= now) {
        startGameExecution(gameId, dateTime)
      }
    }
    executing = false
  }, ONE_MINUTE_IN_MS) // Check every minute
}

const startGameExecution = async (gameId: number, scheduledDate: Date): Promise<void> => {
  console.log(`Playing game ${gameId}, scheduled at ${scheduledDate.toISOString()}`)
  GameService.playFullGame(gameId).then(() => {
    console.log(`Game ${gameId} has been played`)
  })
}

export default {
  startScheduler,
}
