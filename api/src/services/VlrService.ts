import { load } from 'cheerio'
import { VLR_URL, VlrPlayer, VlrTeam } from '../models/Vlr'
import { countryCodeToCountryName } from '../base/StringUtils'
import { downloadImage } from '../base/FileUtils'
import Team from '../models/Team'
import Player from '../models/Player'
import { PlayerRole } from '../models/enums'

/**
 * Imports teams and players from VLR.gg website.
 * @returns {Promise<Array>} - The teams imported from VLR.
 */
export const importTeamsAndPlayersFromVLR = async (): Promise<VlrTeam[]> => {
  const teamsData = await fetchTeamsDataFromVLR()
  for (const teamData of teamsData) {
    // Upsert a team entry
    const logoBlob = await downloadImage(teamData.logo_url)

    const [team, created] = await Team.upsert({
      short_name: teamData.short_name,
      full_name: teamData.full_name,
      country: teamData.country,
      logo_image_file: logoBlob,
    },  {
      returning: true,
      conflictFields: ['short_name'], // Ensure upsert is based on unique constraint
    })

    console.log(`Team ${team.short_name} ${created ? 'created' : 'updated'}`)
    

    for (const playerData of teamData.players) {
      // Upsert a player entry and associate it with the team
      const [player, playerCreated] = await Player.upsert({
        nickname: playerData.nickname,
        full_name: playerData.full_name,
        country: playerData.country,
        team_id: team.id,
        role: playerData.role,
      },{
        returning: true,
        conflictFields: ['nickname'], // Ensure upsert is based on unique constraint
      })

      console.log(`Player ${player.nickname} ${playerCreated ? 'created' : 'updated'} and associated with team ${team.short_name}`)

    }
  }

  return teamsData
}


/**
 * Fetches teams' data from VLR.gg website.
 * @returns {Promise<Array>} - A promise that resolves to an array of teams' data.
 */
export const fetchTeamsDataFromVLR = async (): Promise<VlrTeam[]> => {
  const response = await fetch(`${VLR_URL}/rankings/all`)
  const body = await response.text()
  const $ = load(body)

  const teams: any[] = []

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
  const $ = load(body)

  const players: any[] = []

  const teamRoster = $('.wf-card').find('.team-roster-item')
  
  for (const el of teamRoster) {
    const isStaffOrInactive = $(el).has(".wf-tag").text()

    if(isStaffOrInactive) {
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
    const response = await fetch(`${VLR_URL}/player/${playerId}?timespan=all`)
    const body = await response.text()
    const $ = load(body)

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
 * @param agentsPlayedHTML - The tr lines of the HTML that shows the agents the player plays.
 * @returns {PlayerRole} - The role of the player.
 */
const getPlayerRoleBasedOnVlrStats = async ($:any, agentsPlayedHTML: any): Promise<PlayerRole> => {
  const agentsPlayed = agentsPlayedHTML.map((_: any, line: any) => {
    return {name: $(line).find('img').first().attr('alt'), rounds: parseInt($(line).find('td').eq(2).text())}
  }).get()

  const duelists = ['jett', 'raze', 'phoenix', 'yoru', 'reyna', 'neon', 'iso']
  const initiators = ['sova', 'breach', 'skye', 'kayo', 'gekko', 'fade']
  const controllers = ['omen', 'astra', 'brimstone', 'viper', 'clove', 'harbor']
  const sentinels = ['killjoy', 'cypher', 'sage', 'chamber', 'deadlock', 'vyse']

  let duelistsRoundPlayed = 0
  let initiatorsRoundPlayed = 0
  let controllersRoundPlayed = 0
  let sentinelsRoundPlayed = 0

  for (const agent of agentsPlayed) {
    if (duelists.includes(agent.name)) {
      duelistsRoundPlayed+= agent.rounds ? agent.rounds : 0
    } else if (initiators.includes(agent.name)) {
      initiatorsRoundPlayed+= agent.rounds ? agent.rounds : 0
    } else if (controllers.includes(agent.name)) {
      controllersRoundPlayed+= agent.rounds ? agent.rounds : 0
    } else if (sentinels.includes(agent.name)) {
      sentinelsRoundPlayed+= agent.rounds ? agent.rounds : 0
    }
  }

  console.log('Duelists:', duelistsRoundPlayed)
  console.log('Initiators:', initiatorsRoundPlayed)
  console.log('Controllers:', controllersRoundPlayed)
  console.log('Sentinels:', sentinelsRoundPlayed)

  const maxPlayed = Math.max(duelistsRoundPlayed, initiatorsRoundPlayed, controllersRoundPlayed, sentinelsRoundPlayed, 0)

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

export default {
  fetchTeamsDataFromVLR,
  fetchPlayerDataFromVLRTeamPage,
  importTeamsAndPlayersFromVLR,
}
