import { useState, useEffect, useCallback } from 'react';
import { GameState, LOCATIONS, INITIAL_STATE, LocationId, ItemId, Location, WIN_NARRATIVE } from '@/lib/gameData';
import { movePlayer, collectItem, solvePuzzle, repairCar } from '@/lib/gameEngine';
import BearMeter from '@/components/game/BearMeter';
import Inventory from '@/components/game/Inventory';
import NarrativeLog from '@/components/game/NarrativeLog';
import LocationView from '@/components/game/LocationView';
import PuzzleModal from '@/components/game/PuzzleModal';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [locations, setLocations] = useState({ ...LOCATIONS });
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [bearShake, setBearShake] = useState(false);

  const currentLocation = locations[gameState.currentLocation];

  const triggerBearShake = useCallback(() => {
    setBearShake(true);
    setTimeout(() => setBearShake(false), 500);
  }, []);

  useEffect(() => {
    if (gameState.bearAlert) triggerBearShake();
  }, [gameState.turn, gameState.bearAlert, triggerBearShake]);

  const handleMove = (targetId: LocationId) => {
    const result = movePlayer(gameState, locations, targetId);
    setGameState(result.state);
    setLocations(result.locations);
  };

  const handleCollect = (itemId: ItemId) => {
    const result = collectItem(gameState, locations, itemId);
    setGameState(result.state);
    setLocations(result.locations);
  };

  const handlePuzzleSolve = (optionIndex: number) => {
    const result = solvePuzzle(gameState, locations, optionIndex);
    setGameState(result.state);
    setLocations(result.locations);
    if (!result.success) triggerBearShake();
  };

  const handleRepair = () => {
    const result = repairCar(gameState);
    setGameState(result.state);
  };

  const handleRestart = () => {
    setGameState(INITIAL_STATE);
    setLocations({ ...LOCATIONS });
    setShowPuzzle(false);
  };

  if (gameState.phase === 'intro') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(https://cdn.poehali.dev/projects/b043684b-b6e5-4480-b897-0e9b84e061fb/files/97f6c11d-a2c1-487e-9feb-7bf3dbc0ff3a.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/70 to-black" />
        <div className="relative z-10 text-center max-w-lg mx-4 animate-fade-in-slow">
          <h1 className="font-horror text-6xl md:text-8xl text-blood-bright mb-2 animate-flicker tracking-wider">
            ЛЕСНАЯ
          </h1>
          <h1 className="font-horror text-6xl md:text-8xl text-blood mb-6 animate-flicker tracking-wider">
            ЛОВУШКА
          </h1>
          <div className="horror-border rounded p-4 mb-8 text-left">
            <p className="text-gray-300 text-sm font-mono leading-relaxed">
              Твоя машина заглохла посреди ночного леса. Телефон разряжен. Фонарь почти не светит.
            </p>
            <p className="text-gray-400 text-sm font-mono mt-2 leading-relaxed">
              Где-то в темноте — медведь. Тебе нужно найти инструменты, починить машину и выбраться,
              пока он не нашёл тебя.
            </p>
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-600 font-mono">Цель: собери все детали и вернись к машине</p>
              <p className="text-xs text-gray-700 font-mono mt-1">🔧 Гаечный ключ · ⛽ Топливо · 🔋 Аккумулятор · 〰️ Провод · ⚡ Свеча · 🛢️ Масло</p>
            </div>
          </div>
          <button
            onClick={() => setGameState(s => ({ ...s, phase: 'playing' }))}
            className="location-btn px-8 py-4 border border-red-900 rounded text-red-500 font-horror text-2xl tracking-widest hover:bg-red-950/30 transition-all duration-300"
          >
            ВОЙТИ В ЛЕС
          </button>
          <p className="text-gray-700 text-xs font-mono mt-4">Используй наушники для максимального эффекта</p>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'death') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(https://cdn.poehali.dev/projects/b043684b-b6e5-4480-b897-0e9b84e061fb/files/b0ac8eca-0781-47b0-a38d-7f86976252a4.jpg)` }}
        />
        <div className="absolute inset-0 bg-red-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        <div className="relative z-10 text-center max-w-md mx-4">
          <h1 className="font-horror text-7xl text-blood-bright mb-4 animate-glitch">ТЫ МЁРТВы</h1>
          <p className="text-gray-500 text-sm font-mono mb-2">Медведь нашёл тебя.</p>
          <p className="text-gray-600 text-xs font-mono mb-8">
            Собрано деталей: {gameState.inventory.length}/6 · Ход: {gameState.turn}
          </p>
          <button
            onClick={handleRestart}
            className="location-btn px-6 py-3 border border-red-900 rounded text-red-500 font-horror text-xl tracking-widest hover:bg-red-950/30"
          >
            СНОВА В ТЕМНОТУ
          </button>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'win') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(https://cdn.poehali.dev/projects/b043684b-b6e5-4480-b897-0e9b84e061fb/files/97f6c11d-a2c1-487e-9feb-7bf3dbc0ff3a.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black" />
        <div className="relative z-10 text-center max-w-md mx-4 animate-fade-in-slow">
          <h1 className="font-horror text-6xl text-green-600 mb-4">ТЫ ВЫЖИЛ</h1>
          <div className="horror-border rounded p-4 mb-6 text-left">
            {WIN_NARRATIVE.split('\n').map((line, i) => (
              <p key={i} className="text-gray-300 text-sm font-mono leading-relaxed">{line}</p>
            ))}
          </div>
          <p className="text-gray-600 text-xs font-mono mb-6">Ходов: {gameState.turn} · Рассудок: {gameState.sanity}%</p>
          <button
            onClick={handleRestart}
            className="location-btn px-6 py-3 border border-green-900 rounded text-green-600 font-horror text-xl tracking-widest"
          >
            СЫГРАТЬ СНОВА
          </button>
        </div>
      </div>
    );
  }

  const puzzle = currentLocation.puzzle;
  const puzzleSolved = puzzle ? gameState.solvedPuzzles.includes(puzzle.id) : false;

  return (
    <div className={`fixed inset-0 bg-[#060806] overflow-hidden ${bearShake ? 'animate-bear-shake' : ''}`}>
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url(${currentLocation.image})`,
          backgroundSize: 'cover',
          filter: 'blur(20px)',
          transition: 'background-image 0.8s ease',
        }}
      />

      {gameState.bearAlert && (
        <div className="absolute inset-0 pointer-events-none z-10"
          style={{ boxShadow: 'inset 0 0 80px rgba(139,0,0,0.4)', animation: 'pulse-red 1s ease infinite' }}
        />
      )}

      <div className="relative z-20 h-full flex flex-col md:flex-row gap-3 p-3 max-w-5xl mx-auto">
        <div className="flex-1 min-w-0 overflow-y-auto">
          <LocationView
            location={currentLocation}
            allLocations={locations}
            inventory={gameState.inventory}
            solvedPuzzles={gameState.solvedPuzzles}
            onMove={handleMove}
            onCollect={handleCollect}
            onPuzzle={() => setShowPuzzle(true)}
            onRepair={handleRepair}
            bearAlert={gameState.bearAlert}
          />
        </div>

        <div className="md:w-72 flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center justify-between px-1">
            <span className="font-horror text-blood text-sm animate-flicker">ЛЕСНАЯ ЛОВУШКА</span>
            <span className="text-gray-600 text-xs font-mono">ход {gameState.turn}</span>
          </div>

          <BearMeter
            distance={gameState.bearDistance}
            sanity={gameState.sanity}
            isAlert={gameState.bearAlert}
          />

          <Inventory items={gameState.inventory} />

          <NarrativeLog logs={gameState.narrativeLogs} />

          <div className="flex gap-2">
            <button
              onClick={handleRestart}
              className="flex-1 p-1.5 border border-gray-800 rounded text-gray-600 text-xs font-mono hover:border-gray-600 hover:text-gray-400 transition-all"
            >
              <Icon name="RotateCcw" size={10} className="inline mr-1" />
              Заново
            </button>
            <button
              onClick={() => setGameState(s => ({ ...s, phase: 'intro' }))}
              className="flex-1 p-1.5 border border-gray-800 rounded text-gray-600 text-xs font-mono hover:border-gray-600 hover:text-gray-400 transition-all"
            >
              Меню
            </button>
          </div>
        </div>
      </div>

      {showPuzzle && puzzle && !puzzleSolved && (
        <PuzzleModal
          puzzle={puzzle}
          onSolve={handlePuzzleSolve}
          onClose={() => setShowPuzzle(false)}
        />
      )}
    </div>
  );
};

export default Index;
