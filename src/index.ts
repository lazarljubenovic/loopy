import * as svg from './svg'
import doc = Mocha.reporters.doc

enum Side {
  Bottom = 1,
  Right = 2,
  Top = 4,
  Left = 8,
}

function isFacing (side: Side) {
  return function (block: number): boolean {
    return (side & block) !== 0
  }
}

function xnor (a: boolean, b: boolean) {
  return a && b || (!a && !b)
}

function isCorrectHorizontalOrder (leftBlock: number, rightBlock: number) {
  return xnor(isFacing(Side.Right)(leftBlock), isFacing(Side.Left)(rightBlock))
}

function isCorrectVerticalOrder (topBlock: number, bottomBlock: number) {
  return xnor(isFacing(Side.Bottom)(topBlock), isFacing(Side.Top)(bottomBlock))
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

export function arrayAccess (array: ReadonlyArray<number> | Array<number>, index: number, times: number = 1): number {
  if (times < 0) throw new Error(`“times” argument must be >= 0.`)
  let curr = array[index]
  for (let k = 1; k < times; k++) {
    curr = array[curr]
  }
  return curr
}

function defaultRandomNumberGenerator (): number {
  return Math.floor((Math.random() * 4))
}

export class Board {

  private matrix: number[][]

  constructor (public width: number,
               public height: number) {
    this.matrix = new Array(height)
    for (let row = 0; row < height; row++) {
      this.matrix[row] = new Array(width)
      for (let col = 0; col < width; col++) {
        this.setCell(row, col, 0)
      }
    }
  }

  private checkBounds (r: number, c: number) {
    const h = this.height
    const w = this.width
    if (0 <= r && r <= h - 1 && 0 <= c && c <= w - 1) return
    throw new RangeError(`Block ${r}/${c} doesn't fit in the matrix.`)
  }

  public get (rowIndex: number, colIndex: number): number {
    this.checkBounds(rowIndex, colIndex)
    return this.getUnsafe(rowIndex, colIndex)!
  }

  public getUnsafe (rowIndex: number, colIndex: number): number | undefined {
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

  public rotate(row: number, col: number, spin: 1 | -1, times = 1) {
    this.checkBounds(row, col)
    const curr = this.get(row, col)
    const next = arrayAccess(spin == 1 ? CW_ROTATION_MAP : CCW_ROTATION_MAP, curr, times)
    this.setCell(row, col, next)
  }

  public isComplete (): boolean {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const curr = this.get(row, col)
        const below = this.getUnsafe(row + 1, col)
        const right = this.getUnsafe(row, col + 1)
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

}

const PATHS = {
  nothing: '',
  tCurve: 'M 32 0 Q 32 32 64 32 Q 32 32 32 64',
  curve: 'M 64 32 Q 32 32 32 64',
  line: 'M 32 0 L 32 64',
  singlet: 'M 64 32 Q 64 32 40 32 Q 40 40 32 40 Q 24 40 24 32 Q 24 24 32 24 Q 40 24 40 32',
  full: 'M 32 0 Q 32 32 64 32 Q 32 32 32 64 Q 32 32 0 32 Q 32 32 32 0',
}

// [path, number of 90-degree (ccw) turns]
const PATH_MAP: ReadonlyArray<[string, number]> = [
  /* 0 */ [PATHS.nothing, 0],
  /* 1 */ [PATHS.singlet, 3],
  /* 2 */ [PATHS.singlet, 0],
  /* 3 */ [PATHS.curve, 0],
  /* 4 */ [PATHS.singlet, 1],
  /* 5 */ [PATHS.line, 0],
  /* 6 */ [PATHS.curve, 1],
  /* 7 */ [PATHS.tCurve, 0],
  /* 8 */ [PATHS.singlet, 2],
  /* 9 */ [PATHS.curve, 3],
  /* 10 */ [PATHS.line, 1],
  /* 11 */ [PATHS.tCurve, 3],
  /* 12 */ [PATHS.curve, 2],
  /* 13 */ [PATHS.tCurve, 2],
  /* 14 */ [PATHS.tCurve, 1],
  /* 15 */ [PATHS.full, 0],
]

class BoardRenderer {

  private svgElement: SVGSVGElement
  private onCompleteFn: (() => void) | undefined
  private levelNumberElement: HTMLElement
  private completeMessageElement: HTMLElement
  private isComplete: boolean = false

  public constructor (private root: HTMLElement,
                      private board: Board,
                      levelNumber: number) {
    let w = this.board.width * 64
    const h = this.board.height * 64

    this.svgElement = svg.svg()
    this.svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    this.svgElement.setAttribute('viewBox', `0 0 ${w} ${h}`)
    this.svgElement.setAttribute('width', (w * 2).toString(10))
    this.svgElement.setAttribute('height', (h * 2).toString(10))

    this.completeMessageElement = document.createElement('div')
    this.completeMessageElement.id = 'complete-message'
    this.completeMessageElement.innerText = `Click for the next level`
    this.completeMessageElement.style.opacity = '0'

    this.levelNumberElement = document.createElement('div')
    this.levelNumberElement.id = 'level-counter'
    this.levelNumberElement.innerText = levelNumber.toString(10)

    this.root.append(this.svgElement, this.completeMessageElement, this.levelNumberElement)
  }

  public drawBoard () {
    const groups: SVGGElement[] = []
    for (let i = 0; i < this.board.height; i++) {
      for (let j = 0; j < this.board.width; j++) {
        const cell = this.board.get(i, j)
        const rect = svg.rect(64, 64)
        rect.setAttribute('fill', 'transparent')
        const pathInfo = PATH_MAP[cell]
        const path = svg.path(pathInfo[0])
        path.setAttribute('transform', `rotate(${-90 * pathInfo[1]} 32 32)`)
        path.setAttribute('stroke', 'black')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-width', '3')
        const g = svg.g(rect, path)
        g.setAttribute('transform', `translate(${j * 64} ${i * 64})`)
        groups.push(g)
      }
    }

    this.svgElement.append(...groups)
  }

  public addEventListeners () {
    const createHandler = (spin: 1 | -1) => (event: MouseEvent) => {
      if (this.isComplete) return
      event.preventDefault()
      event.stopPropagation()
      const target = event.target as SVGElement
      const group = target.parentElement!
      if (!(group instanceof SVGGElement)) return
      const groups = [...this.svgElement.children]
      const index = groups.indexOf(group)
      const rowIndex = Math.floor(index / this.board.width)
      const colIndex = index % this.board.width
      this.rotate(rowIndex, colIndex, spin)
    }

    this.svgElement.addEventListener('click', createHandler(1))
    this.svgElement.addEventListener('contextmenu', createHandler(-1))
  }

  private rotate (rowIndex: number, colIndex: number, spin: 1 | -1) {
    const index = rowIndex * this.board.width + colIndex
    const g = this.svgElement.children[index] as SVGGElement
    const rotation = this.svgElement.createSVGTransform()
    rotation.setRotate(spin * 90, 32, 32)
    g.transform.baseVal.appendItem(rotation)

    this.board.rotate(rowIndex, colIndex, spin)
    if (this.board.isComplete()) this.runOnCompleteHook()
  }

  public onComplete (fn: () => void) {
    this.onCompleteFn = fn
  }

  private runOnCompleteHook () {
    if (this.onCompleteFn != null) {
      this.onCompleteFn()
    }
    this.showCompleteMessage()
  }

  public showCompleteMessage () {
    this.completeMessageElement.style.opacity = '1'
  }

  public disableMovement () {
    this.isComplete = true
  }

}

class Game {

  private currentLevel = 0
  private isWaitingForClickToGoToNextLevel: boolean = false
  private readonly ROOT: HTMLDivElement

  private colorSchemes = [
    ['#E0E1DD', '#415A77'],
    ['#CFF27E', '#523A34'],
    ['#E2C2C6', '#610F7F'],
    ['#F7F5FB', '#084887'],
    ['#E5F77D', '#823038'],
  ]

  private LEVELS = [
    [
      [0, 3, 9, 3, 8],
      [3, 13, 5, 6, 9],
      [7, 12, 5, 3, 13],
      [6, 9, 5, 7, 12],
      [2, 12, 6, 12, 0],
    ],
    [
      [3, 10, 9, 3, 9],
      [6, 11, 13, 5, 4],
      [0, 7, 15, 13, 0],
      [1, 5, 7, 14, 9],
      [6, 12, 6, 10, 12],
    ]
  ]

  public constructor () {
    this.ROOT = document.getElementById('root') as HTMLDivElement
    this.ROOT.addEventListener('click', () => {
      if (!this.isWaitingForClickToGoToNextLevel) return
      this.currentLevel++
      document.getElementById('level')!.remove()
      this.loadCurrentLevel()
      this.isWaitingForClickToGoToNextLevel = false
    })
  }

  private loadLevel (level: number) {
    const board = new Board(5, 5)
    board.defineLevel(this.LEVELS[level])
    board.scramble()

    const levelRoot = document.createElement('div')
    levelRoot.id = 'level'
    const renderer = new BoardRenderer(levelRoot, board, level + 1)
    renderer.drawBoard()
    renderer.addEventListeners()
    renderer.onComplete(() => {
      renderer.disableMovement()
      this.isWaitingForClickToGoToNextLevel = true
    })

    const colorScheme = this.colorSchemes[level % this.colorSchemes.length]
    const [background, foreground] = colorScheme
    document.documentElement.style.setProperty('--background', background)
    document.documentElement.style.setProperty('--foreground', foreground)

    this.ROOT.append(levelRoot)
  }

  public loadCurrentLevel () {
    this.loadLevel(this.currentLevel)
  }

  public async main() {
    this.loadCurrentLevel()
  }

}

const game = new Game()
game.main().catch(console.error)
