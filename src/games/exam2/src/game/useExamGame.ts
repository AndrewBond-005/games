import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, Indicator, Pocket } from './types';
import {
  DISTRACTION_DURATION,
  DISTRACTION_MAX_INTERVAL,
  DISTRACTION_MIN_INTERVAL,
  EXAM_DURATION,
  PLAYER_X,
  PLAYER_Y,
  PROCTOR_VISION_ANGLE,
  PROCTOR_VISION_RANGE,
  TOTAL_QUESTIONS,
  WIN_THRESHOLD,
  WRITE_SPEED_DESK,
  WRITE_SPEED_LAP,
  WRITE_SPEED_PHONE,
} from './constants';
import {
  createProctors,
  generateQuestions,
  getDirectionToPlayer,
  isPlayerInVision,
  isProctorLookingDirectlyAt,
  randRange,
  updateProctor,
} from './utils';

export function useExamGame(initialPockets: Pocket[]) {
  const [state, setState] = useState<GameState>(() => ({
    phase: 'exam',
    timeLeft: EXAM_DURATION,
    pockets: initialPockets,
    questions: generateQuestions(),
    completedCount: 0,
    activeSheet: null,
    activeQuestion: null,
    cheatingMode: null,
    sheetOnDesk: false,
    sheetHidden: false,
    sheetRevealedId: null,
    writingActive: false,
    friendUsed: false,
    friendMessage: '',
    friendHelpActive: false,
    distraction: { active: false, timeLeft: 0, studentIndex: -1 },
    proctors: createProctors(),
    lastDistraction: 0,
    nextDistractionIn: randRange(DISTRACTION_MIN_INTERVAL, DISTRACTION_MAX_INTERVAL),
    loseReason: '',
    phoneActive: false,
  }));

  // Ref для игрового цикла (избегаем лишних ререндеров)
  const stateRef = useRef(state);
  stateRef.current = state;

  const lastTimeRef = useRef<number>(performance.now());

  // Игровой цикл
  useEffect(() => {
    if (state.phase !== 'exam') return;

    let animId: number;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;
      update(dt);
      animId = requestAnimationFrame(loop);
    };
    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const update = useCallback((dt: number) => {
    setState((prev) => {
      if (prev.phase !== 'exam') return prev;

      const next = { ...prev };
      next.proctors = prev.proctors.map((p) => ({ ...p }));
      next.questions = prev.questions.map((q) => ({ ...q }));

      // Обновление таймера
      next.timeLeft = Math.max(0, prev.timeLeft - dt);

      // Победа только если списаны ВСЕ 5 вопросов (игра продолжается после 3)
      if (next.completedCount >= TOTAL_QUESTIONS) {
        return { ...next, phase: 'win' };
      }

      // Проверка окончания времени
      if (next.timeLeft <= 0) {
        // Если списано >= 3 — победа, иначе поражение
        if (next.completedCount >= WIN_THRESHOLD) {
          return { ...next, phase: 'win' };
        }
        return {
          ...next,
          phase: 'lose',
          loseReason: `Время вышло! Списано только ${next.completedCount}/5 вопросов (нужно минимум ${WIN_THRESHOLD}).`,
        };
      }

      // Обновление отвлечения
      if (prev.distraction.active) {
        const newTime = prev.distraction.timeLeft - dt;
        if (newTime <= 0) {
          next.distraction = { active: false, timeLeft: 0, studentIndex: -1 };
          next.lastDistraction = 0;
          next.nextDistractionIn = randRange(
            DISTRACTION_MIN_INTERVAL,
            DISTRACTION_MAX_INTERVAL
          );
        } else {
          next.distraction = { ...prev.distraction, timeLeft: newTime };
        }
      } else {
        // Счётчик до следующего отвлечения
        next.nextDistractionIn = prev.nextDistractionIn - dt;
        if (next.nextDistractionIn <= 0) {
          // Запускаем отвлечение
          next.distraction = {
            active: true,
            timeLeft: DISTRACTION_DURATION,
            studentIndex: Math.floor(Math.random() * 8),
          };
        }
      }

      // Цель отвлечения для надзирателей (к случайному студенту)
      const distractionTarget = next.distraction.active
        ? getDistractionTarget(next.distraction.studentIndex)
        : null;

      // Обновление позиций надзирателей
      for (const p of next.proctors) {
        updateProctor(p, dt, distractionTarget);
      }

      // Проверка безопасности: находится ли игрок в чьей-то зоне видимости
      const isSafe = next.distraction.active; // во время отвлечения — безопасно

      let anyLooking = false;
      let anyDirectLook = false;
      for (const p of next.proctors) {
        if (isPlayerInVision(p.x, p.y, p.angle, PLAYER_X, PLAYER_Y, PROCTOR_VISION_RANGE, PROCTOR_VISION_ANGLE)) {
          anyLooking = true;
          if (isProctorLookingDirectlyAt(p.x, p.y, p.angle, PLAYER_X, PLAYER_Y, PROCTOR_VISION_RANGE)) {
            anyDirectLook = true;
          }
        }
      }

      // Проверка проигрыша
      if (!isSafe) {
        const headDown = prev.cheatingMode === 'lap' || prev.cheatingMode === 'phone';
        if (headDown && anyLooking) {
          return {
            ...next,
            phase: 'lose',
            loseReason: 'Попался! Преподаватель заметил твою опущенную голову.',
          };
        }
        // Шпора на парте видима + надзиратель смотрит прямо
        if (prev.cheatingMode === 'desk' && prev.sheetOnDesk && !prev.sheetHidden && anyDirectLook) {
          return {
            ...next,
            phase: 'lose',
            loseReason: 'Попался! Надзиратель увидел шпору на парте.',
          };
        }
      }

      // Прогресс написания
      // Для режима "desk" пишем только если writingActive (игрок начал отдельным кликом)
      // Для "lap" и "phone" пишем сразу (голова опущена = списываем)
      const isWriting =
        prev.cheatingMode === 'desk' ? prev.writingActive : prev.cheatingMode !== null;
      
      // Помощь друга тоже имеет "время" (5 сек на списывание)
      if (prev.friendHelpActive && prev.activeQuestion !== null) {
        const q = next.questions[prev.activeQuestion];
        if (q && !q.completed) {
          const FRIEND_SPEED = 20; // быстро списывает друг
          q.progressFromCorrectSheet = Math.min(100, q.progressFromCorrectSheet + FRIEND_SPEED * dt);
          if (
  q.progressFromCorrectSheet >= 100 &&
  !q.completed
) {
  q.completed = true;
  q.correctAnswer = true;

  next.completedCount += 1;

  next.cheatingMode = null;
  next.activeQuestion = null;
  next.activeSheet = null;
  next.phoneActive = false;
  next.sheetOnDesk = false;
  next.sheetHidden = false;
  next.sheetRevealedId = null;
  next.writingActive = false;
}
        }
      }
      
      if (prev.activeQuestion !== null && prev.cheatingMode !== null && isWriting && !prev.friendHelpActive) {
        const q = next.questions[prev.activeQuestion];
        if (q && !q.completed) {
          let speed = 0;
          if (prev.cheatingMode === 'desk') speed = WRITE_SPEED_DESK;
          else if (prev.cheatingMode === 'lap') speed = WRITE_SPEED_LAP;
          else if (prev.cheatingMode === 'phone') speed = WRITE_SPEED_PHONE;

          // Определяем: правильная ли шпора?
          const isCorrectSheet =
            prev.activeSheet &&
            prev.activeSheet.type === q.type &&
            prev.activeSheet.number === q.sheetNum;
          
          const isPhoneUsed = prev.cheatingMode === 'phone';

          // Общий прогресс (видно игроку)
          q.progress = Math.min(100, q.progress + speed * dt);
          
          // Только правильная шпора или телефон добавляют к progressFromCorrectSheet
          if (isCorrectSheet || isPhoneUsed) {
            q.progressFromCorrectSheet = Math.min(100, q.progressFromCorrectSheet + speed * dt);
          }

          // Завершение: только если progressFromCorrectSheet >= 100
          if (q.progressFromCorrectSheet >= 100) {
            q.completed = true;
            q.correctAnswer = true;
            next.completedCount = prev.completedCount + 1;
            // Автоматически выходим из режима
            next.cheatingMode = null;
            next.activeQuestion = null;
            next.activeSheet = null;
            next.phoneActive = false;
            next.sheetOnDesk = false;
            next.sheetHidden = false;
            next.writingActive = false;
            next.sheetRevealedId = null;
          }
        }
      }

      return next;
    });
  }, []);

  // === Действия игрока ===

  // Достать шпору из кармана ВСЛЕПУЮ по FIFO (первым положил — первым достал).
  // Игрок не видит, какую достал — узнает только начав списывать.
  const openPocket = (pocketId: 'left' | 'right' | 'hoodie') => {
    setState((prev) => {
      // Нельзя достать новую, пока в руке уже есть шпора или идёт списывание
      if (prev.activeSheet || prev.cheatingMode) return prev;
      const pocket = prev.pockets.find((p) => p.id === pocketId);
      if (!pocket || pocket.sheets.length === 0) return prev;

      // FIFO: берём первую (индекс 0)
      const sheet = pocket.sheets[0];

      // Удаляем первую шпору из кармана
      const newPockets = prev.pockets.map((p) => {
        if (p.id !== pocketId) return p;
        const newSheets = p.sheets.slice(1); // удалили первую
        return { ...p, sheets: newSheets };
      });

      return {
        ...prev,
        activeSheet: sheet,
        pockets: newPockets,
      };
    });
  };

  const usePhone = () => {
    setState((prev) => {
      if (prev.activeQuestion === null) {
        // Надо сначала выбрать вопрос
        return prev;
      }
      return {
        ...prev,
        cheatingMode: 'phone',
        phoneActive: true,
        writingActive: true,
        sheetOnDesk: false,
        sheetHidden: false,
      };
    });
  };

  const selectQuestion = (qIdx: number) => {
    setState((prev) => {
      if (prev.questions[qIdx].completed) return prev;
      return {
        ...prev,
        activeQuestion: qIdx,
        cheatingMode: null,
        sheetOnDesk: false,
        sheetHidden: false,
        phoneActive: false,
      };
    });
  };

  // Положить шпору на парту: шпора видна, но списывание НЕ начато
  // (надо отдельно нажать "Начать списывать")
const putOnDesk = () => {
  setState((prev) => {
    if (!prev.activeSheet || prev.activeQuestion === null) return prev;
    const indicators = getIndicators();
    const noticed = indicators.some((i) => i.status === 'looking');
    if (noticed) {
      return {
        ...prev,
        phase: 'lose',
        loseReason: 'Надзиратель заметил, как ты положил шпору на стол.',
      };
    }
    return {
      ...prev,
      cheatingMode: 'desk',
      sheetOnDesk: true,
      sheetHidden: false,     // ← шпора видна изначально
      sheetRevealedId: null,
      writingActive: false,
      phoneActive: false,
    };
  });
};

  // Начать списывать на парте (только после putOnDesk). Прячет шпору под лист не нужно —
  // просто запускает прогресс.
  const startWriting = () => {
    setState((prev) => {
      if (prev.cheatingMode !== 'desk') return prev;
      return { ...prev, writingActive: true };
    });
  };

  const putOnLap = () => {
    setState((prev) => {
      if (!prev.activeSheet || prev.activeQuestion === null) return prev;
      return {
        ...prev,
        cheatingMode: 'lap',
        sheetOnDesk: false,
        sheetHidden: false,
        writingActive: true, // на коленях пишем сразу
        phoneActive: false,
      };
    });
  };

  // Узнать какая шпора лежит на столе (после того как спрятали под листом)
  const revealSheet = () => {
    setState((prev) => {
      if (!prev.activeSheet || !prev.sheetOnDesk || !prev.sheetHidden) return prev;
      return { ...prev, sheetRevealedId: prev.activeSheet.id };
    });
  };

  // Спрятать шпору под лист — приостанавливает написание (безопасно)
const hideSheet= () => {
  setState((prev) => {
    if (prev.cheatingMode !== 'desk') return prev;
    return {
      ...prev,
      sheetHidden: true,
      writingActive: false,   // останавливаем списывание, пока шпора спрятана
    };
  });
};
const resumeFromHidden = () => {
  setState((prev) => {
    if (prev.cheatingMode !== 'desk' || !prev.sheetHidden) return prev;
    // Проверка: не смотрит ли надзиратель в момент, когда достаёшь шпору
    const indicators = getIndicators();
    const noticed = indicators.some((i) => i.status === 'looking');
    if (noticed) {
      return {
        ...prev,
        phase: 'lose',
        loseReason: 'Надзиратель заметил, как ты достал шпору из-под листа!',
      };
    }
    return {
      ...prev,
      sheetHidden: false,
      writingActive: true,
    };
  });
};
  // Зачеркнуть вопрос — обнулить прогресс
  const strikeQuestion = (qIdx: number) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIdx ? { ...q, progress: 0, progressFromCorrectSheet: 0 } : q
      ),
    }));
  };

  const stopCheating = () => {
    setState((prev) => {
      // Возвращаем шпору в карман худи (если она есть в руке)
      const returnedSheet = prev.activeSheet;
      const newPockets = returnedSheet
        ? prev.pockets.map((p) =>
            p.id === 'hoodie' ? { ...p, sheets: [...p.sheets, returnedSheet] } : p
          )
        : prev.pockets;
      return {
        ...prev,
        cheatingMode: null,
        activeSheet: null,
        sheetOnDesk: false,
        sheetHidden: false,
        writingActive: false,
        phoneActive: false,
        pockets: newPockets,
      };
    });
  };

  // Сдать экзамен досрочно
  const submitExam = () => {
    setState((prev) => {
      if (prev.completedCount >= WIN_THRESHOLD) {
        return { ...prev, phase: 'win' };
      }
      return {
        ...prev,
        phase: 'lose',
        loseReason: `Ты сдал экзамен досрочно. Списано ${prev.completedCount}/5 вопросов (нужно минимум ${WIN_THRESHOLD}).`,
      };
    });
  };

  const askFriend = () => {
    setState((prev) => {
      if (prev.friendUsed || prev.activeQuestion === null) return prev;
      
      // Проверка: безопасно ли звать друга?
      // Нельзя если надзиратель смотрит (красный индикатор) или очень близко (жёлтый большой)
      const indicators = getIndicators();
      const isUnsafe = indicators.some(
        (ind) => ind.status === 'looking' || (ind.status === 'near' && ind.distance > 0.6)
      );
      
      if (isUnsafe) {
        return {
          ...prev,
          phase: 'lose',
          loseReason: 'Попался! Надзиратель заметил, что ты просишь помощи у друга!',
        };
      }

      // Успешно: друг помогает 5 секунд
      return {
        ...prev,
        friendUsed: true,
        friendHelpActive: true,
        friendMessage: '🤝 Друг помогает... (5 сек)',
        cheatingMode: null, // выходим из текущего режима
        sheetOnDesk: false,
        sheetHidden: false,
        writingActive: false,
        phoneActive: false,
        activeSheet: null,
      };
    });
  };

  const getIndicators = useCallback((): Indicator[] => {
    // Каждый индикатор отражает "ближайшего" надзирателя в этом направлении
    // distance: 0 (далеко) до 1 (очень близко)
    const MAX_DETECT_RANGE = 12;
    const indicators: Indicator[] = [
      { direction: 'top', distance: 0, status: 'none', isPlayerLookingDown: false },
      { direction: 'bottom', distance: 0, status: 'none', isPlayerLookingDown: false },
      { direction: 'left', distance: 0, status: 'none', isPlayerLookingDown: false },
      { direction: 'right', distance: 0, status: 'none', isPlayerLookingDown: false },
    ];

    // Во время отвлечения надзиратели "безопасны" — индикаторы серые
    if (state.distraction.active) {
      for (const p of state.proctors) {
        const dir = getDirectionToPlayer(p.x, p.y, PLAYER_X, PLAYER_Y);
        const dist = Math.hypot(p.x - PLAYER_X, p.y - PLAYER_Y);
        const normDist = Math.max(0.1, 1 - dist / MAX_DETECT_RANGE);
        const ind = indicators.find((i) => i.direction === dir)!;
        if (normDist > ind.distance) ind.distance = normDist;
        // статус остаётся 'none' - безопасно
      }
      return indicators;
    }

    for (const p of state.proctors) {
      const dir = getDirectionToPlayer(p.x, p.y, PLAYER_X, PLAYER_Y);
      const dist = Math.hypot(p.x - PLAYER_X, p.y - PLAYER_Y);
      const normDist = Math.max(0.1, 1 - dist / MAX_DETECT_RANGE);
      const inVision = isPlayerInVision(
        p.x, p.y, p.angle, PLAYER_X, PLAYER_Y,
        PROCTOR_VISION_RANGE, PROCTOR_VISION_ANGLE
      );
      const directLook = isProctorLookingDirectlyAt(
        p.x, p.y, p.angle, PLAYER_X, PLAYER_Y, PROCTOR_VISION_RANGE
      );

      const ind = indicators.find((i) => i.direction === dir)!;
      const newDist = Math.max(ind.distance, normDist);
      let newStatus = ind.status;
      if (directLook) newStatus = 'looking';
      else if (inVision && newStatus !== 'looking') newStatus = 'near';
      ind.distance = newDist;
      ind.status = newStatus;
    }

    return indicators;
  }, [state.proctors, state.distraction.active]);

  return {
    state,
    getIndicators,
    actions: {
      openPocket,
      selectQuestion,
      putOnDesk,
      startWriting,
      putOnLap,
      usePhone,
      resumeFromHidden,
      revealSheet,
      hideSheet,
      strikeQuestion,
      stopCheating,
      submitExam,
      askFriend,
    },
  };
}

function getDistractionTarget(studentIdx: number): { x: number; y: number } {
  const positions = [
    { x: 3, y: 3 }, { x: 3, y: 5 }, { x: 3, y: 7 }, { x: 3, y: 8.5 },
    { x: 7, y: 3 }, { x: 7, y: 5 }, { x: 7, y: 7 }, { x: 7, y: 8.5 },
  ];
  return positions[studentIdx] || positions[0];
}
