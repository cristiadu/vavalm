import { randomInt } from 'node:crypto'
import data from '@/models/generation-data.json'

/** Picks an entry from the shared generator vocabulary. */
export const pickGenerationValue = (values: string[]): string => values[randomInt(values.length)]

/** Reserves a name, retrying collisions before adding distinct word combinations. */
export const reserveGeneratedName = (generate: () => string, existing: Set<string>, separator = ''): string => {
  let name = generate()
  for (let attempt = 0; existing.has(name) && attempt < 10; attempt++) name = generate()
  const base = name
  let collision = 0
  while (existing.has(name)) {
    let index = collision++
    const words: string[] = []
    do {
      words.unshift(data.NAME_VARIANTS[index % data.NAME_VARIANTS.length])
      index = Math.floor(index / data.NAME_VARIANTS.length) - 1
    } while (index >= 0)
    name = [base, ...words].join(separator)
  }
  existing.add(name)
  return name
}

/** Creates esports brands; ten percent reference 13 round wins or a five-player stack. */
export const generateTeamName = (): string => {
  if (randomInt(100) < 10) {
    return `${pickGenerationValue(data.TEAM_NUMBER_NAMES)} ${pickGenerationValue(data.TEAM_SUFFIXES)}`
  }
  return `${pickGenerationValue(data.NAME_WORDS)} ${pickGenerationValue(data.TEAM_SUFFIXES)}`
}

/** Keeps the recognizable words in the team name, without an arbitrary number suffix. */
export const generateTeamShortName = (fullName: string): string => {
  const words = fullName.split(' ').filter(word => word !== 'Team')
  const distinctiveWords = words.filter(word => !data.TEAM_SUFFIXES.includes(word))
  return (distinctiveWords.length > 0 ? distinctiveWords : words).join('')
}

/** Combines one to three distinct gaming terms into a readable handle. */
export const generatePlayerNickname = (): string => {
  const available = [...data.NICKNAMES]
  const count = randomInt(1, 4)
  const words: string[] = []
  for (let index = 0; index < count; index++) words.push(available.splice(randomInt(available.length), 1)[0])
  return words.join('')
}

/** Uses the common name words with event suffixes and an optional year. */
export const generateTournamentName = (year: number): string => {
  const name = `${pickGenerationValue(data.NAME_WORDS)} ${pickGenerationValue(data.TOURNAMENT_SUFFIXES)}`
  return randomInt(100) < 30 ? `${name} ${year}` : name
}

/** Colors the script's SVG emblems using distinct palette colors, without external services. */
export const generateTeamLogo = (): Buffer => {
  const colors = [...new Set(Object.values(data.LOGO_COLOR_HEX))]
  const primary = pickGenerationValue(colors)
  const secondary = pickGenerationValue(colors.filter(color => color !== primary))
  return Buffer.from(pickGenerationValue(data.SVG_LOGOS)
    .replaceAll('{primary_color}', primary)
    .replaceAll('{secondary_color}', secondary), 'utf8')
}
