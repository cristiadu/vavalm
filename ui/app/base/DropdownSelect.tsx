import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface DropdownSelectProps<T> {
  dropdownName: string
  items: T[]
  selectedItems: T[]
  onSelect: (item: T) => void
  displayKey: keyof T
  imageKey?: keyof T
  placeholder: string
  shouldFormatImageSrc?: boolean
  isMultiSelect: boolean
  styleCssOnValue?: (value: any) => string
}

const DropdownSelect = <T,>({
  dropdownName,
  items,
  selectedItems,
  onSelect,
  displayKey,
  imageKey,
  placeholder,
  isMultiSelect,
  shouldFormatImageSrc,
  styleCssOnValue,
}: DropdownSelectProps<T>) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (item: T) => {
    if (isMultiSelect) {
      onSelect(item)
    } else {
      onSelect(item)
      setDropdownOpen(false)
    }
  }

  const sortItemsByDisplayKey = (displayKey: keyof T): ((a: T, b: T) => number) => {
    return (a, b) => (a[displayKey] as string).localeCompare(b[displayKey] as string)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 cursor-pointer"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {selectedItems.length > 0 ? (
          <div className="flex items-center">
            {selectedItems.map((selectedItem , index) => (
              <div key={`selectedItem-${index}`}>
                {imageKey && (
                  <Image
                    src={selectedItem[imageKey] && selectedItem[imageKey] instanceof Blob ? URL.createObjectURL(selectedItem[imageKey]) : !shouldFormatImageSrc ? selectedItem[imageKey] as string: '/images/nologo.svg'}
                    alt={selectedItem[displayKey] as string}
                    width={30}
                    height={30}
                    className="ml-2 mr-2 inline-block"
                  />
                )}
                <span className={styleCssOnValue && styleCssOnValue(selectedItem[displayKey])}>{String(selectedItem[displayKey])}</span>
              </div>
            ))}
          </div>
        ) : (
          placeholder
        )}
      </div>
      {dropdownOpen && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-60 overflow-y-auto">
          {items.sort(sortItemsByDisplayKey(displayKey)).map((item, index) => (
            <div
              key={`${dropdownName}-${index}`}
              className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(item)}
            >
              {isMultiSelect && (
                <input
                  type="checkbox"
                  checked={selectedItems.some((selectedItem) => selectedItem[displayKey] === item[displayKey])}
                  readOnly
                  className="mr-2"
                />
              )}
              {imageKey && (
                <Image
                  src={item[imageKey] && item[imageKey] instanceof Blob ? URL.createObjectURL(item[imageKey]) : !shouldFormatImageSrc ? item[imageKey] as string: '/images/nologo.svg'}
                  alt={item[displayKey] as string}
                  width={30}
                  height={30}
                  className="mr-2"
                />
              )}
              <span className={styleCssOnValue && styleCssOnValue(item[displayKey])}>{String(item[displayKey])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DropdownSelect
