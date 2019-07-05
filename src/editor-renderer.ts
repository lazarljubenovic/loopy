import * as svg from './svg'
import { Board } from './board'
import { PATH_MAP } from './board-renderer'
import { Side } from './side'


export class EditorRenderer {

  private svgEl: SVGSVGElement

  public constructor (private root: HTMLElement,
                      private board: Board) {
    this.svgEl = svg.svg()
  }

  public drawEditor () {
    const settingsEl = document.createElement('div')
    settingsEl.id = 'settings'
    const flipSectionEl = this.initSettingSection('flip', `Flip`, [])
    const rotateSectionEL = this.initSettingSection('rotate', `Rotate`, [])
    const lockSectionEl = this.initSettingSection('lock', `Lock`, [])
    const flipAndRotateWrapperEl = document.createElement('div')
    flipAndRotateWrapperEl.append(flipSectionEl, rotateSectionEL)
    settingsEl.append(flipAndRotateWrapperEl, lockSectionEl)

    this.svgEl = this.renderBoard()
    const boardWrapperEl = document.createElement('div')
    boardWrapperEl.classList.add('board-wrapper')
    boardWrapperEl.append(this.svgEl)

    this.root.append(boardWrapperEl, settingsEl)
  }

  private initSettingSection (id: string, title: string, buttons: HTMLButtonElement[]): HTMLDivElement {
    const wrapperEl = document.createElement('div')
    wrapperEl.id = id
    wrapperEl.classList.add('wrapper')
    const titleEl = document.createElement('div')
    titleEl.classList.add('title')
    titleEl.innerText = title
    const flipButtonsEl = document.createElement('div')
    flipButtonsEl.classList.add('buttons')
    flipButtonsEl.append(...buttons)
    wrapperEl.append(titleEl, flipButtonsEl)
    return wrapperEl
  }

  private createSettingButton (icon: SVGSVGElement, text: string, action: () => void) {
    const buttonEl = document.createElement('button')
    const textEl = document.createElement('div')
    textEl.classList.add('text')
    textEl.innerText = text
    const iconWrapperEl = document.createElement('div')
    iconWrapperEl.classList.add('icon-wrapper')
    buttonEl.append(textEl, iconWrapperEl)
    buttonEl.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
      action()
    })
    return buttonEl
  }

  private renderLook (): SVGGElement[] {
    const groups: SVGGElement[] = []
    for (let i = 0; i < this.board.height; i++) {
      for (let j = 0; j < this.board.width; j++) {
        const cell = this.board.getCell(i, j)
        const rect = svg.rect(64, 64)
        const pathInfo = PATH_MAP[cell]
        const path = svg.path(pathInfo[0])

        path.setAttribute('transform', `rotate(${-90 * pathInfo[1]} 32 32)`)
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-width', '3')

        const x = j * 64 + (j - 1) * 4 + 8
        const y = i * 64 + (i - 1) * 4 + 8

        const g = svg.g(rect, path)
        g.setAttribute('transform', `translate(${x} ${y})`)
        groups.push(g)
      }
    }
    return groups
  }

  private renderBoard (): SVGSVGElement {
    const w = this.board.width * 64 + (this.board.width - 1) * 4 + 8
    const h = this.board.height * 64 + (this.board.height - 1) * 4 + 8

    const svgElement = svg.svg()
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    svgElement.setAttribute('viewBox', `0 0 ${w} ${h}`)
    svgElement.setAttribute('width', (w * 2).toString(10))
    svgElement.setAttribute('height', (h * 2).toString(10))

    const buttons: SVGCircleElement[] = []

    for (let i = 0; i < this.board.height; i++) {
      for (let j = 0; j < this.board.width; j++) {
        const x = j * 64 + (j - 1) * 4 + 8
        const y = i * 64 + (i - 1) * 4 + 8

        // east of cell
        if (j != this.board.width - 1) {
          const button = svg.circle(x + 64 + 2, y + 32, 16)
          button.addEventListener('click', () => {
            this.board.toggleBit(i, j, Side.East)
            this.updateLook()
          })
          buttons.push(button)
        }

        // south of cell
        if (i != this.board.height - 1) {
          const button = svg.circle(x + 32, y + 64 + 2, 16)
          button.addEventListener('click', () => {
            this.board.toggleBit(i, j, Side.South)
            this.updateLook()
          })
          buttons.push(button)
        }
      }
    }

    const buttonsGroup = svg.g()
    buttonsGroup.id = 'buttons'
    buttonsGroup.append(...buttons)

    const groups = this.renderLook()
    const looksGroup = svg.g()
    looksGroup.id ='looks'
    looksGroup.append(...groups)
    svgElement.append(looksGroup, buttonsGroup)

    return svgElement
  }

  public updateLook () {
    const looksGroup = document.getElementById('looks') as unknown as SVGGElement
    looksGroup.remove()
    const newLooksGroup = svg.g()
    newLooksGroup.id = 'looks'
    newLooksGroup.append(...this.renderLook())
    this.svgEl.prepend(newLooksGroup)
    console.log(this.board.printArray())
  }

}
