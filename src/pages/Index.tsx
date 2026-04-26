import { useEffect, useRef, useState, useCallback } from 'react';
import { ForestGame3D, GameState3D } from '@/lib/ForestGame3D';

const ITEM_MAP: Record<string, string> = {
  wrench: '🔧',
  fuel: '⛽',
  battery: '🔋',
  wire: '〰️',
  spark_plug: '⚡',
  oil: '🛢️',
};
const REQUIRED = ['wrench', 'fuel', 'battery', 'wire', 'spark_plug', 'oil'];

const ITEM_NAMES: Record<string, string> = {
  wrench: 'Ключ',
  fuel: 'Топливо',
  battery: 'Аккумулятор',
  wire: 'Провод',
  spark_plug: 'Свеча',
  oil: 'Масло',
};

function BearIndicator({ distance }: { distance: number }) {
  const danger = distance < 8 ? 'text-red-500 animate-pulse' : distance < 16 ? 'text-orange-600' : 'text-green-900';
  const bars = Math.max(0, Math.min(5, Math.floor((30 - distance) / 5)));
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm ${danger}`}>🐻</span>
      <div className="flex gap-0.5">
        {[0,1,2,3,4].map(i => (
          <div key={i} className={`w-2 h-3 rounded-sm transition-all duration-300 ${i < bars ? 'bg-red-700' : 'bg-gray-800'}`} />
        ))}
      </div>
    </div>
  );
}

function StaminaBar({ stamina, isRunning }: { stamina: number; isRunning: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-yellow-700 text-xs">⚡</span>
      <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-200 ${isRunning ? 'bg-yellow-600' : 'bg-yellow-900'}`}
          style={{ width: `${stamina}%` }}
        />
      </div>
    </div>
  );
}

