import React, { useState, useEffect } from 'react';
import { DentalApp } from './components/DentalApp';
import { KivexToolbar } from './components/KivexToolbar';
import { NotFound } from './components/NotFound';

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isInsideIframe, setIsInsideIframe] = useState(false);
  const [isDirectView, setIsDirectView] = useState(false);

  useEffect(() => {
    // 1. Detect if hosted inside iframe
    const insideIframe = window.self !== window.top;
    setIsInsideIframe(insideIframe);

    // 2. Check query parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === 'true' || params.get('preview') === 'false') {
      setIsDirectView(true);
    }

    // 3. Listen to browser history navigation
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Route: Dedicated /preview route
  if (currentPath === '/preview') {
    return <KivexToolbar />;
  }

  // CRM Routes Redirection
  if (currentPath === '/login' || currentPath === '/login/') {
    window.location.href = '/login.html';
    return null;
  }
  if (currentPath === '/dashboard' || currentPath === '/dashboard/' || currentPath === '/crm' || currentPath === '/crm/') {
    window.location.href = '/dashboard.html';
    return null;
  }
  if (currentPath === '/walkin' || currentPath === '/walkin/') {
    window.location.href = '/walkin.html';
    return null;
  }
  if (currentPath === '/online' || currentPath === '/online/') {
    window.location.href = '/#book';
    return null;
  }
  if (currentPath === '/appointments') {
    window.location.href = '/dashboard.html#online-bookings';
    return null;
  }
  if (currentPath === '/patients') {
    window.location.href = '/dashboard.html#patients';
    return null;
  }
  if (currentPath === '/doctors') {
    window.location.href = '/dashboard.html#doctors-note';
    return null;
  }
  if (currentPath === '/services') {
    window.location.href = '/dashboard.html#services';
    return null;
  }
  if (currentPath === '/finance') {
    window.location.href = '/dashboard.html#finance';
    return null;
  }
  if (currentPath === '/notifications') {
    window.location.href = '/dashboard.html#notifications';
    return null;
  }
  if (currentPath === '/settings') {
    window.location.href = '/dashboard.html#settings';
    return null;
  }

  // 404 Check (if path is not root or index.html)
  if (currentPath !== '/' && currentPath !== '/index.html') {
    return (
      <NotFound
        onReturnHome={() => navigateTo('/')}
        onOpenBooking={() => navigateTo('/#book')}
      />
    );
  }

  // If inside preview iframe or direct view requested, render pure DentalApp
  if (isInsideIframe || isDirectView) {
    return <DentalApp />;
  }

  // Default: KIVEX Technology Responsive Device Preview Toolbar wrapper
  return <KivexToolbar />;
}

export default App;
