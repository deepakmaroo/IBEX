import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';
import dotenv from 'dotenv';
import webpack from 'webpack';

dotenv.config();

export const mainConfig: Configuration = {
  entry: './src/main',
  module: {
    rules,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      path: false,
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.E2E_TEST': JSON.stringify(process.env.E2E_TEST || 'false'),
    }),
  ],
};
