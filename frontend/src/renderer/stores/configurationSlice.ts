import { StateCreator } from 'zustand';
import { ConfigurationState } from 'src/renderer/types';

export const configurationSlice: StateCreator<ConfigurationState> = (set) => ({
  configurations: [],
  active: null,

  addConfiguration: (configuration) =>
    set((state) => ({
      configurations: [...state.configurations, configuration],
    })),

  updatedConfiguration: (configuration) => {
    set((state) => {
      const updatedConfigurations = state.configurations.map((c) =>
        c.name === configuration.name ? configuration : c,
      );

      const updatedActive =
        state.active?.name === configuration.name
          ? configuration
          : state.active;

      return {
        ...state,
        active: { ...updatedActive, saved: false },
        configurations: updatedConfigurations,
      };
    });
  },

  removeConfiguration: (name) => {
    set((state) => {
      const configuration = state.configurations.find((c) => c.name === name);
      if (!configuration) return state;

      const updatedConfigurations = state.configurations.filter(
        (c) => c.name !== name,
      );

      const updateActive =
        state.active?.name === configuration.name
          ? updatedConfigurations[updatedConfigurations.length - 1]
          : state.active;

      return {
        configurations: updatedConfigurations,
        active: updateActive,
      };
    });
  },

  setActive: (name) => {
    set((state) => {
      const configuration = state.configurations.find((c) => c.name === name);
      if (!configuration) return state;

      return {
        ...state,
        active: configuration,
      };
    });
  },
});
