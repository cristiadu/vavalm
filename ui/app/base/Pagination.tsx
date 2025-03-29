import React, { useState, useEffect } from 'react'
import { LIMIT_PER_PAGE_INITIAL_VALUE } from '../api/models/constants'

interface PaginationProps {
  totalItems: number
  onPageChange: (limit: number, offset: number) => void
  limitValue?: number
}

const Pagination: React.FC<PaginationProps> = ({ totalItems, onPageChange, limitValue = LIMIT_PER_PAGE_INITIAL_VALUE}) => {
  const [limit, setLimit] = useState(limitValue)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    setTotalPages(Math.ceil(totalItems / limit))
  }, [totalItems, limit])

  useEffect(() => {
    setLimit(limitValue)
  }, [limitValue])

  const handlePreviousPage = () => {
    const newCurrentPage = Math.max(currentPage - 1, 1)
    const newOffset = (newCurrentPage - 1) * limit

    setCurrentPage(newCurrentPage)
    onPageChange(limit, newOffset)
  }

  const handleNextPage = () => {
    const newCurrentPage = Math.min(currentPage + 1, totalPages)
    const newOffset = (newCurrentPage - 1) * limit

    setCurrentPage(newCurrentPage)
    onPageChange(limit, newOffset)
  }

  return (
    <div className="flex justify-between mt-4">
      <button 
        onClick={handlePreviousPage} 
        disabled={currentPage === 1} 
        className="bg-gray-500 text-white mr-4 px-4 py-2 rounded hover:bg-gray-700 disabled:bg-gray-300"
      >
        Previous
      </button>
      <span className="text-gray-700 py-2">Page {currentPage} of {totalPages}</span>
      <button 
        onClick={handleNextPage} 
        disabled={currentPage >= totalPages} 
        className="bg-gray-500 text-white px-4 py-2 ml-4 rounded hover:bg-gray-700 disabled:bg-gray-300"
      >
        Next
      </button>
    </div>
  )
}

export default Pagination
