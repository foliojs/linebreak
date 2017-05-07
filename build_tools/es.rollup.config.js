import coffeescript from 'rollup-plugin-coffee-script'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import browserifyPlugin from 'rollup-plugin-browserify-transform'
import brfsBabel from 'brfs-babel'
import minify from 'rollup-plugin-babili'
var pkg = require('../package.json')

export default {
  entry: 'src/linebreaker.coffee',
  dest: 'dist/linebreak.es.min.js',
  moduleName: 'linebreak',
  format: 'es',
  external: Object.keys(pkg.dependencies),
  sourceMap: false,
  plugins: [
    coffeescript(),
    nodeResolve({extensions: ['.js', '.coffee']}),
    commonjs({extensions: ['.js', '.coffee']}),
    // browserifyPlugin / brfsBabel seems to break source maps
    browserifyPlugin(brfsBabel, {exclude: 'node_modules/**'}),
    minify({comments: false}),
  ]
}
