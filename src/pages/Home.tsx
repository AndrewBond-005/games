// src/pages/Home.tsx
import { Link } from 'react-router-dom';
import { GAMES_CONFIG } from '@/config/games';
import { useEffect, useState, useRef, useMemo } from 'react';
import React from 'react';

// ===== НАСТРОЙКИ АНИМАЦИЙ =====
const ANIMATION_CONFIG = {
    // Плавность курсора (меньше = плавнее, но медленнее)
    CURSOR_SMOOTHING: 1,      // 0.02 — очень плавно, 0.15 — отзывчиво

    // Эффекты при движении мыши
    PARALLAX_STRENGTH: 0.0,      // 0 — выкл, 0.05 — умеренно, 0.1 — сильно
    PARALLAX_SMOOTHING: 0.0,     // Плавность параллакса

    // Эффекты при скролле
    SCROLL_PARALLAX_STRENGTH: 0.0, // Наклон сетки при скролле

    // Звёзды
    STAR_COUNT: 450,               // Количество звёзд (100-300)
    STAR_ANIMATION_SPEED: 2,       // Скорость мерцания (секунды)

    // Орбы
    ORB_PULSE_SPEED: 15,            // Скорость пульсации

    // Карточки
    CARD_HOVER_SCALE: 1.1,        // Увеличение карточки (1.02-1.05)
    CARD_TRANSITION_SPEED: 400,    // Скорость анимации (300-500 мс)

};

