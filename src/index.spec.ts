import 'mocha'
import { assert } from 'chai'
import { arrayAccess, Board } from './index'

describe(`Helpers`, () => {

  describe(`arrayAccess`, () => {

    it(`once`, () => {
      assert.equal(arrayAccess([2, 3, 0, 1], 1, 1), 3)
    })

    it(`twice`, () => {
      assert.equal(arrayAccess([2, 3, 0, 1], 1, 2), 1)
    })

    it(`thrice`, () => {
      assert.equal(arrayAccess([1, 2, 3, 0], 1, 3), 0)
    })

  })

})

describe(`Board`, () => {

  describe(`#isComplete`, () => {

    it(`true`, () => {
      const board = new Board(5, 5)
      board.defineLevel([
        [0, 3, 9, 3, 8],
        [3, 13, 5, 6, 9],
        [7, 12, 5, 3, 13],
        [6, 9, 5, 7, 12],
        [2, 12, 6, 12, 0],
      ])
      assert.isTrue(board.isComplete())
    })

    it(`false`, () => {
      const board = new Board(5, 5)
      board.defineLevel([
        [0, 3, 9, 3, 8],
        [3, 13, 5, 6, 9],
        [7, 12, 5, 3, 13],
        [6, 9, 5, 7, 12],
        [2, 12, 6, 12, 0],
      ])
      board.scramble(() => 1)
      assert.isFalse(board.isComplete())
    })

  })

})
