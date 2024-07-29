import path from 'path'
import { Configuration } from 'webpack'

declare const __dirname: string // Add this line to declare __dirname

const config: Configuration = {
  entry: './src/api/index.ts', // Adjust the entry point as needed
  target: 'node',
  mode: 'development', // Change to 'production' for production builds
  module: {
    rules: [
      {
        test: /\.tsx?$/,
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
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'source-map', // Enable source maps for debugging
}

export default config