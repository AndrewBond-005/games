// src/games/types.ts
export interface GameProps {
    onExit?: () => void;      // Выход в меню
    onComplete?: (score: number) => void; // Если нужен счёт
}

export interface GameModule {
    default: React.ComponentType<GameProps>;
    metadata: GameMetadata;
}

export interface GameMetadata {
    id: string;
    title: string;
    description: string;
    icon: string;
    thumbnail?: string;
    version: string;
}