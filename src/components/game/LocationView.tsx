import { useState } from 'react';
import { Location, LocationId, ItemId, ITEMS, LOCATIONS } from '@/lib/gameData';
import Icon from '@/components/ui/icon';

interface LocationViewProps {
  location: Location;
  allLocations: Record<LocationId, Location>;
  inventory: ItemId[];
  solvedPuzzles: string[];
  onMove: (id: LocationId) => void;
  onCollect: (id: ItemId) => void;
  onPuzzle: () => void;
  onRepair: () => void;
  bearAlert: boolean;
}

const LocationView = ({
  location,
  allLocations,
  inventory,
  solvedPuzzles,
  onMove,
  onCollect,
  onPuzzle,
  onRepair,
  bearAlert,
}: LocationViewProps) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const hasPuzzle = !!location.puzzle;
  const puzzleSolved = hasPuzzle && solvedPuzzles.includes(location.puzzle!.id);
  const availableItems = location.items.filter(i => !inventory.includes(i));
  const itemsAccessible = !hasPuzzle || puzzleSolved;

  return (
    <div className="flex flex-col h-full">
      <div className="relative overflow-hidden rounded-lg mb-3" style={{ height: '220px' }}>
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gray-950 flex items-center justify-center">
            <div className="w-6 h-6 border border-red-900 rounded-full animate-spin border-t-transparent" />
          </div>
        )}
        <img
          src={location.image}
          alt={location.name}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'} ${bearAlert ? 'animate-pulse' : ''}`}
          style={{ filter: 'brightness(0.55) saturate(0.6) contrast(1.2)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h2 className="font-horror text-2xl text-blood-bright animate-flicker">{location.name}</h2>
          <p className="text-gray-400 text-xs font-mono italic">{location.atmosphere}</p>
        </div>

        {bearAlert && (
          <div className="absolute top-2 right-2 bg-red-950/90 border border-red-800 rounded px-2 py-1 animate-pulse">
            <span className="text-red-400 text-xs font-mono">⚠ ОПАСНОСТЬ</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {hasPuzzle && !puzzleSolved && (
          <button
            onClick={onPuzzle}
            className="location-btn w-full p-2.5 rounded border border-yellow-900/60 bg-yellow-950/20 text-yellow-600 text-sm font-mono flex items-center gap-2"
          >
            <Icon name="Lock" size={14} />
            Решить загадку
          </button>
        )}

        {puzzleSolved && (
          <div className="flex items-center gap-2 text-green-700 text-xs font-mono px-1">
            <Icon name="Unlock" size={12} />
            Загадка решена
          </div>
        )}

        {availableItems.length > 0 && (
          <div className="horror-border rounded p-2 bg-black/40">
            <p className="text-gray-600 text-xs font-mono uppercase tracking-widest mb-1">Предметы</p>
            <div className="flex flex-wrap gap-1">
              {availableItems.map(itemId => (
                <button
                  key={itemId}
                  onClick={() => onCollect(itemId)}
                  disabled={!itemsAccessible}
                  title={ITEMS[itemId].description}
                  className={`px-2 py-1 rounded border text-xs font-mono flex items-center gap-1 transition-all duration-200 ${
                    itemsAccessible
                      ? 'border-green-900 bg-green-950/30 text-green-400 hover:border-green-600 hover:bg-green-900/40'
                      : 'border-gray-800 text-gray-600 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span>{ITEMS[itemId].emoji}</span>
                  {ITEMS[itemId].name}
                </button>
              ))}
            </div>
          </div>
        )}

        {location.id === 'car' && (
          <button
            onClick={onRepair}
            className="location-btn w-full p-2.5 rounded border border-green-900 bg-green-950/20 text-green-500 text-sm font-mono flex items-center gap-2"
          >
            <Icon name="Wrench" size={14} />
            Починить машину
          </button>
        )}

        <div>
          <p className="text-gray-600 text-xs font-mono uppercase tracking-widest mb-1 px-1">Перейти</p>
          <div className="grid grid-cols-2 gap-1">
            {location.connections.map(connId => {
              const conn = allLocations[connId];
              return (
                <button
                  key={connId}
                  onClick={() => onMove(connId)}
                  className={`location-btn p-2 rounded border border-gray-800 text-xs font-mono text-gray-400 flex items-center gap-1 ${
                    conn.visited ? '' : 'border-dashed'
                  }`}
                >
                  <Icon name="ArrowRight" size={10} />
                  {conn.shortName}
                  {!conn.visited && <span className="text-gray-600 ml-auto">?</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationView;
