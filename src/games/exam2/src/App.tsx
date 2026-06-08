import { useState, useRef, useEffect } from 'react';
import type { Pocket } from './game/types';
import PrepScreen from './components/PrepScreen';
import ExamScreen from './components/ExamScreen';

type Screen = 'title' | 'prep' | 'exam' | 'end';

interface EndInfo {
  result: 'win' | 'lose';
  reason: string;
  stats: { completed: number; examTime: number };
}

function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [endInfo, setEndInfo] = useState<EndInfo | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const handleStartPrep = () => setScreen('prep');

  const handleStartExam = (p: Pocket[]) => {
    setPockets(p);
    setGameKey((k) => k + 1);
    setScreen('exam');
  };

  const handleEnd = (result: 'win' | 'lose', reason: string, examTime: number, completed: number) => {
    setEndInfo({ result, reason, stats: { completed, examTime } });
    setScreen('end');
  };

  const handleNewGame = () => {
    setEndInfo(null);
    setScreen('title');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-900">
      {screen === 'title' && <TitleScreen onStart={handleStartPrep} />}
      {screen === 'prep' && <PrepScreen onStart={handleStartExam} />}
      {screen === 'exam' && (
        <ExamScreen key={gameKey} initialPockets={pockets} onEnd={handleEnd} />
      )}
      {screen === 'end' && endInfo && (
        <EndScreen info={endInfo} onNewGame={handleNewGame} />
      )}
    </div>
  );
}

