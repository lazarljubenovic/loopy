import { Board } from './board'
import { BoardRenderer } from './board-renderer'
import { EditorRenderer } from './editor-renderer'
import levels from './levels'

const enum LocalStorageKey {
  CurrentLevel = 'loopy@current-level',
}

class Game {

  private currentLevel = 0
  private isWaitingForClickToGoToNextLevel: boolean = false
  private readonly ROOT: HTMLDivElement

  private colorSchemes = [
    ['#E0E1DD', '#415A77'],
    // ['#CFF27E', '#523A34'],
    // ['#E2C2C6', '#610F7F'],
    ['#F7F5FB', '#084887'],
    ['#E5F77D', '#823038'],
    ['#F2F3AE', '#020122'],
    // ['#CBEFB6', '#635D5C'],
    ['#F4FFF8', '#1C3738'],
    ['#F4FAFF', '#8789C0'],
    // ['#94B9AF', '#593837'],
  ]

  private LEVELS = levels

  public constructor () {
    this.ROOT = document.getElementById('root') as HTMLDivElement
    this.ROOT.addEventListener('click', () => {
      if (!this.isWaitingForClickToGoToNextLevel) return
      this.currentLevel++
      document.getElementById('level')!.remove()
      this.loadLevel()
      this.isWaitingForClickToGoToNextLevel = false
    })
  }

  private loadLevel (levelNumber: number = this.currentLevel) {
    const level = this.LEVELS[levelNumber]
    if (level == null) {
      this.loadEndScreen()
      return
    }

    const height = level.length
    const width = level[0].length
    const board = new Board(width, height)
    board.defineLevel(level)
    board.scramble()

    const levelRoot = document.createElement('div')
    levelRoot.id = 'level'
    const renderer = new BoardRenderer(levelRoot, board, levelNumber + 1)
    renderer.drawBoard()
    renderer.addEventListeners()
    renderer.onComplete(() => {
      renderer.disableMovement()
      this.saveState()
      this.isWaitingForClickToGoToNextLevel = true
    })

    const colorScheme = this.colorSchemes[levelNumber % this.colorSchemes.length]
    const [background, foreground] = colorScheme
    document.documentElement.style.setProperty('--background', background)
    document.documentElement.style.setProperty('--foreground', foreground)

    this.ROOT.append(levelRoot)
  }

  private loadEndScreen () {
    const gameCompleteRoot = document.createElement('div')
    gameCompleteRoot.id = 'game-complete'
    gameCompleteRoot.innerText = `Game complete!`
    this.ROOT.append(gameCompleteRoot)
  }

  public main () {
    this.loadLevel()
  }

  public editor () {
    const board = new Board(7, 7)
    const renderer = new EditorRenderer(this.ROOT, board)
    renderer.drawEditor()
  }

  public saveState () {
    localStorage.setItem(LocalStorageKey.CurrentLevel, this.currentLevel.toString(10))
  }

  public loadState () {
    const currentLevelString = localStorage.getItem(LocalStorageKey.CurrentLevel) || '0'
    this.currentLevel = Number.parseInt(currentLevelString)
  }

}

const game = new Game()
game.loadState()
game.main()
