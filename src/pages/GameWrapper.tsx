import React from 'react';
import { Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';

const gamesComponents = {
    'exam': lazy(() => import('@/games/exam')),
    'exam2': lazy(() => import('@/games/exam2')),  // 👈 ДОБАВИТЬ
} as const;

export function GameWrapper() {
    const { gameId } = useParams();

    if (!gameId || !(gameId in gamesComponents)) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-4xl mb-4">😕 Игра не найдена</h1>
                    <a href="/" className="text-blue-400 underline">Вернуться в меню</a>
                </div>
            </div>
        );
    }

    const GameComponent = gamesComponents[gameId as keyof typeof gamesComponents];

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center text-white text-xl">
                Загрузка игры...
            </div>
        }>
            <GameComponent />
        </Suspense>
    );
}