export function Home() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [targetMousePos, setTargetMousePos] = useState({ x: 0, y: 0 });
    const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
    const [scrollY, setScrollY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);

    // 🔥 ИСПРАВЛЕНО: звёзды генерируются ОДИН РАЗ при монтировании через useMemo
    const stars = useMemo(() => {
        return [...Array(ANIMATION_CONFIG.STAR_COUNT)].map((_, i) => ({
            id: i,
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            left: Math.random() * 100,
            top: Math.random() * 100,
            opacity: Math.random() * 0.4 + 0.1,
            animationDelay: Math.random() * 5,
            animationDuration: Math.random() * 2 + ANIMATION_CONFIG.STAR_ANIMATION_SPEED,
        }));
    }, []);

    useEffect(() => {
        let lastTime = performance.now();

        const handleMouseMove = (e: MouseEvent) => {
            setTargetMousePos({ x: e.clientX, y: e.clientY });
        };

        const animate = () => {
            const now = performance.now();
            const dt = Math.min(0.033, (now - lastTime) / 1000);
            lastTime = now;

            setMousePosition(prev => ({
                x: prev.x + (targetMousePos.x - prev.x) * ANIMATION_CONFIG.CURSOR_SMOOTHING,
                y: prev.y + (targetMousePos.y - prev.y) * ANIMATION_CONFIG.CURSOR_SMOOTHING,
            }));

            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const targetParallaxX = (targetMousePos.x - centerX) * ANIMATION_CONFIG.PARALLAX_STRENGTH;
            const targetParallaxY = (targetMousePos.y - centerY) * ANIMATION_CONFIG.PARALLAX_STRENGTH;

            setParallaxOffset(prev => ({
                x: prev.x + (targetParallaxX - prev.x) * ANIMATION_CONFIG.PARALLAX_SMOOTHING,
                y: prev.y + (targetParallaxY - prev.y) * ANIMATION_CONFIG.PARALLAX_SMOOTHING,
            }));

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', handleMouseMove);
        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [targetMousePos]);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div ref={containerRef} className="min-h-screen bg-black relative overflow-x-hidden">
            {/* ===== ФОН С ПАРАЛЛАКСОМ ===== */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-black to-black"></div>

                {/* 🔥 ИСПРАВЛЕНО: звёзды используют фиксированный массив, а не random при каждом рендере */}
                {stars.map((star) => (
                    <div
                        key={star.id}
                        className="absolute bg-white rounded-full animate-twinkle"
                        style={{
                            width: `${star.width}px`,
                            height: `${star.height}px`,
                            left: `${star.left}%`,
                            top: `${star.top}%`,
                            opacity: star.opacity,
                            animationDelay: `${star.animationDelay}s`,
                            animationDuration: `${star.animationDuration}s`,
                        }}
                    />
                ))}

                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, rgba(139, 92, 246, 0.08) 0px, rgba(139, 92, 246, 0.08) 1px, transparent 1px, transparent 50px),
                                         repeating-linear-gradient(90deg, rgba(139, 92, 246, 0.08) 0px, rgba(139, 92, 246, 0.08) 1px, transparent 1px, transparent 50px)`,
                        transform: `perspective(800px) rotateX(${scrollY * ANIMATION_CONFIG.SCROLL_PARALLAX_STRENGTH}deg)`,
                        transition: 'transform 0.1s ease-out',
                    }}
                />

                <div
                    className="absolute w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-[100px] animate-pulse-slow"
                    style={{
                        left: `${10 + parallaxOffset.x * 0.5}%`,
                        top: `${20 + parallaxOffset.y * 0.3}%`,
                        animationDuration: `${ANIMATION_CONFIG.ORB_PULSE_SPEED}s`,
                    }}
                />
                <div
                    className="absolute w-[600px] h-[600px] rounded-full bg-pink-500/15 blur-[120px] animate-pulse-slow animation-delay-2000"
                    style={{
                        right: `${5 - parallaxOffset.x * 0.3}%`,
                        bottom: `${10 - parallaxOffset.y * 0.2}%`,
                        animationDuration: `${ANIMATION_CONFIG.ORB_PULSE_SPEED}s`,
                    }}
                />
                <div
                    className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/15 blur-[90px] animate-pulse-slow animation-delay-4000"
                    style={{
                        left: `${40 + parallaxOffset.x * 0.2}%`,
                        top: `${60 + parallaxOffset.y * 0.1}%`,
                        animationDuration: `${ANIMATION_CONFIG.ORB_PULSE_SPEED + 1}s`,
                    }}
                />

                <div
                    className="absolute rounded-full bg-gradient-to-r from-purple-500/8 to-pink-500/8 blur-3xl pointer-events-none will-change-transform"
                    style={{
                        width: '500px',
                        height: '500px',
                        transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
                        transition: 'transform 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
                    }}
                />
            </div>

            {/* ===== HEADER (уменьшен) ===== */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="text-2xl animate-pulse group-hover:animate-spin transition-all duration-300">🎮</div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                                Game Portal
                            </h1>
                            <p className="text-[10px] text-slate-400">Ваша игровая вселенная</p>
                        </div>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-4">
                        {['Игры', 'Рейтинг', 'Достижения', 'О нас'].map((item) => (
                            <a key={item} href="#" className="text-slate-300 hover:text-white transition-colors text-sm relative group">
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-300 group-hover:w-full"></span>
                            </a>
                        ))}
                        <button className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold text-sm hover:shadow-md hover:shadow-purple-500/50 transition-all hover:scale-105">
                            Войти
                        </button>
                    </nav>
                </div>
            </header>

            {/* ===== MAIN CONTENT (уменьшен) ===== */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
                {/* Hero секция — УМЕНЬШЕНА */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <div className="inline-block mb-2">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full"></div>
                            <div className="relative text-6xl md:text-7xl animate-float">🎮✨</div>
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                            Добро пожаловать
                        </span>
                    </h1>

                    <p className="text-sm md:text-base text-slate-300 mb-4 max-w-2xl mx-auto">
                        В твою персональную вселенную игр. Выбирай, играй, побеждай!
                    </p>

                    {/* Статистика — уменьшена */}
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-4">
                        {[
                            { value: GAMES_CONFIG.length, label: 'Игр доступно', icon: '🎯', color: 'purple' },
                            { value: '∞', label: 'Часов веселья', icon: '⏰', color: 'pink' },
                            { value: '24/7', label: 'Круглосуточно', icon: '🌟', color: 'yellow' },
                        ].map((stat, idx) => (
                            <div key={idx} className="text-center animate-fade-in-up" style={{ animationDelay: `${idx * 150}ms` }}>
                                <div className={`text-2xl font-bold bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 bg-clip-text text-transparent`}>
                                    {stat.value}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 justify-center">
                                    <span>{stat.icon}</span> {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Сетка игр — УМЕНЬШЕНЫ КАРТОЧКИ */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                    {GAMES_CONFIG.map((game, index) => (
                        <Link
                            key={game.id}
                            to={`/game/${game.id}`}
                            className="group relative animate-fade-in-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div
                                className="relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl rounded-xl p-4 border border-white/10 overflow-hidden"
                                style={{
                                    transition: `all ${ANIMATION_CONFIG.CARD_TRANSITION_SPEED}ms cubic-bezier(0.2, 0.9, 0.4, 1.1)`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = `scale(${ANIMATION_CONFIG.CARD_HOVER_SCALE})`;
                                    e.currentTarget.style.boxShadow = '0 15px 30px -10px rgba(139, 92, 246, 0.25)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '';
                                }}
                            >
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                    <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-xl blur-md"></div>
                                </div>

                                {index === 0 && (
                                    <div className="absolute top-2 right-2 z-20">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-yellow-500/50 blur-md rounded-full"></div>
                                            <div className="relative px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-[10px] font-bold text-white shadow-lg animate-pulse">
                                                🔥 NEW!
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="relative z-10">
                                    <div className="relative inline-block mb-2">
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <div className="relative text-4xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 group-hover:animate-bounce">
                                            {game.icon}
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-white mb-1 group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                                        {game.title}
                                    </h2>

                                    <p className="text-slate-300 mb-3 leading-relaxed line-clamp-2 text-xs">
                                        {game.description}
                                    </p>

                                    <div className="flex items-center justify-between flex-wrap gap-1">
                                        <div className="flex gap-1 flex-wrap">
                                            <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-[9px] text-purple-300 backdrop-blur-sm">
                                                🎯 Экзамен
                                            </span>
                                            <span className="px-2 py-0.5 bg-pink-500/20 border border-pink-500/30 rounded-full text-[9px] text-pink-300 backdrop-blur-sm">
                                                ⭐ Popular
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono bg-black/30 px-1.5 py-0.5 rounded">
                                            v{game.version}
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <span className="text-purple-400 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                            Начать игру
                                            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                        <div className="text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">✨</div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* CTA Блок — УМЕНЬШЕН */}
                <div className="relative mt-8 mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-3xl"></div>
                    <div className="relative bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-2xl rounded-xl p-6 text-center border border-white/20">
                        <div className="inline-block mb-2">
                            <div className="text-5xl animate-float">🚀</div>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Готов к приключениям?
                        </h3>
                        <p className="text-slate-300 mb-4 text-sm max-w-2xl mx-auto">
                            Присоединяйся к сообществу игроков и начни своё путешествие уже сегодня!
                        </p>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-bold text-sm hover:shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105 inline-flex items-center gap-2"
                        >
                            <span>Выбрать игру</span>
                            <span>👇</span>
                        </button>
                    </div>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="relative z-10 mt-8 backdrop-blur-xl bg-black/30 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="text-2xl">🎮</div>
                                <div>
                                    <h4 className="text-white font-bold text-base">Game Portal</h4>
                                    <p className="text-slate-400 text-[10px]">Твоя игровая вселенная</p>
                                </div>
                            </div>
                            <p className="text-slate-400 text-xs max-w-md">
                                Погрузись в мир увлекательных игр, соревнуйся с друзьями и становись лучшим!
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-bold text-sm mb-2">Быстрые ссылки</h4>
                            <ul className="space-y-1 text-xs">
                                <li><a href="#" className="text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-1">✨ Популярные игры</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-1">🏆 Рейтинги</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-1">🎯 Достижения</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold text-sm mb-2">Поддержка</h4>
                            <ul className="space-y-1 text-xs">
                                <li><a href="#" className="text-slate-400 hover:text-purple-400 transition-colors">FAQ</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-purple-400 transition-colors">Контакты</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-purple-400 transition-colors">Сообщить о баге</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-2 text-center text-slate-400 text-[10px]">
                        <p>© 2024 Game Portal. Сделано с ❤️ для геймеров</p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-purple-400 transition-colors">Политика конфиденциальности</a>
                            <a href="#" className="hover:text-purple-400 transition-colors">Условия использования</a>
                        </div>
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.1; }
                    50% { opacity: 0.6; }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.12; transform: scale(1); }
                    50% { opacity: 0.22; transform: scale(1.05); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; opacity: 0; }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-gradient { background-size: 200% auto; animation: gradient 3s linear infinite; }
                .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}