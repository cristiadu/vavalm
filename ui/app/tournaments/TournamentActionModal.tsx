import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Modal from '../base/Modal'
import CountryApi, { Country } from '../calls/CountryApi'
import TeamsApi, { Team } from '../calls/TeamsApi'
import { ItemActionModalProps } from '../common/CommonModels'
import ErrorAlert from '../base/ErrorAlert'
import { Tournament, TournamentType, Game, Standing } from '../calls/TournamentsApi'
import TournamentsApi from '../calls/TournamentsApi'
import { quill_config } from '../base/Configs'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const initialTournamentState = {
  name: '',
  description: '',
  start_date: '',
  started: false,
  ended: false,
  country: null as Country | null,
  type: null as TournamentType | null,
  teams: [] as Team[],
  schedule: [] as Game[],
  standings: [] as Standing[],
}

const TournamentActionModal: React.FC<ItemActionModalProps> = ({ isOpen, onClose, isEdit, object }) => {
  const tournament = object ? object as Tournament : null
  const [tournamentState, setTournamentState] = useState(initialTournamentState)
  const [teams, setTeams] = useState<Team[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [dropdownOpenCountry, setDropdownOpenCountry] = useState(false)
  const [dropdownOpenType, setDropdownOpenType] = useState(false)
  const [dropdownOpenTeams, setDropdownOpenTeams] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const dropdownCountryRef = useRef<HTMLDivElement>(null)
  const dropdownTypeRef = useRef<HTMLDivElement>(null)
  const dropdownTeamsRef = useRef<HTMLDivElement>(null)

  const setInitialValues = useCallback((cleanup: boolean = false) => {
    if (isEdit && tournament && !cleanup) {
      setTournamentState({
        name: tournament.name,
        description: tournament.description,
        start_date: tournament.start_date,
        started: tournament.started,
        ended: tournament.ended,
        country: countries.find(country => country.name === tournament.country) || null,
        type: tournament.type,
        teams: tournament.teams,
        schedule: tournament.schedule,
        standings: tournament.standings,
      })
    } else {
      setTournamentState(initialTournamentState)
    }
  }, [isEdit, tournament, countries])

  useEffect(() => {
    const handleClickOutsideDropdowns = (event: MouseEvent) => {
      if (dropdownCountryRef.current && !dropdownCountryRef.current.contains(event.target as Node)) {
        setDropdownOpenCountry(false)
      }

      if (dropdownTypeRef.current && !dropdownTypeRef.current.contains(event.target as Node)) {
        setDropdownOpenType(false)
      }

      if (dropdownTeamsRef.current && !dropdownTeamsRef.current.contains(event.target as Node)) {
        setDropdownOpenTeams(false)
      }
    }
  
    document.addEventListener('mousedown', handleClickOutsideDropdowns)
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDropdowns)
    }
  })

  useEffect(() => {
    if (isOpen) {
      CountryApi.fetchCountries(setCountries)
      TeamsApi.fetchTeams(setTeams)
    }
  }, [isOpen])

  useEffect(() => {
    if (isEdit && tournament) {
      setInitialValues()
    }
  }, [tournament, isEdit, setInitialValues])

  const handleCountrySelect = (country: Country) => {
    setTournamentState(prevState => ({ ...prevState, country }))
    setDropdownOpenCountry(false)
  }

  const handleTypeSelect = (type: TournamentType) => {
    setTournamentState(prevState => ({ ...prevState, type }))
    setDropdownOpenType(false)
  }

  const handleTeamSelect = (team: Team) => {
    setTournamentState(prevState => {
      const isSelected = prevState.teams.some(selectedTeam => selectedTeam.id === team.id)
      const updatedTeams = isSelected
        ? prevState.teams.filter(selectedTeam => selectedTeam.id !== team.id)
        : [...prevState.teams, team]
      return { ...prevState, teams: updatedTeams }
    })
  }

  const closeModal = () => {
    onClose()
    setInitialValues(true)
    setDropdownOpenCountry(false)
    setDropdownOpenType(false)
    setValidationError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!tournamentState.country || !tournamentState.type || tournamentState.teams.length === 0 || !tournamentState.name || !tournamentState.start_date) {
      setValidationError("Please select values for name, country, type, start date, and add at least one team to tournament.")
      return
    }

    const requestTournament: Tournament = {
      id: tournament?.id || 0,
      name: tournamentState.name,
      description: tournamentState.description,
      start_date: tournamentState.start_date,
      started: tournamentState.started,
      ended: tournamentState.ended,
      country: tournamentState.country?.name || '',
      type: tournamentState.type,
      teams: tournamentState.teams,
      schedule: tournamentState.schedule,
      standings: tournamentState.standings,
    }

    if (isEdit) {
      await TournamentsApi.editTournament(requestTournament, (editedTournament) => {
        console.log('Tournament edited:', editedTournament)
        closeModal()
      })
      return
    }

    await TournamentsApi.newTournament(requestTournament, (newTournament) => {
      console.log('Tournament created:', newTournament)
      closeModal()
    })
  }

  const selectedCountry = countries.find(country => country.name === tournamentState.country?.name) || null
  const selectedTeams = teams.filter(team => tournamentState.teams.some(selectedTeam => selectedTeam.id === team.id)) || null

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title={isEdit ? "Edit Tournament" : "New Tournament"}>
      <ErrorAlert validationError={validationError} />
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
          <label className="block text-gray-700">Country</label>
          <div className="relative" ref={dropdownCountryRef}>
            <div className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 cursor-pointer"
              onClick={() => setDropdownOpenCountry(!dropdownOpenCountry)}>
              {selectedCountry ? (
                <div className="flex items-center">
                  <Image src={selectedCountry.flag} alt={selectedCountry.name} width={30} height={30} className="mr-2" />
                  {selectedCountry.name}
                </div>
              ) : (
                'Select a country'
              )}
            </div>
            {dropdownOpenCountry && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-60 overflow-y-auto">
                {countries.sort((a, b) => a.name.localeCompare(b.name)).map((country, index) => (
                  <div key={index} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleCountrySelect(country)}>
                    <Image src={country.flag} alt={country.name} width={30} height={30} className="mr-2" />
                    {country.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Type</label>
          <div className="relative" ref={dropdownTypeRef}>
            <div className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 cursor-pointer"
              onClick={() => setDropdownOpenType(!dropdownOpenType)}>
              {tournamentState.type ? (
                <div className="flex items-center">
                  {tournamentState.type}
                </div>
              ) : (
                'Select a type'
              )}
            </div>
            {dropdownOpenType && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-60 overflow-y-auto">
                {Object.values(TournamentType).map((type, index) => (
                  <div key={index} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleTypeSelect(type)}>
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Teams</label>
          <div className="relative" ref={dropdownTeamsRef}>
            <div className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 cursor-pointer"
              onClick={() => setDropdownOpenTeams(!dropdownOpenTeams)}>
              {tournamentState.teams.length > 0 ? (
                <div className="flex items-center">
                  {selectedTeams.map(selectedTeam => (
                    <div key={'team-'+selectedTeam.id}>
                      <Image src={selectedTeam.logo_image_file ? URL.createObjectURL(selectedTeam.logo_image_file) : '/images/nologo.svg'} alt={selectedTeam.short_name || 'No Team'} width={30} height={30} className="mr-2" />
                      {selectedTeam.short_name}
                    </div>
                  ))}
                </div>
              ) : (
                'Select teams'
              )}
            </div>
            {dropdownOpenTeams && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-60 overflow-y-auto">
                {teams.sort((a, b) => a.short_name.localeCompare(b.short_name)).map((team, index) => (
                  <div key={team.id} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleTeamSelect(team)}>
                    <input
                      type="checkbox"
                      checked={tournamentState.teams.some(selectedTeam => selectedTeam.id === team.id)}
                      readOnly
                      className="mr-2"
                    />
                    <Image src={team.logo_image_file ? URL.createObjectURL(team.logo_image_file) : '/images/nologo.svg'} alt={team.short_name || 'No Team'} width={30} height={30} className="mr-2" />
                    {team.short_name}
                  </div>
                ))}
              </div>
            )}
          </div>
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
