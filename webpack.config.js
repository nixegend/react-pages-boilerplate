const path = require('path');
const getRepositoryName = require('git-repo-name').sync;
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OpenBrowserPlugin = require('open-browser-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const SETTINGS = require('./settings');

const production = process.env.NODE_ENV === 'production';
const pagesBuild = process.env.BUILD === 'pages';

const stylesLoaders = [
  {
    loader: 'css-loader',
    options: {
      minimize: production,
      modules: true,
      localIdentName: production ? '[hash:base64:7]' : '[path]__[local]--[hash:base64:5]',
    },
  },
  'postcss-loader',
  {
    loader: 'sass-loader',
    options: {
      data: '@import "styles/globals";',
      includePaths: [path.join(__dirname, 'src')],
    },
  },
];

const loaders = [
  {
    test: /\.(js|jsx)$/,
    loader: 'babel-loader',
    include: path.join(__dirname, 'src'),
    exclude: /node_modules/,
  },

  {
    test: /\.(css|scss)$/,
    include: path.join(__dirname, './src'),
    loader: production
      ? ExtractTextPlugin.extract({ fallback: 'style-loader', use: stylesLoaders })
      : ['style-loader', ...stylesLoaders],
  },

  {
    // do not load styles as css modules from other direcroies (e.g. node_modules) but src
    test: /\.(css)$/,
    loaders: production
      ? ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: ['css-loader', 'postcss-loader'],
      })
      : ['style-loader', 'css-loader', 'postcss-loader'],
    exclude: path.resolve(__dirname, '../src'),
  },

  {
    test: /\.(svg|png|jpg|gif|woff|woff2|otf|ttf|eot)$/,
    loader: 'file-loader',
  },
];

const pluginsBase = [
  new HtmlWebpackPlugin({ template: 'template.ejs' }),
  new FaviconsWebpackPlugin(SETTINGS.FAVICONS),
  new BundleAnalyzerPlugin({ analyzerMode: production ? 'static' : 'disabled' }),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || ''),
    },
  }),
];

const developmentPlugins = [
  ...pluginsBase,
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NamedModulesPlugin(),
  new OpenBrowserPlugin({ url: `http://localhost:${SETTINGS.PORT}` }),
];

const productionPlugins = [
  ...pluginsBase,
  new LodashModuleReplacementPlugin(),
  new ExtractTextPlugin('[name].css'),
  new webpack.optimize.OccurrenceOrderPlugin(),
  new webpack.optimize.UglifyJsPlugin({
    beautify: false,
    comments: false,
    compress: {
      sequences: true,
      booleans: true,
      loops: true,
      unused: false,
      warnings: false,
      drop_console: true,
      unsafe: true,
    },
  }),
];

module.exports = {
  devtool: production ? false : 'eval',

  entry: production
    ? path.join(__dirname, './src/index')
    : [
      `webpack-dev-server/client?http://localhost:${SETTINGS.PORT}`,
      'webpack/hot/only-dev-server',
      path.join(__dirname, './src/index'),
    ],

  output: {
    path: SETTINGS.PUBLIC_PATH,
    filename: 'bundle.js',
    publicPath: pagesBuild ? `/${getRepositoryName()}/` : '/',
  },

  resolve: {
    modules: [path.join(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx'],
  },

  module: { loaders },
  plugins: production ? productionPlugins : developmentPlugins,
};
