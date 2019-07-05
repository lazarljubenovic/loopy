import { xnor } from './helpers'

export enum Side {
  South = 1,
  East = 2,
  North = 4,
  West = 8,
}

export function isFacing (side: Side) {
  return function (block: number): boolean {
    return (side & block) !== 0
  }
}


export function isCorrectHorizontalOrder (leftBlock: number, rightBlock: number) {
  return xnor(isFacing(Side.East)(leftBlock), isFacing(Side.West)(rightBlock))
}

export function isCorrectVerticalOrder (topBlock: number, bottomBlock: number) {
  return xnor(isFacing(Side.South)(topBlock), isFacing(Side.North)(bottomBlock))
}

export function add (side: Side) {
  return function (block: number) {
    return side | block
  }
}

export function remove (side: Side) {
  return function (block: number) {
    return 0b1111 & ~side & block
  }
}

export const removeNorth = remove(Side.North)
export const removeSouth = remove(Side.South)
export const removeWest = remove(Side.West)
export const removeEast = remove(Side.East)
