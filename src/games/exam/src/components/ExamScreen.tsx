import { useEffect, useRef } from 'react';
import type { Indicator, Pocket, Question } from '../game/types';
import { useExamGame } from '../game/useExamGame';
import { EXAM_DURATION, WIN_THRESHOLD } from '../game/constants';
import GameCanvas from './GameCanvas';

interface Props {
  initialPockets: Pocket[];
  onEnd: (result: 'win' | 'lose', reason: string, examTime: number, completed: number) => void;
}

const POCKET_ICONS: Record<string, string> = { left: '👖 L', right: '👖 R', hoodie: '🧥' };

export default function ExamScreen({ initialPockets, onEnd }: Props) {
  const { state, getIndicators, actions } = useExamGame(initialPockets);
  const indicators = getIndicators();
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    if (state.phase === 'win' || state.phase === 'lose') {
      const t = setTimeout(() => {
        onEndRef.current(
          state.phase as 'win' | 'lose',
          state.phase === 'win' ? `Отлично! Списал ${state.completedCount}/5 вопросов!` : state.loseReason,
          Math.floor(EXAM_DURATION - state.timeLeft),
          state.completedCount
        );
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [state.phase, state.completedCount, state.loseReason, state.timeLeft]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const activeQ: Question | null = state.activeQuestion !== null ? state.questions[state.activeQuestion] : null;

  return (
      <div className="relative w-screen h-screen overflow-y-auto bg-black select-none">
          <div className="absolute inset-0 flex items-center justify-center">
              <GameCanvas
                  proctors={state.proctors}
                  distraction={state.distraction}
                  cheatingMode={state.cheatingMode}
                  sheetOnDesk={state.sheetOnDesk}
                  sheetHidden={state.sheetHidden}
                  phoneActive={state.phoneActive}
                  hasSheetInHand={!!state.activeSheet && !state.cheatingMode}
              />
          </div>

          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
              <div
                  className="bg-black/70 backdrop-blur border-2 border-amber-500 rounded-xl px-6 py-3 pointer-events-auto">
                  <div className="text-amber-300 text-xs uppercase tracking-wider">Осталось</div>
                  <div
                      className={`text-4xl font-bold ${state.timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}> ⏱ {formatTime(state.timeLeft)}</div>
              </div>
              <div
                  className="bg-black/70 backdrop-blur border-2 border-emerald-500 rounded-xl px-6 py-3 pointer-events-auto">
                  <div className="text-emerald-300 text-xs uppercase tracking-wider">Списано</div>
                  <div className="text-4xl font-bold text-white">{state.completedCount} / 5</div>
                  <div className="text-xs text-emerald-300">(нужно {WIN_THRESHOLD})</div>
              </div>
              <button onClick={actions.submitExam}
                      className="bg-black/70 backdrop-blur border-2 border-red-500 hover:border-red-400 rounded-xl px-5 py-3 pointer-events-auto text-red-300 hover:text-red-200 font-bold transition">📤
                  Сдать
              </button>
          </div>

          <Indicators indicators={indicators}/>

          {state.distraction.active && (
              <div
                  className="absolute top-32 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold text-xl animate-pulse">
                  🎉 СТУДЕНТ ПОДНЯЛ РУКУ! {Math.ceil(state.distraction.timeLeft)}с БЕЗОПАСНО!
              </div>
          )}

          <div
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur border-2 border-amber-600 rounded-xl p-3 max-w-xs max-h-[60vh] overflow-y-auto pointer-events-auto">
              <div className="text-amber-300 font-bold mb-2 text-sm">📋 Выбери вопрос из билета:</div>
              <div className="space-y-1">
                  {state.questions.map((q, i) => (
                      <button key={q.index} onClick={() => actions.selectQuestion(i)} disabled={q.completed}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${q.completed ? 'bg-emerald-900/50 text-emerald-300 line-through' : state.activeQuestion === i ? 'bg-amber-500 text-black font-bold ring-2 ring-amber-300' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
                          {q.completed ? '✓' : '•'} {q.index}. Тип {q.type}{q.sheetNum}
                          {!q.completed && q.progressFromCorrectSheet > 0 && <span
                              className="text-xs text-slate-300"> ({Math.floor(q.progressFromCorrectSheet)}%)</span>}
                          {!q.hasSheet && <span className="text-xs text-red-300"> 📱</span>}
                      </button>
                  ))}
              </div>
          </div>

          <div className="absolute right-4 bottom-4 flex flex-col gap-2 pointer-events-auto">
              <div className="bg-black/80 backdrop-blur border-2 border-purple-500 rounded-xl p-2">
                  <div className="text-purple-300 text-xs font-bold mb-1 text-center">КАРМАНЫ (вслепую)</div>
                  {state.pockets.map((p) => {
                      const disabled = !!state.cheatingMode || !!state.activeSheet || p.sheets.length === 0;
                      return (
                          <button key={p.id} onClick={() => actions.openPocket(p.id)} disabled={disabled}
                                  className="w-full px-4 py-3 my-1 bg-purple-700 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-white font-bold transition">
                              <div className="text-lg">{POCKET_ICONS[p.id]}</div>
                              <div
                                  className="text-xs">{p.sheets.length === 0 ? 'пусто' : `достать (${p.sheets.length})`}</div>
                          </button>
                      );
                  })}
              </div>
          </div>

          <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 flex-wrap justify-center pointer-events-auto max-w-2xl">
              {state.activeSheet && !state.cheatingMode && state.activeQuestion !== null && (
                  <>
                      <button onClick={actions.putOnDesk}
                              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg">📝
                          На парту
                      </button>
                      <button onClick={actions.putOnLap}
                              className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg">🦵
                          На колени
                      </button>
                  </>
              )}
              {!state.cheatingMode && state.activeQuestion !== null && (
                  <button onClick={actions.usePhone}
                          className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold shadow-lg">📱
                      Телефон</button>
              )}
              {state.cheatingMode === 'desk' && (
                  <>
                      {!state.sheetHidden ? (
                          // Шпора видна — показываем кнопку "Спрятать"
                          <>
                              {!state.writingActive ? (
                                  <button onClick={actions.startWriting}
                                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg">
                                      ✍️ Начать списывать
                                  </button>
                              ) : (
                                  <button onClick={actions.hideSheet}
                                          className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-lg shadow-lg animate-pulse">
                                      🫣 СПРЯТАТЬ ШПОРУ
                                  </button>
                              )}
                          </>
                      ) : (
                          // Шпора спрятана — показываем кнопку "Продолжить"
                          <button onClick={actions.resumeFromHidden}
                                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-lg shadow-lg">
                              🔍 ДОСТАТЬ ШПОРУ И ПРОДОЛЖИТЬ
                          </button>
                      )}
                  </>
              )}
              {state.sheetOnDesk && state.sheetHidden && !state.sheetRevealedId && (
                  <button onClick={actions.revealSheet}
                          className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg">🔍
                      Узнать шпору</button>
              )}
              {state.cheatingMode && (
                  <button onClick={actions.stopCheating}
                          className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold shadow-lg">↩
                      Перестать</button>
              )}
          </div>

          <div className="absolute left-4 bottom-4 pointer-events-auto">
              <button onClick={actions.askFriend} disabled={state.friendUsed || state.friendHelpActive}
                      className={`px-5 py-3 rounded-xl font-bold shadow-lg ${state.friendUsed || state.friendHelpActive ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>
                  🤝 {state.friendHelpActive ? 'Помогает...' : state.friendUsed ? 'Использован' : 'Друг'}
              </button>
              {state.friendMessage && (
                  <div
                      className="mt-2 bg-black/80 border-2 border-cyan-400 text-cyan-100 px-4 py-2 rounded-xl text-sm font-bold max-w-[220px]">{state.friendMessage}</div>
              )}
          </div>

          {activeQ && !activeQ.completed && (
              <div
                  className="absolute top-24 right-4 bg-black/80 backdrop-blur border-2 border-yellow-400 rounded-xl p-4 w-72 pointer-events-none">
                  <div className="text-yellow-300 font-bold mb-2">Вопрос {activeQ.index}:
                      нужна {activeQ.type}{activeQ.sheetNum}</div>
                  {state.cheatingMode && state.activeSheet && (
                      <div
                          className={`text-sm font-bold mb-2 px-2 py-1 rounded ${state.activeSheet.id === `${activeQ.type}${activeQ.sheetNum}` ? 'bg-emerald-700 text-emerald-100' : 'bg-red-800 text-red-100'}`}>
                          {state.activeSheet.id === `${activeQ.type}${activeQ.sheetNum}` ? `✓ Нужная шпора: ${state.activeSheet.id}` : `✗ Неправильная: ${state.activeSheet.id}`}
                      </div>
                  )}
                  {state.sheetOnDesk && state.sheetRevealedId && (
                      <div className="text-sm text-blue-300 mb-2">Шпора под листом: {state.sheetRevealedId}</div>
                  )}
                  <div className="w-full h-6 bg-slate-800 rounded-full overflow-hidden border border-yellow-500">
                      <div className="h-full bg-gradient-to-r from-yellow-500 to-emerald-500 transition-all"
                           style={{width: `${activeQ.progressFromCorrectSheet}%`}}/>
                  </div>
                  <div
                      className="text-white text-center font-bold mt-1">{Math.floor(activeQ.progressFromCorrectSheet)}%
                  </div>
                  <button onClick={() => actions.strikeQuestion(state.activeQuestion!)}
                          className="w-full mt-3 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold text-sm">❌
                      Зачеркнуть
                  </button>
              </div>
          )}

          {state.activeSheet && !state.cheatingMode && (
              <div
                  className="absolute top-28 left-52 bg-amber-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg pointer-events-none max-w-[240px]">📄
                  В руке шпора (узнаешь при списывании). Положи её на парту или на колени.</div>
          )}

          {(state.phase === 'win' || state.phase === 'lose') && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 pointer-events-auto">
                  <div
                      className={`p-10 rounded-3xl text-center max-w-lg ${state.phase === 'win' ? 'bg-emerald-900 border-4 border-emerald-400' : 'bg-red-900 border-4 border-red-500'}`}>
                      <div className="text-8xl mb-4">{state.phase === 'win' ? '🎓' : '😱'}</div>
                      <h2 className="text-5xl font-bold text-white mb-4">{state.phase === 'win' ? 'ПОБЕДА!' : 'ПОПАЛСЯ!'}</h2>
                      <p className="text-2xl text-white mb-6">{state.phase === 'win' ? `Отлично! Списал ${state.completedCount}/5 вопросов!` : state.loseReason}</p>
                      <button onClick={() => window.location.reload()}
                              className="px-8 py-3 bg-white text-black rounded-xl font-bold text-xl hover:bg-slate-200">🔄
                          Новая игра
                      </button>
                  </div>
              </div>
          )}
      </div>
  );
}

function Indicators({indicators}: { indicators: Indicator[] }) {
    const displayedInds = indicators.filter((i) => i.direction === 'left' || i.direction === 'right');
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-64 pointer-events-none">
      {displayedInds.map((ind) => {
        const size = 32 + ind.distance * 80;
        let color = 'bg-slate-600/70 border-slate-400';
        let label = '';
        if (ind.status === 'looking') {
          color = 'bg-red-500 border-red-300 animate-pulse shadow-[0_0_40px_rgba(255,0,0,1)]';
          label = '👁';
        } else if (ind.status === 'near') {
          color = 'bg-yellow-500 border-yellow-300 shadow-[0_0_25px_rgba(255,200,0,0.7)]';
          label = '⚠';
        }
        return (
          <div key={ind.direction} className="flex flex-col items-center gap-2">
            <div className={`${color} border-4 rounded-lg transition-all`} style={{ width: size, height: size }} />
            {label && <div className="text-white text-xl font-bold drop-shadow-lg">{label}</div>}
          </div>
        );
      })}
    </div>
  );
}