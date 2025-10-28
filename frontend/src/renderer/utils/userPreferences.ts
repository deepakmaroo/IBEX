export const createDefaultConfig = async (path = '') => {
  const homePath = await window.api.fs.getHomePath();
  const IbexConfPath = '/.ibexConfig';

  const defaultConfig = {
    defaultConfigPath: path,
  };
  window.api.fs.writeFile(
    homePath + IbexConfPath,
    JSON.stringify(defaultConfig, null, 2),
  );
};
