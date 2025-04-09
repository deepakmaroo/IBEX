import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export type TConfig = {
  API_URL: string;
};

const getConfigPath = (): string => {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'config.json')
    : path.join(__dirname, '../../config.json');
};

export const getConfig = async (): Promise<TConfig> => {
  const configPath = getConfigPath();

  try {
    await fs.promises.access(configPath, fs.constants.F_OK);
  } catch {
    // Le fichier n'existe pas, on le crée avec la config par défaut
    const defaultConfig: TConfig = {
      API_URL: 'http://localhost:8000',
    };

    try {
      await fs.promises.writeFile(
        configPath,
        JSON.stringify(defaultConfig, null, 2),
        'utf-8',
      );
    } catch (err) {
      console.error(
        `Erreur lors de la création du fichier de configuration: ${err}`,
      );
      return defaultConfig; // Retourne la config par défaut si l'écriture échoue
    }
  }

  try {
    const configData = await fs.promises.readFile(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (err) {
    console.error(
      `Erreur lors de la lecture du fichier de configuration: ${err}`,
    );
    return { API_URL: 'http://localhost:8000' }; // Fallback en cas de problème de lecture
  }
};
