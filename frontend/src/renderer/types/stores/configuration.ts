import { Configuration } from '..';

export interface ConfigurationState {
  configurations: Configuration[];
  active: Configuration;

  addConfiguration?: (configuration: Configuration) => void;
  updatedConfiguration?: (configuration: Configuration) => void;
  removeConfiguration?: (name: string) => void;
  setActive?: (name: string) => void;
  setState?: (state: Partial<ConfigurationState>) => void;
}
