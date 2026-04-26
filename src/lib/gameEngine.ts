import {
  GameState,
  Location,
  LocationId,
  ItemId,
  LOCATIONS,
  ITEMS,
  REQUIRED_ITEMS,
  BEAR_NARRATIVES,
  DEATH_MESSAGES,
  NarrativeLog,
} from './gameData';

let logCounter = 0;

function makeLog(text: string, type: NarrativeLog['type'], turn: number): NarrativeLog {
  return { id: `log_${++logCounter}_${Date.now()}`, text, type, turn };
}

export function movePlayer(
  state: GameState,
  locations: Record<LocationId, Location>,
  targetId: LocationId,
): { state: GameState; locations: Record<LocationId, Location>; logs: NarrativeLog[] } {
  const logs: NarrativeLog[] = [];
  const current = locations[state.currentLocation];

  if (!current.connections.includes(targetId)) {
    logs.push(makeLog('Туда не пройти отсюда.', 'system', state.turn));
    return { state, locations, logs };
  }

  const newTurn = state.turn + 1;
  const newLocations = { ...locations };
  newLocations[targetId] = { ...newLocations[targetId], visited: true };

  const target = newLocations[targetId];
  logs.push(makeLog(target.description, 'narrative', newTurn));

  if (target.items.length > 0 && !target.puzzle) {
    logs.push(makeLog(`Видишь предметы: ${target.items.map(i => ITEMS[i].name).join(', ')}`, 'item', newTurn));
  }

  const newBearDist = moveBear(state.bearDistance, targetId, state.bearLastSeen);
  const bearAlert = newBearDist <= 2;
  const bearAttacking = newBearDist <= 0;
  const sanity = Math.max(0, state.sanity - (bearAlert ? 10 : 3));

  if (bearAttacking) {
    const msg = DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)];
    logs.push(makeLog(msg, 'danger', newTurn));
    return {
      state: { ...state, phase: 'death', bearDistance: 0, bearAttacking: true, turn: newTurn, sanity: 0, narrativeLogs: [...state.narrativeLogs, ...logs] },
      locations: newLocations,
      logs,
    };
  }

  if (bearAlert) {
    const bearMsg = BEAR_NARRATIVES[Math.floor(Math.random() * BEAR_NARRATIVES.length)];
    logs.push(makeLog(bearMsg, 'danger', newTurn));
  }

  const newState: GameState = {
    ...state,
    currentLocation: targetId,
    turn: newTurn,
    bearDistance: newBearDist,
    bearAlert,
    bearAttacking,
    bearLastSeen: newBearDist <= 2 ? targetId : state.bearLastSeen,
    sanity,
    narrativeLogs: [...state.narrativeLogs, ...logs],
  };

  return { state: newState, locations: newLocations, logs };
}

function moveBear(currentDist: number, playerLocation: LocationId, lastSeen: LocationId | null): number {
  const danger = ['cave', 'cabin'].includes(playerLocation) ? -1 : 0;
  const rnd = Math.random();
  let delta = rnd < 0.4 ? -1 : rnd < 0.7 ? 0 : 1;
  if (lastSeen === playerLocation) delta -= 1;
  return Math.max(0, Math.min(6, currentDist + delta + danger));
}

export function collectItem(
  state: GameState,
  locations: Record<LocationId, Location>,
  itemId: ItemId,
): { state: GameState; locations: Record<LocationId, Location>; logs: NarrativeLog[] } {
  const logs: NarrativeLog[] = [];
  const loc = locations[state.currentLocation];

  if (!loc.items.includes(itemId)) {
    logs.push(makeLog('Предмет недоступен здесь.', 'system', state.turn));
    return { state, locations, logs };
  }

  if (loc.puzzle && !state.solvedPuzzles.includes(loc.puzzle.id)) {
    logs.push(makeLog('Сначала реши загадку, чтобы получить доступ.', 'puzzle', state.turn));
    return { state, locations, logs };
  }

  const item = ITEMS[itemId];
  const newLocations = { ...locations };
  newLocations[state.currentLocation] = {
    ...loc,
    items: loc.items.filter(i => i !== itemId),
  };

  logs.push(makeLog(`Ты подобрал: ${item.emoji} ${item.name}. ${item.description}`, 'item', state.turn));

  const newInventory = [...state.inventory, itemId];
  const newCollected = [...state.collectedItems, itemId];

  const hasAll = REQUIRED_ITEMS.every(ri => newInventory.includes(ri));
  if (hasAll) {
    logs.push(makeLog('У тебя есть всё необходимое! Возвращайся к машине!', 'system', state.turn));
  }

  return {
    state: { ...state, inventory: newInventory, collectedItems: newCollected, narrativeLogs: [...state.narrativeLogs, ...logs] },
    locations: newLocations,
    logs,
  };
}

export function solvePuzzle(
  state: GameState,
  locations: Record<LocationId, Location>,
  optionIndex: number,
): { state: GameState; locations: Record<LocationId, Location>; logs: NarrativeLog[]; success: boolean } {
  const logs: NarrativeLog[] = [];
  const loc = locations[state.currentLocation];

  if (!loc.puzzle || state.solvedPuzzles.includes(loc.puzzle.id)) {
    return { state, locations, logs, success: false };
  }

  const option = loc.puzzle.options[optionIndex];
  logs.push(makeLog(option.response, option.correct ? 'item' : 'danger', state.turn));

  if (!option.correct) {
    const newBearDist = Math.max(0, state.bearDistance - 1);
    logs.push(makeLog('Шум привлёк внимание. Медведь стал ближе!', 'danger', state.turn));

    if (newBearDist <= 0) {
      logs.push(makeLog(DEATH_MESSAGES[0], 'danger', state.turn));
      return {
        state: { ...state, phase: 'death', bearDistance: 0, narrativeLogs: [...state.narrativeLogs, ...logs] },
        locations,
        logs,
        success: false,
      };
    }

    return {
      state: { ...state, bearDistance: newBearDist, bearAlert: newBearDist <= 2, narrativeLogs: [...state.narrativeLogs, ...logs] },
      locations,
      logs,
      success: false,
    };
  }

  const newLocations = { ...locations };
  newLocations[state.currentLocation] = { ...loc };
  const newSolved = [...state.solvedPuzzles, loc.puzzle.id];

  const reward = loc.puzzle.reward;
  logs.push(makeLog(`Доступен предмет: ${ITEMS[reward].emoji} ${ITEMS[reward].name}`, 'item', state.turn));

  return {
    state: { ...state, solvedPuzzles: newSolved, narrativeLogs: [...state.narrativeLogs, ...logs] },
    locations: newLocations,
    logs,
    success: true,
  };
}

export function repairCar(
  state: GameState,
): { state: GameState; logs: NarrativeLog[] } {
  const logs: NarrativeLog[] = [];

  if (state.currentLocation !== 'car') {
    logs.push(makeLog('Ты не у машины.', 'system', state.turn));
    return { state, logs };
  }

  const missing = REQUIRED_ITEMS.filter(ri => !state.inventory.includes(ri));
  if (missing.length > 0) {
    const missingNames = missing.map(i => ITEMS[i].name).join(', ');
    logs.push(makeLog(`Не хватает: ${missingNames}`, 'system', state.turn));
    return { state, logs };
  }

  logs.push(makeLog('Ты вставляешь все детали. Поворачиваешь ключ... ПУСК!', 'item', state.turn));
  return {
    state: { ...state, phase: 'win', narrativeLogs: [...state.narrativeLogs, ...logs] },
    logs,
  };
}
