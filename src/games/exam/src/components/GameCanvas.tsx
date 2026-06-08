import { useEffect, useRef } from 'react';
import type { Proctor } from '../game/types';
import { PLAYER_X, PLAYER_Y, COLORS, PROCTOR_VISION_RANGE } from '../game/constants';

interface Props {
  proctors: Proctor[];
  distraction: { active: boolean; studentIndex: number } | null;
  cheatingMode: 'desk' | 'lap' | 'phone' | null;
  sheetOnDesk: boolean;
  sheetHidden: boolean;
  phoneActive: boolean;
  hasSheetInHand: boolean;
}

const CANVAS_W = 1280;
const CANVAS_H = 720;
const HORIZON_Y = CANVAS_H * 0.38;
const CAMERA_HEIGHT = 1.6;
const FOV_SCALE = 480;

function project(wx: number, wy: number, wz: number) {
  const rx = wx - PLAYER_X;
  const ry = wy - PLAYER_Y;
  const depth = -ry;
  if (depth < 0.2) return null;
  const screenX = CANVAS_W / 2 + (rx * FOV_SCALE) / depth;
  const screenY = HORIZON_Y + ((CAMERA_HEIGHT - wz) * FOV_SCALE) / depth;
  return { x: screenX, y: screenY, depth };
}

function drawCircleSafe(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const safeRadius = Math.abs(radius);
  if (safeRadius > 0.5) {
    ctx.arc(x, y, safeRadius, startAngle, endAngle);
  } else if (safeRadius > 0) {
    ctx.arc(x, y, 0.5, startAngle, endAngle);
  }
}

