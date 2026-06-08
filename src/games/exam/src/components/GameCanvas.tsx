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

// ===== КОНСТАНТЫ РАЗМЕРОВ И ЦВЕТОВ =====
const DESK_CONFIG = {
  WIDTH: 0.9,
  DEPTH: 0.6,
  TOP_THICKNESS: 0.05,
  HEIGHT: 0.75,
  LEG_WIDTH: 0.05,
  TOP_COLOR: '#8B6F47',
  TOP_SIDE_COLOR: '#6B5437',
  LEG_COLOR: '#4A3728',
  EDGE_COLOR: '#3A2410',
};

const CHAIR_CONFIG = {
  SEAT_WIDTH: 0.4,
  SEAT_DEPTH: 0.4,
  SEAT_HEIGHT: 0.45,
  SEAT_THICKNESS: 0.04,
  BACK_HEIGHT: 0.85,
  BACK_THICKNESS: 0.03,
  LEG_WIDTH: 0.04,
  SEAT_COLOR: '#6B5437',
  BACK_COLOR: '#5A4427',
  LEG_COLOR: '#4A3728',
};

const STUDENT_CONFIG = {
  BODY_HEIGHT: 0.55,
  SHOULDER_WIDTH: 0.35,
  HIP_WIDTH: 0.25,
  HEAD_RADIUS: 0.13,
  NECK_HEIGHT: 0.08,
  ARM_WIDTH: 0.08,
  SHIRT_COLOR: '#3A5A7A',
  SKIN_COLOR: '#E8C4A0',
  HAIR_COLOR: '#3A2A1A',
};

function project(wx: number, wy: number, wz: number) {
  const rx = wx - PLAYER_X;
  const ry = wy - PLAYER_Y;
  const depth = -ry;
  if (depth < 0.2) return null;
  const screenX = CANVAS_W / 2 + (rx * FOV_SCALE) / depth;
  const screenY = HORIZON_Y + ((CAMERA_HEIGHT - wz) * FOV_SCALE) / depth;
  return { x: screenX, y: screenY, depth };
}

