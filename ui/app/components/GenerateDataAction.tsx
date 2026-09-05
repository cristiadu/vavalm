"use client"

import { useRef, useState } from 'react'
import Modal from '@/components/common/Modal'
import { VavalMApiClient } from '@/api/client'
import { invalidatePlayerCache } from '@/api/PlayersApi'

/** Offers repeatable bulk generation in the shared web and desktop UI. */
export const GenerateDataAction = ({ onGenerated }: { onGenerated: () => void }): React.ReactNode => {
  const [isOpen, setIsOpen] = useState(false)
  const [teamCount, setTeamCount] = useState(8)
  const [tournamentCount, setTournamentCount] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const submitting = useRef(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const close = (): void => {
    if (!submitting.current) setIsOpen(false)
  }

  const generate = async (event: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setIsGenerating(true)
    setError('')
    setSuccess('')
    try {
      const result = await VavalMApiClient.default.generateData({ teamCount, tournamentCount })
      invalidatePlayerCache()
      setSuccess(`Created ${result.tournamentIds.length} tournaments, ${result.teamIds.length} teams and ${result.playerIds.length} players.`)
      setIsOpen(false)
      onGenerated()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not generate data. Please try again.')
    } finally {
      submitting.current = false
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-full mb-4">
      <button type="button" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700" onClick={() => { setError(''); setIsOpen(true) }}>
        Generate data
      </button>
      {success && <p role="status" className="mt-2 text-green-700">{success}</p>}
      <Modal isOpen={isOpen} onClose={close} title="Generate tournaments, teams and players">
        <form onSubmit={generate} className="space-y-4 text-gray-900" aria-busy={isGenerating}>
          <p>Create a fresh batch with generated names, countries, ages and random player attributes from 0 to 3. Existing data stays intact.</p>
          <label className="block">
            Teams (2–32)
            <input type="number" min={2} max={32} step={1} required value={teamCount} disabled={isGenerating} onChange={event => setTeamCount(event.target.valueAsNumber)} className="block w-full border rounded p-2" />
          </label>
          <label className="block">
            Tournaments (0–10)
            <input type="number" min={0} max={10} step={1} required value={tournamentCount} disabled={isGenerating} onChange={event => setTournamentCount(event.target.valueAsNumber)} className="block w-full border rounded p-2" />
          </label>
          <p>Each team gets five players. Each tournament includes all generated teams, standings and best-of-three matches. The first tournament starts tomorrow; later tournaments follow every eight days. Set tournaments to 0 to generate only teams and players.</p>
          <p className="font-semibold">{Number.isFinite(teamCount) ? teamCount * 5 : 0} players will be created.</p>
          {error && <p role="alert" className="text-red-700">{error}</p>}
          <button type="submit" disabled={isGenerating} className="bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50">
            {isGenerating ? 'Generating…' : 'Generate'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
