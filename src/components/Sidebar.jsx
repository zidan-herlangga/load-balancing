import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import tools, { categories } from '../data/tools';

const grouped = categories.map(cat => ({
  label: cat,
  items: tools.filter(t => t.category === cat),
}));

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  useEffect(() => { onClose(); }, [location.pathname]);

  const linkClass = ({ isActive }) =>
    `tool-btn w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center gap-2.5 no-underline ${
      isActive ? 'active text-white' : 'text-gray-400 hover:text-white'
    }`;

  return (
    <>
      {open && <div className="mobile-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-inner">
          <div className="sidebar-top">
            <div className="logo-section no-underline">
              <div className="bg-[#7d63ff] p-2 rounded-lg glow-sm">
                <svg width="18" height="14" viewBox="0 0 75 61" fill="none">
                  <path d="M39.154 16.883 51.575 0 62 45H12L28.73 9.31l10.424 7.573Z" fill="white"/>
                </svg>
              </div>
              <div>
                <h1 className="text-white font-extrabold text-sm tracking-tight leading-none">
                  DEVSEC<span className="text-[#7d63ff]">HUB</span>
                </h1>
                <p className="text-[9px] text-gray-600 font-medium tracking-widest mt-0.5">PENTEST SUITE</p>
              </div>
            </div>
            <button className="sidebar-close" onClick={onClose}>
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <nav>
            <NavLink to="/" end className={linkClass}>
              <i className="fa-solid fa-gauge-high text-base shrink-0 w-5"></i>
              <span className="font-semibold tracking-wide">Dashboard</span>
            </NavLink>

            {grouped.map(g => (
              <div key={g.label}>
                <div className="cat-label">{g.label}</div>
                {g.items.map(t => (
                  <NavLink key={t.id} to={`/tool/${t.id}`} className={linkClass}>
                    <i className={`${t.icon} text-base shrink-0 w-5`}></i>
                    <span className="font-semibold tracking-wide">{t.title}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="flex items-center gap-2 text-[9px] text-gray-600 font-medium">
              <span className="sdot idle"></span>
              Ready
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
