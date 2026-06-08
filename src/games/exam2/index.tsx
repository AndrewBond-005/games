// src/games/exam/index.tsx
import React from 'react';
import OriginalApp from './src/App';

// Оборачиваем компонент, игнорируя пропсы
export default function ExamGameWrapper(props: any) {
    // Игнорируем все пропсы, которые передаёт GameWrapper
    return <OriginalApp />;
}

export const metadata = {
    id: 'exam2',
    title: 'Экзамен2',
    description: 'Спиши ответы, пока надзиратели не заметили',
    icon: '🎓',
    version: '1.0.0'
};