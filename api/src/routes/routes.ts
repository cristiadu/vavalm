/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { VlrImportController } from './../controllers/VlrImportController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TournamentController } from './../controllers/TournamentController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TeamsController } from './../controllers/TeamsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { RoundController } from './../controllers/RoundController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PlayersController } from './../controllers/PlayersController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MatchController } from './../controllers/MatchController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GameController } from './../controllers/GameController';
import { expressAuthentication } from './../middleware/authentication';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';
const multer = require('multer');


const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "PlayerRole": {
        "dataType": "refEnum",
        "enums": ["Initiator","Duelist","Controller","Sentinel","Flex","IGL"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VlrPlayer": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "nickname": {"dataType":"string","required":true},
            "full_name": {"dataType":"string","required":true},
            "country": {"dataType":"string","required":true},
            "role": {"ref":"PlayerRole","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VlrTeam": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "short_name": {"dataType":"string","required":true},
            "full_name": {"dataType":"string","required":true},
            "country": {"dataType":"string","required":true},
            "logo_url": {"dataType":"string","required":true},
            "players": {"dataType":"array","array":{"dataType":"refObject","ref":"VlrPlayer"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VlrImportResponse": {
        "dataType": "refObject",
        "properties": {
            "teamsData": {"dataType":"array","array":{"dataType":"refObject","ref":"VlrTeam"},"required":true},
            "message": {"dataType":"string"},
            "error": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TournamentType": {
        "dataType": "refEnum",
        "enums": ["SINGLE_GROUP"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "buffer.File": {
        "dataType": "refObject",
        "properties": {
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PlayerAttributesApiModel": {
        "dataType": "refObject",
        "properties": {
            "clutch": {"dataType":"double","required":true},
            "awareness": {"dataType":"double","required":true},
            "aim": {"dataType":"double","required":true},
            "positioning": {"dataType":"double","required":true},
            "game_reading": {"dataType":"double","required":true},
            "resilience": {"dataType":"double","required":true},
            "confidence": {"dataType":"double","required":true},
            "strategy": {"dataType":"double","required":true},
            "adaptability": {"dataType":"double","required":true},
            "communication": {"dataType":"double","required":true},
            "unpredictability": {"dataType":"double","required":true},
            "game_sense": {"dataType":"double","required":true},
            "decision_making": {"dataType":"double","required":true},
            "rage_fuel": {"dataType":"double","required":true},
            "teamwork": {"dataType":"double","required":true},
            "utility_usage": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PlayerApiModel": {
        "dataType": "refObject",
        "properties": {
            "nickname": {"dataType":"string","required":true},
            "full_name": {"dataType":"string","required":true},
            "age": {"dataType":"double","required":true},
            "country": {"dataType":"string","required":true},
            "team_id": {"dataType":"double","required":true},
            "role": {"ref":"PlayerRole","required":true},
            "player_attributes": {"ref":"PlayerAttributesApiModel","required":true},
            "id": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TeamApiModel": {
        "dataType": "refObject",
        "properties": {
            "short_name": {"dataType":"string"},
            "full_name": {"dataType":"string"},
            "description": {"dataType":"string"},
            "country": {"dataType":"string"},
            "logo_image_file": {"dataType":"union","subSchemas":[{"ref":"buffer.File"},{"dataType":"enum","enums":[null]}]},
            "id": {"dataType":"double"},
            "players": {"dataType":"array","array":{"dataType":"refObject","ref":"PlayerApiModel"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TournamentApiModel": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string","required":true},
            "country": {"dataType":"string","required":true},
            "type": {"ref":"TournamentType","required":true},
            "start_date": {"dataType":"string","required":true},
            "end_date": {"dataType":"string","required":true},
            "started": {"dataType":"boolean","required":true},
            "ended": {"dataType":"boolean","required":true},
            "winner_id": {"dataType":"double"},
            "teams": {"dataType":"array","array":{"dataType":"union","subSchemas":[{"ref":"TeamApiModel"},{"dataType":"double"}]}},
            "id": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ItemsWithPagination_TournamentApiModel_": {
        "dataType": "refObject",
        "properties": {
            "items": {"dataType":"array","array":{"dataType":"refObject","ref":"TournamentApiModel"},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MatchType": {
        "dataType": "refEnum",
        "enums": ["BO1","BO3","BO5","FRIENDLY","SHOWMATCH"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GameMap": {
        "dataType": "refEnum",
        "enums": ["Bind","Haven","Split","Ascent","Fracture","Icebox","Breeze","Sunset","Abyss","Lotus","Pearl"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GameStatsApiModel": {
        "dataType": "refObject",
        "properties": {
            "team1_score": {"dataType":"double","required":true},
            "team2_score": {"dataType":"double","required":true},
            "game_id": {"dataType":"double","required":true},
            "team1_id": {"dataType":"double","required":true},
            "team2_id": {"dataType":"double","required":true},
            "winner_id": {"dataType":"double"},
            "id": {"dataType":"double"},
            "team1": {"ref":"TeamApiModel"},
            "team2": {"ref":"TeamApiModel"},
            "players_stats_team1": {"dataType":"array","array":{"dataType":"refObject","ref":"PlayerGameStatsApiModel"}},
            "players_stats_team2": {"dataType":"array","array":{"dataType":"refObject","ref":"PlayerGameStatsApiModel"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PlayerGameStatsApiModel": {
        "dataType": "refObject",
        "properties": {
            "kills": {"dataType":"double","required":true},
            "deaths": {"dataType":"double","required":true},
            "assists": {"dataType":"double","required":true},
            "player_id": {"dataType":"double","required":true},
            "game_stats_player1_id": {"dataType":"double"},
            "game_stats_player2_id": {"dataType":"double"},
            "game_stats_player1": {"ref":"GameStatsApiModel"},
            "game_stats_player2": {"ref":"GameStatsApiModel"},
            "player": {"ref":"PlayerApiModel"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GameApiModel": {
        "dataType": "refObject",
        "properties": {
            "date": {"dataType":"string","required":true},
            "map": {"ref":"GameMap","required":true},
            "match_id": {"dataType":"double","required":true},
            "included_on_standings": {"dataType":"boolean","required":true},
            "started": {"dataType":"boolean","required":true},
            "finished": {"dataType":"boolean","required":true},
            "id": {"dataType":"double"},
            "stats": {"ref":"GameStatsApiModel"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MatchApiModel": {
        "dataType": "refObject",
        "properties": {
            "date": {"dataType":"string","required":true},
            "tournament_id": {"dataType":"double","required":true},
            "team1_id": {"dataType":"double","required":true},
            "team2_id": {"dataType":"double","required":true},
            "type": {"ref":"MatchType","required":true},
            "team1_score": {"dataType":"double","required":true},
            "team2_score": {"dataType":"double","required":true},
            "included_on_standings": {"dataType":"boolean","required":true},
            "started": {"dataType":"boolean","required":true},
            "finished": {"dataType":"boolean","required":true},
            "winner_id": {"dataType":"double"},
            "id": {"dataType":"double"},
            "team1": {"ref":"TeamApiModel"},
            "team2": {"ref":"TeamApiModel"},
            "games": {"dataType":"array","array":{"dataType":"refObject","ref":"GameApiModel"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ItemsWithPagination_MatchApiModel_": {
        "dataType": "refObject",
        "properties": {
            "items": {"dataType":"array","array":{"dataType":"refObject","ref":"MatchApiModel"},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StandingsApiModel": {
        "dataType": "refObject",
        "properties": {
            "wins": {"dataType":"double","required":true},
            "losses": {"dataType":"double","required":true},
            "maps_won": {"dataType":"double","required":true},
            "maps_lost": {"dataType":"double","required":true},
            "rounds_won": {"dataType":"double","required":true},
            "rounds_lost": {"dataType":"double","required":true},
            "tournament_id": {"dataType":"double","required":true},
            "team_id": {"dataType":"double","required":true},
            "position": {"dataType":"double","required":true},
            "id": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ItemsWithPagination_TeamApiModel_": {
        "dataType": "refObject",
        "properties": {
            "items": {"dataType":"array","array":{"dataType":"refObject","ref":"TeamApiModel"},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TeamStats": {
        "dataType": "refObject",
        "properties": {
            "team": {"ref":"TeamApiModel","required":true},
            "tournamentsWon": {"dataType":"double","required":true},
            "tournamentsParticipated": {"dataType":"double","required":true},
            "winrate": {"dataType":"double","required":true},
            "totalMatchesPlayed": {"dataType":"double","required":true},
            "totalMatchesWon": {"dataType":"double","required":true},
            "totalMatchesLost": {"dataType":"double","required":true},
            "mapWinrate": {"dataType":"double","required":true},
            "totalMapsPlayed": {"dataType":"double","required":true},
            "totalMapsWon": {"dataType":"double","required":true},
            "totalMapsLost": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ItemsWithPagination_TeamStats_": {
        "dataType": "refObject",
        "properties": {
            "items": {"dataType":"array","array":{"dataType":"refObject","ref":"TeamStats"},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PlayerDuelResults": {
        "dataType": "refObject",
        "properties": {
            "winner": {"dataType":"union","subSchemas":[{"ref":"PlayerApiModel"},{"dataType":"enum","enums":[null]}],"required":true},
            "loser": {"dataType":"union","subSchemas":[{"ref":"PlayerApiModel"},{"dataType":"enum","enums":[null]}],"required":true},
            "startedTradeDuel": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RoundStateApiModel": {
        "dataType": "refObject",
        "properties": {
            "round": {"dataType":"double","required":true},
            "duel": {"ref":"PlayerDuelResults","required":true},
            "team1_alive_players": {"dataType":"array","array":{"dataType":"refObject","ref":"PlayerApiModel"},"required":true},
            "team2_alive_players": {"dataType":"array","array":{"dataType":"refObject","ref":"PlayerApiModel"},"required":true},
            "team_won": {"dataType":"union","subSchemas":[{"ref":"TeamApiModel"},{"dataType":"enum","enums":[null]}],"required":true},
            "finished": {"dataType":"boolean","required":true},
            "previous_duel": {"ref":"PlayerDuelResults"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Weapon": {
        "dataType": "refEnum",
        "enums": ["Vandal","Phantom","Operator","Sheriff","Ghost","Marshal","Ares","Odin","Bucky","Judge","Frenzy","Shorty"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GameLogApiModel": {
        "dataType": "refObject",
        "properties": {
            "round_state": {"ref":"RoundStateApiModel","required":true},
            "duel_buff": {"dataType":"double","required":true},
            "trade_buff": {"dataType":"double","required":true},
            "trade": {"dataType":"boolean","required":true},
            "weapon": {"ref":"Weapon","required":true},
            "game_id": {"dataType":"double","required":true},
            "team1_player_id": {"dataType":"double","required":true},
            "team2_player_id": {"dataType":"double","required":true},
            "player_killed_id": {"dataType":"double","required":true},
            "included_on_player_stats": {"dataType":"boolean","required":true},
            "included_on_team_stats": {"dataType":"boolean","required":true},
            "id": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ItemsWithPagination_PlayerApiModel_": {
        "dataType": "refObject",
        "properties": {
            "items": {"dataType":"array","array":{"dataType":"refObject","ref":"PlayerApiModel"},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AllPlayerStats": {
        "dataType": "refObject",
        "properties": {
            "player": {"ref":"PlayerApiModel","required":true},
            "kda": {"dataType":"double","required":true},
            "winrate": {"dataType":"double","required":true},
            "mapWinrate": {"dataType":"double","required":true},
            "totalMatchesPlayed": {"dataType":"double","required":true},
            "totalMatchesWon": {"dataType":"double","required":true},
            "totalMatchesLost": {"dataType":"double","required":true},
            "totalMapsPlayed": {"dataType":"double","required":true},
            "totalMapsWon": {"dataType":"double","required":true},
            "totalMapsLost": {"dataType":"double","required":true},
            "totalKills": {"dataType":"double","required":true},
            "totalDeaths": {"dataType":"double","required":true},
            "totalAssists": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ItemsWithPagination_AllPlayerStats_": {
        "dataType": "refObject",
        "properties": {
            "items": {"dataType":"array","array":{"dataType":"refObject","ref":"AllPlayerStats"},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"silently-remove-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router,opts?:{multer?:ReturnType<typeof multer>}) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################

    const upload = opts?.multer ||  multer({"limits":{"fileSize":8388608}});

    
        const argsVlrImportController_importTeamsAndPlayersFromVLR: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.post('/api/vlr',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VlrImportController)),
            ...(fetchMiddlewares<RequestHandler>(VlrImportController.prototype.importTeamsAndPlayersFromVLR)),

            async function VlrImportController_importTeamsAndPlayersFromVLR(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVlrImportController_importTeamsAndPlayersFromVLR, request, response });

                const controller = new VlrImportController();

              await templateService.apiHandler({
                methodName: 'importTeamsAndPlayersFromVLR',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTournamentController_getTournaments: Record<string, TsoaRoute.ParameterSchema> = {
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                offset: {"default":0,"in":"query","name":"offset","dataType":"double"},
        };
        app.get('/api/tournaments',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TournamentController)),
            ...(fetchMiddlewares<RequestHandler>(TournamentController.prototype.getTournaments)),

            async function TournamentController_getTournaments(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTournamentController_getTournaments, request, response });

                const controller = new TournamentController();

              await templateService.apiHandler({
                methodName: 'getTournaments',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTournamentController_getTournament: Record<string, TsoaRoute.ParameterSchema> = {
                tournamentId: {"in":"path","name":"tournamentId","required":true,"dataType":"double"},
        };
        app.get('/api/tournaments/:tournamentId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TournamentController)),
            ...(fetchMiddlewares<RequestHandler>(TournamentController.prototype.getTournament)),

            async function TournamentController_getTournament(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTournamentController_getTournament, request, response });

                const controller = new TournamentController();

              await templateService.apiHandler({
                methodName: 'getTournament',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTournamentController_getTournamentSchedule: Record<string, TsoaRoute.ParameterSchema> = {
                tournamentId: {"in":"path","name":"tournamentId","required":true,"dataType":"double"},
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                offset: {"default":0,"in":"query","name":"offset","dataType":"double"},
        };
        app.get('/api/tournaments/:tournamentId/schedule',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TournamentController)),
            ...(fetchMiddlewares<RequestHandler>(TournamentController.prototype.getTournamentSchedule)),

            async function TournamentController_getTournamentSchedule(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTournamentController_getTournamentSchedule, request, response });

                const controller = new TournamentController();

              await templateService.apiHandler({
                methodName: 'getTournamentSchedule',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTournamentController_getTournamentStandings: Record<string, TsoaRoute.ParameterSchema> = {
                tournamentId: {"in":"path","name":"tournamentId","required":true,"dataType":"double"},
        };
        app.get('/api/tournaments/:tournamentId/standings',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TournamentController)),
            ...(fetchMiddlewares<RequestHandler>(TournamentController.prototype.getTournamentStandings)),

            async function TournamentController_getTournamentStandings(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTournamentController_getTournamentStandings, request, response });

                const controller = new TournamentController();

              await templateService.apiHandler({
                methodName: 'getTournamentStandings',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTournamentController_createTournament: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"TournamentApiModel"},
        };
        app.post('/api/tournaments',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TournamentController)),
            ...(fetchMiddlewares<RequestHandler>(TournamentController.prototype.createTournament)),

            async function TournamentController_createTournament(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTournamentController_createTournament, request, response });

                const controller = new TournamentController();

              await templateService.apiHandler({
                methodName: 'createTournament',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTournamentController_updateTournament: Record<string, TsoaRoute.ParameterSchema> = {
                tournamentId: {"in":"path","name":"tournamentId","required":true,"dataType":"double"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"TournamentApiModel"},
        };
        app.put('/api/tournaments/:tournamentId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TournamentController)),
            ...(fetchMiddlewares<RequestHandler>(TournamentController.prototype.updateTournament)),

            async function TournamentController_updateTournament(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTournamentController_updateTournament, request, response });

                const controller = new TournamentController();

              await templateService.apiHandler({
                methodName: 'updateTournament',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTournamentController_startTournament: Record<string, TsoaRoute.ParameterSchema> = {
                tournamentId: {"in":"path","name":"tournamentId","required":true,"dataType":"double"},
        };
        app.post('/api/tournaments/:tournamentId/start',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TournamentController)),
            ...(fetchMiddlewares<RequestHandler>(TournamentController.prototype.startTournament)),

            async function TournamentController_startTournament(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTournamentController_startTournament, request, response });

                const controller = new TournamentController();

              await templateService.apiHandler({
                methodName: 'startTournament',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTournamentController_endTournament: Record<string, TsoaRoute.ParameterSchema> = {
                tournamentId: {"in":"path","name":"tournamentId","required":true,"dataType":"double"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"winner_id":{"dataType":"double","required":true}}},
        };
        app.post('/api/tournaments/:tournamentId/end',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TournamentController)),
            ...(fetchMiddlewares<RequestHandler>(TournamentController.prototype.endTournament)),

            async function TournamentController_endTournament(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTournamentController_endTournament, request, response });

                const controller = new TournamentController();

              await templateService.apiHandler({
                methodName: 'endTournament',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTournamentController_deleteTournament: Record<string, TsoaRoute.ParameterSchema> = {
                tournamentId: {"in":"path","name":"tournamentId","required":true,"dataType":"double"},
        };
        app.delete('/api/tournaments/:tournamentId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TournamentController)),
            ...(fetchMiddlewares<RequestHandler>(TournamentController.prototype.deleteTournament)),

            async function TournamentController_deleteTournament(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTournamentController_deleteTournament, request, response });

                const controller = new TournamentController();

              await templateService.apiHandler({
                methodName: 'deleteTournament',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTeamsController_getTeams: Record<string, TsoaRoute.ParameterSchema> = {
                country: {"in":"query","name":"country","dataType":"string"},
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                offset: {"default":0,"in":"query","name":"offset","dataType":"double"},
        };
        app.get('/api/teams',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TeamsController)),
            ...(fetchMiddlewares<RequestHandler>(TeamsController.prototype.getTeams)),

            async function TeamsController_getTeams(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTeamsController_getTeams, request, response });

                const controller = new TeamsController();

              await templateService.apiHandler({
                methodName: 'getTeams',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTeamsController_getTeamsStats: Record<string, TsoaRoute.ParameterSchema> = {
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                offset: {"default":0,"in":"query","name":"offset","dataType":"double"},
        };
        app.get('/api/teams/stats',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TeamsController)),
            ...(fetchMiddlewares<RequestHandler>(TeamsController.prototype.getTeamsStats)),

            async function TeamsController_getTeamsStats(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTeamsController_getTeamsStats, request, response });

                const controller = new TeamsController();

              await templateService.apiHandler({
                methodName: 'getTeamsStats',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTeamsController_createTeamsBulk: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"array","array":{"dataType":"refObject","ref":"TeamApiModel"}},
        };
        app.post('/api/teams/bulk',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TeamsController)),
            ...(fetchMiddlewares<RequestHandler>(TeamsController.prototype.createTeamsBulk)),

            async function TeamsController_createTeamsBulk(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTeamsController_createTeamsBulk, request, response });

                const controller = new TeamsController();

              await templateService.apiHandler({
                methodName: 'createTeamsBulk',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTeamsController_getTeam: Record<string, TsoaRoute.ParameterSchema> = {
                teamId: {"in":"path","name":"teamId","required":true,"dataType":"double"},
        };
        app.get('/api/teams/:teamId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TeamsController)),
            ...(fetchMiddlewares<RequestHandler>(TeamsController.prototype.getTeam)),

            async function TeamsController_getTeam(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTeamsController_getTeam, request, response });

                const controller = new TeamsController();

              await templateService.apiHandler({
                methodName: 'getTeam',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTeamsController_getTeamStats: Record<string, TsoaRoute.ParameterSchema> = {
                teamId: {"in":"path","name":"teamId","required":true,"dataType":"double"},
        };
        app.get('/api/teams/:teamId/stats',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TeamsController)),
            ...(fetchMiddlewares<RequestHandler>(TeamsController.prototype.getTeamStats)),

            async function TeamsController_getTeamStats(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTeamsController_getTeamStats, request, response });

                const controller = new TeamsController();

              await templateService.apiHandler({
                methodName: 'getTeamStats',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTeamsController_createTeam: Record<string, TsoaRoute.ParameterSchema> = {
                short_name: {"in":"formData","name":"short_name","required":true,"dataType":"string"},
                full_name: {"in":"formData","name":"full_name","required":true,"dataType":"string"},
                description: {"in":"formData","name":"description","required":true,"dataType":"string"},
                country: {"in":"formData","name":"country","required":true,"dataType":"string"},
                logo_image_file: {"in":"formData","name":"logo_image_file","dataType":"file"},
        };
        app.post('/api/teams',
            authenticateMiddleware([{"BearerAuth":[]}]),
            upload.fields([
                {
                    name: "logo_image_file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(TeamsController)),
            ...(fetchMiddlewares<RequestHandler>(TeamsController.prototype.createTeam)),

            async function TeamsController_createTeam(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTeamsController_createTeam, request, response });

                const controller = new TeamsController();

              await templateService.apiHandler({
                methodName: 'createTeam',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTeamsController_updateTeam: Record<string, TsoaRoute.ParameterSchema> = {
                teamId: {"in":"path","name":"teamId","required":true,"dataType":"double"},
                short_name: {"in":"formData","name":"short_name","required":true,"dataType":"string"},
                full_name: {"in":"formData","name":"full_name","required":true,"dataType":"string"},
                description: {"in":"formData","name":"description","required":true,"dataType":"string"},
                country: {"in":"formData","name":"country","required":true,"dataType":"string"},
                logo_image_file: {"in":"formData","name":"logo_image_file","dataType":"file"},
        };
        app.put('/api/teams/:teamId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            upload.fields([
                {
                    name: "logo_image_file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(TeamsController)),
            ...(fetchMiddlewares<RequestHandler>(TeamsController.prototype.updateTeam)),

            async function TeamsController_updateTeam(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTeamsController_updateTeam, request, response });

                const controller = new TeamsController();

              await templateService.apiHandler({
                methodName: 'updateTeam',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTeamsController_deleteTeam: Record<string, TsoaRoute.ParameterSchema> = {
                teamId: {"in":"path","name":"teamId","required":true,"dataType":"double"},
        };
        app.delete('/api/teams/:teamId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TeamsController)),
            ...(fetchMiddlewares<RequestHandler>(TeamsController.prototype.deleteTeam)),

            async function TeamsController_deleteTeam(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTeamsController_deleteTeam, request, response });

                const controller = new TeamsController();

              await templateService.apiHandler({
                methodName: 'deleteTeam',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTeamsController_getTeamPlayers: Record<string, TsoaRoute.ParameterSchema> = {
                teamId: {"in":"path","name":"teamId","required":true,"dataType":"double"},
        };
        app.get('/api/teams/:teamId/players',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TeamsController)),
            ...(fetchMiddlewares<RequestHandler>(TeamsController.prototype.getTeamPlayers)),

            async function TeamsController_getTeamPlayers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTeamsController_getTeamPlayers, request, response });

                const controller = new TeamsController();

              await templateService.apiHandler({
                methodName: 'getTeamPlayers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsRoundController_playRound: Record<string, TsoaRoute.ParameterSchema> = {
                gameId: {"in":"path","name":"gameId","required":true,"dataType":"double"},
                round: {"in":"path","name":"round","required":true,"dataType":"double"},
        };
        app.post('/api/games/:gameId/rounds/:round/play',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RoundController)),
            ...(fetchMiddlewares<RequestHandler>(RoundController.prototype.playRound)),

            async function RoundController_playRound(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRoundController_playRound, request, response });

                const controller = new RoundController();

              await templateService.apiHandler({
                methodName: 'playRound',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsRoundController_playDuel: Record<string, TsoaRoute.ParameterSchema> = {
                gameId: {"in":"path","name":"gameId","required":true,"dataType":"double"},
                round: {"in":"path","name":"round","required":true,"dataType":"double"},
        };
        app.post('/api/games/:gameId/rounds/:round/duel',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RoundController)),
            ...(fetchMiddlewares<RequestHandler>(RoundController.prototype.playDuel)),

            async function RoundController_playDuel(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRoundController_playDuel, request, response });

                const controller = new RoundController();

              await templateService.apiHandler({
                methodName: 'playDuel',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsRoundController_getLastDuel: Record<string, TsoaRoute.ParameterSchema> = {
                gameId: {"in":"path","name":"gameId","required":true,"dataType":"double"},
        };
        app.get('/api/games/:gameId/rounds/last/duel',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RoundController)),
            ...(fetchMiddlewares<RequestHandler>(RoundController.prototype.getLastDuel)),

            async function RoundController_getLastDuel(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRoundController_getLastDuel, request, response });

                const controller = new RoundController();

              await templateService.apiHandler({
                methodName: 'getLastDuel',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsRoundController_getLastRound: Record<string, TsoaRoute.ParameterSchema> = {
                gameId: {"in":"path","name":"gameId","required":true,"dataType":"double"},
        };
        app.get('/api/games/:gameId/rounds/last',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RoundController)),
            ...(fetchMiddlewares<RequestHandler>(RoundController.prototype.getLastRound)),

            async function RoundController_getLastRound(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRoundController_getLastRound, request, response });

                const controller = new RoundController();

              await templateService.apiHandler({
                methodName: 'getLastRound',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsRoundController_getRound: Record<string, TsoaRoute.ParameterSchema> = {
                gameId: {"in":"path","name":"gameId","required":true,"dataType":"double"},
                round: {"in":"path","name":"round","required":true,"dataType":"double"},
        };
        app.get('/api/games/:gameId/rounds/:round',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RoundController)),
            ...(fetchMiddlewares<RequestHandler>(RoundController.prototype.getRound)),

            async function RoundController_getRound(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRoundController_getRound, request, response });

                const controller = new RoundController();

              await templateService.apiHandler({
                methodName: 'getRound',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayersController_getPlayers: Record<string, TsoaRoute.ParameterSchema> = {
                teamId: {"in":"query","name":"teamId","dataType":"double"},
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                offset: {"default":0,"in":"query","name":"offset","dataType":"double"},
        };
        app.get('/api/players',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayersController)),
            ...(fetchMiddlewares<RequestHandler>(PlayersController.prototype.getPlayers)),

            async function PlayersController_getPlayers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayersController_getPlayers, request, response });

                const controller = new PlayersController();

              await templateService.apiHandler({
                methodName: 'getPlayers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayersController_getPlayersStats: Record<string, TsoaRoute.ParameterSchema> = {
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                offset: {"default":0,"in":"query","name":"offset","dataType":"double"},
        };
        app.get('/api/players/stats',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayersController)),
            ...(fetchMiddlewares<RequestHandler>(PlayersController.prototype.getPlayersStats)),

            async function PlayersController_getPlayersStats(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayersController_getPlayersStats, request, response });

                const controller = new PlayersController();

              await templateService.apiHandler({
                methodName: 'getPlayersStats',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayersController_getPlayer: Record<string, TsoaRoute.ParameterSchema> = {
                playerId: {"in":"path","name":"playerId","required":true,"dataType":"double"},
        };
        app.get('/api/players/:playerId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayersController)),
            ...(fetchMiddlewares<RequestHandler>(PlayersController.prototype.getPlayer)),

            async function PlayersController_getPlayer(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayersController_getPlayer, request, response });

                const controller = new PlayersController();

              await templateService.apiHandler({
                methodName: 'getPlayer',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayersController_getPlayerStats: Record<string, TsoaRoute.ParameterSchema> = {
                playerId: {"in":"path","name":"playerId","required":true,"dataType":"double"},
        };
        app.get('/api/players/:playerId/stats',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayersController)),
            ...(fetchMiddlewares<RequestHandler>(PlayersController.prototype.getPlayerStats)),

            async function PlayersController_getPlayerStats(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayersController_getPlayerStats, request, response });

                const controller = new PlayersController();

              await templateService.apiHandler({
                methodName: 'getPlayerStats',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayersController_createPlayer: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PlayerApiModel"},
        };
        app.post('/api/players',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayersController)),
            ...(fetchMiddlewares<RequestHandler>(PlayersController.prototype.createPlayer)),

            async function PlayersController_createPlayer(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayersController_createPlayer, request, response });

                const controller = new PlayersController();

              await templateService.apiHandler({
                methodName: 'createPlayer',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayersController_createPlayersBulk: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"array","array":{"dataType":"refObject","ref":"PlayerApiModel"}},
        };
        app.post('/api/players/bulk',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayersController)),
            ...(fetchMiddlewares<RequestHandler>(PlayersController.prototype.createPlayersBulk)),

            async function PlayersController_createPlayersBulk(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayersController_createPlayersBulk, request, response });

                const controller = new PlayersController();

              await templateService.apiHandler({
                methodName: 'createPlayersBulk',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayersController_updatePlayer: Record<string, TsoaRoute.ParameterSchema> = {
                playerId: {"in":"path","name":"playerId","required":true,"dataType":"double"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PlayerApiModel"},
        };
        app.put('/api/players/:playerId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayersController)),
            ...(fetchMiddlewares<RequestHandler>(PlayersController.prototype.updatePlayer)),

            async function PlayersController_updatePlayer(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayersController_updatePlayer, request, response });

                const controller = new PlayersController();

              await templateService.apiHandler({
                methodName: 'updatePlayer',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayersController_deletePlayer: Record<string, TsoaRoute.ParameterSchema> = {
                playerId: {"in":"path","name":"playerId","required":true,"dataType":"double"},
        };
        app.delete('/api/players/:playerId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayersController)),
            ...(fetchMiddlewares<RequestHandler>(PlayersController.prototype.deletePlayer)),

            async function PlayersController_deletePlayer(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayersController_deletePlayer, request, response });

                const controller = new PlayersController();

              await templateService.apiHandler({
                methodName: 'deletePlayer',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMatchController_getMatch: Record<string, TsoaRoute.ParameterSchema> = {
                matchId: {"in":"path","name":"matchId","required":true,"dataType":"double"},
        };
        app.get('/api/matches/:matchId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MatchController)),
            ...(fetchMiddlewares<RequestHandler>(MatchController.prototype.getMatch)),

            async function MatchController_getMatch(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMatchController_getMatch, request, response });

                const controller = new MatchController();

              await templateService.apiHandler({
                methodName: 'getMatch',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMatchController_getMatches: Record<string, TsoaRoute.ParameterSchema> = {
                tournamentId: {"in":"query","name":"tournamentId","dataType":"double"},
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                offset: {"default":0,"in":"query","name":"offset","dataType":"double"},
        };
        app.get('/api/matches',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MatchController)),
            ...(fetchMiddlewares<RequestHandler>(MatchController.prototype.getMatches)),

            async function MatchController_getMatches(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMatchController_getMatches, request, response });

                const controller = new MatchController();

              await templateService.apiHandler({
                methodName: 'getMatches',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGameController_getGame: Record<string, TsoaRoute.ParameterSchema> = {
                gameId: {"in":"path","name":"gameId","required":true,"dataType":"double"},
        };
        app.get('/api/games/:gameId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GameController)),
            ...(fetchMiddlewares<RequestHandler>(GameController.prototype.getGame)),

            async function GameController_getGame(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGameController_getGame, request, response });

                const controller = new GameController();

              await templateService.apiHandler({
                methodName: 'getGame',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGameController_playGame: Record<string, TsoaRoute.ParameterSchema> = {
                gameId: {"in":"path","name":"gameId","required":true,"dataType":"double"},
        };
        app.post('/api/games/:gameId/play',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GameController)),
            ...(fetchMiddlewares<RequestHandler>(GameController.prototype.playGame)),

            async function GameController_playGame(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGameController_playGame, request, response });

                const controller = new GameController();

              await templateService.apiHandler({
                methodName: 'playGame',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGameController_getGamesByMatch: Record<string, TsoaRoute.ParameterSchema> = {
                matchId: {"in":"path","name":"matchId","required":true,"dataType":"double"},
        };
        app.get('/api/games/match/:matchId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GameController)),
            ...(fetchMiddlewares<RequestHandler>(GameController.prototype.getGamesByMatch)),

            async function GameController_getGamesByMatch(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGameController_getGamesByMatch, request, response });

                const controller = new GameController();

              await templateService.apiHandler({
                methodName: 'getGamesByMatch',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGameController_getGameStats: Record<string, TsoaRoute.ParameterSchema> = {
                gameId: {"in":"path","name":"gameId","required":true,"dataType":"double"},
        };
        app.get('/api/games/:gameId/stats',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GameController)),
            ...(fetchMiddlewares<RequestHandler>(GameController.prototype.getGameStats)),

            async function GameController_getGameStats(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGameController_getGameStats, request, response });

                const controller = new GameController();

              await templateService.apiHandler({
                methodName: 'getGameStats',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
