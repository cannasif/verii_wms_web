import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { AppShellBootstrap } from './components/shared/AppShellBootstrap';
import './App.css';

function App() {
  return (
    <>
      <AppShellBootstrap />
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;
