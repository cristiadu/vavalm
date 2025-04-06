/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { buffer_Blob } from './buffer_Blob';
import type { PlayerApiModel } from './PlayerApiModel';
export type TeamApiModel = {
  short_name?: string;
  full_name?: string;
  description?: string;
  country?: string;
  logo_image_file?: buffer_Blob | null;
  id?: number;
  players?: Array<PlayerApiModel>;
};

