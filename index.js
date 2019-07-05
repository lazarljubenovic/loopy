(function () {
  'use strict';

  function xnor(a, b) {
      return a && b || (!a && !b);
  }
  function arrayAccess(array, index, times = 1) {
      if (times < 0)
          throw new Error(`“times” argument must be >= 0.`);
      let curr = array[index];
      for (let k = 1; k < times; k++) {
          curr = array[curr];
      }
      return curr;
  }

  var Side;
  (function (Side) {
      Side[Side["South"] = 1] = "South";
      Side[Side["East"] = 2] = "East";
      Side[Side["North"] = 4] = "North";
      Side[Side["West"] = 8] = "West";
  })(Side || (Side = {}));
  function isFacing(side) {
      return function (block) {
          return (side & block) !== 0;
      };
  }
  function isCorrectHorizontalOrder(leftBlock, rightBlock) {
      return xnor(isFacing(Side.East)(leftBlock), isFacing(Side.West)(rightBlock));
  }
  function isCorrectVerticalOrder(topBlock, bottomBlock) {
      return xnor(isFacing(Side.South)(topBlock), isFacing(Side.North)(bottomBlock));
  }
  function remove(side) {
      return function (block) {
          return 0b1111 & ~side & block;
      };
  }
  const removeNorth = remove(Side.North);
  const removeSouth = remove(Side.South);
  const removeWest = remove(Side.West);
  const removeEast = remove(Side.East);

  class FriendlyError extends Error {
  }
  class BoardSizeFriendlyError extends FriendlyError {
      constructor() {
          super(`Board size must be between 3×3 and 12×12.`);
      }
  }
  const CCW_ROTATION_MAP = [
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
  ];
  const CW_ROTATION_MAP = new Array(16);
  CCW_ROTATION_MAP.forEach((el, i) => {
      CW_ROTATION_MAP[el] = i;
  });
  const UNICODE_MAP = [
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
  ];
  function defaultRandomNumberGenerator() {
      return Math.floor((Math.random() * 4));
  }
  class Board {
      constructor(width = 3, height = 3) {
          this.width = width;
          this.height = height;
          this.checkSize();
          this.matrix = new Array(this.height);
          for (let i = 0; i < this.height; i++) {
              this.matrix[i] = new Array(this.width);
              for (let j = 0; j < this.width; j++) {
                  this.matrix[i][j] = 0;
              }
          }
      }
      getCell(rowIndex, colIndex) {
          this.checkBounds(rowIndex, colIndex);
          return this.getCellUnsafe(rowIndex, colIndex);
      }
      getCellUnsafe(rowIndex, colIndex) {
          const row = this.matrix[rowIndex];
          if (row == null)
              return undefined;
          return row[colIndex];
      }
      setCell(row, col, block) {
          this.checkBounds(row, col);
          this.matrix[row][col] = block;
      }
      // We also check dimensions while iterating.
      defineLevel(matrix) {
          if (matrix.length != this.height)
              throw new Error(`Wrong matrix dimensions.`);
          for (let i = 0; i < matrix.length; i++) {
              if (matrix[i].length != this.width)
                  throw new Error(`Wrong matrix dimensions.`);
              for (let j = 0; j < matrix[i].length; j++) {
                  this.setCell(i, j, matrix[i][j]);
              }
          }
      }
      rotate(row, col, spin, times = 1) {
          this.checkBounds(row, col);
          const curr = this.getCell(row, col);
          const next = arrayAccess(spin == 1 ? CW_ROTATION_MAP : CCW_ROTATION_MAP, curr, times);
          this.setCell(row, col, next);
      }
      isComplete() {
          for (let row = 0; row < this.height; row++) {
              for (let col = 0; col < this.width; col++) {
                  const curr = this.getCell(row, col);
                  const below = this.getCellUnsafe(row + 1, col);
                  const right = this.getCellUnsafe(row, col + 1);
                  if ((below != null && !isCorrectVerticalOrder(curr, below))
                      ||
                          (right != null && !isCorrectHorizontalOrder(curr, right))) {
                      return false;
                  }
              }
          }
          return true;
      }
      scramble(randomNumberGenerator = defaultRandomNumberGenerator) {
          for (let i = 0; i < this.matrix.length; i++) {
              for (let j = 0; j < this.matrix[i].length; j++) {
                  const times = randomNumberGenerator();
                  this.rotate(i, j, 1, times);
              }
          }
      }
      print(map = UNICODE_MAP) {
          return this.matrix.map(row => row.map(cell => map[cell]).join('')).join('\n');
      }
      printArray() {
          return '[\n'
              + this.matrix.map(row => {
                  return '  [' + row.map(cell => cell.toString(10).padStart(2)).join(', ') + ']';
              }).join(',\n')
              + ',\n]';
      }
      addRowToNorth() {
          this.checkSize(this.width, this.height + 1);
          this.height++;
          this.matrix.unshift(new Array(this.height));
      }
      removeRowFromNorth() {
          this.checkSize(this.width, this.height - 1);
          this.height--;
          this.matrix.shift();
          this.repairBorders();
      }
      addRowToSouth() {
          this.checkSize(this.width, this.height + 1);
          this.height++;
          this.matrix.push(new Array(this.height));
      }
      removeRowFromSouth() {
          this.checkSize(this.width, this.height - 1);
          this.height--;
          this.matrix.pop();
          this.repairBorders();
      }
      addColumnToWest() {
          this.checkSize(this.width + 1, this.height);
          this.width++;
          this.matrix.forEach(row => {
              row.unshift(0);
          });
      }
      removeColumnFromWest() {
          this.checkSize(this.width - 1, this.height);
          this.width--;
          this.matrix.forEach(row => {
              row.shift();
          });
      }
      addColumnToEast() {
          this.checkSize(this.width, this.height - 1);
          this.height--;
          this.matrix.forEach(row => {
              row.push(0);
          });
      }
      removeColumnFromEast() {
          this.checkSize(this.width - 1, this.height);
          this.width--;
          this.matrix.forEach(row => {
              row.pop();
          });
      }
      checkBounds(r, c) {
          const h = this.height;
          const w = this.width;
          if (0 <= r && r <= h - 1 && 0 <= c && c <= w - 1)
              return;
          throw new RangeError(`Block ${r}/${c} doesn't fit in the matrix.`);
      }
      checkSize(width = this.width, height = this.height) {
          if (width < 3 || width > 12 || height < 3 || height > 12) {
              throw new BoardSizeFriendlyError();
          }
      }
      // When a row or column is removed, the remaining board will likely "leak" outside.
      // This function checks the lines on the border of the board and removes anything
      // that might peek out.
      repairBorders() {
          for (let i = 0; i < this.width; i++) {
              this.matrix[0][i] = removeNorth(this.matrix[0][i]);
              this.matrix[this.matrix.length - 1][i] = removeSouth(this.matrix[this.matrix.length - 1][i]);
          }
          for (let i = 0; i < this.height; i++) {
              this.matrix[i][0] = removeWest(this.matrix[i][0]);
              this.matrix[i][this.matrix[i].length - 1] = removeEast(this.matrix[i][this.matrix[i].length - 1]);
          }
      }
      xorOrIgnore(row, col, arg) {
          const cell = this.getCellUnsafe(row, col);
          if (cell == null)
              return;
          this.setCell(row, col, cell ^ arg);
      }
      toggleBit(row, col, side) {
          const [i, j] = DIRECTIONS[side];
          const [lbRow, lbCol] = [row + i, col + j];
          const lbSide = LOOKBACK_DIRECTION[side];
          this.xorOrIgnore(row, col, side);
          this.xorOrIgnore(lbRow, lbCol, lbSide);
      }
  }
  const DIRECTIONS = {
      [Side.North]: [-1, 0],
      [Side.South]: [1, 0],
      [Side.East]: [0, 1],
      [Side.West]: [0, -1],
  };
  const LOOKBACK_DIRECTION = {
      [Side.North]: Side.South,
      [Side.South]: Side.North,
      [Side.West]: Side.East,
      [Side.East]: Side.West,
  };

  function el(tagName) {
      return document.createElementNS('http://www.w3.org/2000/svg', tagName);
  }
  function svg() {
      return el('svg');
  }
  function g(...svgElements) {
      const element = el('g');
      element.append(...svgElements);
      return element;
  }
  function circle(cx, cy, r) {
      const element = el('circle');
      element.setAttribute('cx', cx.toString(10));
      element.setAttribute('cy', cy.toString(10));
      element.setAttribute('r', r.toString(10));
      return element;
  }
  function path(d) {
      const element = el('path');
      element.setAttribute('d', d);
      return element;
  }
  function rect(width, height) {
      const element = el('rect');
      element.setAttribute('width', width.toString(10));
      element.setAttribute('height', height.toString(10));
      return element;
  }

  const PATHS = {
      nothing: '',
      tCurve: 'M 32 0 Q 32 32 64 32 Q 32 32 32 64',
      curve: 'M 64 32 Q 32 32 32 64',
      line: 'M 32 0 L 32 64',
      singlet: 'M 64 32 Q 64 32 40 32 Q 40 40 32 40 Q 24 40 24 32 Q 24 24 32 24 Q 40 24 40 32',
      full: 'M 32 0 Q 32 32 64 32 Q 32 32 32 64 Q 32 32 0 32 Q 32 32 32 0',
  };
  // [path, number of 90-degree (ccw) turns]
  const PATH_MAP = [
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
  ];
  class BoardRenderer {
      constructor(root, board, levelNumber) {
          this.root = root;
          this.board = board;
          this.isComplete = false;
          const w = this.board.width * 64;
          const h = this.board.height * 64;
          this.svgElement = svg();
          this.svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          this.svgElement.setAttribute('viewBox', `0 0 ${w} ${h}`);
          this.svgElement.setAttribute('width', (w * 2).toString(10));
          this.svgElement.setAttribute('height', (h * 2).toString(10));
          this.completeMessageElement = document.createElement('div');
          this.completeMessageElement.id = 'complete-message';
          this.completeMessageElement.innerText = `Click for the next level`;
          this.completeMessageElement.style.opacity = '0';
          this.levelNumberElement = document.createElement('div');
          this.levelNumberElement.id = 'level-counter';
          this.levelNumberElement.innerText = levelNumber.toString(10);
          this.root.append(this.svgElement, this.completeMessageElement, this.levelNumberElement);
      }
      drawBoard() {
          const groups = [];
          for (let i = 0; i < this.board.height; i++) {
              for (let j = 0; j < this.board.width; j++) {
                  const cell = this.board.getCell(i, j);
                  const rect$1 = rect(64, 64);
                  rect$1.setAttribute('fill', 'transparent');
                  const pathInfo = PATH_MAP[cell];
                  const path$1 = path(pathInfo[0]);
                  path$1.setAttribute('transform', `rotate(${-90 * pathInfo[1]} 32 32)`);
                  const g$1 = g(rect$1, path$1);
                  g$1.setAttribute('transform', `translate(${j * 64} ${i * 64})`);
                  groups.push(g$1);
              }
          }
          this.svgElement.append(...groups);
      }
      addEventListeners() {
          const createHandler = (spin) => (event) => {
              if (this.isComplete)
                  return;
              event.preventDefault();
              event.stopPropagation();
              const target = event.target;
              const group = target.parentElement;
              if (!(group instanceof SVGGElement))
                  return;
              const groups = [...this.svgElement.children];
              const index = groups.indexOf(group);
              const rowIndex = Math.floor(index / this.board.width);
              const colIndex = index % this.board.width;
              this.rotate(rowIndex, colIndex, spin);
          };
          this.svgElement.addEventListener('click', createHandler(1));
          this.svgElement.addEventListener('contextmenu', createHandler(-1));
      }
      rotate(rowIndex, colIndex, spin) {
          const index = rowIndex * this.board.width + colIndex;
          const g = this.svgElement.children[index];
          const rotation = this.svgElement.createSVGTransform();
          rotation.setRotate(spin * 90, 32, 32);
          g.transform.baseVal.appendItem(rotation);
          this.board.rotate(rowIndex, colIndex, spin);
          if (this.board.isComplete())
              this.runOnCompleteHook();
      }
      onComplete(fn) {
          this.onCompleteFn = fn;
      }
      runOnCompleteHook() {
          if (this.onCompleteFn != null) {
              this.onCompleteFn();
          }
          this.showCompleteMessage();
      }
      showCompleteMessage() {
          this.completeMessageElement.style.opacity = '1';
      }
      disableMovement() {
          this.isComplete = true;
      }
  }

  class EditorRenderer {
      constructor(root, board) {
          this.root = root;
          this.board = board;
          this.svgEl = svg();
      }
      drawEditor() {
          const settingsEl = document.createElement('div');
          settingsEl.id = 'settings';
          const flipSectionEl = this.initSettingSection('flip', `Flip`, []);
          const rotateSectionEL = this.initSettingSection('rotate', `Rotate`, []);
          const lockSectionEl = this.initSettingSection('lock', `Lock`, []);
          const flipAndRotateWrapperEl = document.createElement('div');
          flipAndRotateWrapperEl.append(flipSectionEl, rotateSectionEL);
          settingsEl.append(flipAndRotateWrapperEl, lockSectionEl);
          this.svgEl = this.renderBoard();
          const boardWrapperEl = document.createElement('div');
          boardWrapperEl.classList.add('board-wrapper');
          boardWrapperEl.append(this.svgEl);
          this.root.append(boardWrapperEl, settingsEl);
      }
      initSettingSection(id, title, buttons) {
          const wrapperEl = document.createElement('div');
          wrapperEl.id = id;
          wrapperEl.classList.add('wrapper');
          const titleEl = document.createElement('div');
          titleEl.classList.add('title');
          titleEl.innerText = title;
          const flipButtonsEl = document.createElement('div');
          flipButtonsEl.classList.add('buttons');
          flipButtonsEl.append(...buttons);
          wrapperEl.append(titleEl, flipButtonsEl);
          return wrapperEl;
      }
      createSettingButton(icon, text, action) {
          const buttonEl = document.createElement('button');
          const textEl = document.createElement('div');
          textEl.classList.add('text');
          textEl.innerText = text;
          const iconWrapperEl = document.createElement('div');
          iconWrapperEl.classList.add('icon-wrapper');
          buttonEl.append(textEl, iconWrapperEl);
          buttonEl.addEventListener('click', event => {
              event.preventDefault();
              event.stopPropagation();
              action();
          });
          return buttonEl;
      }
      renderLook() {
          const groups = [];
          for (let i = 0; i < this.board.height; i++) {
              for (let j = 0; j < this.board.width; j++) {
                  const cell = this.board.getCell(i, j);
                  const rect$1 = rect(64, 64);
                  const pathInfo = PATH_MAP[cell];
                  const path$1 = path(pathInfo[0]);
                  path$1.setAttribute('transform', `rotate(${-90 * pathInfo[1]} 32 32)`);
                  path$1.setAttribute('fill', 'none');
                  path$1.setAttribute('stroke-width', '3');
                  const x = j * 64 + (j - 1) * 4 + 8;
                  const y = i * 64 + (i - 1) * 4 + 8;
                  const g$1 = g(rect$1, path$1);
                  g$1.setAttribute('transform', `translate(${x} ${y})`);
                  groups.push(g$1);
              }
          }
          return groups;
      }
      renderBoard() {
          const w = this.board.width * 64 + (this.board.width - 1) * 4 + 8;
          const h = this.board.height * 64 + (this.board.height - 1) * 4 + 8;
          const svgElement = svg();
          svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svgElement.setAttribute('viewBox', `0 0 ${w} ${h}`);
          svgElement.setAttribute('width', (w * 2).toString(10));
          svgElement.setAttribute('height', (h * 2).toString(10));
          const buttons = [];
          for (let i = 0; i < this.board.height; i++) {
              for (let j = 0; j < this.board.width; j++) {
                  const x = j * 64 + (j - 1) * 4 + 8;
                  const y = i * 64 + (i - 1) * 4 + 8;
                  // east of cell
                  if (j != this.board.width - 1) {
                      const button = circle(x + 64 + 2, y + 32, 16);
                      button.addEventListener('click', () => {
                          this.board.toggleBit(i, j, Side.East);
                          this.updateLook();
                      });
                      buttons.push(button);
                  }
                  // south of cell
                  if (i != this.board.height - 1) {
                      const button = circle(x + 32, y + 64 + 2, 16);
                      button.addEventListener('click', () => {
                          this.board.toggleBit(i, j, Side.South);
                          this.updateLook();
                      });
                      buttons.push(button);
                  }
              }
          }
          const buttonsGroup = g();
          buttonsGroup.id = 'buttons';
          buttonsGroup.append(...buttons);
          const groups = this.renderLook();
          const looksGroup = g();
          looksGroup.id = 'looks';
          looksGroup.append(...groups);
          svgElement.append(looksGroup, buttonsGroup);
          return svgElement;
      }
      updateLook() {
          const looksGroup = document.getElementById('looks');
          looksGroup.remove();
          const newLooksGroup = g();
          newLooksGroup.id = 'looks';
          newLooksGroup.append(...this.renderLook());
          this.svgEl.prepend(newLooksGroup);
          console.log(this.board.printArray());
      }
  }

  var levels = [
      [
          [3, 10, 10, 10, 9],
          [7, 10, 10, 9, 5],
          [7, 10, 9, 5, 5],
          [7, 9, 5, 5, 5],
          [6, 14, 14, 14, 12],
      ],
      [
          [3, 11, 9, 3, 9],
          [7, 12, 6, 14, 13],
          [6, 9, 3, 11, 13],
          [3, 13, 7, 12, 5],
          [6, 14, 14, 10, 12],
      ],
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
      ],
      [
          [3, 10, 10, 8, 3, 9],
          [7, 10, 11, 10, 13, 5],
          [7, 8, 7, 9, 4, 5],
          [5, 1, 6, 13, 2, 13],
          [5, 7, 10, 14, 10, 13],
          [6, 12, 2, 10, 10, 12],
      ],
      [
          [1, 0, 3, 11, 10, 8],
          [5, 0, 7, 13, 0, 0],
          [7, 11, 15, 13, 3, 9],
          [6, 12, 7, 15, 14, 13],
          [0, 0, 7, 13, 0, 5],
          [2, 10, 14, 12, 0, 4],
      ],
      [
          [3, 9, 3, 9, 3, 9],
          [6, 13, 5, 5, 7, 12],
          [2, 15, 14, 14, 13, 0],
          [0, 7, 11, 11, 15, 8],
          [3, 13, 5, 5, 7, 9],
          [6, 12, 6, 12, 6, 12],
      ],
      [
          [3, 10, 10, 10, 11, 10, 9],
          [4, 3, 11, 10, 14, 9, 5],
          [1, 5, 7, 9, 1, 5, 5],
          [5, 5, 7, 15, 13, 5, 5],
          [5, 5, 4, 6, 13, 5, 4],
          [5, 6, 11, 10, 14, 12, 1],
          [6, 10, 14, 10, 10, 10, 12],
      ],
      [
          [3, 11, 8, 2, 10, 11, 9],
          [7, 15, 10, 10, 9, 7, 13],
          [4, 7, 11, 9, 5, 5, 4],
          [0, 5, 7, 15, 13, 5, 0],
          [1, 5, 5, 6, 14, 13, 1],
          [7, 13, 6, 10, 10, 15, 13],
          [6, 14, 10, 8, 2, 14, 12],
      ],
      [
          [3, 10, 11, 11, 11, 10, 9],
          [7, 10, 13, 5, 7, 8, 5],
          [7, 10, 15, 14, 15, 11, 13],
          [7, 10, 13, 0, 5, 5, 5],
          [7, 10, 15, 11, 15, 14, 13],
          [5, 2, 13, 5, 7, 10, 13],
          [6, 10, 14, 14, 14, 10, 12],
      ],
  ];

  class Game {
      constructor() {
          this.currentLevel = 0;
          this.isWaitingForClickToGoToNextLevel = false;
          this.colorSchemes = [
              ['#E0E1DD', '#415A77'],
              // ['#CFF27E', '#523A34'],
              // ['#E2C2C6', '#610F7F'],
              ['#F7F5FB', '#084887'],
              ['#E5F77D', '#823038'],
              ['#F2F3AE', '#020122'],
              // ['#CBEFB6', '#635D5C'],
              ['#F4FFF8', '#1C3738'],
              ['#F4FAFF', '#8789C0'],
          ];
          this.LEVELS = levels;
          this.ROOT = document.getElementById('root');
          this.ROOT.addEventListener('click', () => {
              if (!this.isWaitingForClickToGoToNextLevel)
                  return;
              this.currentLevel++;
              document.getElementById('level').remove();
              this.loadLevel();
              this.isWaitingForClickToGoToNextLevel = false;
          });
      }
      loadLevel(levelNumber = this.currentLevel) {
          const level = this.LEVELS[levelNumber];
          if (level == null) {
              this.loadEndScreen();
              return;
          }
          const height = level.length;
          const width = level[0].length;
          const board = new Board(width, height);
          board.defineLevel(level);
          board.scramble();
          const levelRoot = document.createElement('div');
          levelRoot.id = 'level';
          const renderer = new BoardRenderer(levelRoot, board, levelNumber + 1);
          renderer.drawBoard();
          renderer.addEventListeners();
          renderer.onComplete(() => {
              renderer.disableMovement();
              this.saveState();
              this.isWaitingForClickToGoToNextLevel = true;
          });
          const colorScheme = this.colorSchemes[levelNumber % this.colorSchemes.length];
          const [background, foreground] = colorScheme;
          document.documentElement.style.setProperty('--background', background);
          document.documentElement.style.setProperty('--foreground', foreground);
          this.ROOT.append(levelRoot);
      }
      loadEndScreen() {
          const gameCompleteRoot = document.createElement('div');
          gameCompleteRoot.id = 'game-complete';
          gameCompleteRoot.innerText = `Game complete!`;
          this.ROOT.append(gameCompleteRoot);
      }
      main() {
          this.loadLevel();
      }
      editor() {
          const board = new Board(7, 7);
          const renderer = new EditorRenderer(this.ROOT, board);
          renderer.drawEditor();
      }
      saveState() {
          localStorage.setItem("loopy@current-level" /* CurrentLevel */, this.currentLevel.toString(10));
      }
      loadState() {
          const currentLevelString = localStorage.getItem("loopy@current-level" /* CurrentLevel */) || '0';
          this.currentLevel = Number.parseInt(currentLevelString);
      }
  }
  const game = new Game();
  game.loadState();
  game.main();

}());
