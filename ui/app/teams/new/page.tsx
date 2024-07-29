"use client"

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface Country {
  name: string
  flag: string
}

const quill_modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'], // toggled buttons
    ['blockquote', 'code-block', 'link'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
    [{ 'color': [] }, { 'background': [] }], // dropdown with defaults from theme
    [{ 'align': [] }],
  ],
}

export default function NewTeam() {
  const [imageSrc, setImageSrc] = useState('https://tecdn.b-cdn.net/img/new/slides/041.jpg')
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [description, setDescription] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,flags')
      .then(response => response.json())
      .then(data => {
        const countryData = data.map((country: { name: { common: string }, flags: { png: string } }) => ({
          name: country.name.common,
          flag: country.flags.png,
        }))
        setCountries(countryData)
      })
      .catch(error => console.error('Error fetching countries:', error))
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageSrc(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setDropdownOpen(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData()
    formData.append('image', imageSrc)
    formData.append('fullName', (event.target as any)['full-name'].value)
    formData.append('shortName', (event.target as any)['short-name'].value)
    formData.append('country', selectedCountry?.name || '')
    formData.append('description', description)

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        console.log("Network response was not ok: ", Array.from(formData).map(([key, value]) => `${key}: ${value}`).join(', '))
        return
      }

      const result = await response.json()
      console.log('Success:', result)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <form className="w-full max-w-2xl mx-auto" onSubmit={handleSubmit}>
      <div className="flex flex-wrap -mx-2 mb-4 items-center">
        <div className="w-full md:w-1/2 px-4 mb-6 md:mb-0">
          <div className="border w-full p-2 m-2 max-w-screen-sm max-h-96">
            <Image
              width={600}
              height={600}
              className="w-full h-auto max-w-screen-sm max-h-80"
              src={imageSrc}
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
            <input className="w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="full-name" name="full-name" type="text" placeholder="Full Name" />
          </div>
          <div className="w-full mt-4">
            <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="short-name">
              Short Name
            </label>
            <input className="w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="short-name" name="short-name" type="text" placeholder="Short Name" />
          </div>
          <div className="w-full mt-4">
            <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="country">
              Country
            </label>
            <div className="relative" ref={dropdownRef}>
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
            value={description}
            onChange={setDescription}
            className="h-96"
            placeholder="Description"
            modules={quill_modules}
          />
        </div>
      </div>
      <div className="flex flex-wrap w-full px-4">
        <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-800">
          Submit
        </button>
      </div>
    </form>
  )
}
