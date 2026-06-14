import { useRef, useEffect } from 'react';

function colorize(line) {
  const lw = line.toLowerCase();
  if (line.startsWith('  =') && line.length > 10) return 'text-gray-700';
  if (lw.includes('[error]') || lw.includes('[fail]') || lw.includes('[high]') || lw.includes('✖') || lw.includes('vulnerable'))
    return 'line-error';
  if (lw.includes('[pass]') || lw.includes('[open]') || lw.includes('[valid]') || lw.includes('[ok]'))
    return 'line-success';
  if (lw.includes('[warn]') || lw.includes('[risk]') || lw.includes('expir') || lw.includes('missing') || lw.includes('expired'))
    return 'line-warn';
  if (lw.includes('[info]') || lw.includes('[results]') || lw.includes('[summary]') || lw.includes('[note]') || lw.includes('scan') || lw.includes('found'))
    return 'line-info';
  return '';
}

export default function Console({ lines, placeholder }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  return (
    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden glass-console border border-white/[.06] glow fade-in">
      <div className="bg-white/[.02] px-5 py-3 border-b border-white/[.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30 border border-yellow-500/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/30 border border-green-500/40"></div>
          </div>
          <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider">Terminal</span>
        </div>
      </div>
      <pre
        id="console"
        ref={ref}
        className="p-5 h-[420px] overflow-y-auto font-mono text-xs leading-relaxed text-gray-300"
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
      >
        {lines.length === 0 && (
          <span className={`text-gray-600 ${lines.length === 0 ? 'typing-cursor' : ''}`}>
            {placeholder || '/* DevSec Hub Terminal v1.0 */'}
          </span>
        )}
        {lines.map((line, i) => (
          <span key={i} className={colorize(line)}>{line}</span>
        ))}
      </pre>
    </div>
  );
}
