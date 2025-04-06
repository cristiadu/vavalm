/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PlayerApiModel } from './PlayerApiModel';
import type { PlayerDuelResults } from './PlayerDuelResults';
import type { TeamApiModel } from './TeamApiModel';
export type RoundStateApiModel = {
  round: number;
  duel: PlayerDuelResults;
  team1_alive_players: Array<PlayerApiModel>;
  team2_alive_players: Array<PlayerApiModel>;
  team_won: TeamApiModel | null;
  finished: boolean;
  previous_duel?: PlayerDuelResults;
};

