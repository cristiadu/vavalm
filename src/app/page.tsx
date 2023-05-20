import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      Welcome to the VaValM website!.
      <Link href="/teams">Team List</Link>
      <Link href="/players">Player List</Link>
      <Link href="/tournaments">Tournament List</Link>
    </main>
  )
}
