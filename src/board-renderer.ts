import { Board } from './board'
import * as svg from './svg'

const PATHS = {
  nothing: '',
  tCurve: 'M 32 0 Q 32 32 64 32 Q 32 32 32 64',
  curve: 'M 64 32 Q 32 32 32 64',
  line: 'M 32 0 L 32 64',
  singlet: 'M 64 32 Q 64 32 40 32 Q 40 40 32 40 Q 24 40 24 32 Q 24 24 32 24 Q 40 24 40 32',
  full: 'M 32 0 Q 32 32 64 32 Q 32 32 32 64 Q 32 32 0 32 Q 32 32 32 0',
}

// [path, number of 90-degree (ccw) turns]
export const PATH_MAP: ReadonlyArray<[string, number]> = [
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

export class BoardRenderer {

  private svgElement: SVGSVGElement
  private onCompleteFn: (() => void) | undefined
  private levelNumberElement: HTMLElement
  private completeMessageElement: HTMLElement
  private isComplete: boolean = false

  public constructor (private root: HTMLElement,
                      private board: Board,
                      levelNumber: number) {
    const w = this.board.width * 64
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
        const cell = this.board.getCell(i, j)
        const rect = svg.rect(64, 64)
        rect.setAttribute('fill', 'transparent')
        const pathInfo = PATH_MAP[cell]
        const path = svg.path(pathInfo[0])
        path.setAttribute('transform', `rotate(${-90 * pathInfo[1]} 32 32)`)
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
