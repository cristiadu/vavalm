
export default function ListTeams({ params }: { params: { tourneyId: string } }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      Welcome to the VaValM website!. Edit Tournament: {params.tourneyId}
    </div>
  )
}
