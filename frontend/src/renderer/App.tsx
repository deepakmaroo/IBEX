import { MantineProvider } from '@mantine/core';
import { StrictMode, useEffect } from 'react';
import { AppRouter } from './router';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { useIbexStore } from './stores';
import { ConfigurationState } from './types';

export function App() {
  const { setState } = useIbexStore();

  useEffect(() => {
    console.log('[App] useEffect mounted');

    
  const handler = (event: any, testState: ConfigurationState) => {
    console.log('[App] updateTestState received:', testState);
    setState(testState);
  };

  window.api.onUpdateTestState?.(handler); // ⬅️ Utiliser le vrai handler ici

  return () => {
    window.api.removeUpdateTestStateListener(handler);
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
