/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoundStateApiModel } from './RoundStateApiModel';
import type { Weapon } from './Weapon';
export type GameLogApiModel = {
  round_state: RoundStateApiModel;
  duel_buff: number;
  trade_buff: number;
  trade: boolean;
  weapon: Weapon;
  game_id: number;
  team1_player_id: number;
  team2_player_id: number;
  player_killed_id: number;
  included_on_player_stats: boolean;
  included_on_team_stats: boolean;
  id?: number;
};

