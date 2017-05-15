const rollup = require('rollup')
const pkg = require('../package.json')
const del = require('del')

const coffeescript = require('rollup-plugin-coffee-script')
const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const browserifyPlugin = require('rollup-plugin-browserify-transform')
const brfsBabel = require('brfs-babel')
const minify = require('rollup-plugin-babili')

const plugins = [
  coffeescript(),
  nodeResolve({extensions: ['.js', '.coffee']}),
  commonjs({extensions: ['.js', '.coffee']}),
  // brfsBabel breaks source maps
  browserifyPlugin(brfsBabel, {exclude: 'node_modules/**'}),
  minify({comments: false}),
]

const bundles = [
  {format: 'es', ext: '.es.min.js'},
  {format: 'umd', ext: '.umd.min.js', moduleName: pkg.name},
]

let promise = Promise.resolve()
promise = promise.then(() => del(['dist/']))

for (const config of bundles) {
  promise = promise.then(() => rollup.rollup({
    entry: 'src/linebreaker.coffee',
    external: Object.keys(pkg.dependencies),
    plugins: plugins
  }))
  .then(bundle => bundle.write({
    dest: `dist/${pkg.name}${config.ext}`,
    format: config.format,
    moduleName: config.moduleName,
    sourceMap: false,
  }))
}

promise.catch((err) => console.error(err.stack))
