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
    },
    extensions: ['.ts', '.tsx', '.js'],
  },
};
