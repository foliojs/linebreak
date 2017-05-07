import coffeescript from 'rollup-plugin-coffee-script'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import browserifyPlugin from 'rollup-plugin-browserify-transform'
import brfsBabel from 'brfs-babel'
import minify from 'rollup-plugin-babili'

export default {
  entry: 'src/linebreaker.coffee',
  dest: 'dist/linebreaker.es.min.js',
  moduleName: 'linebreak',
  format: 'es',
  plugins: [
    coffeescript(),
    nodeResolve({extensions: ['.js', '.coffee']}),
    commonjs({extensions: ['.js', '.coffee']}),
    browserifyPlugin(brfsBabel, {exclude: 'node_modules/**'}),
    minify({comments: false}),
  ]
}
