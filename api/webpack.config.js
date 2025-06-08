import path from 'path'
import { fileURLToPath } from 'url'
import webpack from 'webpack'
import WorkerPlugin from 'worker-plugin'

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Webpack configuration function
 * @param {object} _env - Environment variables
 * @param {object} argv - CLI arguments
 * @returns {webpack.Configuration} Webpack configuration object
 */
export default (_env, argv) => {
  const isProduction = argv.mode === 'production'
  console.log(`Building in ${isProduction ? 'production' : 'development'} mode`)

  return {
    entry: './src/index.ts',
    target: 'node',
    mode: argv.mode || 'development',
    module: {
      rules: [
        {
          test: /\.ts?$/,
          use: 'ts-loader',
          exclude: [/node_modules/],
        },
        {
          test: /\.js$/,
          use: 'babel-loader',
          exclude: [/node_modules/],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@tests': path.resolve(__dirname, 'tests'),
      },
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      module: true,
      library: {
        type: 'module',
      },
    },
    externals: {
      pg: 'module pg',
      express: 'module express',
      sequelize: 'module sequelize',
      url: 'module url',
      handlebars: 'module handlebars',
      tsoa: 'module tsoa',
      '@tsoa/cli': 'module @tsoa/cli',
      typescript: 'module typescript',
      'yargs-parser': 'module yargs-parser',
      yargs: 'module yargs',
    },
    devtool: isProduction ? false : 'source-map',
    watch: !isProduction,
    watchOptions: {
      ignored: /node_modules|dist|tests/,
      aggregateTimeout: 300,
      poll: 1000,
    },
    plugins: [
      new webpack.IgnorePlugin({
        resourceRegExp: /migrations/,
      }),
      new WorkerPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),
    ],
    experiments: {
      outputModule: true,
    },
  }
}
