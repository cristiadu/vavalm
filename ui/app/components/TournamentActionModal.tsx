"use client"

import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/common/Modal'
import { fetchCountries } from '@/api/CountryApi'
import { Country } from '@/api/models/types'
import { fetchAllTeams } from '@/api/TeamsApi'
import { ItemActionModalProps } from '@/common/CommonModels'
import AlertMessage, { AlertType } from '@/components/common/AlertMessage'
import { EnumWithFieldName } from '@/api/models/types'
import { editTournament, newTournament } from '@/api/TournamentsApi'
import { quill_config } from '@/common/UIUtils'
import 'react-quill-new/dist/quill.snow.css'
import DropdownSelect from '@/components/common/DropdownSelect'
import dynamic from 'next/dynamic'
import { TeamApiModel, TournamentApiModel, TournamentType } from '@/api/generated'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

const initialTournamentState: TournamentApiModel = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  started: false,
  ended: false,
  country: '',
  type: TournamentType.SINGLE_GROUP,
  teams: [],
}

const TournamentActionModal: React.FC<ItemActionModalProps> = ({ isOpen, onClose, isEdit, object }) => {
  const tournament = object ? object as TournamentApiModel : null
  const [tournamentState, setTournamentState] = useState(initialTournamentState)
  const [teams, setTeams] = useState<TeamApiModel[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  const setInitialValues = useCallback((cleanup: boolean = false) => {
    if (isEdit && tournament && !cleanup) {
      setTournamentState({
        name: tournament.name,
        description: tournament.description,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        started: tournament.started,
        ended: tournament.ended,
        country: tournament.country,
        type: tournament.type,
        teams: tournament.teams,
      })
    } else {
      setTournamentState(initialTournamentState)
    }
  }, [isEdit, tournament, countries])

  useEffect(() => {
    if (isOpen) {
      fetchCountries(setCountries)
      fetchAllTeams(setTeams)
    }
  }, [isOpen])

  useEffect(() => {
    if (isEdit && tournament) {
      setInitialValues()
    }
  }, [tournament, isEdit, setInitialValues])

  const handleCountrySelect = (country: Country): void => {
    setTournamentState(prevState => ({ ...prevState, country: country.name }))
  }

  const handleTypeSelect = (tournament_type: EnumWithFieldName<TournamentType>): void => {
    setTournamentState(prevState => ({ ...prevState, type: tournament_type.value }))
  }

  const handleTeamSelect = (team: TeamApiModel): void => {
    setTournamentState(prevState => {
      const isSelected = prevState.teams?.some(selectedTeam => selectedTeam instanceof Number ? selectedTeam === team.id : (selectedTeam as TeamApiModel).id === team.id)
      const updatedTeams = isSelected
        ? prevState.teams?.filter(selectedTeam => selectedTeam instanceof Number ? selectedTeam !== team.id : (selectedTeam as TeamApiModel).id !== team.id)
        : [...(prevState.teams || []), team]
      return { ...prevState, teams: updatedTeams }
    })
  }

  const closeModal = (): void => {
    onClose()
    setInitialValues(true)
    setValidationError(null)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setValidationError(null)

    if (!tournamentState.country || !tournamentState.type || tournamentState?.teams?.length === 0 || !tournamentState.name || !tournamentState.start_date || !tournamentState.end_date) {
      setValidationError("Please select values for name, country, type, start date, end_date, and add at least one team to tournament.")
      return
    }

    const requestTournament: TournamentApiModel = {
      id: tournament?.id || 0,
      name: tournamentState.name,
      description: tournamentState.description,
      start_date: tournamentState.start_date,
      end_date: tournamentState.end_date,
      started: tournamentState.started,
      ended: tournamentState.ended,
      country: tournamentState.country,
      type: tournamentState.type,
      teams: tournamentState.teams,
    }

    if (isEdit) {
      await editTournament(requestTournament, (editedTournament) => {
        console.debug('Tournament edited:', editedTournament)
        closeModal()
      })
      return
    }

    await newTournament(requestTournament, (newTournament) => {
      console.debug('Tournament created:', newTournament)
      closeModal()
    })
  }

  const selectedCountry = countries.find(country => country.name === tournamentState.country) || null
  const selectedTeams = teams.filter(team => tournamentState?.teams?.some(selectedTeam => selectedTeam instanceof Number ? selectedTeam === team.id : (selectedTeam as TeamApiModel).id === team.id)) || null

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title={isEdit ? "Edit Tournament" : "New Tournament"}>
      <AlertMessage message={validationError} type={AlertType.ERROR} />
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Name</label>
          <input
            type="text"
            value={tournamentState.name}
            onChange={(e) => setTournamentState({ ...tournamentState, name: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700" htmlFor="description">Description</label>
          <ReactQuill
            value={tournamentState.description}
            onChange={(value) => setTournamentState((prevState) => ({ ...prevState, description: value }))}
            placeholder="Description"
            modules={quill_config}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Start Date</label>
          <input
            type="date"
            value={tournamentState.start_date ? new Date(tournamentState.start_date).toISOString().split('T')[0] : ''}
            onChange={(e) => setTournamentState({ ...tournamentState, start_date: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">End Date</label>
          <input
            type="date"
            value={tournamentState.end_date ? new Date(tournamentState.end_date).toISOString().split('T')[0] : ''}
            onChange={(e) => setTournamentState({ ...tournamentState, end_date: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Country</label>
          <DropdownSelect
            dropdownName={'country'}
            items={countries}
            selectedItems={selectedCountry ? [selectedCountry] : []}
            onSelect={handleCountrySelect}
            displayKey="name"
            imageKey="flag"
            placeholder="Select a country"
            imageDimensions={{ width: 32, height: 16 }}
            isMultiSelect={false}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Type</label>
          <DropdownSelect 
            dropdownName={'type'}
            items={Object.values(TournamentType).map(value => ({ value }))}
            selectedItems={tournamentState.type ? [{value: tournamentState.type}] : []}
            onSelect={handleTypeSelect}
            displayKey="value"
            placeholder="Select a type"
            isMultiSelect={false} 
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Teams</label>
          <DropdownSelect
            dropdownName={'teams'}
            items={teams}
            selectedItems={selectedTeams}
            onSelect={handleTeamSelect}
            displayKey="short_name"
            imageKey="logo_image_file"
            placeholder="Select teams"
            isMultiSelect={true} 
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700">
              Submit
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default TournamentActionModal
