import Link from "next/link"

export default function Index() {
  return (
    <main className="flex flex-col items-center justify-center h-screen text-center bg-gray-100 p-6">
      <h1 className="text-4xl font-bold mb-8">Welcome to the VaValM website!</h1>
      <nav className="flex flex-col gap-4">
        <Link href="/teams" className="text-blue-500 text-xl hover:underline">
          Team List
        </Link>
        <Link href="/players" className="text-blue-500 text-xl hover:underline">
          Player List
        </Link>
        <Link href="/tournaments" className="text-blue-500 text-xl hover:underline">
          Tournament List
        </Link>
        <Link href="/players/stats" className="text-blue-500 text-xl hover:underline">
          Players Stats
        </Link>
        <Link href="/teams/stats" className="text-blue-500 text-xl hover:underline">
          Teams Stats
        </Link>
      </nav>
    </main>
  )
}
