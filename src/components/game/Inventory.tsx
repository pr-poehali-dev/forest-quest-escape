import { ItemId, ITEMS, REQUIRED_ITEMS } from '@/lib/gameData';

interface InventoryProps {
  items: ItemId[];
}

const Inventory = ({ items }: InventoryProps) => {
  return (
    <div className="horror-border rounded p-3 bg-black/60">
      <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-3">
        Инвентарь ({items.length}/{REQUIRED_ITEMS.length})
      </p>

      <div className="grid grid-cols-4 gap-1 mb-3">
        {REQUIRED_ITEMS.map((reqId) => {
          const has = items.includes(reqId);
          const item = ITEMS[reqId];
          return (
            <div
              key={reqId}
              title={item.name}
              className={`item-slot aspect-square rounded border flex items-center justify-center text-lg transition-all duration-300 ${
                has
                  ? 'border-green-800 bg-green-950/40 shadow-[0_0_8px_rgba(0,100,0,0.4)]'
                  : 'border-gray-800 bg-gray-950/40 opacity-40'
              }`}
            >
              <span className={has ? 'animate-item-found' : 'grayscale opacity-50'}>
                {item.emoji}
              </span>
            </div>
          );
        })}
      </div>

      {items.length > REQUIRED_ITEMS.length && (
        <div className="border-t border-gray-800 pt-2 mt-2">
          {items.filter(i => !REQUIRED_ITEMS.includes(i)).map(id => (
            <div key={id} className="flex items-center gap-2 text-xs text-gray-400 py-0.5">
              <span>{ITEMS[id].emoji}</span>
              <span className="font-mono">{ITEMS[id].name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2">
        {REQUIRED_ITEMS.every(ri => items.includes(ri)) ? (
          <p className="text-green-600 text-xs font-mono animate-pulse">✓ Все детали собраны!</p>
        ) : (
          <p className="text-gray-600 text-xs font-mono">
            Нужно: {REQUIRED_ITEMS.filter(ri => !items.includes(ri)).map(ri => ITEMS[ri].name).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
};

export default Inventory;
