export function xnor (a: boolean, b: boolean) {
  return a && b || (!a && !b)
}

export function arrayAccess (array: ReadonlyArray<number> | Array<number>, index: number, times: number = 1): number {
  if (times < 0) throw new Error(`“times” argument must be >= 0.`)
  let curr = array[index]
  for (let k = 1; k < times; k++) {
    curr = array[curr]
  }
  return curr
}
