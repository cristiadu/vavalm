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
  const brand = pickGenerationValue(data.TEAM_NOUNS)
  switch (randomInt(4)) {
  case 0: return brand
  case 1: return `${brand} ${pickGenerationValue(data.TEAM_SUFFIXES)}`
  case 2: return `${pickGenerationValue(data.TEAM_ADJECTIVES)} ${brand}`
  default: return `Team ${brand}`
  }
}

/** Keeps the recognizable words in the team name, without an arbitrary number suffix. */
export const generateTeamShortName = (fullName: string): string => fullName.split(' ')
  .filter(word => word !== 'Team' && !data.TEAM_SUFFIXES.includes(word))
  .join('')

/** Uses the script's simple, numeric, stylized, combined and leetspeak nicknames. */
export const generatePlayerNickname = (): string => {
  const pattern = randomInt(5)
  let nickname = pickGenerationValue(data.NICKNAMES)
  if (pattern === 1) return `${nickname}${randomInt(1, 100)}`
  if (pattern === 2) return `${pickGenerationValue(['x', 'i', 'o', 'v', 's1', 'The', 'Mr', 'Sir', ''])}${nickname}${pickGenerationValue(['x', 'z', 'y', 'TTV', 'YT', 'Pro', 'TV', ''])}`
  if (pattern === 3) return nickname + pickGenerationValue(data.NICKNAMES.filter(value => value !== nickname))
  if (pattern === 4 && randomInt(100) < 50) {
    for (const [letter, digit] of [['a', '4'], ['e', '3'], ['i', '1'], ['o', '0'], ['s', '5'], ['t', '7']]) {
      if (nickname.toLowerCase().includes(letter) && randomInt(100) < 70) nickname = nickname.replace(new RegExp(letter, 'gi'), digit)
    }
  }
  return nickname
}

/** Composes tournament names from the script's sponsors, regions and event titles. */
export const generateTournamentName = (year: number): string => {
  const words: string[] = []
  if (randomInt(100) < 40) words.push(pickGenerationValue(data.TOURNAMENT_PREFIXES))
  if (randomInt(100) < 70) words.push(pickGenerationValue(data.SPONSORS))
  if (randomInt(100) < 80) words.push(pickGenerationValue(data.REGIONS))
  words.push(pickGenerationValue(data.TOURNAMENT_TYPES))
  if (randomInt(100) < 30) words.push(String(year))
  if (randomInt(100) < 20) words.push(pickGenerationValue(data.TOURNAMENT_SUFFIXES))
  return words.join(' ')
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
