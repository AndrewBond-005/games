import { useState } from 'react';
import type { CheatSheet, Pocket } from '../game/types';
import { createAllCheatSheets, createInitialPockets } from '../game/utils';

interface Props {
  onStart: (pockets: Pocket[]) => void;
}

const POCKET_ICONS: Record<string, string> = { left: '👖', right: '👖', hoodie: '🧥' };
const POCKET_LABELS: Record<string, string> = { left: 'Левый карман штанов', right: 'Правый карман штанов', hoodie: 'Карман худи' };

export default function PrepScreen({ onStart }: Props) {
  const [sheets] = useState<CheatSheet[]>(() => createAllCheatSheets());
  const [pockets, setPockets] = useState<Pocket[]>(() => createInitialPockets());
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [hintShown, setHintShown] = useState(true);

  const isSheetPlaced = (sheetId: string) => pockets.some((p) => p.sheets.some((s) => s.id === sheetId));

  const handleSheetClick = (sheetId: string) => {
    if (isSheetPlaced(sheetId)) return;
    setSelectedSheet(sheetId === selectedSheet ? null : sheetId);
  };

  const handlePocketClick = (pocketId: 'left' | 'right' | 'hoodie') => {
    if (!selectedSheet) return;
    const sheet = sheets.find((s) => s.id === selectedSheet);
    if (!sheet) return;
    setPockets((prev) => prev.map((p) => p.id === pocketId ? { ...p, sheets: [...p.sheets, sheet] } : p));
    setSelectedSheet(null);
  };

  const removeFromPocket = (pocketId: 'left' | 'right' | 'hoodie', sheetId: string) => {
    setPockets((prev) => prev.map((p) => p.id === pocketId ? { ...p, sheets: p.sheets.filter((s) => s.id !== sheetId) } : p));
  };

  const allPlaced = sheets.every((s) => isSheetPlaced(s.id));

  const handleRandomDistribute = () => {
    const shuffled = [...sheets];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const newPockets: Pocket[] = [
      { id: 'left', name: 'Левый карман штанов', sheets: [] },
      { id: 'right', name: 'Правый карман штанов (+телефон)', sheets: [] },
      { id: 'hoodie', name: 'Карман худи', sheets: [] },
    ];
    for (const sheet of shuffled) newPockets[Math.floor(Math.random() * 3)].sheets.push(sheet);
    setPockets(newPockets);
    setSelectedSheet(null);
  };

  return (
      <div className="min-h-screen max-h-screen overflow-y-auto bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4">
        <div className="max-w-5xl mx-auto">
          {/* Уменьшенный заголовок */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold mb-1 text-amber-300 drop-shadow-lg">📚 Подготовка к экзамену</h1>
            <p className="text-sm text-slate-300">Разложи 8 шпаргалок по 3 карманам. На вопрос типа Д шпоры нет — юзай телефон.</p>
          </div>

          {/* Уменьшенная подсказка */}
          {hintShown && (
              <div className="bg-amber-900/40 border border-amber-500 rounded-lg p-2 mb-4 relative">
                <button className="absolute top-1 right-2 text-amber-300 hover:text-white text-sm" onClick={() => setHintShown(false)}>✕</button>
                <p className="text-amber-100 text-xs">💡 <b>Подсказка:</b> Разложи шпоры так, чтобы запомнить где какая! На экзамене ты будешь доставать шпоры вслепую.</p>
              </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Шпаргалки — уменьшенные карточки */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
              <h2 className="text-lg font-bold mb-2 text-amber-300">📝 Шпаргалки</h2>
              <p className="text-xs text-slate-400 mb-2">Кликни на шпору, затем на карман.</p>
              <div className="grid grid-cols-2 gap-2">
                {sheets.map((sheet) => {
                  const placed = isSheetPlaced(sheet.id);
                  return (
                      <button
                          key={sheet.id}
                          onClick={() => handleSheetClick(sheet.id)}
                          disabled={placed}
                          className={`py-2 rounded-lg border transition-all font-bold text-sm ${
                              placed
                                  ? 'bg-slate-900/50 border-slate-700 text-slate-600 cursor-not-allowed'
                                  : selectedSheet === sheet.id
                                      ? 'bg-amber-500 border-amber-300 text-slate-900 scale-105 shadow-md shadow-amber-500/50'
                                      : 'bg-amber-50 border-amber-700 text-slate-900 hover:scale-105 hover:shadow-md'
                          }`}
                      >
                        {placed ? '✓' : '📄'} {sheet.id}
                      </button>
                  );
                })}
              </div>
            </div>

            {/* Карманы — уменьшенные */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              {pockets.map((pocket) => (
                  <div key={pocket.id} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700 min-h-[220px]">
                    <div className="text-center mb-2">
                      <div className="text-3xl mb-1">{POCKET_ICONS[pocket.id]}</div>
                      <h3 className="font-bold text-sm text-amber-300">{POCKET_LABELS[pocket.id]}</h3>
                    </div>
                    <button
                        onClick={() => handlePocketClick(pocket.id as 'left' | 'right' | 'hoodie')}
                        disabled={!selectedSheet}
                        className={`w-full py-1.5 rounded-lg mb-2 font-bold text-sm transition-all ${
                            selectedSheet
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                      {selectedSheet ? '⬇ Положить сюда' : 'Выбери шпору'}
                    </button>
                    <div className="space-y-1">
                      {pocket.id === 'right' && (
                          <div className="p-1 bg-blue-900/40 border border-blue-500 rounded text-xs text-blue-200 text-center">
                            📱 Телефон
                          </div>
                      )}
                      {pocket.sheets.map((s) => (
                          <div key={s.id} className="p-1.5 bg-amber-100 text-slate-900 rounded flex justify-between items-center text-sm">
                            <span className="font-bold text-xs">📄 {s.id}</span>
                            <button onClick={() => removeFromPocket(pocket.id, s.id)} className="text-red-600 hover:text-red-400 font-bold text-xs">✕</button>
                          </div>
                      ))}
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {/* Таблица типов вопросов — уменьшена */}
          <div className="mt-4 bg-slate-800/60 rounded-xl p-3 border border-slate-700">
            <h3 className="font-bold mb-2 text-amber-300 text-sm">📋 Типы вопросов на экзамене</h3>
            <div className="grid grid-cols-5 gap-1 text-center">
              {['А', 'Б', 'В', 'Г', 'Д'].map((t) => (
                  <div key={t} className="bg-slate-900/50 rounded p-1.5">
                    <div className="text-base font-bold text-amber-300">Тип {t}</div>
                    <div className="text-[10px] text-slate-400">Шпоры: {t}1, {t}2</div>
                  </div>
              ))}
            </div>
          </div>

          {/* Кнопки внизу — уменьшены */}
          <div className="text-center mt-4 flex gap-3 justify-center">
            <button
                onClick={handleRandomDistribute}
                className="px-4 py-2 rounded-xl font-bold text-sm bg-slate-600 hover:bg-slate-500 text-white shadow-md"
            >
              🎲 Случайно
            </button>
            <button
                onClick={() => onStart(pockets)}
                disabled={!allPlaced}
                className={`px-6 py-2 rounded-xl font-bold text-base transition-all ${
                    allPlaced
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-md shadow-emerald-500/50 hover:scale-105'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
            >
              {allPlaced ? '🎓 Начать экзамен' : `Осталось: ${sheets.length - pockets.reduce((a, p) => a + p.sheets.length, 0)}`}
            </button>
          </div>
        </div>
      </div>
  );
}