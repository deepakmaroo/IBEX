import { ConfigurationState } from "src/renderer/types";

export const mockConfigurationState: Partial<ConfigurationState> = {
  configurations: [
    {
      name: 'Test Configuration 1',
      dataURI: [],
      checkedNodeURI: [],
      customDataTree: [],
      dataPlot: [],
    },

    {
      name: 'Test Configuration 2',
      dataURI: [],
      checkedNodeURI: [],
      customDataTree: [],
      dataPlot: [],
    },
  ],
  active: {
    name: 'Test Configuration 1',
    dataURI: [],
    checkedNodeURI: [],
    customDataTree: [],
    dataPlot: [],
  },
}

export const mockemptyConfigurationsState: Partial<ConfigurationState> = {
  configurations: [],
  active: null,
}