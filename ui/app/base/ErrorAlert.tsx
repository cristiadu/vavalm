import React from 'react'

interface ErrorAlertProps {
  validationError: string | null;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ validationError }) => {
  if (!validationError) return null

  return (
    <div className="pt-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 text-sm rounded relative mb-4" role="alert">
        <strong className="font-bold">❌ Error: </strong>
        <span className="block sm:inline">{validationError}</span>
      </div>
    </div>
  )
}

export default ErrorAlert