function SanityBar({ sanity }: { sanity: number }) {
  const color = sanity > 60 ? 'bg-blue-900' : sanity > 30 ? 'bg-purple-900' : 'bg-red-900';
  return (
    <div className="flex items-center gap-2">
      <span className="text-purple-800 text-xs">🧠</span>
      <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${sanity}%` }} />
      </div>
    </div>
  );
}

function InventoryHUD({ inventory }: { inventory: string[] }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {REQUIRED.map(id => {
        const has = inventory.includes(id);
        return (
          <div
            key={id}
            title={ITEM_NAMES[id]}
            className={`w-9 h-9 rounded border flex items-center justify-center text-base transition-all duration-300 ${
              has ? 'border-green-700 bg-green-950/60 shadow-[0_0_6px_rgba(0,120,0,0.4)]' : 'border-gray-800 bg-black/50 opacity-40'
            }`}
          >
            {ITEM_MAP[id]}
          </div>
        );
      })}
    </div>
  );
}

function PointerLockHint() {
  const [locked, setLocked] = useState(!!document.pointerLockElement);
  useEffect(() => {
    const update = () => setLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', update);
    return () => document.removeEventListener('pointerlockchange', update);
  }, []);
  if (locked) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/50">
      <p className="text-gray-400 text-sm font-mono border border-gray-700 px-4 py-2 rounded bg-black/90">
        Кликни для управления мышью
      </p>
    </div>
  );
}

export default function Index() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<ForestGame3D | null>(null);
  const [gameState, setGameState] = useState<GameState3D>({
    phase: 'menu',
    inventory: [],
    requiredItems: REQUIRED,
    bearDistance: 30,
    sanity: 100,
    stamina: 100,
    isRunning: false,
    nearItem: null,
    nearCar: false,
    message: '',
    messageTimer: 0,
  });

  const handleStateChange = useCallback((s: GameState3D) => {
    setGameState({ ...s });
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = new ForestGame3D(canvasRef.current, handleStateChange);
    gameRef.current = game;
    return () => { game.destroy(); };
  }, [handleStateChange]);

  const startGame = () => gameRef.current?.startGame();
  const resumeGame = () => gameRef.current?.resumeGame();
  const restartGame = () => gameRef.current?.startGame();

  const phase = gameState.phase;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* ── MENU ── */}
      {phase === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="text-center max-w-md mx-4">
            <h1 className="font-horror text-7xl text-red-700 mb-1 animate-flicker">ЛЕСНАЯ</h1>
            <h1 className="font-horror text-7xl text-red-900 mb-8 animate-flicker">ЛОВУШКА</h1>
            <div className="horror-border rounded p-4 mb-8 text-left bg-black/80">
              <p className="text-gray-300 text-sm font-mono mb-3 leading-relaxed">
                Машина заглохла в ночном лесу. Медведь охотится. Найди 6 деталей и сбеги.
              </p>
              <div className="grid grid-cols-2 gap-y-1.5 text-xs font-mono text-gray-500 mt-3 border-t border-gray-800 pt-3">
                <span><span className="text-gray-200">WASD / ↑↓←→</span> — движение</span>
                <span><span className="text-gray-200">Мышь</span> — обзор</span>
                <span><span className="text-gray-200">Shift</span> — бег</span>
                <span><span className="text-gray-200">E</span> — взять / починить</span>
                <span><span className="text-gray-200">Esc</span> — пауза</span>
                <span><span className="text-gray-200">Клик</span> — захват курсора</span>
              </div>
            </div>
            <button
              onClick={startGame}
              className="location-btn px-10 py-4 border border-red-800 rounded text-red-500 font-horror text-3xl tracking-widest hover:bg-red-950/30 transition-all animate-pulse-red"
            >
              ВОЙТИ В ЛЕС
            </button>
            <p className="text-gray-700 text-xs font-mono mt-5">3D · WebGL · Наушники рекомендованы</p>
          </div>
        </div>
      )}

      {/* ── PAUSE ── */}
      {phase === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center horror-border rounded p-8 bg-black/95 max-w-sm mx-4">
            <h2 className="font-horror text-4xl text-red-800 mb-2">ПАУЗА</h2>
            <p className="text-gray-600 text-xs font-mono mb-6">Медведь всё ещё там...</p>
            <div className="space-y-3">
              <button onClick={resumeGame} className="location-btn w-full py-3 border border-red-800 rounded text-red-400 font-horror text-xl tracking-widest">
                ПРОДОЛЖИТЬ
              </button>
              <button onClick={restartGame} className="location-btn w-full py-2 border border-gray-700 rounded text-gray-500 font-mono text-sm">
                Начать заново
              </button>
              <button onClick={() => setGameState(s => ({ ...s, phase: 'menu' }))} className="location-btn w-full py-2 border border-gray-800 rounded text-gray-600 font-mono text-sm">
                Главное меню
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DEATH ── */}
      {phase === 'dead' && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/50 backdrop-blur-sm">
          <div className="text-center max-w-sm mx-4">
            <h1 className="font-horror text-8xl text-red-600 mb-4 animate-glitch">ТЫ МЁРТВы</h1>
            <p className="text-gray-400 text-sm font-mono mb-2">Медведь настиг тебя в темноте.</p>
            <p className="text-gray-600 text-xs font-mono mb-8">
              Собрано: {gameState.inventory.length} / {REQUIRED.length} деталей
            </p>
            <button onClick={restartGame} className="location-btn px-8 py-3 border border-red-900 rounded text-red-600 font-horror text-2xl tracking-widest hover:bg-red-950/30">
              СНОВА В ТЕМНОТУ
            </button>
          </div>
        </div>
      )}

      {/* ── WIN ── */}
      {phase === 'win' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="text-center max-w-md mx-4 animate-fade-in-slow">
            <h1 className="font-horror text-7xl text-green-600 mb-4">ТЫ ВЫЖИЛ</h1>
            <div className="horror-border rounded p-4 mb-6 text-left">
              <p className="text-gray-300 text-sm font-mono leading-relaxed">Двигатель взревел. Фары разорвали тьму.</p>
              <p className="text-gray-300 text-sm font-mono leading-relaxed mt-2">В зеркале — красные глаза. Ты давишь на газ.</p>
              <p className="text-green-700 text-sm font-mono leading-relaxed mt-2">Лес остался позади.</p>
            </div>
            <button onClick={restartGame} className="location-btn px-8 py-3 border border-green-900 rounded text-green-600 font-horror text-2xl tracking-widest">
              СЫГРАТЬ СНОВА
            </button>
          </div>
        </div>
      )}

      {/* ── HUD ── */}
      {phase === 'playing' && (
        <>
          {/* Crosshair */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-5 h-5">
              <div className="absolute top-1/2 left-0 w-full h-px bg-red-800/60 -translate-y-1/2" />
              <div className="absolute left-1/2 top-0 h-full w-px bg-red-800/60 -translate-x-1/2" />
            </div>
          </div>

          {/* Stats top-left */}
          <div className="absolute top-4 left-4 space-y-2 pointer-events-none">
            <div className="horror-border rounded p-2.5 bg-black/75 space-y-2">
              <BearIndicator distance={gameState.bearDistance} />
              <SanityBar sanity={gameState.sanity} />
              <StaminaBar stamina={gameState.stamina} isRunning={gameState.isRunning} />
            </div>
          </div>

          {/* Inventory top-right */}
          <div className="absolute top-4 right-4 pointer-events-none">
            <div className="horror-border rounded p-2.5 bg-black/75">
              <p className="text-gray-600 text-xs font-mono uppercase tracking-widest mb-2">
                Детали {gameState.inventory.length}/{REQUIRED.length}
              </p>
              <InventoryHUD inventory={gameState.inventory} />
            </div>
          </div>

          {/* Interact prompt */}
          {gameState.nearItem && !gameState.nearItem.collected && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="horror-border rounded px-4 py-2 bg-black/90 flex items-center gap-3 animate-slide-up">
                <span className="text-yellow-600 border border-yellow-900 rounded px-1.5 py-0.5 text-xs font-mono font-bold">E</span>
                <span className="text-gray-200 text-sm font-mono">
                  {gameState.nearItem.emoji} Взять {gameState.nearItem.name}
                </span>
              </div>
            </div>
          )}

          {gameState.nearCar && !gameState.nearItem && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="horror-border rounded px-4 py-2 bg-black/90 flex items-center gap-3 animate-slide-up">
                <span className={`border rounded px-1.5 py-0.5 text-xs font-mono font-bold ${gameState.inventory.length === REQUIRED.length ? 'text-green-500 border-green-800' : 'text-gray-600 border-gray-700'}`}>E</span>
                <span className={`text-sm font-mono ${gameState.inventory.length === REQUIRED.length ? 'text-green-400' : 'text-gray-500'}`}>
                  {gameState.inventory.length === REQUIRED.length ? '🚗 Починить машину и СБЕЖАТЬ!' : `🔧 Нужно ещё ${REQUIRED.length - gameState.inventory.length} деталей`}
                </span>
              </div>
            </div>
          )}

          {/* Message */}
          {gameState.messageTimer > 0 && gameState.message && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
              <div
                className="horror-border rounded px-5 py-2 bg-black/90 max-w-sm text-center"
                style={{ opacity: Math.min(1, gameState.messageTimer) }}
              >
                <p className="text-gray-300 text-xs font-mono">{gameState.message}</p>
              </div>
            </div>
          )}

          {/* Bear danger vignette */}
          {gameState.bearDistance < 18 && (
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-500"
              style={{
                boxShadow: `inset 0 0 ${Math.max(0, (18 - gameState.bearDistance) * 7)}px rgba(120,0,0,${Math.min(0.55, (18 - gameState.bearDistance) * 0.035)})`,
              }}
            />
          )}

          {/* Low sanity overlay */}
          {gameState.sanity < 30 && (
            <div
              className="absolute inset-0 pointer-events-none animate-flicker"
              style={{ background: `radial-gradient(ellipse at center, transparent 50%, rgba(30,0,50,${0.4 - gameState.sanity * 0.013}) 100%)` }}
            />
          )}

          <PointerLockHint />
        </>
      )}
    </div>
  );
}
