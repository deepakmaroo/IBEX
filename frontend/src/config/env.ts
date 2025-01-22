export const ENV_VARIABLE = {
  API_PORT: parseInt(process.env.API_PORT || '8000', 10),
  API_HOST: process.env.API_HOST || '127.0.0.1',
};