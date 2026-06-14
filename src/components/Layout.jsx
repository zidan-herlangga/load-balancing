import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="layout-main">
        <header className="mobile-header">
          <div className="mobile-header-logo">
            <div className="bg-[#7d63ff] p-1.5 rounded-lg glow-sm">
              <svg width="14" height="11" viewBox="0 0 75 61" fill="none">
                <path d="M39.154 16.883 51.575 0 62 45H12L28.73 9.31l10.424 7.573Z" fill="white"/>
              </svg>
            </div>
            <span className="text-white font-extrabold text-sm tracking-tight">
              DEVSEC<span className="text-[#7d63ff]">HUB</span>
            </span>
          </div>
          <button className="mobile-header-btn" onClick={() => setSidebarOpen(true)}>
            <i className="fa-solid fa-bars"></i>
          </button>
        </header>
        <main className="main-content">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
