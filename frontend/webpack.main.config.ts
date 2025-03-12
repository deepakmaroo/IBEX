import path from 'path';
import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';

export const mainConfig: Configuration = {
  entry: './src/main',
  module: {
    rules,
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
      // stream: require.resolve('stream-browserify'), // Add this line
    },
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      path: false,
      // crypto: require.resolve('crypto-browserify'),
      // stream: require.resolve('stream-browserify'),
      // buffer: require.resolve('buffer/'),
      // assert: require.resolve('assert/'),
    },
  },
};
