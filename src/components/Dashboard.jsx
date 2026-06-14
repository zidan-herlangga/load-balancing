import { Link } from 'react-router-dom';
import tools, { categories } from '../data/tools';

const catLabel = { Recon: 'recon', Web: 'web', Utility: 'utility' };

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-white text-2xl font-extrabold tracking-tight">Pentest Toolkit</h2>
          <p className="text-sm text-gray-500 mt-1">14 tools untuk reconnaissance, web security, dan utility</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7d63ff]"></span>14 tools ready
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>All Node.js
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 dash-grid">
        {tools.map(t => (
          <Link
            key={t.id}
            to={`/tool/${t.id}`}
            className="dash-card glass-card rounded-xl p-5 no-underline block transition-all duration-300 border border-white/[.04] hover:-translate-y-1 hover:border-[#7d63ff]/20 hover:shadow-[0_12px_40px_-12px_rgba(125,99,255,0.2)]"
          >
            <div className="card-icon text-2xl mb-4 transition-transform duration-300 hover:scale-110 hover:-rotate-6">
              <i className={t.icon}></i>
            </div>
            <h3 className="text-white font-bold text-sm mb-1">{t.title}</h3>
            <p className="text-xs text-gray-500">{t.desc}</p>
            <span className="inline-block mt-3 text-[10px] text-[#7d63ff] font-semibold">
              {catLabel[t.category] || 'tool'} &rarr;
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 glass-card rounded-xl p-6 glow">
        <h3 className="text-white font-bold text-sm mb-3">
          <i className="fa-solid fa-bolt"></i> Quick Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
          <div className="flex gap-3 items-start">
            <span className="text-[#7d63ff] mt-0.5">&bull;</span>
            <span>Gunakan <strong className="text-gray-400">Port Scanner</strong> untuk fast recon target</span>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-[#7d63ff] mt-0.5">&bull;</span>
            <span>Cek security headers dengan <strong className="text-gray-400">Header Audit</strong></span>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-[#7d63ff] mt-0.5">&bull;</span>
            <span>Temukan subdomain via <strong className="text-gray-400">Subdomain Scanner</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
