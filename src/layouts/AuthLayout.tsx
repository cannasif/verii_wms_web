import { Outlet, useLocation } from 'react-router-dom';

export default function AuthLayout() {
  const location = useLocation();
  return <Outlet key={location.key} />;
}

