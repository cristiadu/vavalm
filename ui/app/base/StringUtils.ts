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

export const asFormattedDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(date))
}
