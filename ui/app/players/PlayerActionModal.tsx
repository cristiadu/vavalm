import { useState, useEffect, useCallback } from 'react'
import { editPlayer, newPlayer } from '@/api/PlayersApi'
import { getRoleBgColor, Player, PlayerAttributes, PlayerRole } from '@/api/models/Player'
import Modal from '@/base/Modal'
import { fetchCountries } from '@/api/CountryApi'
import {Country} from '@/api/models/Country'
import { fetchAllTeams } from '@/api/TeamsApi'
import { Team } from '@/api/models/Team'
import { ItemActionModalProps } from '@/common/CommonModels'
import AlertMessage, { AlertType } from '@/base/AlertMessage'
import DropdownSelect from '@/base/DropdownSelect'
import { EnumWithFieldName } from '@/api/models/types'

const defaultPlayerAttributes: PlayerAttributes = {
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

const initialPlayerState = {
  nickname: '',
  fullName: '',
  age: 15,
  role: null as PlayerRole | null,
  teamId: null as number | null,
  playerAttributes: defaultPlayerAttributes,
  selectedCountry: null as Country | null,
}

const PlayerActionModal: React.FC<ItemActionModalProps> = ({ isOpen, onClose, isEdit, object }) => {
  const player = object ? object as Player: null
  const [playerState, setPlayerState] = useState(initialPlayerState)
  const [teams, setTeams] = useState<Team[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  const setInitialValues = useCallback((cleanup: boolean = false) => {
    if (isEdit && player && !cleanup) {
      setPlayerState({
        nickname: player.nickname,
        fullName: player.full_name,
        age: player.age,
        teamId: player.team_id,
        role: player.role,
        playerAttributes: player.player_attributes,
        selectedCountry: countries.find(country => country.name === player.country) || null,
      })
    } else {
      setPlayerState(initialPlayerState)
    }
  }, [isEdit, player, countries])

  useEffect(() => {
    if (isOpen) {
      fetchCountries(setCountries)
      fetchAllTeams(setTeams)
    }
  }, [isOpen])

  useEffect(() => {
    if (isEdit && player) {
      setInitialValues()
    }
  }, [player, isEdit, setInitialValues])

  const handleTeamSelect = (team: Team): void => {
    setPlayerState(prevState => ({ ...prevState, teamId: team.id ?? null }))
  }

  const handleCountrySelect = (country: Country): void => {
    setPlayerState(prevState => ({ ...prevState, selectedCountry: country }))
  }

  const handleRoleSelect = (item: EnumWithFieldName<PlayerRole>): void => {
    setPlayerState({
      ...playerState,
      role: item.value,
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

    if (playerState.teamId === null || playerState.selectedCountry === null || playerState.role === null) {
      setValidationError("Please select values for team, role, and country.")
      return
    }

    const requestPlayer: Player = {
      id: player?.id,
      nickname: playerState.nickname,
      full_name: playerState.fullName,
      age: playerState.age,
      role: playerState.role,
      country: playerState.selectedCountry?.name || '',
      team_id: playerState.teamId,
      player_attributes: playerState.playerAttributes,
    }

    if (isEdit) {
      await editPlayer(requestPlayer, (editedPlayer) => {
        console.debug('Player edited:', editedPlayer)
        closeModal()
      })
      return
    }

    await newPlayer(requestPlayer, (newPlayer) => {
      console.debug('Player created:', newPlayer)
      closeModal()
    })
  }

  const selectedTeam = teams.find(team => team.id === playerState.teamId)

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title={isEdit ? "Edit Player" : "New Player"}>
      <AlertMessage message={validationError} type={AlertType.ERROR} />
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-10 gap-4 mb-4">
          <div className="col-span-8">
            <label className="block text-gray-700">Nickname</label>
            <input
              type="text"
              value={playerState.nickname}
              onChange={(e) => setPlayerState({ ...playerState, nickname: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="block text-gray-700">Age</label>
            <input
              type="number"
              min={15}
              max={50}
              value={playerState.age}
              onChange={(e) => setPlayerState({ ...playerState, age: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Full Name</label>
          <input
            type="text"
            value={playerState.fullName}
            onChange={(e) => setPlayerState({ ...playerState, fullName: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="role">
                Role
          </label>
          {playerState.role && (
            <DropdownSelect
              dropdownName={'role'}
              items={Object.values(PlayerRole).map(value => ({ value }))}
              selectedItems={playerState.role ? [{value: playerState.role}] : []}
              onSelect={handleRoleSelect}
              displayKey="value"
              placeholder="Select a type"
              styleCssOnValue={(value) => getRoleBgColor(value as PlayerRole)}
              isMultiSelect={false} 
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="country">
                Country
            </label>
            <DropdownSelect
              dropdownName={'country'}
              items={countries}
              selectedItems={playerState.selectedCountry ? [playerState.selectedCountry] : []}
              onSelect={handleCountrySelect}
              displayKey="name"
              imageKey="flag"
              placeholder="Select a country"
              imageDimensions={{ width: 32, height: 16 }}
              isMultiSelect={false}
            />
          </div>
          <div>
            <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">Team</label>
            <DropdownSelect
              dropdownName={'teams'}
              items={teams}
              selectedItems={selectedTeam ? [selectedTeam] : []}
              onSelect={handleTeamSelect}
              displayKey="short_name"
              imageKey="logo_image_file"
              placeholder="Select teams"
              isMultiSelect={false} 
            />
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-xl mb-2">Player Attributes</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.keys(defaultPlayerAttributes).map((attribute) => (
              <div key={`modal-player-attribute-${attribute}`} className="mb-2">
                <label className="block text-gray-700 capitalize">{attribute.replace('_', ' ')}</label>
                <input
                  type="number"
                  min={0}
                  max={3}
                  name={attribute}
                  value={playerState.playerAttributes[attribute as keyof PlayerAttributes]}
                  onChange={(e) =>
                    setPlayerState({
                      ...playerState,
                      playerAttributes: {
                        ...playerState.playerAttributes,
                        [attribute]: Number(e.target.value),
                      },
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
    </Modal>
  )
}

export default PlayerActionModal
