import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import ImageAutoSize from './ImageAutoSize'

interface DropdownSelectProps<T> {
  dropdownName: string
  items: T[]
  selectedItems: T[]
  onSelect: (_item: T) => void
  displayKey: keyof T
  imageKey?: keyof T
  placeholder: string
  isMultiSelect: boolean
  imageDimensions?: { width: number; height: number }
  styleCssOnValue?: (_value: string) => string
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
  imageDimensions = { width: 32, height: 32 },
  styleCssOnValue,
}: DropdownSelectProps<T>): React.ReactNode => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClickOutside])

  const handleSelect = useCallback((item: T) => {
    onSelect(item)
    if (!isMultiSelect) {
      setDropdownOpen(false)
    }
  }, [onSelect, isMultiSelect])

  const sortedItems = useMemo(() => {
    return items.sort((a, b) => (a[displayKey] as string).localeCompare(b[displayKey] as string))
  }, [items, displayKey])

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
                  <ImageAutoSize
                    imageBlob={selectedItem[imageKey] as Blob}
                    fallbackSrc="/images/nologo.svg"
                    src={selectedItem[imageKey] && !(selectedItem[imageKey] instanceof Blob) ? selectedItem[imageKey] as string: undefined}
                    alt={selectedItem[displayKey] as string}
                    width={imageDimensions.width}
                    height={imageDimensions.height}
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
          {sortedItems.map((item, index) => (
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
                <ImageAutoSize
                  imageBlob={item[imageKey] as Blob}
                  fallbackSrc="/images/nologo.svg"
                  src={item[imageKey] && !(item[imageKey] instanceof Blob) ? item[imageKey] as string: undefined}
                  alt={item[displayKey] as string}
                  width={imageDimensions.width}
                  height={imageDimensions.height}
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