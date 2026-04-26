import Icon from '@/components/ui/icon';

interface BearMeterProps {
  distance: number;
  sanity: number;
  isAlert: boolean;
}

const BearMeter = ({ distance, sanity, isAlert }: BearMeterProps) => {
  const maxDist = 6;
  const danger = distance <= 1 ? 'text-red-500' : distance <= 3 ? 'text-yellow-500' : 'text-green-800';

  return (
    <div className="horror-border rounded p-3 bg-black/60">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-lg ${isAlert ? 'animate-heartbeat' : ''} ${danger}`}>🐻</span>
        <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">Угроза</span>
      </div>

      <div className="flex gap-1 mb-3">
        {Array.from({ length: maxDist }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm transition-all duration-500 ${
              i < maxDist - distance
                ? 'bg-red-700'
                : 'bg-gray-800'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Icon name="Brain" size={12} className="text-purple-700" />
        <span className="text-xs text-gray-500 font-mono">Рассудок</span>
        <div className="flex-1 h-1 bg-gray-800 rounded-sm ml-1">
          <div
            className="h-full rounded-sm transition-all duration-700"
            style={{
              width: `${sanity}%`,
              backgroundColor: sanity > 60 ? '#4a7c59' : sanity > 30 ? '#b45309' : '#991b1b',
            }}
          />
        </div>
      </div>

      {isAlert && (
        <p className="text-red-600 text-xs font-mono mt-2 animate-pulse uppercase tracking-widest">
          ⚠ МЕДВЕДЬ РЯДОМ
        </p>
      )}
    </div>
  );
};

export default BearMeter;
