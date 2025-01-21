import { MantineProvider } from '@mantine/core';
import { StrictMode, useEffect } from 'react';
import { AppRouter } from './router';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

export function App() {
  useEffect(() => {
    console.log('BACKEND_Port:', window.env.API_PORT);
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
