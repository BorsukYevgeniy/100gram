export type Paginated<K extends string, V> = {
  nextCursor: number | null;
  limit: number;

  hasMore: boolean;
} & Record<K, V[]>;
