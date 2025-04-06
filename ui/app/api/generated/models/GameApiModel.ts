/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GameMap } from './GameMap';
import type { GameStatsApiModel } from './GameStatsApiModel';
export type GameApiModel = {
  date: string;
  map: GameMap;
  match_id: number;
  included_on_standings: boolean;
  started: boolean;
  finished: boolean;
  id?: number;
  stats?: GameStatsApiModel;
};

