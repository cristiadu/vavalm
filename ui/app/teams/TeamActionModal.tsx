"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import CountryApi, { Country } from '../calls/CountryApi'
import TeamsApi, { Team } from '../calls/TeamsApi'
import Modal from '../base/Modal'
import { ItemActionModalProps } from '../common/CommonModels'
import ErrorAlert from '../base/ErrorAlert'
import 'react-quill/dist/quill.snow.css'
import { quill_config } from '../base/Configs'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

const initialState : Team = {
  short_name: '',
  logo_image_file: null,
  full_name: '',
  description: '',
  country: '',
}

const TeamActionModal: React.FC<ItemActionModalProps> = ({ isOpen, onClose, isEdit, object }) => {
  const team = object as Team
  const [validationError, setValidationError] = useState<string | null>(null)
  const [teamState, setTeamState] = useState<Team>(initialState)
  const [imageSrc, setImageSrc] = useState('images/nologo.svg')
  const [countries, setCountries] = useState<Country[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownCountryRef = useRef<HTMLDivElement>(null)
  const selectedCountry = countries.find(country => country.name === teamState.country) || null

  const setInitialValues = useCallback((cleanup: boolean = false) => {
    if (isEdit && team && !cleanup) {
      setTeamState({
        full_name: team.full_name,
        short_name: team.short_name,
        description: team.description,
        logo_image_file: team.logo_image_file,
        country: team.country,
      })
    } else {
      setTeamState(initialState)
    }
  }, [isEdit, team])

  useEffect(() => {
    const handleClickOutsideDropdown = (event: MouseEvent) => {
      if (dropdownCountryRef.current && !dropdownCountryRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
  
    document.addEventListener('mousedown', handleClickOutsideDropdown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDropdown)
    }
  })

  useEffect(() => {
    if (isOpen) {
      CountryApi.fetchCountries(setCountries)
    }
  }, [isOpen])

  useEffect(() => {
    if (isEdit && team) {
      setInitialValues()
    }
  }, [team, isEdit, setInitialValues])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageSrc(reader.result as string)
        setTeamState({ ...teamState, logo_image_file: file })
      }
      reader.readAsDataURL(file)
    }
  }

  const closeModal = () => {
    onClose()
    setInitialValues(true)
    setImageSrc('/images/nologo.svg')
    setDropdownOpen(false)
    setValidationError(null)
  }

  const handleCountrySelect = (country: Country) => {
    setTeamState({ ...teamState, country: country.name })
    setDropdownOpen(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const requestTeam: Team = {
      id: team?.id,
      short_name: teamState.short_name,
      logo_image_file: teamState.logo_image_file,
      full_name: teamState.full_name,
      description: teamState.description,
      country: selectedCountry?.name || '',
    }

    if(!requestTeam.short_name || !requestTeam.full_name || !requestTeam.country) {
      setValidationError('Please fill in all required fields: Short Name, Full Name, Country')
      return
    }

    if (isEdit) {
      await TeamsApi.editTeam(requestTeam, (editedTeam: Team) => {
        console.log('Team edited', editedTeam)
        closeModal()
      })
      return
    }

    await TeamsApi.newTeam(requestTeam, (newTeam: Team) => {
      console.log('Team created', newTeam)
      closeModal()
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title={isEdit ? "Edit Team" : "New Team"}>
      <ErrorAlert validationError={validationError} />
      <form className="w-full max-w-2xl mx-auto" onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2 mb-4 items-center">
          <div className="w-full md:w-1/2 px-4 mb-6 md:mb-0">
            <div className="border w-full p-2 m-2 max-w-screen-sm max-h-96">
              <Image
                width={600}
                height={600}
                className="w-full h-auto max-w-screen-sm max-h-80"
                src={teamState.logo_image_file ? URL.createObjectURL(teamState.logo_image_file) : imageSrc} 
                alt="Team Logo"
              />
            </div>
            <div className="md:w-1/3">
              <label className="uppercase tracking-wide text-gray-700 text-xs font-bold" htmlFor="team-logo">
                Logo
              </label>
            </div>
            <div>
              <input
                className="w-full text-sm text-gray-700 bg-gray-200 border border-gray-200 rounded
                  file:mr-4 file:py-3 file:px-4 focus:outline-none cursor-pointer
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-500 file:text-white
                  hover:file:bg-blue-800"
                id="team-logo"
                type="file"
                onChange={handleImageChange}
              />
            </div>
          </div>
          <div className="w-full md:w-1/2 px-4">
            <div className="w-full">
              <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="full-name">
                Full Name
              </label>
              <input className="w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" 
                value={teamState.full_name} 
                onChange={(event) => setTeamState({ ...teamState, full_name: event.target.value })}
                id="full-name" name="full-name" type="text" placeholder="Full Name" />
            </div>
            <div className="w-full mt-4">
              <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="short-name">
                Short Name
              </label>
              <input className="w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" 
                value={teamState.short_name} 
                onChange={(event) => setTeamState({ ...teamState, short_name: event.target.value })}
                id="short-name" name="short-name" type="text" placeholder="Short Name" />
            </div>
            <div className="w-full mt-4">
              <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="country">
                Country
              </label>
              <div className="relative" ref={dropdownCountryRef}>
                <div className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 cursor-pointer" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  {selectedCountry ? (
                    <div className="flex items-center">
                      <Image src={selectedCountry.flag} alt={selectedCountry.name} width={30} height={30} className="mr-2" />
                      {selectedCountry.name}
                    </div>
                  ) : (
                    'Select a country'
                  )}
                </div>
                {dropdownOpen && (
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
          </div>
        </div>
        <div className="flex flex-wrap -mx-2 pb-20">
          <div className="w-full px-4">
            <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="description">
              Description
            </label>
            <ReactQuill
              value={teamState.description}
              onChange={(value) => setTeamState({ ...teamState, description: value })}
              className="h-96"
              placeholder="Description"
              modules={quill_config}
            />
          </div>
        </div>
        <div className="flex flex-wrap w-full px-4">
          <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-800">
            Submit
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default TeamActionModal
