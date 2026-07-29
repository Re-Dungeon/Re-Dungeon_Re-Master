import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from 'components/Layout/Layout';
import ProtectedRoute from 'components/ProtectedRoute/ProtectedRoute';
import { ROUTES } from './routes';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route element={<ProtectedRoute />}>
          {ROUTES.map((route, index) =>
            route.index ? (
              <Route key={index} index element={route.element} />
            ) : (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ),
          )}
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
