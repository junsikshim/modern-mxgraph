var path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/js/index.js',
  devServer: {
    static: path.join(__dirname, '.'),
    compress: false,
    hot: true,
    port: 7070
  },
  devtool: 'eval-source-map',
  output: {
    filename: 'modern-mxgraph.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'mxgraph',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  },
  resolve: {
    modules: [path.resolve(__dirname, 'src/js'), 'node_modules']
  }
};
