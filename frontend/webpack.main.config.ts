import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';

export const mainConfig: Configuration = {
  entry: './src/main',
  module: {
    rules,
  },
  resolve: {

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
