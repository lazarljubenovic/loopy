import {
  isCorrectHorizontalOrder,
  isCorrectVerticalOrder,
  removeEast,
  removeNorth,
  removeSouth,
  removeWest,
  Side,
} from './side'
import { arrayAccess } from './helpers'

const MIN_WIDTH = 3
const MIN_HEIGHT = 3
const MAX_WIDTH = 12
const MAX_HEIGHT = 12

export class FriendlyError extends Error {
}

export class BoardSizeFriendlyError extends FriendlyError {
  constructor () {
    super(`Board size must be between 3×3 and 12×12.`)
  }
}


const CCW_ROTATION_MAP: ReadonlyArray<number> = [
  /* 0 */ 0,
  /* 1 */ 2,
  /* 2 */ 4,
  /* 3 */ 6,
  /* 4 */ 8,
  /* 5 */ 10,
  /* 6 */ 12,
  /* 7 */ 14,
  /* 8 */ 1,
  /* 9 */ 3,
  /* 10 */ 5,
  /* 11 */ 7,
  /* 12 */ 9,
  /* 13 */ 11,
  /* 14 */ 13,
  /* 15 */ 15,
]

const CW_ROTATION_MAP: ReadonlyArray<number> = new Array(16)
CCW_ROTATION_MAP.forEach((el, i) => {
  ;(CW_ROTATION_MAP as Array<number>)[el] = i
})

const UNICODE_MAP: ReadonlyArray<string> = [
  /* 0 */ ' ',
  /* 1 */ '╻',
  /* 2 */ '╺',
  /* 3 */ '┏',
  /* 4 */ '╹',
  /* 5 */ '┃',
  /* 6 */ '┗',
  /* 7 */ '┣',
  /* 8 */ '╸',
  /* 9 */ '┓',
  /* 10 */ '━',
  /* 11 */ '┳',
  /* 12 */ '┛',
  /* 13 */ '┫',
  /* 14 */ '┻',
  /* 15 */ '╋',
]

function defaultRandomNumberGenerator (): number {
  return Math.floor((Math.random() * 4))
}

export class Board {

  private matrix: number[][]

  public constructor (public width: number = 3,
                      public height: number = 3) {
    this.checkSize()
    this.matrix = new Array(this.height)
    for (let i = 0; i < this.height; i++) {
      this.matrix[i] = new Array(this.width)
      for (let j = 0; j < this.width; j++) {
        this.matrix[i][j] = 0
      }
    }
  }

  public getCell (rowIndex: number, colIndex: number): number {
    this.checkBounds(rowIndex, colIndex)
    return this.getCellUnsafe(rowIndex, colIndex)!
  }

  public getCellUnsafe (rowIndex: number, colIndex: number): number | undefined {
    const row = this.matrix[rowIndex]
    if (row == null) return undefined
    return row[colIndex]
  }

  private setCell (row: number, col: number, block: number) {
    this.checkBounds(row, col)
    this.matrix[row][col] = block
  }

  // We also check dimensions while iterating.
  public defineLevel (matrix: number[][]) {
    if (matrix.length != this.height) throw new Error(`Wrong matrix dimensions.`)
    for (let i = 0; i < matrix.length; i++) {
      if (matrix[i].length != this.width) throw new Error(`Wrong matrix dimensions.`)
      for (let j = 0; j < matrix[i].length; j++) {
        this.setCell(i, j, matrix[i][j])
      }
    }
  }

  public rotate (row: number, col: number, spin: 1 | -1, times = 1) {
    this.checkBounds(row, col)
    const curr = this.getCell(row, col)
    const next = arrayAccess(spin == 1 ? CW_ROTATION_MAP : CCW_ROTATION_MAP, curr, times)
    this.setCell(row, col, next)
  }

