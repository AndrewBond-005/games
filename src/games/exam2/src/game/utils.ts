import type { CheatSheet, Pocket, Proctor, Question, QuestionType } from './types';
import { QUESTION_TYPES, TOTAL_QUESTIONS } from './constants';

// Fisher-Yates shuffle
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1));
}

// Создание всех 8 шпаргалок (8, а не 10)
// На один из вопросов нет шпоры — придётся использовать телефон
export function createAllCheatSheets(): CheatSheet[] {
  const sheets: CheatSheet[] = [];
  // Создаём шпоры для типов А, Б, В, Г (по 2), но Д будет без шпоры
  const typesWithSheets = ['А', 'Б', 'В', 'Г'];
  for (const type of typesWithSheets) {
    sheets.push({ id: `${type}1`, type: type as any, number: 1 });
    sheets.push({ id: `${type}2`, type: type as any, number: 2 });
  }
  return sheets;
}

// Создание начальных пустых карманов (телефон всегда в правом)
export function createInitialPockets(): Pocket[] {
  return [
    { id: 'left', name: 'Левый карман штанов', sheets: [] },
    { id: 'right', name: 'Правый карман штанов (+телефон)', sheets: [] },
    { id: 'hoodie', name: 'Карман худи', sheets: [] },
  ];
}

// Генерация 5 вопросов: каждый — случайный тип + случайная шпора (1 или 2).
// На вопрос про тип Д (5-й вопрос) нет шпоры — нужно использовать телефон.
export function generateQuestions(): Question[] {
  const types = shuffle([...QUESTION_TYPES]);
  const questions: Question[] = [];
  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    const type = types[i] as QuestionType;
    const hasSheet = type !== 'Д'; // Д не имеет шпоры
    questions.push({
      index: i + 1,
      type,
      sheetNum: Math.random() < 0.5 ? 1 : 2,
      hasSheet,
      progress: 0,
      progressFromCorrectSheet: 0,
      completed: false,
      correctAnswer: false,
    });
  }
  return questions;
}

// Маршруты надзирателей по аудитории (петли, с диагональными переходами)
export function createProctors(): Proctor[] {
  // Надзиратель 1 — ходит зигзагом через левую часть (y < 10, т.е. перед игроком)
  const path1 = [
    { x: 2, y: 2 },
    { x: 3.5, y: 4 },
    { x: 2, y: 6 },
    { x: 3.5, y: 8 },
    { x: 2, y: 9 },
    { x: 1, y: 7 },
    { x: 2, y: 5 },
    { x: 1, y: 3 },
  ];
  // Надзиратель 2 — зигзагом через правую часть
  const path2 = [
    { x: 8, y: 8.5 },
    { x: 6.5, y: 6.5 },
    { x: 8, y: 4.5 },
    { x: 6.5, y: 2.5 },
    { x: 8, y: 1.5 },
    { x: 9, y: 3.5 },
    { x: 8, y: 5.5 },
    { x: 9, y: 7.5 },
  ];
  return [
    {
      id: 1,
      x: path1[0].x,
      y: path1[0].y,
      angle: Math.PI / 2,
      targetAngle: Math.PI / 2,
      lookTimer: 0,
      pathIndex: 0,
      path: path1,
      speed: 0.55,
      name: 'Надзиратель 1',
      targetX: path1[1].x,
      targetY: path1[1].y,
    },
    {
      id: 2,
      x: path2[0].x,
      y: path2[0].y,
      angle: Math.PI / 2,
      targetAngle: Math.PI / 2,
      lookTimer: 0,
      pathIndex: 0,
      path: path2,
      speed: 0.5,
      name: 'Надзиратель 2',
      targetX: path2[1].x,
      targetY: path2[1].y,
    },
  ];
}

// Плавно поворачиваем текущий угол к целевому (учитывая кратчайший путь)
function approachAngle(current: number, target: number, maxStep: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
}

// Обновление позиции надзирателя вдоль его маршрута.
// Движение и поворот головы — плавные (без дрожания и резких скачков).
export function updateProctor(p: Proctor, dt: number, distractionTarget: { x: number; y: number } | null): void {
  const ANGLE_SPEED = 1.8; // рад/сек — скорость плавного поворота головы

  if (distractionTarget) {
    const dx = distractionTarget.x - p.x;
    const dy = distractionTarget.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.15) {
      // Стоим у студента, смотрим на него (от игрока)
      p.targetAngle = Math.atan2(-(dy || 0.01), -(dx || 0.01));
    } else {
      const step = p.speed * dt * 1.3;
      const move = Math.min(step, dist);
      p.x += (dx / dist) * move;
      p.y += (dy / dist) * move;
      p.targetAngle = Math.atan2(dy, dx);
    }
    p.angle = approachAngle(p.angle, p.targetAngle, ANGLE_SPEED * dt);
    return;
  }

  // Режим "осмотра" — стоит на месте и плавно поворачивает голову
  if (p.lookTimer > 0) {
    p.lookTimer -= dt;
    p.angle = approachAngle(p.angle, p.targetAngle, ANGLE_SPEED * dt);
    return;
  }

  const dx = p.targetX - p.x;
  const dy = p.targetY - p.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 0.15) {
    // Достигли точки маршрута
    const shouldLookAround = Math.random() < 0.45;
    p.pathIndex = (p.pathIndex + 1) % p.path.length;
    p.targetX = p.path[p.pathIndex].x;
    p.targetY = p.path[p.pathIndex].y;
    if (shouldLookAround) {
      // Останавливаемся на 1.5-3 сек и плавно поворачиваемся в случайную сторону
      p.lookTimer = 1.5 + Math.random() * 1.5;
      p.targetAngle = Math.random() * Math.PI * 2;
    }
  } else {
    const step = p.speed * dt;
    const move = Math.min(step, dist);
    p.x += (dx / dist) * move;
    p.y += (dy / dist) * move;
    // Цель поворота — направление движения, голова доворачивается плавно
    p.targetAngle = Math.atan2(dy, dx);
    p.angle = approachAngle(p.angle, p.targetAngle, ANGLE_SPEED * dt);
  }
}

// Проверка: игрок в конусе видимости надзирателя?
export function isPlayerInVision(
  proctorX: number, proctorY: number, proctorAngle: number,
  playerX: number, playerY: number, range: number, fov: number
): boolean {
  const dx = playerX - proctorX;
  const dy = playerY - proctorY;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  const angleToPlayer = Math.atan2(dy, dx);
  let diff = angleToPlayer - proctorAngle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) < fov / 2;
}

// Определяет направление на надзирателя относительно игрока
export function getDirectionToPlayer(
  proctorX: number, proctorY: number, playerX: number, playerY: number
): 'top' | 'bottom' | 'left' | 'right' {
  const dx = proctorX - playerX;
  const dy = proctorY - playerY;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  // В нашей системе игрок смотрит на "доску" (уменьшение Y = верх)
  return dy < 0 ? 'top' : 'bottom';
}

// Проверка: надзиратель смотрит прямо на игрока (более узкий конус)
export function isProctorLookingDirectlyAt(
  proctorX: number, proctorY: number, proctorAngle: number,
  playerX: number, playerY: number, range: number
): boolean {
  const dx = playerX - proctorX;
  const dy = playerY - proctorY;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  const angleToPlayer = Math.atan2(dy, dx);
  let diff = angleToPlayer - proctorAngle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  // Узкий конус ~40 градусов
  return Math.abs(diff) < 0.35;
}
