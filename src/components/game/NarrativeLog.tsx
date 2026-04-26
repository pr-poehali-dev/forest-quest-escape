import { useEffect, useRef } from 'react';
import { NarrativeLog as NarrativeLogType } from '@/lib/gameData';

interface NarrativeLogProps {
  logs: NarrativeLogType[];
}

const typeStyles: Record<NarrativeLogType['type'], string> = {
  narrative: 'text-gray-300',
  danger: 'text-red-500 font-semibold',
  item: 'text-green-500',
  puzzle: 'text-yellow-500',
  system: 'text-gray-500 italic',
};

const typePrefix: Record<NarrativeLogType['type'], string> = {
  narrative: '',
  danger: '⚠ ',
  item: '▶ ',
  puzzle: '? ',
  system: '— ',
};

const NarrativeLog = ({ logs }: NarrativeLogProps) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="horror-border rounded bg-black/80 p-3 h-48 overflow-y-auto">
      <p className="text-xs text-gray-600 font-mono uppercase tracking-widest mb-2">Журнал событий</p>
      {logs.length === 0 && (
        <p className="text-gray-600 text-xs font-mono italic">Тишина. Только твоё дыхание...</p>
      )}
      <div className="space-y-1">
        {logs.map((log) => (
          <p
            key={log.id}
            className={`text-xs font-mono leading-relaxed animate-slide-up ${typeStyles[log.type]}`}
          >
            {typePrefix[log.type]}{log.text}
          </p>
        ))}
      </div>
      <div ref={endRef} />
    </div>
  );
};

export default NarrativeLog;
