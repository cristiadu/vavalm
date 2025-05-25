/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { buffer_File } from './buffer_File';
import type { PlayerApiModel } from './PlayerApiModel';
export type TeamApiModel = {
  short_name?: string;
  full_name?: string;
  description?: string;
  country?: string;
  logo_image_file?: (string | buffer_File) | null;
  id?: number;
  players?: Array<PlayerApiModel>;
};

