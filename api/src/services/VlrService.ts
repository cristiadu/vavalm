import { load } from 'cheerio'
import { VLR_URL, VlrPlayer, VlrTeam } from '../models/Vlr'
import { countryCodeToCountryName } from '../base/StringUtils'
import { downloadImage } from '../base/FileUtils'
import Team from '../models/Team'
import Player from '../models/Player'

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
    const vlrTeamId = href ? href.split('/')[2] : undefined
    const players = await fetchPlayerDataFromVLR(vlrTeamId)
    
    teams.push({
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
export const fetchPlayerDataFromVLR = async (teamId: string = ''): Promise<any[]> => {
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

    const nickname = $(el).find('.team-roster-item-name-alias').text().trim()
    const full_name = $(el).find('.team-roster-item-name-real').text().trim()
    const classAttr = $(el).find('.team-roster-item-name-alias').find('i').attr('class')
    const country = classAttr ? classAttr.split(' ')[1].replace('mod-', '') : ''
    const fullCountryName = await countryCodeToCountryName(country)

    players.push({
      nickname,
      full_name,
      country: fullCountryName,
    } as VlrPlayer)
  }

  return players
}

export default {
  fetchTeamsDataFromVLR,
  fetchPlayerDataFromVLR,
}