// НОВАЯ ФУНКЦИЯ: Рисует всю комнату целиком (4 стены, пол, потолок)
function drawRoom(ctx: CanvasRenderingContext2D) {
  // Гарантированный фон на случай любых микро-зазоров при рендеринге
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Вершины комнаты (X: -6..6, Y: -0.5..-12 от игрока, Z: 0..3)
  const v = [
    project(PLAYER_X - 6, PLAYER_Y - 0.5, 0),    // 0: ближний низ лево
    project(PLAYER_X + 6, PLAYER_Y - 0.5, 0),    // 1: ближний низ право
    project(PLAYER_X + 6, PLAYER_Y - 12, 0),     // 2: дальний низ право
    project(PLAYER_X - 6, PLAYER_Y - 12, 0),     // 3: дальний низ лево
    project(PLAYER_X - 6, PLAYER_Y - 0.5, 3),    // 4: ближний верх лево
    project(PLAYER_X + 6, PLAYER_Y - 0.5, 3),    // 5: ближний верх право
    project(PLAYER_X + 6, PLAYER_Y - 12, 3),     // 6: дальний верх право
    project(PLAYER_X - 6, PLAYER_Y - 12, 3),     // 7: дальний верх лево
  ];

  if (v.some(p => !p)) return;
  const p = v as NonNullable<typeof v[0]>[];

  // 1. Дальняя стена (Front wall)
  ctx.fillStyle = '#4a4a4a';
  ctx.beginPath();
  ctx.moveTo(p[3].x, p[3].y);
  ctx.lineTo(p[2].x, p[2].y);
  ctx.lineTo(p[6].x, p[6].y);
  ctx.lineTo(p[7].x, p[7].y);
  ctx.closePath();
  ctx.fill();

  // Доска на дальней стене
  const boardLeft = project(PLAYER_X - 3.5, PLAYER_Y - 12, 0.8);
  const boardRight = project(PLAYER_X + 3.5, PLAYER_Y - 12, 0.8);
  const boardTop = project(PLAYER_X - 3.5, PLAYER_Y - 12, 2.4);
  const boardBottom = project(PLAYER_X - 3.5, PLAYER_Y - 12, 0.8);
  
  if (boardLeft && boardRight && boardTop && boardBottom) {
    ctx.fillStyle = '#1e3a1e'; // Темно-зеленая доска
    ctx.fillRect(boardLeft.x, boardTop.y, boardRight.x - boardLeft.x, boardBottom.y - boardTop.y);
    ctx.strokeStyle = '#8b6914'; // Деревянная рамка
    ctx.lineWidth = 3;
    ctx.strokeRect(boardLeft.x, boardTop.y, boardRight.x - boardLeft.x, boardBottom.y - boardTop.y);
    
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.fillText('ЭКЗАМЕН', (boardLeft.x + boardRight.x) / 2, (boardTop.y + boardBottom.y) / 2 + 8);
  }

  // 2. Левая стена (чуть темнее для объема)
  ctx.fillStyle = '#383838';
  ctx.beginPath();
  ctx.moveTo(p[0].x, p[0].y);
  ctx.lineTo(p[3].x, p[3].y);
  ctx.lineTo(p[7].x, p[7].y);
  ctx.lineTo(p[4].x, p[4].y);
  ctx.closePath();
  ctx.fill();

  // 3. Правая стена (чуть темнее для объема)
  ctx.fillStyle = '#383838';
  ctx.beginPath();
  ctx.moveTo(p[1].x, p[1].y);
  ctx.lineTo(p[2].x, p[2].y);
  ctx.lineTo(p[6].x, p[6].y);
  ctx.lineTo(p[5].x, p[5].y);
  ctx.closePath();
  ctx.fill();

  // 4. Потолок (светлее, так как свет обычно сверху)
  ctx.fillStyle = '#555555';
  ctx.beginPath();
  ctx.moveTo(p[4].x, p[4].y);
  ctx.lineTo(p[5].x, p[5].y);
  ctx.lineTo(p[6].x, p[6].y);
  ctx.lineTo(p[7].x, p[7].y);
  ctx.closePath();
  ctx.fill();

  // 5. Пол (рисуем последним, чтобы красиво перекрыть нижние стыки стен)
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.moveTo(p[0].x, p[0].y);
  ctx.lineTo(p[1].x, p[1].y);
  ctx.lineTo(p[2].x, p[2].y);
  ctx.lineTo(p[3].x, p[3].y);
  ctx.closePath();
  ctx.fill();
  
  // Сетка на полу для сохранения ощущения глубины и перспективы
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = -5; i <= 5; i++) {
    const x1 = PLAYER_X + i * 1.2;
    const pt1 = project(x1, PLAYER_Y - 0.5, 0);
    const pt2 = project(x1, PLAYER_Y - 12, 0);
    if (pt1 && pt2) {
      ctx.beginPath();
      ctx.moveTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.stroke();
    }
  }
  for (let y = -2; y >= -11; y -= 2) {
    const pt1 = project(PLAYER_X - 6, PLAYER_Y + y, 0);
    const pt2 = project(PLAYER_X + 6, PLAYER_Y + y, 0);
    if (pt1 && pt2) {
      ctx.beginPath();
      ctx.moveTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.stroke();
    }
  }
}

function drawStudentDesks(ctx: CanvasRenderingContext2D, distractionStudentIdx: number | null) {
  const deskPositions = [
    { x: 3, y: 3 }, { x: 3, y: 5 }, { x: 3, y: 7 }, { x: 3, y: 8.5 },
    { x: 7, y: 3 }, { x: 7, y: 5 }, { x: 7, y: 7 }, { x: 7, y: 8.5 },
  ];
  const sorted = deskPositions.map((d, i) => ({ ...d, idx: i })).sort((a, b) => a.y - b.y);
  for (const desk of sorted) {
    drawSingleDesk(ctx, desk.x, desk.y, distractionStudentIdx === desk.idx);
  }
}

