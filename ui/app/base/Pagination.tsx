import React, { useState, useEffect } from 'react'
import { LIMIT_PER_PAGE_INITIAL_VALUE } from '../api/models/constants'

interface PaginationProps {
  totalItems: number
  onPageChange: (_limit: number, _offset: number) => void
  limitValue?: number
}

const Pagination: React.FC<PaginationProps> = ({ totalItems, onPageChange, limitValue = LIMIT_PER_PAGE_INITIAL_VALUE}) => {
  const [limit, setLimit] = useState(limitValue)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [showPageSelect, setShowPageSelect] = useState(false)

  useEffect(() => {
    setTotalPages(Math.ceil(totalItems / limit))
  }, [totalItems, limit])

  useEffect(() => {
    setLimit(limitValue)
  }, [limitValue])

  const handlePreviousPage = (): void => {
    const newCurrentPage = Math.max(currentPage - 1, 1)
    const newOffset = (newCurrentPage - 1) * limit

    setCurrentPage(newCurrentPage)
    onPageChange(limit, newOffset)
  }

  const handleNextPage = (): void => {
    const newCurrentPage = Math.min(currentPage + 1, totalPages)
    const newOffset = (newCurrentPage - 1) * limit

    setCurrentPage(newCurrentPage)
    onPageChange(limit, newOffset)
  }

  const handlePageSelect = (page: number): void => {
    const newOffset = (page - 1) * limit
    setCurrentPage(page)
    onPageChange(limit, newOffset)
    setShowPageSelect(false)
  }

  return (
    <div className="flex items-center justify-center space-x-4 mt-4">
      <button 
        onClick={handlePreviousPage} 
        disabled={currentPage === 1} 
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:bg-gray-300"
      >
        Previous
      </button>

      {/* Page selector dropdown */}
      <div className="relative">
        {showPageSelect && (
          <div className="absolute bottom-full right-0 mb-1 w-32 bg-white rounded-md shadow-lg z-10">
            <div className="py-1 max-h-60 overflow-y-auto">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageSelect(page)}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    currentPage === page
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Page {page}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => setShowPageSelect(!showPageSelect)}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 flex items-center"
        >
          <span>Page {currentPage} of {totalPages}</span>
          <svg
            className={`w-4 h-4 ml-2 transition-transform ${showPageSelect ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <button 
        onClick={handleNextPage} 
        disabled={currentPage >= totalPages} 
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:bg-gray-300"
      >
        Next
      </button>
    </div>
  )
}

export default Pagination
