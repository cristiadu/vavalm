export default function ViewGameLogs({ params }: { params: { gameId: string } }) {
  return <div>Game logs for game {params.gameId}</div>
}