export type ItemId =
  | 'wrench'
  | 'fuel'
  | 'battery'
  | 'wire'
  | 'spark_plug'
  | 'oil'
  | 'flashlight'
  | 'key';

export type LocationId =
  | 'car'
  | 'clearing'
  | 'river'
  | 'cabin'
  | 'cave'
  | 'old_tree';

export interface Item {
  id: ItemId;
  name: string;
  emoji: string;
  description: string;
  weight: number;
}

export interface PuzzleOption {
  text: string;
  correct: boolean;
  response: string;
}

export interface Puzzle {
  id: string;
  question: string;
  options: PuzzleOption[];
  reward: ItemId;
  solved: boolean;
}

export interface Location {
  id: LocationId;
  name: string;
  shortName: string;
  description: string;
  atmosphere: string;
  image: string;
  connections: LocationId[];
  items: ItemId[];
  puzzle?: Puzzle;
  bearVisitChance: number;
  visited: boolean;
  searchable: boolean;
}

export interface GameState {
  phase: 'intro' | 'playing' | 'death' | 'win';
  currentLocation: LocationId;
  inventory: ItemId[];
  bearDistance: number;
  bearAlert: boolean;
  bearAttacking: boolean;
  solvedPuzzles: string[];
  collectedItems: ItemId[];
  narrativeLogs: NarrativeLog[];
  turn: number;
  bearLastSeen: LocationId | null;
  sanity: number;
  heartsound: boolean;
}

export interface NarrativeLog {
  id: string;
  text: string;
  type: 'narrative' | 'danger' | 'item' | 'puzzle' | 'system';
  turn: number;
}

export const ITEMS: Record<ItemId, Item> = {
  flashlight: {
    id: 'flashlight',
    name: 'Фонарь',
    emoji: '🔦',
    description: 'Тусклый свет рассеивает мрак. Слабые батарейки.',
    weight: 1,
  },
  wrench: {
    id: 'wrench',
    name: 'Гаечный ключ',
    emoji: '🔧',
    description: 'Ржавый, но рабочий. Для двигателя.',
    weight: 2,
  },
  fuel: {
    id: 'fuel',
    name: 'Канистра топлива',
    emoji: '⛽',
    description: 'Литра три бензина. Должно хватить.',
    weight: 3,
  },
  battery: {
    id: 'battery',
    name: 'Аккумулятор',
    emoji: '🔋',
    description: 'Тяжёлый. Заряд есть.',
    weight: 4,
  },
  wire: {
    id: 'wire',
    name: 'Провод зажигания',
    emoji: '〰️',
    description: 'Медный. Немного обгорелый.',
    weight: 1,
  },
  spark_plug: {
    id: 'spark_plug',
    name: 'Свеча зажигания',
    emoji: '⚡',
    description: 'Новая. Кто-то оставил здесь...',
    weight: 1,
  },
  oil: {
    id: 'oil',
    name: 'Моторное масло',
    emoji: '🛢️',
    description: 'Потрёпанная бутылка. Масло ещё свежее.',
    weight: 2,
  },
  key: {
    id: 'key',
    name: 'Ключи от машины',
    emoji: '🗝️',
    description: 'Запасные ключи. Кто их сюда положил?',
    weight: 1,
  },
};

export const REQUIRED_ITEMS: ItemId[] = ['wrench', 'fuel', 'battery', 'wire', 'spark_plug', 'oil'];

