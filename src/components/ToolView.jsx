import { useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import tools from '../data/tools';
import Console from './Console';

export default function ToolView() {
  const { id } = useParams();
  const tool = tools.find(t => t.id === id);
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('idle');
  const abortRef = useRef(null);

  const appendLine = useCallback((text) => {
    setLines(prev => [...prev, text]);
  }, []);

  const run = useCallback(async () => {
    if (running || !tool) return;
    setLines([]);
    setRunning(true);
    setStatus('busy');
    abortRef.current = new AbortController();

    const form = document.getElementById('tool-form');
    const data = {};
    if (form) {
      const fd = new FormData(form);
      for (const [k, v] of fd) data[k] = v;
    }
    if (!data.target) data.target = '';

    appendLine(`\u25B6 Running ${tool.title}...\n`);

    try {
      const res = await fetch(tool.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: abortRef.current.signal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        let chunk = decoder.decode(value);
        chunk = chunk.replace(/\x1b\[[0-9;]*m/g, '');
        const chunkLines = chunk.split('\n').filter(Boolean);
        setLines(prev => [...prev, ...chunkLines.map(l => l + '\n')]);
      }

      setStatus('done');
      appendLine('\u2714 Done\n');
    } catch (err) {
      if (err.name === 'AbortError') {
        appendLine('\u25A0 Stopped by user\n');
        setStatus('idle');
      } else {
        appendLine(`\u2718 ${err.message}\n`);
        setStatus('err');
      }
    }
    setRunning(false);
    abortRef.current = null;
  }, [tool, running, appendLine]);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  if (!tool) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Tool tidak ditemukan</p>
        <Link to="/" className="text-[#7d63ff] text-sm mt-2 inline-block">Kembali ke Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 console-wrap">
      <div className="form-col w-full lg:w-[340px] shrink-0">
        <div className="glass-card p-6 rounded-2xl glow h-fit fade-in">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/" className="text-gray-500 hover:text-white text-xs transition-colors">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="w-9 h-9 rounded-lg bg-[#7d63ff]/10 flex items-center justify-center text-lg">
              <i className={tool.icon}></i>
            </div>
            <div>
              <h2 className="text-white font-bold text-base tracking-tight">{tool.title}</h2>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">{tool.desc}</p>
            </div>
          </div>

          <form id="tool-form" className="space-y-4" onSubmit={e => { e.preventDefault(); run(); }}>
            {tool.fields.map(f => (
              <div key={f.id} className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#7d63ff]"></span>
                  {f.label}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    name={f.id}
                    defaultValue={f.default}
                    rows="3"
                    className="w-full bg-white/[.04] border border-white/[.08] p-3.5 rounded-xl text-white text-xs font-mono placeholder:text-gray-600 focus:border-[#7d63ff]/50 outline-none transition-all resize-none"
                  />
                ) : f.type === 'select' ? (
                  <select
                    name={f.id}
                    defaultValue={f.default}
                    className="w-full bg-white/[.04] border border-white/[.08] p-3.5 rounded-xl text-white text-xs outline-none focus:border-[#7d63ff]/50 transition-all"
                  >
                    {f.options.map(o => (
                      <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    name={f.id}
                    defaultValue={f.default}
                    placeholder={f.placeholder || ''}
                    min={f.min}
                    max={f.max}
                    className="w-full bg-white/[.04] border border-white/[.08] p-3.5 rounded-xl text-white text-xs font-mono placeholder:text-gray-600 focus:border-[#7d63ff]/50 outline-none transition-all"
                  />
                )}
              </div>
            ))}

            {tool.note && (
              <div className="bg-white/[.02] rounded-xl p-3 border border-white/[.04]">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  <i className="fa-solid fa-bolt text-[#7d63ff]"></i> {tool.note}
                </p>
              </div>
            )}
          </form>

          <div className="flex gap-3 mt-6">
            <button
              onClick={run}
              disabled={running}
              className={`flex-1 py-3.5 rounded-xl text-white font-bold uppercase tracking-widest text-[11px] transition-all duration-200 ${
                running ? 'opacity-50 cursor-not-allowed bg-gray-700' : 'bg-gradient-to-r from-[#7d63ff] to-[#6a4ff5] hover:brightness-110 active:scale-[.97]'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Run
              </span>
            </button>
            <button
              onClick={stop}
              disabled={!running}
              className="py-3.5 px-5 rounded-xl text-white font-bold uppercase tracking-widest text-[11px] transition-all duration-200 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-stop"></i>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-600">
            <span className={`sdot ${status}`}></span>
            <span>{status === 'idle' ? 'Idle' : status === 'busy' ? 'Running...' : status === 'done' ? 'Done' : 'Error'}</span>
          </div>
        </div>
      </div>

      <Console
        lines={lines}
        placeholder={`/* ${tool.title} ready */\n/* Configure and press Run */`}
      />
    </div>
  );
}
