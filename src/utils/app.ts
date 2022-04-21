export const getCurrentDomain = (): string => {
  return window.location.hostname || document.location.host || ''
}
