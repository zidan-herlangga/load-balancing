import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="layout-main">
        <main className="main-content">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
        <i className="fa-solid fa-bars"></i>
      </button>
    </div>
  );
}
