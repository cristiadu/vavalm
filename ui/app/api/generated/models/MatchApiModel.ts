/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GameApiModel } from './GameApiModel';
import type { MatchType } from './MatchType';
import type { TeamApiModel } from './TeamApiModel';
export type MatchApiModel = {
  date: string;
  tournament_id: number;
  team1_id: number;
  team2_id: number;
  type: MatchType;
  team1_score: number;
  team2_score: number;
  included_on_standings: boolean;
  started: boolean;
  finished: boolean;
  winner_id?: number;
  id?: number;
  team1?: TeamApiModel;
  team2?: TeamApiModel;
  games?: Array<GameApiModel>;
};

