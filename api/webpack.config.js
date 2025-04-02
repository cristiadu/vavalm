const path = require('path')
const webpack = require('webpack')
const WorkerPlugin = require('worker-plugin')

const config = {
  entry: './src/index.ts',
  target: 'node',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: {
    pg: 'commonjs pg',
    express: 'commonjs express',
    sequelize: 'commonjs sequelize',
  },
  devtool: 'source-map',
  watch: true,
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: 1000,
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /migrations/,
    }),
    new WorkerPlugin(),
  ],
}

module.exports = config
