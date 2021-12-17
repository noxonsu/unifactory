export const cache: {
  [area: string]: {
    [key: string]: any
  }
} = {}

export const addValue = (area: string, key: string, value: any) => {
  if (area && key && value) {
    cache[area] = {
      [key]: value,
    }
  }
}

export const removeValue = (area: string, key: string) => {
  if (cache[area]?.[key]) delete cache[key]
}
