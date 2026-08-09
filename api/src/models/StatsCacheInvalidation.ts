import { Model, ModelStatic } from 'sequelize'

import CacheService from '@/services/CacheService'
import { CACHE_KEYS } from '@/base/CacheConstants'

import Team from '@/models/Team'
import Player from '@/models/Player'
import Match from '@/models/Match'
import Tournament from '@/models/Tournament'
import GameStats from '@/models/GameStats'
import PlayerGameStats from '@/models/PlayerGameStats'

/**
 * Models whose rows feed the aggregate team and player leaderboards. A write to
 * any of them can change a total, a winrate or the membership of the list.
 */
const MODELS_FEEDING_AGGREGATE_STATS: ModelStatic<Model>[] = [
  Team,
  Player,
  Match,
  Tournament,
  GameStats,
  PlayerGameStats,
]

/**
 * Drops the cached team and player leaderboard totals.
 *
 * Safe to call from anywhere: the cache is a plain in-memory map, so this is a
 * pair of deletes and the next request recomputes from the database.
 */
export const invalidateAggregateStatsCaches = (): void => {
  CacheService.delete(CACHE_KEYS.ALL_TEAM_STATS)
  CacheService.delete(CACHE_KEYS.ALL_PLAYER_STATS)
}

/**
 * Registers model hooks so the aggregate stats caches are dropped whenever a
 * row behind them changes.
 *
 * Doing this with hooks rather than explicit calls at each write site means a
 * new endpoint or service cannot forget to invalidate. Note this only covers
 * writes made in the thread that registered them — match simulation runs in
 * worker threads with their own module instances, so MatchWorkerService
 * invalidates on the main thread when a scheduled match reports completion.
 */
export const registerStatsCacheInvalidation = (): void => {
  for (const model of MODELS_FEEDING_AGGREGATE_STATS) {
    model.addHook('afterCreate', invalidateAggregateStatsCaches)
    model.addHook('afterUpdate', invalidateAggregateStatsCaches)
    model.addHook('afterDestroy', invalidateAggregateStatsCaches)
    model.addHook('afterUpsert', invalidateAggregateStatsCaches)
    model.addHook('afterBulkCreate', invalidateAggregateStatsCaches)
    model.addHook('afterBulkUpdate', invalidateAggregateStatsCaches)
    model.addHook('afterBulkDestroy', invalidateAggregateStatsCaches)
  }
}
