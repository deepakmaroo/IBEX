import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';
import { config } from 'dotenv';
import { DefinePlugin } from 'webpack';

config();

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
    new DefinePlugin({
      'process.env.E2E_TEST': JSON.stringify(process.env.E2E_TEST || 'false'),
    }),
  ],
};