export const LOCATIONS: Record<LocationId, Location> = {
  car: {
    id: 'car',
    name: 'Заглохшая машина',
    shortName: 'Машина',
    description:
      'Твоя старая "Нива" стоит посреди лесной дороги. Капот открыт, двигатель мёртв. Запах горелой проводки. Где-то в темноте треснула ветка.',
    atmosphere: 'Стартер крутится, но двигатель молчит.',
    image:
      'https://cdn.poehali.dev/projects/b043684b-b6e5-4480-b897-0e9b84e061fb/files/97f6c11d-a2c1-487e-9feb-7bf3dbc0ff3a.jpg',
    connections: ['clearing', 'river'],
    items: ['key'],
    bearVisitChance: 0.1,
    visited: true,
    searchable: true,
  },
  clearing: {
    id: 'clearing',
    name: 'Тёмная поляна',
    shortName: 'Поляна',
    description:
      'Широкая поляна, покрытая мёртвой травой. В центре торчит старый пень. На нём... следы когтей. Туман стелется по земле.',
    atmosphere: 'Что-то большое ломится через кусты — справа.',
    image:
      'https://cdn.poehali.dev/projects/b043684b-b6e5-4480-b897-0e9b84e061fb/files/06c1b640-a396-418e-ae13-e76486bedd4f.jpg',
    connections: ['car', 'cabin', 'old_tree'],
    items: ['wrench'],
    puzzle: {
      id: 'puzz_clearing',
      question:
        'На пне вырезаны цифры: 3, 6, ?, 12. Что нужно вставить вместо вопроса, чтобы открыть замок на старом ящике?',
      options: [
        { text: '8', correct: false, response: 'Замок не поддаётся. Неверно.' },
        { text: '9', correct: true, response: 'Замок щёлкнул. Ящик открыт.' },
        { text: '10', correct: false, response: 'Ты дёргаешь замок. Ничего.' },
        { text: '11', correct: false, response: 'Цифра неверная. Тишина.' },
      ],
      reward: 'wrench',
      solved: false,
    },
    bearVisitChance: 0.25,
    visited: false,
    searchable: true,
  },
  river: {
    id: 'river',
    name: 'Берег реки',
    shortName: 'Река',
    description:
      'Чёрная вода едва движется. На берегу — опрокинутая лодка. Под ней что-то блестит. Туман такой густой, что другой берег не виден.',
    atmosphere: 'Из тумана доносится низкое рычание.',
    image:
      'https://cdn.poehali.dev/projects/b043684b-b6e5-4480-b897-0e9b84e061fb/files/ad31858e-d06e-4827-b63a-2b66d7f88d44.jpg',
    connections: ['car', 'cave'],
    items: ['fuel', 'oil'],
    puzzle: {
      id: 'puzz_river',
      question:
        'Лодка перевёрнута и удерживается верёвкой с замком. На замке написано: "Я иду без ног, говорю без рта. Что я?" Выбери ответ:',
      options: [
        { text: 'Тень', correct: false, response: 'Замок молчит. Это не то.' },
        { text: 'Ветер', correct: true, response: 'Замок открылся. Лодка сдвинута.' },
        { text: 'Время', correct: false, response: 'Нет. Ошибка.' },
        { text: 'Река', correct: false, response: 'Замок не реагирует.' },
      ],
      reward: 'fuel',
      solved: false,
    },
    bearVisitChance: 0.2,
    visited: false,
    searchable: true,
  },
  cabin: {
    id: 'cabin',
    name: 'Заброшенная хижина',
    shortName: 'Хижина',
    description:
      'Гнилые доски, выбитые окна. Внутри пахнет плесенью и чем-то ещё... органическим. На стенах — царапины, слишком высокие для человека.',
    atmosphere: 'Половица скрипит сама по себе.',
    image:
      'https://cdn.poehali.dev/projects/b043684b-b6e5-4480-b897-0e9b84e061fb/files/aec60932-501e-4668-b5f6-3b8aa47f7d0d.jpg',
    connections: ['clearing', 'old_tree'],
    items: ['battery', 'wire'],
    puzzle: {
      id: 'puzz_cabin',
      question:
        'На стене нацарапан шифр: ящики помечены A, B, C. "A не крайний. B левее C. C не правее B." Где аккумулятор? В каком ящике?',
      options: [
        { text: 'Ящик A (слева)', correct: false, response: 'Пусто. Только пыль и паутина.' },
        { text: 'Ящик B (в центре)', correct: true, response: 'Тяжёлый аккумулятор. Нашёл!' },
        { text: 'Ящик C (справа)', correct: false, response: 'Там только старая обувь.' },
      ],
      reward: 'battery',
      solved: false,
    },
    bearVisitChance: 0.3,
    visited: false,
    searchable: true,
  },
  cave: {
    id: 'cave',
    name: 'Тёмная пещера',
    shortName: 'Пещера',
    description:
      'Узкий вход в скалу. Внутри темно, сыро. Запах медведя. На полу — шерсть. Эхо усиливает каждый звук.',
    atmosphere: 'ЭТО ЛОГОВО МЕДВЕДЯ. Ты слышишь его дыхание.',
    image:
      'https://cdn.poehali.dev/projects/b043684b-b6e5-4480-b897-0e9b84e061fb/files/b0ac8eca-0781-47b0-a38d-7f86976252a4.jpg',
    connections: ['river', 'old_tree'],
    items: ['spark_plug'],
    puzzle: {
      id: 'puzz_cave',
      question:
        'У входа лежит металлическая коробка с кодом. На крышке: "Сколько лап у медведя минус сколько сторон у треугольника?" Введи ответ:',
      options: [
        { text: '1', correct: true, response: 'Правильно! Коробка открылась.' },
        { text: '4', correct: false, response: 'Нет. За спиной — звук.' },
        { text: '7', correct: false, response: 'Ошибка. Медведь рядом...' },
        { text: '3', correct: false, response: 'Неверно. Торопись.' },
      ],
      reward: 'spark_plug',
      solved: false,
    },
    bearVisitChance: 0.6,
    visited: false,
    searchable: true,
  },
  old_tree: {
    id: 'old_tree',
    name: 'Старое дерево',
    shortName: 'Дерево',
    description:
      'Огромный дуб, возраст — сотни лет. На стволе вырезаны имена и даты. Последняя запись: "28.10.1987. ОН ПРИШЁЛ". В дупле что-то спрятано.',
    atmosphere: 'Ветки качаются без ветра.',
    image:
      'https://cdn.poehali.dev/projects/b043684b-b6e5-4480-b897-0e9b84e061fb/files/06c1b640-a396-418e-ae13-e76486bedd4f.jpg',
    connections: ['clearing', 'cabin', 'cave'],
    items: ['wire', 'flashlight'],
    puzzle: {
      id: 'puzz_tree',
      question:
        'Дупло заколочено доской с замком. На замке — 4 кнопки: ▲ ■ ● ◆. Последовательность на коре дерева: ▲▲■●. Что нажать последним?',
      options: [
        { text: '▲ (треугольник)', correct: false, response: 'Замок жужжит. Нет.' },
        { text: '■ (квадрат)', correct: false, response: 'Не открывается.' },
        { text: '● (круг)', correct: true, response: 'Щелчок! Дупло открылось.' },
        { text: '◆ (ромб)', correct: false, response: 'Неверно.' },
      ],
      reward: 'wire',
      solved: false,
    },
    bearVisitChance: 0.15,
    visited: false,
    searchable: true,
  },
};

