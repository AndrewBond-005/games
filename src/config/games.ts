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
    },
    {
            id: "student-rpg",
            title: "Отчислись",
            description: "RPG-квест: балансируй между учёбой, ментальным здоровьем и социальным положением. Сдай задания и останься в универе",
            icon: "📚",
            version: "0.0.0"
    },
    {
            id: "dev-simulator",
            title: "Симулятор Gamedev-разработчика",
            description: "Пинай разработчиков, управляй командой и выпускай игры в срок",
            icon: "👨‍💻",
            version: "0.0.0"
    },
    {
            id: "endless-runner",
            title: "Не опоздай на экз",
            description: "Беги на экзамен через город, не нарушай законы и не урони ноутбук",
            icon: "🏃",
            version: "0.0.0"
    },
    {
            id: "squirrel",
            title: "Джесси, ты белка-летяга",
            description: "Прыгай по веткам дерева - весело же. Собирай монетки и не падай",
            icon: "🐿️",
            version: "0.0.0"
    },
    {
            id: "min-messenger",
            title: "Мессенджер МИН",
            description: "Общайся, отправляй мемы и не потеряй связь с друзьями",
            icon: "💬",
            version: "0.0.0"
    },
    {
            id: "polytrack",
            title: "Машинки",
            description: "Гонки на время: пройди трассу быстрее всех",
            icon: "🏎️",
            version: "0.0.0"
    },
    {
        id: "incel-simulator",
        title: "Симулятор инцела",
        description: "Избегай ж*нщин, доберись до друзей и выиграй в задротскую игру",
        icon: "🎮",
        version: "0.0.0"
    }
];