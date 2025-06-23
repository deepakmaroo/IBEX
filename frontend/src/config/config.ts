// src/config-sync.ts
import * as fs from 'fs';
import * as path from 'path';

export type TConfig = {
  API_URL: string;
  WEBPACK_PORT: number;
  LOGGER_PORT: number;
};

const defaultConfig: TConfig = {
  API_URL: 'http://localhost:8000',
  WEBPACK_PORT: 3001,
  LOGGER_PORT: 9013,
};

const getConfigPath = (): string => {
  const isProd = process.env.NODE_ENV === 'production';
  return isProd
    ? path.join(process.resourcesPath, 'config.json')
    : path.join(__dirname, '../../config.json');
};

export const getConfigSync = (): TConfig => {
  const configPath = getConfigPath();

  try {
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(
        configPath,
        JSON.stringify(defaultConfig, null, 2),
        'utf-8',
      );
    }

    const data = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(data);

    if (
      typeof parsed.API_URL === 'string' &&
      typeof parsed.WEBPACK_PORT === 'number' &&
      typeof parsed.LOGGER_PORT === 'number'
    ) {
      return parsed;
    }

    console.warn('Configuration invalide, retour à la config par défaut.');
    return defaultConfig;
  } catch (err) {
    console.error('Erreur de lecture de config:', err);
    return defaultConfig;
  }
};
