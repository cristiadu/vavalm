export interface EnumWithFieldName<T> {
  value: T
}

export interface ItemsWithPagination<T> {
  items: T[]
  total: number
  page?: number
  pageSize?: number
}
