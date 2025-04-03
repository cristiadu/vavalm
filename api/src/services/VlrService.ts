import * as cheerio from 'cheerio'
import { VLR_URL, VlrPlayer, VlrTeam } from '@/models/Vlr'
import { countryCodeToCountryName } from '@/base/StringUtils'
import { PlayerRole } from '@/models/enums'

import { upsertTeamData } from '@/services/TeamService'
import { updateOrCreatePlayer } from '@/services/PlayerService'

/**
 * Imports teams and players from VLR.gg website.
 * @returns {Promise<Array>} - The teams imported from VLR.
 */
export const importTeamsAndPlayersFromVLR = async (): Promise<VlrTeam[]> => {
  const vlrTeamsData = await fetchTeamsDataFromVLR()
  console.log(`Fetched ${vlrTeamsData.length} teams from VLR`)

  for (const vlrTeamData of vlrTeamsData) {
    const team = await upsertTeamData(vlrTeamData)

    for (const playerData of vlrTeamData.players) {
      await updateOrCreatePlayer(playerData, team)
    }
  }

  return vlrTeamsData
}


/**
 * Fetches teams' data from VLR.gg website.
 * @returns {Promise<Array>} - A promise that resolves to an array of teams' data.
 */
export const fetchTeamsDataFromVLR = async (): Promise<VlrTeam[]> => {
  const response = await fetch(`${VLR_URL}/rankings/all`)
  const body = await response.text()
  const $ = cheerio.load(body)

  const teams: VlrTeam[] = []

  const teamElements = $('tr').has('td')
  for (const el of teamElements) {
    const short_name = $(el).find('td').first().next().attr('data-sort-value')
    const full_name = $(el).find('td').first().next().attr('data-sort-value')
    const country = $(el).find('.rank-item-team-country').text().trim()
    const logo_image_file = $(el).find('td').first().next().find('img').attr('src')
    const logo_url = (logo_image_file ?? '').includes(VLR_URL) ? VLR_URL + logo_image_file : 'https:' + logo_image_file
    const href = $(el).find('td').first().next().find('a').attr('href')
    const vlrTeamId = href ? href.split('/')[2] : null

    if (!vlrTeamId) {
      continue
    }

    const players = await fetchPlayerDataFromVLRTeamPage(vlrTeamId)

    teams.push({
      id: vlrTeamId,
      short_name,
      full_name,
      country,
      logo_url: logo_url,
      players,
    } as VlrTeam)
  }

  return teams
}

/**
 * Fetches player data from VLR.gg website.
 * @param teamId - The ID of the team.
 * @returns {Promise<Array>} - A promise that resolves to an array of players' data.
 */
export const fetchPlayerDataFromVLRTeamPage = async (teamId: string): Promise<VlrPlayer[]> => {
  if (!teamId) {
    return []
  }

  const response = await fetch(`${VLR_URL}/team/${teamId}`)
  const body = await response.text()
  const $ = cheerio.load(body)

  const players: VlrPlayer[] = []

  const teamRoster = $('.wf-card').find('.team-roster-item')

  for (const el of teamRoster) {
    const isStaffOrInactive = $(el).has(".wf-tag").text()

    if (isStaffOrInactive) {
      continue
    }

    const player_id = $(el).find('a').attr('href')?.split('/')[2]
    if (!player_id) {
      console.log('Player ID not found')
      continue
    }

    const playerInfo = await fetchPlayerDataFromVLRPlayerPage(player_id)
    const nickname = playerInfo?.nickname ?? $(el).find('.team-roster-item-name-alias').text().trim()
    const full_name = playerInfo?.full_name ?? $(el).find('.team-roster-item-name-real').text().trim()
    const classAttr = $(el).find('.team-roster-item-name-alias').find('i').attr('class')
    const country = classAttr ? classAttr.split(' ')[1].replace('mod-', '') : ''
    const fullCountryName = playerInfo?.country ?? await countryCodeToCountryName(country)
    const role = playerInfo?.role ?? PlayerRole.FLEX

    players.push({
      id: player_id,
      nickname,
      full_name,
      country: fullCountryName,
      role,
    } as VlrPlayer)
  }

  return players
}