function drawSingleDesk(ctx: CanvasRenderingContext2D, wx: number, wy: number, raisedHand: boolean) {
  const corners = [
    project(wx - 0.45, wy - 0.35, 0.8),
    project(wx + 0.45, wy - 0.35, 0.8),
    project(wx + 0.45, wy + 0.35, 0.8),
    project(wx - 0.45, wy + 0.35, 0.8),
  ];
  if (corners.some((c) => !c)) return;
  const c = corners as NonNullable<(typeof corners)[0]>[];
  
  ctx.fillStyle = COLORS.deskLight;
  ctx.beginPath();
  ctx.moveTo(c[0].x, c[0].y);
  c.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = '#3a2410';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.fillStyle = COLORS.desk;
  ctx.beginPath();
  ctx.moveTo(c[0].x, c[0].y);
  ctx.lineTo(c[1].x, c[1].y);
  const bottomY = c[1].y + (c[1].depth > 3 ? 8 : 14);
  ctx.lineTo(c[1].x, bottomY);
  ctx.lineTo(c[0].x, c[0].y + (c[0].depth > 3 ? 8 : 14));
  ctx.closePath();
  ctx.fill();

  const bodyBottom = project(wx, wy + 0.02, 1);
  const bodyTop = project(wx, wy + 0.02, 1.50);
  const headPos = project(wx, wy + 0.02, 1.58);
  
  if (bodyBottom && bodyTop && headPos) {
    const rawHeight = bodyBottom.y - bodyTop.y;
    const bodyHeight = Math.abs(rawHeight);
    if (bodyHeight < 1) return;
    
    const w = Math.min(bodyHeight * 0.75, 32);
    if (w < 2) return;
    
    ctx.fillStyle = '#3a5a7a';
    ctx.beginPath();
    ctx.moveTo(bodyTop.x - w * 0.5, bodyTop.y);
    ctx.lineTo(bodyTop.x + w * 0.5, bodyTop.y);
    ctx.lineTo(bodyBottom.x + w * 0.6, bodyBottom.y);
    ctx.lineTo(bodyBottom.x - w * 0.6, bodyBottom.y);
    ctx.closePath();
    ctx.fill();

    const headRadius = Math.max(4, w * 0.35);
    ctx.fillStyle = '#e8c4a0';
    ctx.beginPath();
    ctx.arc(headPos.x, headPos.y, headRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.arc(headPos.x, headPos.y - headRadius * 0.12, headRadius * 0.75, Math.PI, 0);
    ctx.fill();

    if (raisedHand) {
      ctx.strokeStyle = '#e8c4a0';
      ctx.lineWidth = w * 0.22;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bodyTop.x + w * 0.32, bodyTop.y);
      ctx.lineTo(bodyTop.x + w * 0.6, headPos.y - headRadius * 1.8);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255,80,80,0.5)';
      ctx.beginPath();
      ctx.arc(bodyTop.x + w * 0.6, headPos.y - headRadius * 1.8, headRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawProctor(ctx: CanvasRenderingContext2D, p: Proctor) {
  const feet = project(p.x, p.y, 0);
  const head = project(p.x, p.y, 1.95);
  if (!feet || !head) return;
  
  drawVisionCone(ctx, p);
  
  const height = feet.y - head.y;
  const width = height * 0.35;
  const facingPlayer = Math.sin(p.angle) > 0.25;
  
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(feet.x, feet.y, width * 0.6, height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = COLORS.proctor;
  ctx.fillRect(head.x - width / 2, head.y + height * 0.15, width, height * 0.6);
  
  ctx.fillStyle = '#0a1530';
  ctx.fillRect(head.x - width / 2, head.y + height * 0.75, width * 0.45, height * 0.25);
  ctx.fillRect(head.x + width * 0.05, head.y + height * 0.75, width * 0.45, height * 0.25);
  
  const headCx = head.x;
  const headCy = head.y + height * 0.03;
  const headR = width * 0.35;
  
  if (facingPlayer) {
    ctx.fillStyle = COLORS.proctorHead;
    ctx.beginPath();
    ctx.arc(headCx, headCy, headR, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#1a1410';
    ctx.beginPath();
    ctx.arc(headCx, headCy - headR * 0.2, headR, Math.PI, 0);
    ctx.fill();
    
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(headCx - headR * 0.35, headCy, headR * 0.12, 0, Math.PI * 2);
    ctx.arc(headCx + headR * 0.35, headCy, headR * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#c02020';
    ctx.fillRect(headCx - width * 0.06, head.y + height * 0.15, width * 0.12, height * 0.28);
  } else {
    ctx.fillStyle = '#1a1410';
    ctx.beginPath();
    ctx.arc(headCx, headCy, headR, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#0a1530';
    ctx.fillRect(headCx - width * 0.2, head.y + height * 0.15, width * 0.4, height * 0.06);
  }
  
  ctx.fillStyle = facingPlayer ? '#ff6666' : 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 3;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  const label = `${p.name} ${facingPlayer ? '👁' : '🔙'}`;
  ctx.strokeText(label, head.x, head.y - 8);
  ctx.fillText(label, head.x, head.y - 8);
}

function drawVisionCone(ctx: CanvasRenderingContext2D, p: Proctor) {
  const range = PROCTOR_VISION_RANGE;
  const half = Math.PI / 4;
  const segments = 10;
  const origin = project(p.x, p.y, 0.05);
  if (!origin) return;
  
  const arcPts: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = p.angle - half + (2 * half * i) / segments;
    const wx = p.x + Math.cos(a) * range;
    const wy = p.y + Math.sin(a) * range;
    const pt = project(wx, wy, 0.05);
    if (pt) arcPts.push(pt);
  }
  if (arcPts.length < 2) return;
  
  const facingPlayer = Math.sin(p.angle) > 0.25;
  const grad = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, 200);
  if (facingPlayer) {
    grad.addColorStop(0, 'rgba(255,60,60,0.35)');
    grad.addColorStop(1, 'rgba(255,60,60,0.02)');
  } else {
    grad.addColorStop(0, 'rgba(255,210,80,0.28)');
    grad.addColorStop(1, 'rgba(255,210,80,0.02)');
  }
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  for (const pt of arcPts) ctx.lineTo(pt.x, pt.y);
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = facingPlayer ? 'rgba(255,80,80,0.6)' : 'rgba(255,220,100,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawPlayerDesk(ctx: CanvasRenderingContext2D, sheetOnDesk: boolean, sheetHidden: boolean, cheatingMode: 'desk' | 'lap' | 'phone' | null, yOffset: number = 0) {
  const deskY = CANVAS_H * 0.62 + yOffset;
  const deskTop = deskY - 30;
  
  ctx.fillStyle = COLORS.desk;
  ctx.beginPath();
  ctx.moveTo(-50, CANVAS_H + yOffset);
  ctx.lineTo(CANVAS_W + 50, CANVAS_H + yOffset);
  ctx.lineTo(CANVAS_W * 0.85, deskY);
  ctx.lineTo(CANVAS_W * 0.15, deskY);
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = deskY + ((CANVAS_H - deskY) * i) / 6;
    const t = (y - deskY) / (CANVAS_H - deskY);
    const xShrink = (1 - t) * CANVAS_W * 0.35;
    ctx.beginPath();
    ctx.moveTo(xShrink, y);
    ctx.lineTo(CANVAS_W - xShrink, y);
    ctx.stroke();
  }
  
  const paperX = CANVAS_W * 0.3;
  const paperY = deskTop + 10;
  const paperW = CANVAS_W * 0.4;
  const paperH = 180;
  
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(paperX, paperY, paperW, paperH);
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 2;
  ctx.strokeRect(paperX, paperY, paperW, paperH);
  
  ctx.fillStyle = '#333';
  ctx.font = 'bold 14px serif';
  ctx.textAlign = 'left';
  ctx.fillText('Экзаменационный билет', paperX + 20, paperY + 22);
  
  for (let i = 0; i < 5; i++) {
    const y = paperY + 45 + i * 24;
    ctx.strokeStyle = '#b0b0a0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paperX + 15, y);
    ctx.lineTo(paperX + paperW - 15, y);
    ctx.stroke();
    ctx.fillStyle = '#555';
    ctx.font = '11px serif';
    ctx.fillText(`${i + 1}. _________________________`, paperX + 20, y - 5);
  }
  
  if (sheetOnDesk && !sheetHidden && cheatingMode === 'desk') {
    const sx = paperX + paperW * 0.55;
    const sy = paperY + paperH * 0.4;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(-0.15);
    ctx.fillStyle = '#fff8d0';
    ctx.fillRect(-35, -20, 70, 40);
    ctx.strokeStyle = '#a08020';
    ctx.lineWidth = 2;
    ctx.strokeRect(-35, -20, 70, 40);
    ctx.fillStyle = '#555';
    ctx.font = '8px monospace';
    for (let i = 0; i < 3; i++) ctx.fillText('═══════', -30, -6 + i * 10);
    ctx.restore();
  }
}

function drawPhoneScreen(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, CANVAS_H / 2, CANVAS_W, CANVAS_H / 2);
  ctx.fillStyle = '#1a2a3a';
  ctx.fillRect(CANVAS_W * 0.3, CANVAS_H / 2 + 30, CANVAS_W * 0.4, 120);
  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(CANVAS_W * 0.3, CANVAS_H / 2 + 30, CANVAS_W * 0.4, 120);
  ctx.fillStyle = '#0f0';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('📱 ТЕЛЕФОН', CANVAS_W / 2, CANVAS_H / 2 + 65);
  ctx.fillStyle = '#aaa';
  ctx.font = '12px monospace';
  ctx.fillText('Ответы из интернета...', CANVAS_W / 2, CANVAS_H / 2 + 95);
  ctx.fillStyle = '#ff6666';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('⚠ ГОЛОВА ОПУЩЕНА — ОПАСНО ⚠', CANVAS_W / 2, CANVAS_H / 2 + 125);
}

function drawPlayerHands(ctx: CanvasRenderingContext2D, cheatingMode: 'desk' | 'lap' | 'phone' | null, hasSheet: boolean, yOffset: number = 0) {
  if (cheatingMode === 'lap' || cheatingMode === 'phone') return;
  const handY = CANVAS_H - 35 + yOffset;
  ctx.fillStyle = '#e8c4a0';
  ctx.beginPath();
  ctx.ellipse(CANVAS_W * 0.18, handY, 50, 40, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(CANVAS_W * 0.82, handY, 50, 40, -0.3, 0, Math.PI * 2);
  ctx.fill();
  
  if (hasSheet && !cheatingMode) {
    ctx.save();
    ctx.translate(CANVAS_W * 0.82, handY - 18);
    ctx.rotate(-0.2);
    ctx.fillStyle = '#fff8d0';
    ctx.fillRect(-22, -12, 44, 24);
    ctx.strokeStyle = '#a08020';
    ctx.lineWidth = 2;
    ctx.strokeRect(-22, -12, 44, 24);
    ctx.fillStyle = '#555';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ШПОРА', 0, 2);
    ctx.restore();
  }
}

export default function GameCanvas(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const isHeadDown = props.cheatingMode === 'lap' || props.cheatingMode === 'phone';

    if (isHeadDown) {
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H / 2);
      
      drawRoom(ctx); // <-- Заменили drawFloor и drawWalls на drawRoom
      
      drawStudentDesks(ctx, props.distraction?.active ? props.distraction.studentIndex : null);
      const sorted = [...props.proctors].sort((a, b) => a.y - b.y);
      for (const p of sorted) drawProctor(ctx, p);
      
      drawPlayerDesk(ctx, props.sheetOnDesk, props.sheetHidden, props.cheatingMode, -CANVAS_H / 3);
      drawPlayerHands(ctx, props.cheatingMode, props.hasSheetInHand, -CANVAS_H / 3);
      drawPhoneScreen(ctx);
    } else {
      drawRoom(ctx); // <-- Заменили drawFloor и drawWalls на drawRoom
      
      drawStudentDesks(ctx, props.distraction?.active ? props.distraction.studentIndex : null);
      const sorted = [...props.proctors].sort((a, b) => a.y - b.y);
      for (const p of sorted) drawProctor(ctx, p);
      
      drawPlayerDesk(ctx, props.sheetOnDesk, props.sheetHidden, props.cheatingMode, 0);
      drawPlayerHands(ctx, props.cheatingMode, props.hasSheetInHand, 0);
    }

    const vg = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.3, CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, [props]);
  
  return <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full h-full object-contain block bg-black" style={{ imageRendering: 'auto' }} />;
}

export { PROCTOR_VISION_RANGE };