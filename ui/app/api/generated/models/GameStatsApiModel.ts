/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PlayerGameStatsApiModel } from './PlayerGameStatsApiModel';
import type { TeamApiModel } from './TeamApiModel';
export type GameStatsApiModel = {
  team1_score: number;
  team2_score: number;
  game_id: number;
  team1_id: number;
  team2_id: number;
  winner_id?: number;
  id?: number;
  team1?: TeamApiModel;
  team2?: TeamApiModel;
  players_stats_team1?: Array<PlayerGameStatsApiModel>;
  players_stats_team2?: Array<PlayerGameStatsApiModel>;
};

