// src/pages/Home.tsx
import { Link } from 'react-router-dom';
import { GAMES_CONFIG } from '@/config/games';
import React from 'react';

export function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
            <h1 className="text-5xl font-bold text-center text-white mb-12">
                🎮 Портфель игр
            </h1>
            <div className="bg-red-500 text-white p-4">
                Если этот блок красный — Tailwind работает!
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {GAMES_CONFIG.map(game => (
                    <Link
                        key={game.id}
                        to={`/game/${game.id}`}
                        className="group bg-white/10 backdrop-blur rounded-2xl p-6 hover:bg-white/20 transition-all hover:scale-105"
                    >
                        <div className="text-6xl mb-4">{game.icon}</div>
                        <h2 className="text-2xl font-bold text-white mb-2">{game.title}</h2>
                        <p className="text-slate-300">{game.description}</p>
                        <div className="mt-4 text-sm text-slate-400">v{game.version}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}