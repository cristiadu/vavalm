import Link from "next/link"

export default function Home() {
  return (
    <main>
      Welcome to the VaValM website!.
      <Link href="/teams">Team List</Link>
      <Link href="/players">Player List</Link>
      <Link href="/tournaments">Tournament List</Link>
    </main>
  )
}
