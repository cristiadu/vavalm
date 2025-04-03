import { PlayerApiModel } from "@/models/contract/PlayerApiModel"
import { TeamApiModel } from "@/models/contract/TeamApiModel"
import { Hidden } from "tsoa"

export class BaseEntityModel {
  @Hidden()
  toApiModel(): object | Promise<object> {
    return this
  }

  @Hidden()
  toEntityModel(): object | Promise<object> {
    return this
  }
}

/**
 * @tsoaModel
 */
export class ItemsWithPagination<T extends BaseEntityModel> {
  constructor(
    public items: T[],
    public total: number,
  ) {}

  // Transform so it has the same fields but with the ApiModel type.
  // This is a workaround to make the type inference work correctly.
  toApiModel<X extends BaseEntityModel>(result: ItemsWithPagination<X>): ItemsWithPagination<X> {
    result.items = this.items.map(item => item.toApiModel() as X)
    result.total = this.total
    return result
  }

  toEntityModel<X extends BaseEntityModel>(result: ItemsWithPagination<X>): ItemsWithPagination<X> {
    return this.toApiModel(result)
  }
}

/**
 * @tsoaModel
 */
export class AllPlayerStats extends BaseEntityModel {
  constructor(
    public player: PlayerApiModel,
    public kda: number,
    public winrate: number,
    public mapWinrate: number,
    public totalMatchesPlayed: number,
    public totalMatchesWon: number,
    public totalMatchesLost: number,
    public totalMapsPlayed: number,
    public totalMapsWon: number,
    public totalMapsLost: number,
    public totalKills: number,
    public totalDeaths: number,
    public totalAssists: number,
  ) {
    super()
  }

  toApiModel(): AllPlayerStats {
    return this
  }

  toEntityModel(): AllPlayerStats {
    return this
  }
}

/**
 * @tsoaModel
 */
export class TeamStats extends BaseEntityModel {
  constructor(
    public team: TeamApiModel,
    public tournamentsWon: number,
    public tournamentsParticipated: number,
    public winrate: number,
    public totalMatchesPlayed: number,
    public totalMatchesWon: number,
    public totalMatchesLost: number,
    public mapWinrate: number,
    public totalMapsPlayed: number,
    public totalMapsWon: number,
    public totalMapsLost: number,
  ) {
    super()
  }

  toApiModel(): TeamStats {
    return this
  }

  toEntityModel(): TeamStats {
    return this
  }
}
