const path = require('path')
const { IgnorePlugin } = require('webpack')
const WorkerPlugin = require('worker-plugin')

const config = {
  entry: './src/index.ts', // Adjust the entry point as needed
  target: 'node',
  mode: 'development', // Change to 'production' for production builds
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
  devtool: 'source-map', // Enable source maps for debugging
  plugins: [
    new IgnorePlugin({
      resourceRegExp: /migrations/, // Adjust the regex to match your migrations directory or files
    }),
    new WorkerPlugin(),
  ],
}

module.exports = config
