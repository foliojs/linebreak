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
  // browserifyPlugin / brfsBabel seems to break source maps
  browserifyPlugin(brfsBabel, {exclude: 'node_modules/**'}),
  minify({comments: false})
]

const bundles = [
  {
    format: 'es',
    ext: '.es.min.js',
    plugins
  },
  {
    format: 'umd',
    moduleName: pkg.name,
    ext: '.umd.min.js',
    plugins
  },
]

let promise = Promise.resolve()

// Clean up the output directory
promise = promise.then(() => del(['dist/']))

const suppressWarnings = function (suppressedWarnings) {
  return function (warning) {
    if (suppressedWarnings.indexOf(warning.code) === -1 ) {
      console.warn(warning.message)
    }
  }
}

// Compile source code into a distributable format with Babel and Rollup
for (const config of bundles) {
  promise = promise.then(() => rollup.rollup({
    entry: 'src/linebreaker.coffee',
    external: Object.keys(pkg.dependencies),
    plugins: config.plugins,
    onwarn: suppressWarnings(['MISSING_GLOBAL_NAME'])
  }))
  .then(bundle => bundle.write({
    dest: `dist/${config.moduleName || pkg.name}${config.ext}`,
    format: config.format,
    moduleName: config.moduleName,
    sourceMap: false,
  }))
}

promise.catch((err) => console.error(err.stack))
