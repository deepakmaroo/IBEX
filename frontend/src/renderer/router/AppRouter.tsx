import { HashRouter, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layout';
import { Visualization } from '../pages';
import { RouteError } from '../components';

export function AppRouter() {
  const router = (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route path="/" element={<Visualization />} />
          <Route path="*" element={<RouteError />} />
        </Route>
      </Routes>
    </HashRouter>
  );

  return router;
}
