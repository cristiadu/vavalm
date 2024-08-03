
"use client"

import DOMPurify from 'dompurify'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import CountryApi from '../calls/CountryApi'
import Link from 'next/link'
import TeamsApi, { Team } from '../calls/TeamsApi'
import 'react-quill/dist/quill.snow.css'
import NewTeamModal from './NewTeamModal'

export default function ListTeams() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [newTeamModalOpened, setNewTeamModalOpened] = useState<boolean>(false)
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})

  useEffect(() => {
    CountryApi.fetchCountries((countries) => {
      const countriesToFlagMap: Record<string, string> = {}
      countries.forEach((country) => {
        countriesToFlagMap[country.name] = country.flag
      })
      setCountriesToFlagMap(countriesToFlagMap)
    })

    TeamsApi.fetchTeams(setTeams)
  }, [])

  function asSafeHTML(description: string): React.ReactNode {
    // Sanitize HTML content
    const sanitizedHTML = DOMPurify.sanitize(description)
    return <div className="ql-editor" dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  }

  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()
    const referrer = document.referrer
    const isInternal = referrer && referrer.includes(window.location.hostname)
    if (isInternal && referrer !== '') {
      router.back()
    } else {
      router.push('/')
    }
  }

  const openNewTeamModal = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()
    setNewTeamModalOpened(true)
  }

  const closeNewTeamModal = () => {
    setNewTeamModalOpened(false)
    TeamsApi.fetchTeams(setTeams)
  }

  // List all teams in a table/grid
  return (
    <>
      <NewTeamModal isOpen={newTeamModalOpened} onClose={closeNewTeamModal} />
      <div className="flex min-h-screen flex-col items-center p-24">
        <header className="w-full flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Teams</h1>
          <div className="space-x-4">
            <Link href="#" onClick={handleBackClick} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
              Back
            </Link>
            <Link href="#" onClick={openNewTeamModal} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">
              New Team
            </Link>
          </div>
        </header>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Logo
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Full Name
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.map((team) => (
              <tr key={team.id}>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.id}</td>
                <td className="py-4 whitespace-nowrap text-sm text-gray-500">
                  {team.logo_image_file && team.logo_image_file instanceof Blob && (
                    <Image
                      width={600}
                      height={600}
                      src={URL.createObjectURL(team.logo_image_file)}
                      alt={`${team.short_name} logo`}
                      className='rounded-lg w-24 h-24 shadow-lg'
                    />
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.short_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.full_name}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900"> {team.country && (
                  <span className="flex items-center">
                    <Image src={countriesToFlagMap[team.country]} alt={team.country} width={30} height={30} className="mr-2" />
                    {team.country}
                  </span>)}
                </td>
                <td className="px-3 py-4 whitespace-normal text-sm font-medium text-gray-500">
                  <div className="ql-container ql-snow" style={{ border: "0" }}>{asSafeHTML(team.description || "")}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
