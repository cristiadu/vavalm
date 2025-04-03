"use client"

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { handleBackClick } from './LinkUtils'

interface SectionHeaderProps {
  title: string
  action?: (_e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
  actionText?: string
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action, actionText }) => {
  const router = useRouter()

  return (
    <header className="w-full flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="space-x-4">
        <Link href="#" onClick={(e) => handleBackClick(e, router)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
        Back
        </Link>
        {action && actionText && (
          <Link href="#" onClick={action} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">
            {actionText}
          </Link>
        )}
      </div>
    </header>
  )
}

export default SectionHeader
