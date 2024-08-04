import { useState, useEffect, useRef } from 'react'
import PlayersApi, { Player } from '../calls/PlayersApi'
import Image from 'next/image'
import Modal from '../base/Modal'
import CountryApi, { Country } from '../calls/CountryApi'
import { Team } from '../calls/TeamsApi'

interface NewPlayerModalProps {
  isOpen: boolean
  onClose: () => void
}

const initialPlayerAttributes = {
  clutch: 0,
  awareness: 0,
  aim: 0,
  positioning: 0,
  game_reading: 0,
  resilience: 0,
  confidence: 0,
  strategy: 0,
  adaptability: 0,
  communication: 0,
  unpredictability: 0,
  game_sense: 0,
  decision_making: 0,
  rage_fuel: 0,
  teamwork: 0,
  utility_usage: 0,
}

const NewPlayerModal: React.FC<NewPlayerModalProps> = ({ isOpen, onClose }) => {
  const [nickname, setNickname] = useState('')
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState(0)
  const [teamId, setTeamId] = useState<number | null>(null)
  const [playerAttributes, setPlayerAttributes] = useState(initialPlayerAttributes)
  const [teams, setTeams] = useState<Team[]>([])
  const [dropdownOpenTeam, setDropdownOpenTeam] = useState(false)
  const [dropdownOpenCountry, setDropdownOpenCountry] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      CountryApi.fetchCountries(setCountries)
        .then(() => console.log('Countries fetched'))
      fetchTeams()
    }
  }, [isOpen])

  const fetchTeams = async () => {
    const response = await fetch('http://localhost:8000/teams')
    const data = await response.json()
    // Convert Buffer to Blob
    const teamsWithBlob = data.map((team: any) => {
      if (team.logo_image_file) {
        const blob = new Blob([new Uint8Array(team.logo_image_file.data)], { type: 'image/png' })
        return { ...team, logo_image_file: blob }
      }
      return team
    })
    setTeams(teamsWithBlob)
  }

  const handleTeamSelect = (team: Team) => {
    setTeamId(team.id ?? null)
    setDropdownOpenTeam(false)
  }

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setDropdownOpenCountry(false)
  }

  const closeModal = () => {
    onClose()
    setAge(0)
    setNickname('')
    setFullName('')
    setTeamId(null)
    setPlayerAttributes(initialPlayerAttributes)
    setSelectedCountry(null)
    setDropdownOpenTeam(false)
    setDropdownOpenCountry(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (teamId === null) {
      console.error('Team must be selected')
      return
    }

    const newPlayer: Player = {
      nickname,
      full_name: fullName,
      age,
      country: selectedCountry?.name || '',
      team_id: teamId,
      player_attributes: playerAttributes,
    }

    await PlayersApi.newPlayer(newPlayer, (players) => {
      console.log('Player created:', players)
      closeModal()
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={closeModal}>
      <div className="bg-white p-8 rounded shadow-md w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl">New Player</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-10 gap-4 mb-4">
            <div className="col-span-8">
              <label className="block text-gray-700">Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="country">
                Country
              </label>
              <div className="relative" ref={dropdownRef}>
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
            <div>
              <label className="block text-gray-700">Team</label>
              <div className="relative">
                <div
                  className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 cursor-pointer"
                  onClick={() => setDropdownOpenTeam(!dropdownOpenTeam)}
                >
                  {teams.find(team => team.id === teamId)?.short_name || 'Select a team'}
                </div>
                {dropdownOpenTeam && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-60 overflow-y-auto">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleTeamSelect(team)}
                      >
                        <Image src={team.logo_image_file ? URL.createObjectURL(team.logo_image_file) : ''} alt={team.short_name} width={30} height={30} className="mr-2" />
                        {team.short_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-xl mb-2">Player Attributes</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.keys(initialPlayerAttributes).map((attribute) => (
                <div key={attribute} className="mb-2">
                  <label className="block text-gray-700 capitalize">{attribute.replace('_', ' ')}</label>
                  <input
                    type="number"
                    name={attribute}
                    value={playerAttributes[attribute as keyof typeof initialPlayerAttributes]}
                    onChange={(e) =>
                      setPlayerAttributes({
                        ...playerAttributes,
                        [attribute]: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700">
              Submit
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default NewPlayerModal