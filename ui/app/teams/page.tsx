
"use client"

import DOMPurify from 'dompurify'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import CountryApi from '../calls/CountryApi'
import Link from 'next/link'
import TeamsApi, { Team } from '../calls/TeamsApi'
import 'react-quill/dist/quill.snow.css'
import TeamActionModal from './TeamActionModal'
import { handleBackClick } from '../base/LinkUtils'

export default function ListTeams() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [teamActionModalOpened, setTeamActionModalOpened] = useState<boolean>(false)
  const [countriesToFlagMap, setCountriesToFlagMap] = useState<Record<string, string>>({})
  const [isEditActionOpened, setIsEditActionOpened] = useState<boolean>(false)
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null)

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

  const openNewTeamModal = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()
    setIsEditActionOpened(false)
    setTeamActionModalOpened(true)
  }

  const closeNewTeamModal = () => {
    setTeamActionModalOpened(false)
    setIsEditActionOpened(false)
    TeamsApi.fetchTeams(setTeams)
  }

  const handleView = (team: Team) => {
    // Send user to player details page
    router.push(`/teams/${team.id}`)
  }

  const handleEdit = (team: Team) => {
    // Use same modal as NewPlayerModal but with prefilled data
    setTeamToEdit(team)
    setIsEditActionOpened(true)
    setTeamActionModalOpened(true)
  }

  const handleDelete = (team: Team) => {
    // Show confirm dialog and if confirmed delete player
    const confirmed = confirm(`Are you sure you want to delete team '${team.short_name}'?`)
    if(!confirmed) return

    TeamsApi.deleteTeam(team, () => {
      TeamsApi.fetchTeams(setTeams)
    })
    
  }

  // List all teams in a table/grid
  return (
    <>
      <TeamActionModal isOpen={teamActionModalOpened} onClose={closeNewTeamModal} isEdit={isEditActionOpened} object={teamToEdit} />
      <div className="flex min-h-screen flex-col items-center p-24">
        <header className="w-full flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Teams</h1>
          <div className="space-x-4">
            <Link href="#" onClick={(e) => handleBackClick(e, router)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
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
              <th className="py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase w-auto">
                Actions
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
                <td className="py-4 whitespace-nowrap text-sm text-left text-gray-900 w-auto">
                  <button onClick={() => handleView(team)} className="text-blue-600 hover:text-blue-900 p0">👀</button>
                  <button onClick={() => handleEdit(team)} className="text-blue-600 hover:text-blue-900 p0">✏️</button>
                  <button onClick={() => handleDelete(team)} className="text-red-600 hover:text-red-900 p0">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
