// src/config/games.ts
import type { GameMetadata } from '@/games/types';

export const GAMES_CONFIG: GameMetadata[] = [
    {
        id: 'exam',
        title: 'Экзамен: списать и не попасться',
        description: 'Спиши ответы, пока надзиратели не заметили',
        icon: '🎓',
        version: '1.0.0'
    },
    {
        id: 'exam2',  // 👈 ТОТ ЖЕ ID, ЧТО И У ПЕРВОЙ
        title: 'Экзамен (копия)',
        description: 'Та же самая игра',
        icon: '🎮',
        version: '1.0.0'
    }
];