/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamApiModel } from './TeamApiModel';
import type { TournamentType } from './TournamentType';
export type TournamentApiModel = {
  name: string;
  description: string;
  country: string;
  type: TournamentType;
  start_date: string;
  end_date: string;
  started: boolean;
  ended: boolean;
  winner_id?: number;
  teams?: Array<(TeamApiModel | number)>;
  id?: number;
};