function drawRoom(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const v = [
    project(PLAYER_X - 6, PLAYER_Y - 0.5, 0),
    project(PLAYER_X + 6, PLAYER_Y - 0.5, 0),
    project(PLAYER_X + 6, PLAYER_Y - 12, 0),
    project(PLAYER_X - 6, PLAYER_Y - 12, 0),
    project(PLAYER_X - 6, PLAYER_Y - 0.5, 3),
    project(PLAYER_X + 6, PLAYER_Y - 0.5, 3),
    project(PLAYER_X + 6, PLAYER_Y - 12, 3),
    project(PLAYER_X - 6, PLAYER_Y - 12, 3),
  ];

  if (v.some(p => !p)) return;
  const p = v as NonNullable<typeof v[0]>[];

  ctx.fillStyle = '#4a4a4a';
  ctx.beginPath();
  ctx.moveTo(p[3].x, p[3].y);
  ctx.lineTo(p[2].x, p[2].y);
  ctx.lineTo(p[6].x, p[6].y);
  ctx.lineTo(p[7].x, p[7].y);
  ctx.closePath();
  ctx.fill();

  const boardLeft = project(PLAYER_X - 3.5, PLAYER_Y - 12, 0.8);
  const boardRight = project(PLAYER_X + 3.5, PLAYER_Y - 12, 0.8);
  const boardTop = project(PLAYER_X - 3.5, PLAYER_Y - 12, 2.4);
  const boardBottom = project(PLAYER_X - 3.5, PLAYER_Y - 12, 0.8);

  if (boardLeft && boardRight && boardTop && boardBottom) {
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(boardLeft.x, boardTop.y, boardRight.x - boardLeft.x, boardBottom.y - boardTop.y);
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 3;
    ctx.strokeRect(boardLeft.x, boardTop.y, boardRight.x - boardLeft.x, boardBottom.y - boardTop.y);

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.fillText('ЭКЗАМЕН', (boardLeft.x + boardRight.x) / 2, (boardTop.y + boardBottom.y) / 2 + 8);
  }

  ctx.fillStyle = '#383838';
  ctx.beginPath();
  ctx.moveTo(p[0].x, p[0].y);
  ctx.lineTo(p[3].x, p[3].y);
  ctx.lineTo(p[7].x, p[7].y);
  ctx.lineTo(p[4].x, p[4].y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#383838';
  ctx.beginPath();
  ctx.moveTo(p[1].x, p[1].y);
  ctx.lineTo(p[2].x, p[2].y);
  ctx.lineTo(p[6].x, p[6].y);
  ctx.lineTo(p[5].x, p[5].y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#555555';
  ctx.beginPath();
  ctx.moveTo(p[4].x, p[4].y);
  ctx.lineTo(p[5].x, p[5].y);
  ctx.lineTo(p[6].x, p[6].y);
  ctx.lineTo(p[7].x, p[7].y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.moveTo(p[0].x, p[0].y);
  ctx.lineTo(p[1].x, p[1].y);
  ctx.lineTo(p[2].x, p[2].y);
  ctx.lineTo(p[3].x, p[3].y);
  ctx.closePath();
  ctx.fill();

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

function drawDesk(ctx: CanvasRenderingContext2D, wx: number, wy: number) {
  const { WIDTH, DEPTH, TOP_THICKNESS, HEIGHT, LEG_WIDTH, TOP_COLOR, TOP_SIDE_COLOR, LEG_COLOR, EDGE_COLOR } = DESK_CONFIG;

  const topCorners = [
    project(wx - WIDTH/2, wy - DEPTH/2, HEIGHT + TOP_THICKNESS),
    project(wx + WIDTH/2, wy - DEPTH/2, HEIGHT + TOP_THICKNESS),
    project(wx + WIDTH/2, wy + DEPTH/2, HEIGHT + TOP_THICKNESS),
    project(wx - WIDTH/2, wy + DEPTH/2, HEIGHT + TOP_THICKNESS),
  ];
  const bottomCorners = [
    project(wx - WIDTH/2, wy - DEPTH/2, HEIGHT),
    project(wx + WIDTH/2, wy - DEPTH/2, HEIGHT),
    project(wx + WIDTH/2, wy + DEPTH/2, HEIGHT),
    project(wx - WIDTH/2, wy + DEPTH/2, HEIGHT),
  ];

  if (topCorners.some(c => !c) || bottomCorners.some(c => !c)) return;
  const top = topCorners as NonNullable<typeof topCorners[0]>[];
  const bottom = bottomCorners as NonNullable<typeof bottomCorners[0]>[];

  ctx.fillStyle = TOP_SIDE_COLOR;
  ctx.beginPath();
  ctx.moveTo(top[0].x, top[0].y);
  ctx.lineTo(top[1].x, top[1].y);
  ctx.lineTo(bottom[1].x, bottom[1].y);
  ctx.lineTo(bottom[0].x, bottom[0].y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = EDGE_COLOR;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = TOP_COLOR;
  ctx.beginPath();
  ctx.moveTo(top[0].x, top[0].y);
  ctx.lineTo(top[1].x, top[1].y);
  ctx.lineTo(top[2].x, top[2].y);
  ctx.lineTo(top[3].x, top[3].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const legPositions = [
    { x: wx - WIDTH/2 + LEG_WIDTH, y: wy - DEPTH/2 + LEG_WIDTH },
    { x: wx + WIDTH/2 - LEG_WIDTH, y: wy - DEPTH/2 + LEG_WIDTH },
    { x: wx + WIDTH/2 - LEG_WIDTH, y: wy + DEPTH/2 - LEG_WIDTH },
    { x: wx - WIDTH/2 + LEG_WIDTH, y: wy + DEPTH/2 - LEG_WIDTH },
  ];

  ctx.fillStyle = LEG_COLOR;
  for (const leg of legPositions) {
    const topPt = project(leg.x, leg.y, HEIGHT);
    const bottomPt = project(leg.x, leg.y, 0);
    if (topPt && bottomPt) {
      const legWidth = Math.max(3, 8 / topPt.depth);
      ctx.fillRect(topPt.x - legWidth/2, topPt.y, legWidth, bottomPt.y - topPt.y);
    }
  }
}

function drawChair(ctx: CanvasRenderingContext2D, wx: number, wy: number) {
  const { SEAT_WIDTH, SEAT_DEPTH, SEAT_HEIGHT, SEAT_THICKNESS, BACK_HEIGHT, BACK_THICKNESS, LEG_WIDTH, SEAT_COLOR, BACK_COLOR, LEG_COLOR } = CHAIR_CONFIG;
  const chairY = wy + 0.35;

  const seatTop = [
    project(wx - SEAT_WIDTH/2, chairY - SEAT_DEPTH/2, SEAT_HEIGHT + SEAT_THICKNESS),
    project(wx + SEAT_WIDTH/2, chairY - SEAT_DEPTH/2, SEAT_HEIGHT + SEAT_THICKNESS),
    project(wx + SEAT_WIDTH/2, chairY + SEAT_DEPTH/2, SEAT_HEIGHT + SEAT_THICKNESS),
    project(wx - SEAT_WIDTH/2, chairY + SEAT_DEPTH/2, SEAT_HEIGHT + SEAT_THICKNESS),
  ];
  const seatBottom = [
    project(wx - SEAT_WIDTH/2, chairY - SEAT_DEPTH/2, SEAT_HEIGHT),
    project(wx + SEAT_WIDTH/2, chairY - SEAT_DEPTH/2, SEAT_HEIGHT),
    project(wx + SEAT_WIDTH/2, chairY + SEAT_DEPTH/2, SEAT_HEIGHT),
    project(wx - SEAT_WIDTH/2, chairY + SEAT_DEPTH/2, SEAT_HEIGHT),
  ];

  if (seatTop.some(c => !c) || seatBottom.some(c => !c)) return;
  const sTop = seatTop as NonNullable<typeof seatTop[0]>[];
  const sBottom = seatBottom as NonNullable<typeof seatBottom[0]>[];

  ctx.fillStyle = SEAT_COLOR;
  ctx.beginPath();
  ctx.moveTo(sTop[0].x, sTop[0].y);
  ctx.lineTo(sTop[1].x, sTop[1].y);
  ctx.lineTo(sBottom[1].x, sBottom[1].y);
  ctx.lineTo(sBottom[0].x, sBottom[0].y);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sTop[0].x, sTop[0].y);
  ctx.lineTo(sTop[1].x, sTop[1].y);
  ctx.lineTo(sTop[2].x, sTop[2].y);
  ctx.lineTo(sTop[3].x, sTop[3].y);
  ctx.closePath();
  ctx.fill();

  const backTop = [
    project(wx - SEAT_WIDTH/2, chairY + SEAT_DEPTH/2, BACK_HEIGHT),
    project(wx + SEAT_WIDTH/2, chairY + SEAT_DEPTH/2, BACK_HEIGHT),
    project(wx + SEAT_WIDTH/2, chairY + SEAT_DEPTH/2 - BACK_THICKNESS, BACK_HEIGHT),
    project(wx - SEAT_WIDTH/2, chairY + SEAT_DEPTH/2 - BACK_THICKNESS, BACK_HEIGHT),
  ];
  const backBottom = [
    project(wx - SEAT_WIDTH/2, chairY + SEAT_DEPTH/2, SEAT_HEIGHT + SEAT_THICKNESS),
    project(wx + SEAT_WIDTH/2, chairY + SEAT_DEPTH/2, SEAT_HEIGHT + SEAT_THICKNESS),
    project(wx + SEAT_WIDTH/2, chairY + SEAT_DEPTH/2 - BACK_THICKNESS, SEAT_HEIGHT + SEAT_THICKNESS),
    project(wx - SEAT_WIDTH/2, chairY + SEAT_DEPTH/2 - BACK_THICKNESS, SEAT_HEIGHT + SEAT_THICKNESS),
  ];

  if (backTop.some(c => !c) || backBottom.some(c => !c)) return;
  const bTop = backTop as NonNullable<typeof backTop[0]>[];
  const bBottom = backBottom as NonNullable<typeof backBottom[0]>[];

  ctx.fillStyle = BACK_COLOR;
  ctx.beginPath();
  ctx.moveTo(bTop[0].x, bTop[0].y);
  ctx.lineTo(bTop[1].x, bTop[1].y);
  ctx.lineTo(bBottom[1].x, bBottom[1].y);
  ctx.lineTo(bBottom[0].x, bBottom[0].y);
  ctx.closePath();
  ctx.fill();

  const legPositions = [
    { x: wx - SEAT_WIDTH/2 + LEG_WIDTH, y: chairY - SEAT_DEPTH/2 + LEG_WIDTH },
    { x: wx + SEAT_WIDTH/2 - LEG_WIDTH, y: chairY - SEAT_DEPTH/2 + LEG_WIDTH },
    { x: wx + SEAT_WIDTH/2 - LEG_WIDTH, y: chairY + SEAT_DEPTH/2 - LEG_WIDTH },
    { x: wx - SEAT_WIDTH/2 + LEG_WIDTH, y: chairY + SEAT_DEPTH/2 - LEG_WIDTH },
  ];

  ctx.fillStyle = LEG_COLOR;
  for (const leg of legPositions) {
    const topPt = project(leg.x, leg.y, SEAT_HEIGHT);
    const bottomPt = project(leg.x, leg.y, 0);
    if (topPt && bottomPt) {
      const legWidth = Math.max(2, 6 / topPt.depth);
      ctx.fillRect(topPt.x - legWidth/2, topPt.y, legWidth, bottomPt.y - topPt.y);
    }
  }
}

// 🔥 ИСПРАВЛЕНО: Изменён порядок отрисовки. Руки рисуются ПЕРЕД телом, чтобы торс их перекрывал.
function drawStudent(ctx: CanvasRenderingContext2D, wx: number, wy: number, raisedHand: boolean) {
  const { BODY_HEIGHT, SHOULDER_WIDTH, HIP_WIDTH, HEAD_RADIUS, NECK_HEIGHT, ARM_WIDTH, SHIRT_COLOR, SKIN_COLOR, HAIR_COLOR } = STUDENT_CONFIG;
  const seatHeight = CHAIR_CONFIG.SEAT_HEIGHT + CHAIR_CONFIG.SEAT_THICKNESS;
  const studentY = wy + 0.35;

  const hipZ = seatHeight;
  const shoulderZ = seatHeight + BODY_HEIGHT;
  const neckZ = shoulderZ + NECK_HEIGHT;
  const headZ = neckZ + HEAD_RADIUS;

  const hipPt = project(wx, studentY, hipZ);
  const shoulderPt = project(wx, studentY, shoulderZ);
  const neckPt = project(wx, studentY, neckZ);
  const headPt = project(wx, studentY, headZ);

  if (!hipPt || !shoulderPt || !neckPt || !headPt) return;

  const bodyHeight = Math.abs(shoulderPt.y - hipPt.y);
  if (bodyHeight < 2) return;

  const shoulderWidthScreen = bodyHeight * (SHOULDER_WIDTH / BODY_HEIGHT);
  const hipWidthScreen = bodyHeight * (HIP_WIDTH / BODY_HEIGHT);

  // 1️⃣ Сначала рисуем руки (они окажутся ПОД торсом)
  const armEndY = wy - DESK_CONFIG.DEPTH/2 + 0.15;
  const armEndZ = DESK_CONFIG.HEIGHT + DESK_CONFIG.TOP_THICKNESS;

  const leftArmStart = project(wx - SHOULDER_WIDTH/2, studentY, shoulderZ);
  const leftArmEnd = project(wx - SHOULDER_WIDTH/2 - 0.05, armEndY, armEndZ);
  const rightArmStart = project(wx + SHOULDER_WIDTH/2, studentY, shoulderZ);
  const rightArmEnd = project(wx + SHOULDER_WIDTH/2 + 0.05, armEndY, armEndZ);

  const armWidth = Math.max(3, shoulderWidthScreen * 0.18);
  ctx.strokeStyle = SKIN_COLOR;
  ctx.lineWidth = armWidth;
  ctx.lineCap = 'round';

  if (leftArmStart && leftArmEnd) {
    ctx.beginPath();
    ctx.moveTo(leftArmStart.x, leftArmStart.y);
    ctx.lineTo(leftArmEnd.x, leftArmEnd.y);
    ctx.stroke();
  }
  if (!raisedHand && rightArmStart && rightArmEnd) {
    ctx.beginPath();
    ctx.moveTo(rightArmStart.x, rightArmStart.y);
    ctx.lineTo(rightArmEnd.x, rightArmEnd.y);
    ctx.stroke();
  }
  if (raisedHand && rightArmStart) {
    const handUpPt = project(wx + SHOULDER_WIDTH/2 + 0.1, studentY, headZ + HEAD_RADIUS * 1.5);
    if (handUpPt) {
      ctx.strokeStyle = SKIN_COLOR;
      ctx.beginPath();
      ctx.moveTo(rightArmStart.x, rightArmStart.y);
      ctx.lineTo(handUpPt.x, handUpPt.y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,80,80,0.6)';
      ctx.beginPath();
      ctx.arc(handUpPt.x, handUpPt.y, armWidth * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2️⃣ Рисуем торс (перекроет части рук, проходящие сквозь спину/грудь)
  ctx.fillStyle = SHIRT_COLOR;
  ctx.beginPath();
  ctx.moveTo(shoulderPt.x - shoulderWidthScreen/2, shoulderPt.y);
  ctx.lineTo(shoulderPt.x + shoulderWidthScreen/2, shoulderPt.y);
  ctx.lineTo(hipPt.x + hipWidthScreen/2, hipPt.y);
  ctx.lineTo(hipPt.x - hipWidthScreen/2, hipPt.y);
  ctx.closePath();
  ctx.fill();

  // 3️⃣ Шея и голова
  const neckWidth = shoulderWidthScreen * 0.3;
  ctx.fillStyle = SKIN_COLOR;
  ctx.fillRect(neckPt.x - neckWidth/2, neckPt.y, neckWidth, headPt.y - neckPt.y);

  const headRadiusScreen = Math.max(5, bodyHeight * (HEAD_RADIUS / BODY_HEIGHT));
  ctx.fillStyle = SKIN_COLOR;
  ctx.beginPath();
  ctx.arc(headPt.x, headPt.y, headRadiusScreen, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = HAIR_COLOR;
  ctx.beginPath();
  ctx.arc(headPt.x, headPt.y - headRadiusScreen * 0.15, headRadiusScreen * 0.85, Math.PI, 0);
  ctx.fill();
}

function drawSingleDesk(ctx: CanvasRenderingContext2D, wx: number, wy: number, raisedHand: boolean) {
  drawDesk(ctx, wx, wy);
  drawChair(ctx, wx, wy);
  drawStudent(ctx, wx, wy, raisedHand);
}

// 🔥 ИСПРАВЛЕНО: Студенты сдвинуты к стенам (x: 1.5 и 8.5 вместо 3 и 7)
function drawStudentDesks(ctx: CanvasRenderingContext2D, distractionStudentIdx: number | null) {
  const deskPositions = [
    { x: 1.5, y: 3 }, { x: 1.5, y: 5 }, { x: 1.5, y: 7 }, { x: 1.5, y: 8.5 },
    { x: 8.5, y: 3 }, { x: 8.5, y: 5 }, { x: 8.5, y: 7 }, { x: 8.5, y: 8.5 },
  ];
  const sorted = deskPositions.map((d, i) => ({ ...d, idx: i })).sort((a, b) => a.y - b.y);
  for (const desk of sorted) {
    drawSingleDesk(ctx, desk.x, desk.y, distractionStudentIdx === desk.idx);
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
      drawRoom(ctx);
      drawStudentDesks(ctx, props.distraction?.active ? props.distraction.studentIndex : null);
      const sorted = [...props.proctors].sort((a, b) => a.y - b.y);
      for (const p of sorted) drawProctor(ctx, p);
      drawPlayerDesk(ctx, props.sheetOnDesk, props.sheetHidden, props.cheatingMode, -CANVAS_H / 3);
      drawPlayerHands(ctx, props.cheatingMode, props.hasSheetInHand, -CANVAS_H / 3);
      drawPhoneScreen(ctx);
    } else {
      drawRoom(ctx);
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