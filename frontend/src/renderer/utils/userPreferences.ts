import { IbexConfig } from '../types';

export const updateIbexConfig = async (
  path = '',
  templateFolders = <string[]>[],
) => {
  const homePath = await window.api.fs.getHomePath();
  const IbexConfPath = '/.ibexConfig';

  const updatedConfig: IbexConfig = {
    defaultConfigPath: path,
    templateFolders: templateFolders,
  };
  window.api.fs.writeFile(
    homePath + IbexConfPath,
    JSON.stringify(updatedConfig, null, 2),
  );

  return updatedConfig;
};

export const readIbexConfig = async function () {
  const homePath = await window.api.fs.getHomePath();
  const IbexConfPath = '/.ibexConfig';
  let data: string;
  try {
    data = await window.api.fs.readFile(homePath + IbexConfPath);

    if (!data) {
      const ibexConfig = await updateIbexConfig();
      return ibexConfig;
    }

    // Get default template folders
    const userPreferences: IbexConfig = data && JSON.parse(data);
    return userPreferences;
  } catch (error) {
    console.warn(`Error reading '${homePath + IbexConfPath}': ${error}`);
    const ibexConfig = await updateIbexConfig();
    return ibexConfig;
  }
};