  public isComplete (): boolean {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const curr = this.getCell(row, col)
        const below = this.getCellUnsafe(row + 1, col)
        const right = this.getCellUnsafe(row, col + 1)
        if (
          (below != null && !isCorrectVerticalOrder(curr, below))
          ||
          (right != null && !isCorrectHorizontalOrder(curr, right))
        ) {
          return false
        }
      }
    }
    return true
  }

  public scramble (randomNumberGenerator: () => number = defaultRandomNumberGenerator) {
    for (let i = 0; i < this.matrix.length; i++) {
      for (let j = 0; j < this.matrix[i].length; j++) {
        const times = randomNumberGenerator()
        this.rotate(i, j, 1, times)
      }
    }
  }

  public print (map: Array<string> | ReadonlyArray<string> = UNICODE_MAP) {
    return this.matrix.map(row => row.map(cell => map[cell]).join('')).join('\n')
  }

  public printArray () {
    return '[\n'
      + this.matrix.map(row => {
        return '  [' + row.map(cell => cell.toString(10).padStart(2)).join(', ') + ']'
      }).join(',\n')
      + ',\n]'
  }

  public addRowToNorth () {
    this.checkSize(this.width, this.height + 1)
    this.height++
    this.matrix.unshift(new Array(this.height))
  }

  public removeRowFromNorth () {
    this.checkSize(this.width, this.height - 1)
    this.height--
    this.matrix.shift()
    this.repairBorders()
  }

  public addRowToSouth () {
    this.checkSize(this.width, this.height + 1)
    this.height++
    this.matrix.push(new Array(this.height))
  }

  public removeRowFromSouth () {
    this.checkSize(this.width, this.height - 1)
    this.height--
    this.matrix.pop()
    this.repairBorders()
  }

  public addColumnToWest () {
    this.checkSize(this.width + 1, this.height)
    this.width++
    this.matrix.forEach(row => {
      row.unshift(0)
    })
  }

  public removeColumnFromWest () {
    this.checkSize(this.width - 1, this.height)
    this.width--
    this.matrix.forEach(row => {
      row.shift()
    })
  }

  public addColumnToEast () {
    this.checkSize(this.width, this.height - 1)
    this.height--
    this.matrix.forEach(row => {
      row.push(0)
    })
  }

  public removeColumnFromEast () {
    this.checkSize(this.width - 1, this.height)
    this.width--
    this.matrix.forEach(row => {
      row.pop()
    })
  }

  private checkBounds (r: number, c: number) {
    const h = this.height
    const w = this.width
    if (0 <= r && r <= h - 1 && 0 <= c && c <= w - 1) return
    throw new RangeError(`Block ${r}/${c} doesn't fit in the matrix.`)
  }

  private checkSize (width: number = this.width, height: number = this.height) {
    if (width < 3 || width > 12 || height < 3 || height > 12) {
      throw new BoardSizeFriendlyError()
    }
  }

  // When a row or column is removed, the remaining board will likely "leak" outside.
  // This function checks the lines on the border of the board and removes anything
  // that might peek out.
  private repairBorders () {
    for (let i = 0; i < this.width; i++) {
      this.matrix[0][i] = removeNorth(this.matrix[0][i])
      this.matrix[this.matrix.length - 1][i] = removeSouth(this.matrix[this.matrix.length - 1][i])
    }
    for (let i = 0; i < this.height; i++) {
      this.matrix[i][0] = removeWest(this.matrix[i][0])
      this.matrix[i][this.matrix[i].length - 1] = removeEast(this.matrix[i][this.matrix[i].length - 1])
    }
  }

  private xorOrIgnore (row: number, col: number, arg: number) {
    const cell = this.getCellUnsafe(row, col)
    if (cell == null) return
    this.setCell(row, col, cell ^ arg)
  }

  public toggleBit (row: number, col: number, side: Side) {
    const [i, j] = DIRECTIONS[side]
    const [lbRow, lbCol] = [row + i, col + j]
    const lbSide = LOOKBACK_DIRECTION[side]
    this.xorOrIgnore(row, col, side)
    this.xorOrIgnore(lbRow, lbCol, lbSide)
  }

}

const DIRECTIONS: Record<Side, [number, number]> = {
  [Side.North]: [-1, 0],
  [Side.South]: [1, 0],
  [Side.East]: [0, 1],
  [Side.West]: [0, -1],
}

const LOOKBACK_DIRECTION: Record<Side, Side> = {
  [Side.North]: Side.South,
  [Side.South]: Side.North,
  [Side.West]: Side.East,
  [Side.East]: Side.West,
}
