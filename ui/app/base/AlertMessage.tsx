import React from 'react'
import { asWord } from '@/base/StringUtils'

export enum AlertType {
  ERROR = 'error',
  WARNING = 'warning',
  SUCCESS = 'success',
  INFO = 'info',
}

interface AlertMessageProps {
  message: string | null
  type: AlertType
}

const getIconForType = (type: AlertType): string => {
  switch (type) {
  case AlertType.ERROR:
    return '❌'
  case AlertType.WARNING:
    return '⚠️'
  case AlertType.SUCCESS:
    return '✅'
  case AlertType.INFO:
    return 'ℹ️'
  default:
    return '❓'
  }
}

const getColorForType = (type: AlertType): string => {
  switch (type) {
  case AlertType.ERROR:
    return 'bg-red-100 border-red-400 text-red-700'
  case AlertType.WARNING:
    return 'bg-yellow-100 border-yellow-400 text-yellow-700'
  case AlertType.SUCCESS:
    return 'bg-green-100 border-green-400 text-green-700'
  case AlertType.INFO:
    return 'bg-blue-100 border-blue-400 text-blue-700'
  default:
    return 'bg-gray-100 border-gray-400 text-gray-700'
  }
}

const AlertMessage: React.FC<AlertMessageProps> = ({ message, type }) => {
  if (!message) return null

  return (
    <div className="pt-4">
      <div className={`border px-4 py-3 text-sm rounded relative mb-4 ${getColorForType(type)}`}>
        <strong className="font-bold">{getIconForType(type)} {asWord(type)}: </strong>
        <span className="block sm:inline">{message}</span>
      </div>
    </div>
  )
}

export default AlertMessage
