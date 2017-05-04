import coffeescript from 'rollup-plugin-coffee-script'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: 'src/linebreaker.coffee',
  dest: 'dist/linebreaker.js',
  moduleName: 'linebreak',
  format: 'es',
  plugins: [
    coffeescript(),
    nodeResolve({ extensions: ['.js', '.coffee'] }),
    commonjs({
      extensions: [ '.js', '.coffee' ],
      sourceMap: false,
    }),
  ]
}
