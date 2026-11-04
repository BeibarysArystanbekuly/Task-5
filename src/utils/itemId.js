export function isValidItemId(id) {
  if (typeof id === 'number') return Number.isSafeInteger(id) && id > 0
  return typeof id === 'string' && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))
}
