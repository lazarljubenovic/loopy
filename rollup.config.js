import typescript from 'rollup-plugin-typescript2'
import copy from 'rollup-plugin-copy'
import node from 'rollup-plugin-node-resolve'

export default {
  input: 'src/index.ts',
  output: {
    file: 'dst/index.js',
    format: 'iife',
    name: 'loopy',
  },
  plugins: [
    typescript({
      typescript: require('typescript'),
      objectHashIgnoreUnknownHack: true,
    }),
    copy({
      targets: [
        {src: 'src/index.html', dest: 'dst',}
      ]
    }),
    node(),
  ],
}
