import type { QuestionType } from './types';

export const EXAM_DURATION = 180; // секунды
export const WIN_THRESHOLD = 3;
export const TOTAL_QUESTIONS = 5;
export const TOTAL_SHEETS = 8; // всего шпор (не все вопросы имеют шпоры!)
export const PROGRESS_PER_QUESTION = 100;

// Скорость написания (единиц в секунду; 100 единиц = 1 вопрос)
export const WRITE_SPEED_DESK = 7;    // на парте - 14 сек на вопрос
export const WRITE_SPEED_LAP = 14;    // на коленях - 7 сек на вопрос (быстрее, но опаснее)
export const WRITE_SPEED_PHONE = 4;   // телефон - 25 сек на вопрос (очень медленно)

// Тайминги отвлечений
export const DISTRACTION_MIN_INTERVAL = 15;
export const DISTRACTION_MAX_INTERVAL = 30;
export const DISTRACTION_DURATION = 5;

// Параметры надзирателей
export const PROCTOR_VISION_ANGLE = Math.PI / 2; // 90 градусов
export const PROCTOR_VISION_RANGE = 6;           // метров

// Позиция игрока (неподвижен - сидит за партой в конце аудитории)
export const PLAYER_X = 5;
export const PLAYER_Y = 10;
export const PLAYER_ANGLE = 0; // смотрит вперёд (на доску, -Y)

// Типы вопросов
export const QUESTION_TYPES: QuestionType[] = ['А', 'Б', 'В', 'Г', 'Д'];

export const POCKET_NAMES = {
  left: 'Левый карман штанов',
  right: 'Правый карман штанов',
  hoodie: 'Карман худи',
};

// Цвета
export const COLORS = {
  desk: '#5c3a1e',
  deskLight: '#8b5a2b',
  paper: '#fefef2',
  paperLine: '#c0c0b0',
  floor: '#3a3530',
  wall: '#6b6558',
  wallAccent: '#857d6e',
  proctor: '#1a2a4a',
  proctorHead: '#e8c4a0',
  danger: '#ff2a2a',
  warning: '#ffcc00',
  safe: '#888888',
  success: '#22c55e',
};
