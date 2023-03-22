type CacheItem<T = unknown> =
  | {
      value: T
      deadline?: number
    }
  | undefined

interface Cache {
  [area: string]: {
    [key: string]: CacheItem
  }
}

const cache: Cache = {}

const get = <T>(area: string, key: string) => {
  return cache[area]?.[key] as CacheItem<T>
}

const add = <T = unknown>({
  area,
  key,
  value,
  deadline = Infinity,
}: {
  area: string
  key: string
  value: T
  deadline?: number
}) => {
  if (area && key && value) {
    cache[area] = {
      ...cache[area],
      [key]: {
        value,
        deadline,
      },
    }
  }
}

const remove = (area: string, key: string) => {
  if (cache[area]?.[key]) {
    cache[area][key] = undefined
  }
}

export default {
  get,
  add,
  remove,
}
