const generateHash = (value: string): string => {
  let numHash = 0

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)

    numHash = (numHash << 5) - numHash + code
    numHash |= 0 // Convert to 32bit integer
  }

  return window.btoa(String(numHash))
}

export default {
  generateHash,
}
