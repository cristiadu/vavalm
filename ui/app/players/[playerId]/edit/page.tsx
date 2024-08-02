
export default function ListTeams({ params }: { params: { playerId: string } }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      Welcome to the VaValM website!. Edit Player: {params.playerId}
    </div>
  )
}
