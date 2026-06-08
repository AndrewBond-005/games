// Типы для игры "Экзамен: списать и не попасться"

export type QuestionType = 'А' | 'Б' | 'В' | 'Г' | 'Д';

export interface CheatSheet {
  id: string;          // "А1", "Б2" и т.д.
  type: QuestionType;
  number: 1 | 2;
}

export interface Question {
  index: number;       // 1..5
  type: QuestionType;
  sheetNum: 1 | 2;
  hasSheet: boolean;   // есть ли шпора для этого вопроса (false = нужен телефон)
  progress: number;    // 0..100
  progressFromCorrectSheet: number; // прогресс только от ПРАВИЛЬНОЙ шпоры
  completed: boolean;
  correctAnswer: boolean; // вопрос полностью ответил правильной шпорой или телефоном
}

export interface Pocket {
  id: 'left' | 'right' | 'hoodie';
  name: string;
  sheets: CheatSheet[]; // очередь шпор (FIFO)
}

export type CheatingMode = null | 'desk' | 'lap' | 'phone';

export interface Proctor {
  id: number;
  x: number;           // позиция в аудитории (условные единицы)
  y: number;
  angle: number;       // текущее направление взгляда (радианы)
  targetAngle: number; // целевое направление (плавно приближаемся)
  lookTimer: number;   // таймер "осмотра" (стоит и смотрит)
  pathIndex: number;
  path: { x: number; y: number }[];
  speed: number;
  name: string;
  targetX: number;
  targetY: number;
}

export interface Indicator {
  direction: 'top' | 'bottom' | 'left' | 'right';
  distance: number;    // 0..1 (1 = близко)
  status: 'none' | 'near' | 'looking';
  isPlayerLookingDown: boolean;
}

export type GamePhase = 'prep' | 'exam' | 'win' | 'lose';

export interface GameState {
  phase: GamePhase;
  timeLeft: number;
  pockets: Pocket[];
  questions: Question[];
  completedCount: number;
  activeSheet: CheatSheet | null;
  activeQuestion: number | null; // индекс вопроса, который сейчас списываем
  cheatingMode: CheatingMode;
  sheetOnDesk: boolean;  // шпора лежит на парте (под листом)
  sheetHidden: boolean;  // шпора спрятана под лист (защищена от надзирателей)
  sheetRevealedId: string | null; // какая шпора лежит на столе (показывается после узнавания)
  writingActive: boolean; // началось ли реальное написание (для режима парты)
  friendHelpActive: boolean; // идёт ли сейчас помощь друга (5 сек отсчёт)
  friendUsed: boolean;
  friendMessage: string;  // результат обращения к другу
  distraction: { active: boolean; timeLeft: number; studentIndex: number };
  proctors: Proctor[];
  lastDistraction: number;
  nextDistractionIn: number;
  loseReason: string;
  phoneActive: boolean;
}
