import coffeescript from 'rollup-plugin-coffee-script'

export default {
  entry: 'src/linebreaker.coffee',
  dest: 'dist/linebreaker.js',
  moduleName: 'linebreak',
  format: 'es',
  plugins: [
    coffeescript(),
  ]
}
