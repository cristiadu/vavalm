export enum PlayerRole {
  Initiator = 'Initiator',
  Duelist = 'Duelist',
  Controller = 'Controller',
  Sentinel = 'Sentinel',
  Flex = 'Flex',
  IGL = 'IGL',
}

export const getRoleBgColor = (role: PlayerRole): string => {
  const tailwindStyle = "p-1 rounded text-white ml-2 "
  switch (role) {
  case PlayerRole.Initiator:
    return tailwindStyle + 'bg-blue-400'
  case PlayerRole.Duelist:
    return tailwindStyle + 'bg-red-700'
  case PlayerRole.Controller:
    return tailwindStyle + 'bg-green-700'
  case PlayerRole.Sentinel:
    return tailwindStyle + 'bg-purple-700'
  case PlayerRole.Flex:
    return tailwindStyle + 'bg-yellow-600'
  case PlayerRole.IGL:
    return tailwindStyle + 'bg-orange-500'
  default:
    return tailwindStyle + 'bg-gray-700'
  }
}

export interface PlayerAttributes {
  clutch: number,
  awareness: number,
  aim: number,
  positioning: number,
  game_reading: number,
  resilience: number,
  confidence: number,
  strategy: number,
  adaptability: number,
  communication: number,
  unpredictability: number,
  game_sense: number,
  decision_making: number,
  rage_fuel: number,
  teamwork: number,
  utility_usage: number
}

export interface Player {
  id?: number
  nickname: string
  full_name: string
  age: number
  country: string
  team_id: number
  role: PlayerRole
  player_attributes: PlayerAttributes
}

export interface PlayerWithFlag extends Player {
  countryFlag?: string | null;
}
