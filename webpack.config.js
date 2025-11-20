const path = require('path');

const extensionConfig = {
  name: 'extension',
  mode: 'development',
  target: 'node',
  entry: {
    extension: './src/extension.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  externals: {
    vscode: 'commonjs vscode',
  },
  devtool: 'nosources-source-map',
};

const previewConfig = {
  name: 'preview',
  mode: 'development',
  target: 'web',
  entry: {
    preview: './src/preview/main.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  devtool: 'nosources-source-map',
};

module.exports = [extensionConfig, previewConfig];
