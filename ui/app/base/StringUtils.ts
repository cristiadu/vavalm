import DOMPurify from "dompurify"

export const asWord = (key: string): string => {
  const words = key.split('_')
  const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1))
  const formattedString = capitalizedWords.join(' ')
  return formattedString
}

export const asSafeHTML = (description: string): string => {
  // Sanitize HTML content
  return DOMPurify.sanitize(description)
}

