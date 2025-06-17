import { MantineProvider } from '@mantine/core';
import { StrictMode, useEffect } from 'react';
import { AppRouter } from './router';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { useIbexStore } from './stores';
import { ConfigurationState } from './types';

export function App() {
  const { setState, getState } = useIbexStore();

  useEffect(() => {
    const updateHandler = (
      event: Electron.IpcRendererEvent,
      testState: ConfigurationState,
    ) => {
      setState(testState);
    };

    const getStateHandler = (
      _event: Electron.IpcRendererEvent,
      replyChannel: string,
    ) => {
      const fullState = getState();
      const { configurations, active } = fullState;

      // N'envoie que ce qui est sérialisable
      const serializableState: ConfigurationState = { configurations, active };
      window.api.send(replyChannel, serializableState);
    };

    window.api.onUpdateTestState(updateHandler);
    window.api.on('getTestState', getStateHandler);

    return () => {
      window.api.removeUpdateTestStateListener(updateHandler);
      window.api.removeListener('getTestState', getStateHandler);
    };
  }, []);

  return (
    <div>
      <StrictMode>
        <MantineProvider cssVariablesSelector="html">
          <Notifications />
          <ModalsProvider>
            <AppRouter />
          </ModalsProvider>
        </MantineProvider>
      </StrictMode>
    </div>
  );
}
