/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GameStatsApiModel } from './GameStatsApiModel';
import type { PlayerApiModel } from './PlayerApiModel';
export type PlayerGameStatsApiModel = {
  kills: number;
  deaths: number;
  assists: number;
  player_id: number;
  game_stats_player1_id?: number;
  game_stats_player2_id?: number;
  game_stats_player1?: GameStatsApiModel;
  game_stats_player2?: GameStatsApiModel;
  player?: PlayerApiModel;
};

