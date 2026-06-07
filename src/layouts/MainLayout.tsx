import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Шапка с навигацией */}
            <header className="bg-black/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-amber-400 transition">
                        <span>🎮</span>
                        <span className="hidden sm:inline">Game Portal</span>
                    </Link>

                    <nav className="flex gap-4">
                        {!isHomePage && (
                            <Link
                                to="/"
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition flex items-center gap-2"
                            >
                                ← В меню
                            </Link>
                        )}
                        <a
                            href="https://github.com/AndrewBond-005/games"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition flex items-center gap-2"
                        >
                            GitHub
                        </a>
                    </nav>
                </div>
            </header>

            {/* Основной контент */}
            <main className="container mx-auto">
                {children}
            </main>

            {/* Подвал */}
            <footer className="text-center py-6 text-slate-500 text-sm border-t border-white/10 mt-auto">
                <p>🎮 Game Portal | Создано с ❤️ для экзаменов и развлечений</p>
            </footer>
        </div>
    );
}