function TitleScreen({ onStart }: { onStart: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // ---- ОГРОМНЫЙ НАБОР СИМВОЛОВ (более 150 уникальных) ----
    const symbols = [
      // Математика
      '∫', '∑', 'π', '√', '∞', '∂', 'Δ', 'θ', 'λ', 'μ', 'σ', 'ω', '≈', '≠', '≤', '≥', '→', '∀', '∃', '∅',
      'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'ι', 'κ', 'ν', 'ξ', 'ο', 'ρ', 'τ', 'υ', 'φ', 'χ', 'ψ',
      '∇', '∈', '∉', '⊂', '⊃', '∩', '∪', '⊗', '⊕', '⊻', '∮', '∯', '∰', '∝', '∠', '⊥', '∥', '∴', '∵', '∼', '≅', '≡', '≪', '≫',
      // Греческие заглавные
      'Γ', 'Δ', 'Θ', 'Λ', 'Ξ', 'Π', 'Σ', 'Φ', 'Ψ', 'Ω',
      // Уравнения
      'E=mc²', 'F=ma', 'E=hν', 'PV=nRT', 'a²+b²=c²', 'e^{iπ}+1=0', '∫eˣdx=eˣ+C',
      'sin²θ+cos²θ=1', 'ΔxΔp≥ħ/2', '∮F·ds=0', '∇·E=ρ/ε₀', '∇×B=μ₀J',
      'x=(-b±√Δ)/2a', '∑1/n²=π²/6', 'e=lim(1+1/n)ⁿ', 'ln(ab)=ln a+ln b',
      'd/dx x²=2x', '∂²ψ/∂x²', '∫∫∫div F dV', '∬F·dS',
      // Ещё символы
      '√', '∛', '∜', '∫∫', '∮', '⊕', '⊗', '⊙', '⊖', '⊘', '⨀', '⨁', '⨂',
      '≠', '≈', '≡', '≢', '≣', '≤', '≥', '≦', '≧', '≨', '≩', '⋘', '⋙',
    ];

    // ---- ПЛАВАЮЩИЕ СИМВОЛЫ (300 штук!) ----
    const floatingSymbols: {
      x: number; y: number; text: string; size: number; speedX: number; speedY: number; alpha: number; rot: number; rotSpeed: number;
    }[] = [];
    for (let i = 0; i < 500; i++) {
      floatingSymbols.push({
        x: Math.random() * width,
        y: Math.random() * height,
        text: symbols[Math.floor(Math.random() * symbols.length)],
        size: Math.random() * 36 + 12,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.2 + (Math.random() > 0.7 ? 0.1 : -0.05),
        alpha: Math.random() * 0.25 + 0.05,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
      });
    }

    // ---- ЧАСТИЦЫ (300 мерцающих точек) ----
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; pulseSpeed: number }[] = [];
    for (let i = 0; i < 1000; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.6 + 0.1,
        pulseSpeed: Math.random() * 0.03 + 0.01,
      });
    }

    // ---- ЗВЁЗДЫ (500 штук для глубины) ----
    const stars: { x: number; y: number; size: number; baseBrightness: number; twinkleSpeed: number }[] = [];
    for (let i = 0; i < 5000; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        baseBrightness: Math.random() * 0.5 + 0.1,
        twinkleSpeed: Math.random() * 0.05 + 0.01,
      });
    }

    // ---- ЛИНИИ СЕТКИ (для текстуры) ----
    const gridLines: { x1: number; y1: number; x2: number; y2: number; alpha: number }[] = [];
    for (let i = 0; i < 400; i++) {
      gridLines.push({
        x1: Math.random() * width,
        y1: Math.random() * height,
        x2: Math.random() * width,
        y2: Math.random() * height,
        alpha: Math.random() * 0.15 + 0.01,
      });
    }

    let time = 0;
    let animationId: number;

    const animate = () => {
      // Обновляем размеры при изменении окна
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        width = canvas.width;
        height = canvas.height;
      }

      time += 0.008;

      // ---- ФОН: сложный градиент ----
      const grad = ctx.createLinearGradient(0, 0, width * 0.7, height);
      grad.addColorStop(0, '#070714');
      grad.addColorStop(0.3, '#0f0f22');
      grad.addColorStop(0.7, '#151530');
      grad.addColorStop(1, '#0a0a18');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // ---- ВТОРИЧНЫЙ ГРАДИЕНТ (эффект свечения в центре) ----
      const radialGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.6);
      radialGrad.addColorStop(0, 'rgba(80, 50, 20, 0.15)');
      radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // ---- СЕТКА (медленно пульсирует) ----
      for (let line of gridLines) {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.strokeStyle = `rgba(255, 180, 80, ${line.alpha + Math.sin(time) * 0.05})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // ---- ЗВЁЗДЫ (мерцают) ----
      for (let star of stars) {
        const brightness = star.baseBrightness + Math.sin(time * star.twinkleSpeed * 10) * 0.25;
        ctx.fillStyle = `rgba(255, 240, 180, ${brightness * 0.9})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }

      // ---- ЧАСТИЦЫ (движутся и пульсируют) ----
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;
        if (p.y < -50) p.y = height + 50;
        if (p.y > height + 50) p.y = -50;

        const pulse = Math.sin(time * p.pulseSpeed * 20) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 200, 100, ${p.alpha * pulse})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- ПЛАВАЮЩИЕ СИМВОЛЫ (главная фишка) ----
      for (let s of floatingSymbols) {
        s.x += s.speedX;
        s.y += s.speedY;
        s.rot += s.rotSpeed;
        if (s.x < -100) s.x = width + 100;
        if (s.x > width + 100) s.x = -100;
        if (s.y < -100) s.y = height + 100;
        if (s.y > height + 100) s.y = -100;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.fillStyle = `rgba(255, 210, 120, ${s.alpha + Math.sin(time * 2 + s.x * 0.02) * 0.07})`;
        ctx.font = `${s.size}px "Segoe UI", "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.text, 0, 0);
        ctx.restore();
      }

      // ---- ДОПОЛНИТЕЛЬНЫЙ СЛОЙ: крупные полупрозрачные символы (для глубины) ----
      for (let i = 0; i < 50; i++) {
        const t = (time * 0.3 + i) % (Math.PI * 2);
        const x = width * (0.2 + Math.sin(t) * 0.15);
        const y = height * (0.3 + Math.cos(t * 0.7) * 0.2);
        ctx.fillStyle = `rgba(180, 140, 80, 0.04)`;
        ctx.font = `${Math.sin(time + i) * 20 + 50}px "Segoe UI", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(symbols[i % symbols.length], x, y);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      width = canvas.width;
      height = canvas.height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
      <>
        <canvas
            ref={canvasRef}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 0,
              display: 'block',
            }}
        />

        <div className="relative min-h-screen flex items-center justify-center overflow-hidden text-white p-6" style={{ zIndex: 1, position: 'relative' }}>
          <div className="max-w-3xl text-center">
            <div className="text-8xl mb-6 animate-bounce">🎓</div>
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-2xl">
              Экзамен
            </h1>
            <h2 className="text-3xl text-amber-200 mb-8">Списать и не попасться</h2>

            <div className="bg-slate-800/60 backdrop-blur border-2 border-amber-600 rounded-2xl p-6 mb-8 text-left">
              <h3 className="text-xl font-bold text-amber-300 mb-3">📜 Как играть:</h3>
              <ul className="space-y-2 text-slate-200">
                <li>😞 <b>не поступайте в итмо и всё у вас будет хорошо</b></li>
                <li>🎯 <b>Цель:</b> списать все 5 вопросов за 180 секунд</li>
                <li>📦 <b>Подготовка:</b> разложи 8 шпор по 3 карманам с умом</li>
                <li>👀 <b>Надзиратели:</b> следи за индикаторами в центре сверху</li>
                <li>📝 <b>Режимы:</b> на парте (быстро), на коленях (средне), телефон (медленно)</li>
                <li>🫣 <b>Осторожно:</b> на парте жми "СПРЯТАТЬ" когда надзиратель рядом!</li>
                <li>🤝 <b>Друг:</b> один раз за игру поможет (но не если надзиратель видит!)</li>
                <li>📱 <b>Вопрос без шпоры:</b> его можно ответить только по телефону</li>
                <li>🎉 <b>Отвлечение:</b> когда студент поднимает руку — списывай смело!</li>
                <li>🟥 <b>Красный индикатор</b> = надзиратель смотрит прямо на тебя</li>
              </ul>
            </div>

            <button
                onClick={onStart}
                className="px-12 py-5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 rounded-2xl font-bold text-3xl shadow-2xl shadow-amber-500/50 hover:scale-105 transition-all"
            >
              🎮 НАЧАТЬ ИГРУ
            </button>
          </div>
        </div>
      </>
  );
}


function EndScreen({ info, onNewGame }: { info: EndInfo; onNewGame: () => void }) {
  const isWin = info.result === 'win';
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className={`max-w-2xl text-center p-12 rounded-3xl border-4 ${isWin ? 'bg-emerald-900/60 border-emerald-400' : 'bg-red-900/60 border-red-500'}`}>
        <div className="text-9xl mb-4">{isWin ? '🎓' : '😱'}</div>
        <h1 className="text-6xl font-bold mb-4">{isWin ? 'ПОБЕДА!' : 'ПОПАЛСЯ!'}</h1>
        <p className="text-2xl mb-6">{info.reason}</p>
        <div className="bg-black/40 rounded-2xl p-6 mb-6 inline-block">
          <div className="text-xl">Списано вопросов: <b className="text-3xl text-amber-300">{info.stats.completed}/5</b></div>
          <div className="text-xl mt-2">Времени затрачено: <b className="text-3xl text-amber-300">{info.stats.examTime}с</b></div>
        </div>
        <button onClick={onNewGame} className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-bold text-2xl hover:bg-slate-200 shadow-xl">🔄 НОВАЯ ИГРА</button>
      </div>
    </div>
  );
}

export default App;