const rewire = require('rewire');
const defaults = rewire('react-scripts/scripts/build.js');
let config = defaults.__get__('config');
console.log(config)
//console.log(config.plugins.MiniCssExtractPlugin);
config.plugins.forEach((plugin) => {
  if (plugin.options
    && plugin.options.filename
    && plugin.options.filename == 'static/css/[name].[contenthash:8].css'
    && plugin.options.chunkFilename
    && plugin.options.chunkFilename == 'static/css/[name].[contenthash:8].chunk.css'
  ) {
    console.log('>>> CSS Plugin founded. Fix him')
    // css no hash in filename
    plugin.options.filename = 'static/css/[name].css'
    plugin.options.chunkFilename = 'static/css/[name].chunk.css'
    console.log(plugin)
  }
})
config.output.filename = 'static/js/[name].js';
config.output.chunkFilename = 'static/js/[name].chunk.js';