/**
 * Fetches player data from VLR.gg website.
 * @param playerId - The ID of the player.
 * @returns {Promise<VlrPlayer[]>} - A promise that resolves to an array of players' data.
 * 
  */
export const fetchPlayerDataFromVLRPlayerPage = async (playerId: string): Promise<VlrPlayer | null> => {
  if (!playerId) {
    return null
  }

  try {
    const response = await fetch(`${VLR_URL}/player/${playerId}?timespan=90d`)
    const body = await response.text()
    const $ = cheerio.load(body)

    const nickname = $('.player-header .wf-title').text().trim() !== '' ? $('.player-header .wf-title').text().trim() : null
    const full_name = $('.player-header .player-real-name').text().trim() !== '' ? $('.player-header .player-real-name').text().trim() : null
    const classAttr = $('.player-header').find('.flag').attr('class')
    const country = classAttr ? classAttr.split(' ')[1].replace('mod-', '') : ''
    const fullCountryName = country ? await countryCodeToCountryName(country) : null
    const agentsPlayedHTML = $('.player-summary-container-1 .wf-table tbody').find('tr')
    const role = await getPlayerRoleBasedOnVlrStats($, agentsPlayedHTML)

    return {
      nickname,
      full_name,
      country: fullCountryName,
      role,
    } as VlrPlayer
  } catch (error) {
    console.error('Error fetching player data from player page:', error)
    return null
  }
}

/**
 * Maps the role of a player based on the role statistics from VLR.gg.
 * @param $ - The Cheerio API object for parsing HTML
 * @param agentsPlayedHTML - The tr lines of the HTML that shows the agents the player plays.
 * @returns {PlayerRole} - The role of the player.
 */
const getPlayerRoleBasedOnVlrStats = async ($: ReturnType<typeof cheerio.load>, agentsPlayedHTML: cheerio.Cheerio): Promise<PlayerRole> => {
  type AgentData = { name: string | undefined; rounds: number };
  
  const agentsPlayed: AgentData[] = []
  
  agentsPlayedHTML.each(function(_: number, element: cheerio.Element) {
    const imgAlt = $(element).find('img').first().attr('alt')
    const roundsText = $(element).find('td').eq(2).text()
    const rounds = roundsText ? parseInt(roundsText) || 0 : 0
    
    agentsPlayed.push({
      name: imgAlt,
      rounds: rounds,
    })
  })

  const duelists = ['jett', 'raze', 'phoenix', 'yoru', 'reyna', 'neon', 'iso']
  const initiators = ['sova', 'breach', 'skye', 'kayo', 'gekko', 'fade']
  const controllers = ['omen', 'astra', 'brimstone', 'viper', 'clove', 'harbor']
  const sentinels = ['killjoy', 'cypher', 'sage', 'chamber', 'deadlock', 'vyse']

  let duelistsRoundPlayed = 0
  let initiatorsRoundPlayed = 0
  let controllersRoundPlayed = 0
  let sentinelsRoundPlayed = 0

  for (const agent of agentsPlayed) {
    if (!agent.name) continue
    
    const agentName = agent.name.toLowerCase()
    if (duelists.includes(agentName)) {
      duelistsRoundPlayed += agent.rounds
    } else if (initiators.includes(agentName)) {
      initiatorsRoundPlayed += agent.rounds
    } else if (controllers.includes(agentName)) {
      controllersRoundPlayed += agent.rounds
    } else if (sentinels.includes(agentName)) {
      sentinelsRoundPlayed += agent.rounds
    }
  }

  const maxPlayed = Math.max(duelistsRoundPlayed, initiatorsRoundPlayed, controllersRoundPlayed, sentinelsRoundPlayed, 1)

  if (maxPlayed === duelistsRoundPlayed) {
    return PlayerRole.DUELIST
  } else if (maxPlayed === initiatorsRoundPlayed) {
    return PlayerRole.INITIATOR
  } else if (maxPlayed === controllersRoundPlayed) {
    return PlayerRole.CONTROLLER
  } else if (maxPlayed === sentinelsRoundPlayed) {
    return PlayerRole.SENTINEL
  }

  return PlayerRole.FLEX
}
