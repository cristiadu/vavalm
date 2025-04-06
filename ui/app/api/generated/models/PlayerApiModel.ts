/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PlayerAttributesApiModel } from './PlayerAttributesApiModel';
import type { PlayerRole } from './PlayerRole';
export type PlayerApiModel = {
  nickname: string;
  full_name: string;
  age: number;
  country: string;
  team_id: number;
  role: PlayerRole;
  player_attributes: PlayerAttributesApiModel;
  id?: number;
};