export const INITIAL_STATE: GameState = {
  phase: 'intro',
  currentLocation: 'car',
  inventory: [],
  bearDistance: 5,
  bearAlert: false,
  bearAttacking: false,
  solvedPuzzles: [],
  collectedItems: [],
  narrativeLogs: [],
  turn: 0,
  bearLastSeen: null,
  sanity: 100,
  heartsound: false,
};

export const BEAR_NARRATIVES = [
  'Где-то в темноте треснула ветка.',
  'Ты слышишь низкое рычание.',
  'Чьи-то шаги приближаются.',
  'Запах медведя становится сильнее.',
  'Ты видишь красные глаза в темноте.',
  'Земля вибрирует от тяжёлых шагов.',
  'Медведь рычит громче. Он рядом.',
  'Ты слышишь его дыхание.',
];

export const DEATH_MESSAGES = [
  'Медведь вышел из тьмы. Это конец.',
  'Ты не успел убежать. Тьма поглотила тебя.',
  'Последнее, что ты видишь — красные глаза.',
];

export const WIN_NARRATIVE = `Ты запустил двигатель. "Нива" заревела, разрезая тишину леса.
В свете фар — силуэт медведя на дороге. Он смотрит.
Ты давишь на газ. Машина срывается с места.
В зеркало заднего вида — лес исчезает за поворотом.
Ты выжил.`;
