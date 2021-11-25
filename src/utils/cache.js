export const cache = {}

export const addValue = (area, key, value) => {
  if (area && key && value) cache[area][key] = value
}

export const removeValue = (area, key) => {
  if (cache[area] && cache[area][key]) delete cache[key]
}
