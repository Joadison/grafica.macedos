'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';

/* =====================================================================
   CONSTANTES
   ===================================================================== */

const SHAPES = [
  { id: 'circle', label: 'Círculo', lock: true },
  { id: 'ellipse', label: 'Oval' },
  { id: 'square', label: 'Quadrado', lock: true },
  { id: 'rect', label: 'Retângulo' },
  { id: 'rounded', label: 'Retângulo arredondado' },
  { id: 'hexagon', label: 'Hexágono' },
  { id: 'heart', label: 'Coração' },
  { id: 'star', label: 'Estrela', lock: true },
  { id: 'polaroid', label: 'Polaroid / Instax' },
];
const shapeLabel = (id) => (SHAPES.find((s) => s.id === id) || {}).label || id;
const isLocked = (id) => !!(SHAPES.find((s) => s.id === id) || {}).lock;

// Medidas em mm. side/top/bottom = largura da moldura branca.
const POLAROID_PRESETS = [
  { id: 'classic', label: 'Polaroid clássica 88×107', w: 88, h: 107, side: 4.5, top: 4.5, bottom: 23.5 },
  { id: 'big', label: 'Polaroid grande 100×120', w: 100, h: 120, side: 5, top: 5, bottom: 25 },
  { id: 'mini-pol', label: 'Polaroid mini 60×73', w: 60, h: 73, side: 3, top: 3, bottom: 16 },
  { id: 'tiny', label: 'Polaroid pequena 40×48', w: 40, h: 48, side: 2.5, top: 2.5, bottom: 10.5 },
  { id: 'instax-mini', label: 'Instax Mini 54×86', w: 54, h: 86, side: 3.5, top: 5, bottom: 18 },
  { id: 'instax-square', label: 'Instax Square 72×86', w: 72, h: 86, side: 5, top: 5, bottom: 19 },
  { id: 'instax-wide', label: 'Instax Wide 108×86', w: 108, h: 86, side: 4.5, top: 4.5, bottom: 19.5 },
];

const TAG_SIZES = [
  [25, 25], [30, 30], [38, 38], [44, 44], [50, 50], [58, 58], [75, 75],
  [50, 70], [40, 60], [90, 55],
];

const PAPERS = {
  A4: [210, 297],
  A3: [297, 420],
  A5: [148, 210],
  Carta: [215.9, 279.4],
};

const CAPTION_FONT = "'Caveat', 'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive";
const POLAROID_RADIUS_MM = 0.8;
const PRINT_DPI = 300;

const mmToPx = (mm, dpi = PRINT_DPI) => Math.round((mm / 25.4) * dpi);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

let idCounter = 0;
function newId() {
  idCounter += 1;
  return `q${Date.now()}_${idCounter}`;
}

/* =====================================================================
   GEOMETRIA DAS FORMAS (usada no canvas e no PDF)
   ===================================================================== */

const polyCache = {};
function unitPolygon(shape) {
  if (polyCache[shape]) return polyCache[shape];
  let pts = [];
  if (shape === 'hexagon') {
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i;
      pts.push([Math.cos(a), Math.sin(a)]);
    }
  } else if (shape === 'star') {
    for (let i = 0; i < 10; i += 1) {
      const a = -Math.PI / 2 + (Math.PI / 5) * i;
      const r = i % 2 === 0 ? 1 : 0.42;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  } else if (shape === 'heart') {
    for (let i = 0; i < 90; i += 1) {
      const t = (i / 90) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      pts.push([x, y]);
    }
  }
  // normaliza para a caixa 0..1
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  pts = pts.map(([x, y]) => [(x - minX) / (maxX - minX), (y - minY) / (maxY - minY)]);
  polyCache[shape] = pts;
  return pts;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
}

function radiusMm(cfg) {
  if (cfg.shape === 'polaroid') return POLAROID_RADIUS_MM;
  if (cfg.shape === 'rounded') return cfg.cornerMm;
  return 0;
}

function tracePath(ctx, x, y, w, h, shape, r) {
  ctx.beginPath();
  switch (shape) {
    case 'circle':
    case 'ellipse':
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'rounded':
    case 'polaroid':
      roundRectPath(ctx, x, y, w, h, r);
      break;
    case 'hexagon':
    case 'star':
    case 'heart': {
      const pts = unitPolygon(shape);
      pts.forEach(([px, py], i) => {
        const X = x + px * w;
        const Y = y + py * h;
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      });
      break;
    }
    default:
      ctx.rect(x, y, w, h);
  }
  ctx.closePath();
}

/* =====================================================================
   DESENHO DO DESIGN (preview, miniatura, PNG e PDF usam a mesma função)
   ===================================================================== */

function getWindow(cfg, W, H) {
  if (cfg.shape !== 'polaroid') return { x: 0, y: 0, w: W, h: H };
  const k = W / cfg.wMm;
  return {
    x: cfg.frame.side * k,
    y: cfg.frame.top * k,
    w: Math.max(1, W - 2 * cfg.frame.side * k),
    h: Math.max(1, H - (cfg.frame.top + cfg.frame.bottom) * k),
  };
}

function offsetLimits(img, win, zoom) {
  const base = Math.max(win.w / img.width, win.h / img.height);
  const dw = img.width * base * zoom;
  const dh = img.height * base * zoom;
  return {
    maxX: Math.max(0, (dw - win.w) / 2) / win.w,
    maxY: Math.max(0, (dh - win.h) / 2) / win.h,
  };
}

function drawDesign(ctx, W, H, cfg, img, ed, preview) {
  ctx.clearRect(0, 0, W, H);
  const k = W / cfg.wMm;
  const win = getWindow(cfg, W, H);

  ctx.save();
  tracePath(ctx, 0, 0, W, H, cfg.shape, radiusMm(cfg) * k);
  ctx.clip();

  if (cfg.shape === 'polaroid') {
    ctx.fillStyle = '#fbfaf6';
    ctx.fillRect(0, 0, W, H);
  }

  // janela da foto
  ctx.save();
  ctx.beginPath();
  ctx.rect(win.x, win.y, win.w, win.h);
  ctx.clip();
  if (img) {
    const base = Math.max(win.w / img.width, win.h / img.height);
    const scale = base * ed.zoom;
    const dw = img.width * scale;
    const dh = img.height * scale;
    const { maxX, maxY } = offsetLimits(img, win, ed.zoom);
    const ox = clamp(ed.offX, -maxX, maxX);
    const oy = clamp(ed.offY, -maxY, maxY);
    const dx = win.x + (win.w - dw) / 2 + ox * win.w;
    const dy = win.y + (win.h - dh) / 2 + oy * win.h;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else if (preview) {
    ctx.fillStyle = '#d9d5c9';
    ctx.fillRect(win.x, win.y, win.w, win.h);
    ctx.fillStyle = '#6b665a';
    ctx.font = `${Math.max(12, Math.min(win.w, win.h) * 0.07)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Envie uma foto', win.x + win.w / 2, win.y + win.h / 2);
  }
  ctx.restore();

  // legenda da polaroid
  if (cfg.shape === 'polaroid' && cfg.caption) {
    const area = cfg.frame.bottom * k;
    const maxW = W - 2 * cfg.frame.side * k;
    let fs = area * 0.42;
    ctx.font = `${fs}px ${CAPTION_FONT}`;
    while (ctx.measureText(cfg.caption).width > maxW && fs > 4) {
      fs -= 1;
      ctx.font = `${fs}px ${CAPTION_FONT}`;
    }
    ctx.fillStyle = '#2f2b26';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.caption, W / 2, H - area / 2);
  }
  ctx.restore();

  // contorno de corte (só no preview)
  if (preview) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#E2412D';
    ctx.lineWidth = 1.5;
    tracePath(ctx, 1, 1, W - 2, H - 2, cfg.shape, radiusMm(cfg) * k);
    ctx.stroke();
    ctx.restore();
  }
}

function renderToCanvas(cfg, img, ed, widthPx) {
  const W = Math.max(1, Math.round(widthPx));
  const H = Math.max(1, Math.round((widthPx * cfg.hMm) / cfg.wMm));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  drawDesign(c.getContext('2d'), W, H, cfg, img, ed, false);
  return c;
}

function makeItem(cfg, img, ed, name) {
  const long = 360;
  const wPx = cfg.wMm >= cfg.hMm ? long : (long * cfg.wMm) / cfg.hMm;
  const thumb = renderToCanvas(cfg, img, ed, wPx).toDataURL('image/png');
  return {
    id: newId(),
    name,
    cfg: { ...cfg, frame: { ...cfg.frame } },
    img,
    ed: { ...ed },
    thumb,
    copies: 1,
  };
}

/* =====================================================================
   ENCAIXE NA FOLHA (linhas de peças de tamanhos diferentes)
   ===================================================================== */

function packItems(list, o) {
  const { pageW, pageH, margin, spacing, optimize, center } = o;
  const usableW = pageW - 2 * margin;
  const usableH = pageH - 2 * margin;
  const EPS = 0.001;

  let arr = list.map((p, i) => ({ ...p, i }));
  const oversized = arr.filter((p) => p.w > usableW + EPS || p.h > usableH + EPS).length;
  if (oversized) return { pages: [], oversized };
  if (optimize) arr.sort((a, b) => b.h - a.h || a.i - b.i);

  const rows = [];
  let row = { items: [], w: 0, h: 0 };
  arr.forEach((p) => {
    const nw = row.items.length ? row.w + spacing + p.w : p.w;
    if (row.items.length && nw > usableW + EPS) {
      rows.push(row);
      row = { items: [p], w: p.w, h: p.h };
    } else {
      row.items.push(p);
      row.w = nw;
      row.h = Math.max(row.h, p.h);
    }
  });
  if (row.items.length) rows.push(row);

  const pages = [];
  let cur = null;
  rows.forEach((r) => {
    if (!cur) {
      cur = { rows: [], h: 0 };
      pages.push(cur);
    }
    const need = cur.rows.length ? cur.h + spacing + r.h : r.h;
    if (cur.rows.length && need > usableH + EPS) {
      cur = { rows: [r], h: r.h };
      pages.push(cur);
    } else {
      cur.rows.push(r);
      cur.h = need;
    }
  });

  const placed = pages.map((pg) => {
    const out = [];
    let y = margin + (center ? (usableH - pg.h) / 2 : 0);
    pg.rows.forEach((r) => {
      let x = margin + (center ? (usableW - r.w) / 2 : 0);
      r.items.forEach((p) => {
        out.push({ ...p, x, y: y + (r.h - p.h) / 2 });
        x += p.w + spacing;
      });
      y += r.h + spacing;
    });
    return out;
  });
  return { pages: placed, oversized: 0 };
}

/* =====================================================================
   LINHA DE CORTE VETORIAL NO PDF
   ===================================================================== */

function drawGuide(doc, cfg, x, y, w, h) {
  doc.setDrawColor(226, 65, 45);
  doc.setLineWidth(0.15);
  doc.setLineDashPattern([1.2, 1], 0);
  switch (cfg.shape) {
    case 'circle':
      doc.circle(x + w / 2, y + h / 2, w / 2, 'S');
      break;
    case 'ellipse':
      doc.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 'S');
      break;
    case 'rounded': {
      const r = Math.min(cfg.cornerMm, w / 2, h / 2);
      doc.roundedRect(x, y, w, h, r, r, 'S');
      break;
    }
    case 'polaroid':
      doc.roundedRect(x, y, w, h, POLAROID_RADIUS_MM, POLAROID_RADIUS_MM, 'S');
      break;
    case 'hexagon':
    case 'star':
    case 'heart': {
      const pts = unitPolygon(cfg.shape).map(([px, py]) => [x + px * w, y + py * h]);
      const segs = [];
      for (let i = 1; i < pts.length; i += 1) {
        segs.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
      }
      doc.lines(segs, pts[0][0], pts[0][1], [1, 1], 'S', true);
      break;
    }
    default:
      doc.rect(x, y, w, h, 'S');
  }
  doc.setLineDashPattern([], 0);
}

/* =====================================================================
   INPUT NUMÉRICO (permite apagar e digitar sem "pular" para o padrão)
   ===================================================================== */

function NumInput({ value, onChange, min = 1, max = 1000, step = 1 }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => {
    if (parseFloat(txt) !== value) setTxt(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={txt}
      onChange={(e) => {
        setTxt(e.target.value);
        const v = parseFloat(e.target.value);
        if (!Number.isNaN(v) && v >= min && v <= max) onChange(v);
      }}
    />
  );
}

/* =====================================================================
   PÁGINA
   ===================================================================== */

export default function EditorPage() {
  const [activeTab, setActiveTab] = useState('editor');

  /* ---------- Editor ---------- */
  const canvasRef = useRef(null);
  const edRef = useRef({ offX: 0, offY: 0 });
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // várias fotos: cada uma guarda seu próprio zoom e posição
  const [photos, setPhotos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const activePhoto = photos.find((p) => p.id === activeId) || null;
  const photo = activePhoto ? activePhoto.img : null;
  const [shape, setShape] = useState('circle');
  const [wMm, setWMm] = useState(50);
  const [hMm, setHMm] = useState(50);
  const [cornerMm, setCornerMm] = useState(6);
  const [frame, setFrame] = useState({ side: 4.5, top: 4.5, bottom: 23.5 });
  const [polaPreset, setPolaPreset] = useState('classic');
  const [caption, setCaption] = useState('');
  const [zoomPct, setZoomPct] = useState(100);
  const [editorStatus, setEditorStatus] = useState({ text: '', err: false });

  const cfg = useMemo(
    () => ({ shape, wMm, hMm, cornerMm, frame, caption }),
    [shape, wMm, hMm, cornerMm, frame, caption]
  );

  function paint() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxDim = 420;
    const ratio = cfg.wMm / cfg.hMm;
    const cw = Math.round(ratio >= 1 ? maxDim : maxDim * ratio);
    const ch = Math.round(ratio >= 1 ? maxDim / ratio : maxDim);
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;
    drawDesign(
      canvas.getContext('2d'),
      canvas.width,
      canvas.height,
      cfg,
      photo,
      { zoom: zoomPct / 100, offX: edRef.current.offX, offY: edRef.current.offY },
      true
    );
  }

  useEffect(() => {
    if (activeTab === 'editor') paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, photo, zoomPct, activeTab]);

  function resetFraming() {
    edRef.current = { offX: 0, offY: 0 };
    setZoomPct(100);
  }

  function readImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // guarda o enquadramento atual dentro da foto ativa
  function snapshotPhotos() {
    return photos.map((p) =>
      p.id === activeId
        ? { ...p, zoom: zoomPct / 100, offX: edRef.current.offX, offY: edRef.current.offY }
        : p
    );
  }

  function loadFraming(p) {
    edRef.current = { offX: p ? p.offX : 0, offY: p ? p.offY : 0 };
    setZoomPct(p ? Math.round(p.zoom * 100) : 100);
  }

  function selectPhoto(id) {
    if (id === activeId) return;
    const snap = snapshotPhotos();
    setPhotos(snap);
    loadFraming(snap.find((p) => p.id === id));
    setActiveId(id);
  }

  function removePhoto(id) {
    const rest = photos.filter((p) => p.id !== id);
    setPhotos(rest);
    if (id === activeId) {
      loadFraming(rest[0]);
      setActiveId(rest[0] ? rest[0].id : null);
    }
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (!files.length) return;
    const loaded = [];
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const img = await readImage(file);
      loaded.push({ id: newId(), name: file.name, img, zoom: 1, offX: 0, offY: 0 });
    }
    setPhotos((prev) => [...prev, ...loaded]);
    if (!activeId) {
      loadFraming(loaded[0]);
      setActiveId(loaded[0].id);
    }
    setEditorStatus({ text: `${loaded.length} foto(s) carregada(s).`, err: false });
  }

  function applyPreset(id) {
    const p = POLAROID_PRESETS.find((x) => x.id === id);
    setPolaPreset(id);
    if (!p) return;
    setWMm(p.w);
    setHMm(p.h);
    setFrame({ side: p.side, top: p.top, bottom: p.bottom });
  }

  function handleShapeChange(e) {
    const value = e.target.value;
    if (value === 'polaroid') {
      applyPreset(polaPreset === 'custom' ? 'classic' : polaPreset);
    } else if (shape === 'polaroid') {
      setWMm(50);
      setHMm(50);
    } else if (isLocked(value)) {
      setHMm(wMm);
    }
    setShape(value);
    resetFraming();
  }

  function handleW(v) {
    setWMm(v);
    if (isLocked(shape)) setHMm(v);
    if (shape === 'polaroid') setPolaPreset('custom');
  }
  function handleH(v) {
    setHMm(v);
    if (shape === 'polaroid') setPolaPreset('custom');
  }
  function handleFrame(key, v) {
    setFrame((f) => ({ ...f, [key]: v }));
    setPolaPreset('custom');
  }
  function applyTagSize(w, h) {
    setWMm(w);
    setHMm(isLocked(shape) ? w : h);
  }

  function handlePointerDown(e) {
    if (!photo) return;
    draggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e) {
    if (!draggingRef.current || !photo) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const win = getWindow(cfg, canvas.width, canvas.height);
    const { maxX, maxY } = offsetLimits(photo, win, zoomPct / 100);
    edRef.current.offX = clamp(
      edRef.current.offX + ((e.clientX - lastPosRef.current.x) * sx) / win.w,
      -maxX,
      maxX
    );
    edRef.current.offY = clamp(
      edRef.current.offY + ((e.clientY - lastPosRef.current.y) * sy) / win.h,
      -maxY,
      maxY
    );
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    paint();
  }
  function handlePointerUp() {
    draggingRef.current = false;
  }

  function currentEd() {
    return { zoom: zoomPct / 100, offX: edRef.current.offX, offY: edRef.current.offY };
  }

  function handleDownload() {
    if (!photo) {
      setEditorStatus({ text: 'Envie uma foto primeiro.', err: true });
      return;
    }
    const c = renderToCanvas(cfg, photo, currentEd(), mmToPx(wMm));
    c.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${shape}-${wMm}x${hMm}mm.png`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
    setEditorStatus({ text: `Imagem baixada em ${wMm}×${hMm} mm (300 dpi, fundo transparente).`, err: false });
  }

  function handleAddToQueue() {
    if (!photo) {
      setEditorStatus({ text: 'Envie uma foto primeiro.', err: true });
      return;
    }
    const item = makeItem(cfg, photo, currentEd(), activePhoto ? activePhoto.name : shapeLabel(shape));
    setTagQueue((q) => [...q, item]);
    setEditorStatus({ text: 'Adicionada à folha ✓', err: false });
  }

  // adiciona todas as fotos carregadas, cada uma com seu enquadramento
  function handleAddAll() {
    if (!photos.length) {
      setEditorStatus({ text: 'Envie ao menos uma foto primeiro.', err: true });
      return;
    }
    const items = snapshotPhotos().map((p) =>
      makeItem(cfg, p.img, { zoom: p.zoom, offX: p.offX, offY: p.offY }, p.name)
    );
    setTagQueue((q) => [...q, ...items]);
    setEditorStatus({ text: `${items.length} foto(s) adicionada(s) à folha ✓`, err: false });
  }

  /* ---------- Folha ---------- */
  const [tagQueue, setTagQueue] = useState([]);
  const [paper, setPaper] = useState('A4');
  const [landscape, setLandscape] = useState(false);
  const [marginMm, setMarginMm] = useState(5);
  const [spacingMm, setSpacingMm] = useState(2);
  const [optimize, setOptimize] = useState(true);
  const [center, setCenter] = useState(true);
  const [cutLine, setCutLine] = useState(true);
  const [previewPage, setPreviewPage] = useState(0);
  const [genStatus, setGenStatus] = useState({ text: '', err: false });

  const [pw, ph] = landscape ? [PAPERS[paper][1], PAPERS[paper][0]] : PAPERS[paper];

  const layoutOpts = { pageW: pw, pageH: ph, margin: marginMm, spacing: spacingMm, optimize, center };

  const layout = useMemo(() => {
    const flat = [];
    tagQueue.forEach((item) => {
      for (let i = 0; i < item.copies; i += 1) {
        flat.push({ w: item.cfg.wMm, h: item.cfg.hMm, item });
      }
    });
    return packItems(flat, { pageW: pw, pageH: ph, margin: marginMm, spacing: spacingMm, optimize, center });
  }, [tagQueue, pw, ph, marginMm, spacingMm, optimize, center]);

  const totalPieces = tagQueue.reduce((s, i) => s + i.copies, 0);
  const totalPages = layout.pages.length;
  const shownPage = Math.min(previewPage, Math.max(0, totalPages - 1));

  async function handleExtraImages(e) {
    const files = Array.from(e.target.files);
    e.target.value = '';
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const image = await readImage(file);
      const item = makeItem(cfg, image, { zoom: 1, offX: 0, offY: 0 }, file.name);
      setTagQueue((q) => [...q, item]);
    }
  }

  function updateCopies(id, value) {
    setTagQueue((q) =>
      q.map((it) => (it.id === id ? { ...it, copies: Math.max(1, parseInt(value, 10) || 1) } : it))
    );
  }
  function removeItem(id) {
    setTagQueue((q) => q.filter((it) => it.id !== id));
  }
  function clearQueue() {
    setTagQueue([]);
    setGenStatus({ text: '', err: false });
  }

  // calcula quantas cópias da peça cabem em uma folha
  function fillSheet(id) {
    const item = tagQueue.find((it) => it.id === id);
    if (!item) return;
    let n = 0;
    for (let c = 1; c <= 800; c += 1) {
      const list = Array.from({ length: c }, () => ({ w: item.cfg.wMm, h: item.cfg.hMm }));
      const r = packItems(list, layoutOpts);
      if (r.oversized || r.pages.length > 1) break;
      n = c;
    }
    if (n > 0) updateCopies(id, n);
    else setGenStatus({ text: 'Essa peça é maior que a área útil da folha.', err: true });
  }

  function handleGeneratePdf() {
    setGenStatus({ text: '', err: false });
    if (tagQueue.length === 0) {
      setGenStatus({ text: 'Adicione ao menos uma imagem antes de gerar.', err: true });
      return;
    }
    if (layout.oversized) {
      setGenStatus({
        text: `${layout.oversized} peça(s) não cabem na folha ${paper}. Reduza o tamanho, as margens ou escolha uma folha maior.`,
        err: true,
      });
      return;
    }
    try {
      const orientation = pw > ph ? 'landscape' : 'portrait';
      const doc = new jsPDF({ unit: 'mm', format: [pw, ph], orientation });
      const cache = new Map();

      layout.pages.forEach((page, pi) => {
        if (pi > 0) doc.addPage([pw, ph], orientation);
        page.forEach((p) => {
          const it = p.item;
          if (!cache.has(it.id)) {
            const c = renderToCanvas(it.cfg, it.img, it.ed, mmToPx(it.cfg.wMm));
            cache.set(it.id, c.toDataURL('image/png'));
          }
          doc.addImage(cache.get(it.id), 'PNG', p.x, p.y, p.w, p.h, it.id, 'FAST');
          if (cutLine) drawGuide(doc, it.cfg, p.x, p.y, p.w, p.h);
        });
      });

      doc.save(`folha_${paper}_${Date.now()}.pdf`);
      setGenStatus({
        text: `PDF gerado: ${totalPieces} peça(s) em ${layout.pages.length} folha(s) ${paper}.`,
        err: false,
      });
    } catch (err) {
      console.error(err);
      setGenStatus({ text: 'Não foi possível gerar o PDF. Tente com menos imagens ou fotos menores.', err: true });
    }
  }

  const sizeLabel =
    shape === 'circle' ? 'Diâmetro (mm)' : shape === 'square' ? 'Lado (mm)' : shape === 'star' ? 'Tamanho (mm)' : 'Largura (mm)';

  return (
    <div className="editor-page">
      <header className="top-header">
        <div className="brand">
          <svg className="regmark" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" />
            <line x1="8" y1="0" x2="8" y2="16" />
            <line x1="0" y1="8" x2="16" y2="8" />
          </svg>
          <div>
            <h1>Gráfica Macedo&apos;s</h1>
            <p>Editor de fotos &amp; gerador de tags, polaroids e adesivos com corte</p>
          </div>
        </div>
        <Link href="/" className="back-link">← Voltar ao site</Link>
      </header>

      <nav className="tabs">
        <button className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>
          Editor de Foto
        </button>
        <button className={`tab-btn ${activeTab === 'gerador' ? 'active' : ''}`} onClick={() => setActiveTab('gerador')}>
          Folha de Impressão{tagQueue.length > 0 ? ` (${totalPieces})` : ''}
        </button>
      </nav>

      <main>
        {activeTab === 'editor' && (
          <section className="panel active">
            <h2 className="section-title">Escolha o formato, enquadre a foto e adicione à folha</h2>
            <div className="grid-2">
              <div>
                <div className="field">
                  <label>Fotos (pode selecionar várias)</label>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
                  {photos.length > 0 && (
                    <div className="photo-strip">
                      {photos.map((p) => (
                        <div
                          key={p.id}
                          className={`strip-item ${p.id === activeId ? 'on' : ''}`}
                          onClick={() => selectPhoto(p.id)}
                          title={p.name}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.img.src} alt={p.name} />
                          <button
                            type="button"
                            className="strip-x"
                            title="Remover foto"
                            onClick={(ev) => { ev.stopPropagation(); removePhoto(p.id); }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="field">
                  <label>Formato</label>
                  <select value={shape} onChange={handleShapeChange}>
                    {SHAPES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {shape === 'polaroid' ? (
                  <>
                    <div className="field">
                      <label>Modelo</label>
                      <select value={polaPreset} onChange={(e) => applyPreset(e.target.value)}>
                        {POLAROID_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                        <option value="custom">Personalizada</option>
                      </select>
                    </div>
                    <div className="row2">
                      <div className="field">
                        <label>Largura (mm)</label>
                        <NumInput value={wMm} min={10} onChange={handleW} step={0.5} />
                      </div>
                      <div className="field">
                        <label>Altura (mm)</label>
                        <NumInput value={hMm} min={10} onChange={handleH} step={0.5} />
                      </div>
                    </div>
                    <div className="row3">
                      <div className="field">
                        <label>Borda lateral</label>
                        <NumInput value={frame.side} min={0} max={40} step={0.5} onChange={(v) => handleFrame('side', v)} />
                      </div>
                      <div className="field">
                        <label>Borda topo</label>
                        <NumInput value={frame.top} min={0} max={40} step={0.5} onChange={(v) => handleFrame('top', v)} />
                      </div>
                      <div className="field">
                        <label>Borda base</label>
                        <NumInput value={frame.bottom} min={0} max={80} step={0.5} onChange={(v) => handleFrame('bottom', v)} />
                      </div>
                    </div>
                    <div className="field">
                      <label>Legenda (opcional)</label>
                      <input
                        type="text"
                        maxLength={60}
                        value={caption}
                        placeholder="Ex.: Verão 2026"
                        onChange={(e) => setCaption(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="field">
                      <label>Tamanhos rápidos (mm)</label>
                      <div className="chips">
                        {TAG_SIZES.filter(([w, h]) => !isLocked(shape) || w === h).map(([w, h]) => (
                          <button
                            key={`${w}x${h}`}
                            type="button"
                            className={`chip ${wMm === w && hMm === (isLocked(shape) ? w : h) ? 'on' : ''}`}
                            onClick={() => applyTagSize(w, h)}
                          >
                            {isLocked(shape) ? w : `${w}×${h}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="row2">
                      <div className="field">
                        <label>{sizeLabel}</label>
                        <NumInput value={wMm} min={5} onChange={handleW} step={0.5} />
                      </div>
                      {!isLocked(shape) && (
                        <div className="field">
                          <label>Altura (mm)</label>
                          <NumInput value={hMm} min={5} onChange={handleH} step={0.5} />
                        </div>
                      )}
                    </div>
                    {shape === 'rounded' && (
                      <div className="field">
                        <label>Raio dos cantos (mm)</label>
                        <NumInput value={cornerMm} min={0} max={50} step={0.5} onChange={setCornerMm} />
                      </div>
                    )}
                  </>
                )}

                <div className="field">
                  <label>Zoom</label>
                  <input type="range" min="100" max="400" value={zoomPct} onChange={(e) => setZoomPct(parseFloat(e.target.value))} />
                </div>
                <div className="btn-row">
                  <button className="btn btn-secondary" onClick={() => { resetFraming(); paint(); }}>Centralizar</button>
                </div>
                <div className="btn-row" style={{ marginTop: 18 }}>
                  <button className="btn btn-sage btn-block" onClick={handleAddToQueue}>＋ Adicionar esta foto à folha</button>
                </div>
                {photos.length > 1 && (
                  <div className="btn-row">
                    <button className="btn btn-primary btn-block" onClick={handleAddAll}>＋ Adicionar todas ({photos.length}) à folha</button>
                  </div>
                )}
                <div className="btn-row">
                  <button className="btn btn-secondary btn-block" onClick={handleDownload}>Baixar PNG (300 dpi)</button>
                </div>
                <p className={`status-msg ${editorStatus.err ? 'err' : ''}`}>{editorStatus.text}</p>
              </div>

              <div>
                <div className="canvas-wrap">
                  <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  />
                </div>
                <p className="hint">
                  {shapeLabel(shape)} · {wMm}×{hMm} mm · arraste a foto para posicionar e use o zoom para enquadrar
                </p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'gerador' && (
          <section className="panel active">
            <h2 className="section-title">Monte a folha com linhas de corte</h2>
            <div className="grid-2">
              <div>
                <div className="row2">
                  <div className="field">
                    <label>Folha</label>
                    <select value={paper} onChange={(e) => setPaper(e.target.value)}>
                      {Object.keys(PAPERS).map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Orientação</label>
                    <select value={landscape ? 'l' : 'p'} onChange={(e) => setLandscape(e.target.value === 'l')}>
                      <option value="p">Retrato</option>
                      <option value="l">Paisagem</option>
                    </select>
                  </div>
                </div>
                <div className="row2">
                  <div className="field">
                    <label>Margem da folha (mm)</label>
                    <NumInput value={marginMm} min={0} max={50} step={0.5} onChange={setMarginMm} />
                  </div>
                  <div className="field">
                    <label>Espaço entre peças (mm)</label>
                    <NumInput value={spacingMm} min={0} max={50} step={0.5} onChange={setSpacingMm} />
                  </div>
                </div>

                <label className="check"><input type="checkbox" checked={cutLine} onChange={(e) => setCutLine(e.target.checked)} /> Linha de corte tracejada</label>
                <label className="check"><input type="checkbox" checked={optimize} onChange={(e) => setOptimize(e.target.checked)} /> Aproveitar melhor a folha (agrupa por altura)</label>
                <label className="check"><input type="checkbox" checked={center} onChange={(e) => setCenter(e.target.checked)} /> Centralizar na folha</label>

                <div className="upload-extra">
                  <div className="dropzone">+ fotos</div>
                  <label htmlFor="extraImgInput">Enviar várias fotos de uma vez</label>
                  <p className="hint" style={{ marginTop: 6 }}>
                    Usa o formato do editor agora: {shapeLabel(shape)} {wMm}×{hMm} mm
                  </p>
                  <input id="extraImgInput" type="file" accept="image/*" multiple onChange={handleExtraImages} />
                </div>
              </div>

              <div>
                <div className="stats-bar">
                  <div><span className="k">Peças</span><span className="v">{totalPieces}</span></div>
                  <div><span className="k">1ª folha</span><span className="v">{layout.pages[0] ? layout.pages[0].length : 0}</span></div>
                  <div><span className="k">Folhas {paper}</span><span className="v">{totalPages}</span></div>
                </div>

                {layout.oversized > 0 && (
                  <p className="status-msg err">
                    {layout.oversized} peça(s) maiores que a área útil da folha. Reduza o tamanho, as margens ou escolha uma folha maior.
                  </p>
                )}

                {tagQueue.length === 0 ? (
                  <div className="queue-empty">
                    Nenhuma peça ainda. Escolha um formato no <strong>Editor de Foto</strong> e toque em <strong>Adicionar à folha</strong>, ou envie várias fotos aqui.
                  </div>
                ) : (
                  <div className="queue-grid">
                    {tagQueue.map((item) => (
                      <div className="queue-card" key={item.id}>
                        <div className="thumb-wrap">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.thumb} alt={item.name} />
                        </div>
                        <div className="meta">
                          <div className="name" title={item.name}>{item.name}</div>
                          <div className="size">{shapeLabel(item.cfg.shape)} · {item.cfg.wMm}×{item.cfg.hMm} mm</div>
                          <div className="copies-row">
                            <span>cópias</span>
                            <input type="number" min="1" value={item.copies} onChange={(e) => updateCopies(item.id, e.target.value)} />
                            <button className="remove-btn" onClick={() => removeItem(item.id)} title="Remover">✕</button>
                          </div>
                          <button className="fill-btn" onClick={() => fillSheet(item.id)}>Encher uma folha</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {totalPages > 0 && (
                  <div className="sheet-preview">
                    <div className="sheet-head">
                      <span>Pré-visualização · folha {shownPage + 1} de {totalPages}</span>
                      <span className="sheet-nav">
                        <button className="chip" disabled={shownPage === 0} onClick={() => setPreviewPage(shownPage - 1)}>‹</button>
                        <button className="chip" disabled={shownPage >= totalPages - 1} onClick={() => setPreviewPage(shownPage + 1)}>›</button>
                      </span>
                    </div>
                    <svg className="sheet-svg" viewBox={`0 0 ${pw} ${ph}`}>
                      <rect width={pw} height={ph} fill="#ffffff" />
                      {layout.pages[shownPage].map((p, i) => (
                        <image key={i} href={p.item.thumb} x={p.x} y={p.y} width={p.w} height={p.h} preserveAspectRatio="none" />
                      ))}
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="btn-row" style={{ marginTop: 22 }}>
              <button className="btn btn-primary" onClick={handleGeneratePdf}>Gerar PDF ({paper})</button>
              <button className="btn btn-secondary" onClick={clearQueue}>Limpar tudo</button>
            </div>
            <p className={`status-msg ${genStatus.err ? 'err' : ''}`}>{genStatus.text}</p>
          </section>
        )}
      </main>

      <footer>Ferramenta interna Gráfica Macedo&apos;s — recorte, monte e imprima tags, adesivos e polaroids.</footer>

      <style jsx>{`
        .regmark { width: 16px; height: 16px; opacity: 0.55; flex: none; }
        .regmark circle { fill: none; stroke: var(--paper-dim); stroke-width: 1.2; }
        .regmark line { stroke: var(--paper-dim); stroke-width: 1.2; }

        .top-header {
          padding: 28px 24px 20px;
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand :global(h1) {
          font-family: 'Oswald', sans-serif;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--paper);
        }
        .brand :global(p) { margin-top: 2px; font-size: 12.5px; color: var(--paper-dim); letter-spacing: 0.3px; }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px dashed var(--paper-dim);
          padding: 8px 14px;
          border-radius: 20px;
          color: var(--paper);
          font-size: 13px;
          font-weight: 500;
          transition: border-color 0.15s, color 0.15s;
        }
        .back-link:hover { border-color: var(--red); color: var(--red); }

        .tabs { display: flex; gap: 10px; padding: 20px 24px 0; max-width: 1180px; margin: 0 auto; }
        .tab-btn {
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          font-weight: 600;
          background: var(--panel);
          color: var(--paper-dim);
          border: 1px solid var(--line);
          border-bottom: none;
          padding: 12px 20px;
          border-radius: 10px 10px 0 0;
          cursor: pointer;
          position: relative;
          top: 1px;
        }
        .tab-btn.active { background: var(--panel-2); color: var(--paper); }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: -1px;
          height: 2px;
          background: var(--red);
        }

        main { max-width: 1180px; margin: 0 auto; padding: 0 24px 60px; }
        .panel {
          background: var(--panel-2);
          border: 1px solid var(--line);
          border-radius: 0 10px 10px 10px;
          padding: 26px;
        }
        .section-title {
          font-family: 'Oswald', sans-serif;
          letter-spacing: 0.4px;
          font-size: 16px;
          color: var(--mustard);
          margin-bottom: 18px;
        }

        .grid-2 { display: grid; grid-template-columns: 340px 1fr; gap: 28px; }
        @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }

        .field { margin-bottom: 16px; }
        .field label { display: block; font-size: 12.5px; color: var(--paper-dim); margin-bottom: 6px; letter-spacing: 0.2px; }
        .field :global(input[type='number']),
        .field :global(input[type='text']),
        .field :global(select),
        .field :global(input[type='file']) {
          width: 100%;
          background: var(--panel);
          border: 1px solid var(--line);
          color: var(--paper);
          padding: 9px 10px;
          border-radius: var(--radius);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
        }
        .field :global(input[type='text']) { font-family: 'Inter', sans-serif; }
        .field :global(input[type='file']) { font-family: 'Inter', sans-serif; font-size: 12.5px; padding: 8px; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .field :global(input[type='range']) { width: 100%; accent-color: var(--red); }

        .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip {
          background: var(--panel);
          color: var(--paper-dim);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 5px 11px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          cursor: pointer;
        }
        .chip:hover:not(:disabled) { border-color: var(--paper-dim); color: var(--paper); }
        .chip.on { border-color: var(--red); color: var(--paper); }
        .chip:disabled { opacity: 0.35; cursor: default; }

        .photo-strip { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; padding-bottom: 6px; }
        .strip-item {
          position: relative;
          flex: none;
          width: 58px;
          height: 58px;
          border: 2px solid var(--line);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
        }
        .strip-item.on { border-color: var(--red); }
        .strip-item :global(img) { width: 100%; height: 100%; object-fit: cover; display: block; }
        .strip-x {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 18px;
          height: 18px;
          border: none;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.65);
          color: #fff;
          font-size: 10px;
          line-height: 1;
          cursor: pointer;
        }

        .check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--paper); margin: 0 0 10px; cursor: pointer; }
        .check input { accent-color: var(--red); }

        .btn {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          font-weight: 600;
          font-size: 13px;
          border: none;
          border-radius: 22px;
          padding: 11px 20px;
          cursor: pointer;
          transition: transform 0.1s, filter 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn:active { transform: scale(0.97); }
        .btn-primary { background: var(--red); color: var(--paper); }
        .btn-primary:hover { filter: brightness(1.1); }
        .btn-secondary { background: transparent; color: var(--paper); border: 1px solid var(--paper-dim); }
        .btn-secondary:hover { border-color: var(--paper); }
        .btn-sage { background: var(--sage); color: #0f1a0f; }
        .btn-block { width: 100%; justify-content: center; }
        .btn-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px; }

        .canvas-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          background-image: linear-gradient(45deg, #1c1912 25%, transparent 25%),
            linear-gradient(-45deg, #1c1912 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1912 75%),
            linear-gradient(-45deg, transparent 75%, #1c1912 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          background-color: var(--panel);
          border: 1px dashed var(--paper-dim);
          border-radius: 10px;
          padding: 20px;
          min-height: 460px;
        }
        .canvas-wrap :global(canvas) { touch-action: none; cursor: grab; max-width: 100%; height: auto; }
        .hint { font-size: 12px; color: var(--paper-dim); margin-top: 10px; text-align: center; }

        .dropzone {
          border: 2px dashed var(--paper-dim);
          border-radius: 50%;
          width: 84px;
          height: 84px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--paper-dim);
          font-size: 12px;
          text-align: center;
          margin: 0 auto 6px;
        }
        .upload-extra { text-align: center; padding: 18px; border: 1px dashed var(--line); border-radius: 10px; background: var(--panel); margin-top: 14px; }
        .upload-extra :global(input) { display: none; }
        .upload-extra label { cursor: pointer; color: var(--mustard); font-weight: 600; font-size: 13px; }

        .stats-bar {
          display: flex;
          gap: 22px;
          flex-wrap: wrap;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 14px 18px;
          margin: 0 0 18px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12.5px;
        }
        .stats-bar :global(span.k) { color: var(--paper-dim); display: block; font-size: 11px; letter-spacing: 0.3px; }
        .stats-bar :global(span.v) { color: var(--mustard); font-size: 16px; font-weight: 600; }

        .queue-empty { text-align: center; padding: 40px 10px; color: var(--paper-dim); font-size: 13.5px; }
        .queue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; margin-top: 4px; }
        .queue-card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
        .thumb-wrap {
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          background-image: linear-gradient(45deg, #1c1912 25%, transparent 25%),
            linear-gradient(-45deg, #1c1912 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1912 75%),
            linear-gradient(-45deg, transparent 75%, #1c1912 75%);
          background-size: 16px 16px;
          background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
        }
        .thumb-wrap :global(img) { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
        .meta { padding: 10px; }
        .name { font-size: 12px; color: var(--paper); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .size { font-size: 11px; color: var(--paper-dim); margin-bottom: 8px; font-family: 'IBM Plex Mono', monospace; }
        .copies-row { display: flex; align-items: center; gap: 6px; }
        .copies-row :global(input) {
          width: 52px;
          background: var(--ink);
          border: 1px solid var(--line);
          color: var(--paper);
          border-radius: 5px;
          padding: 5px;
          text-align: center;
          font-family: 'IBM Plex Mono', monospace;
        }
        .copies-row span { font-size: 11px; color: var(--paper-dim); flex: 1; }
        .remove-btn { background: none; border: none; color: var(--red); font-size: 16px; cursor: pointer; line-height: 1; padding: 2px 6px; }
        .fill-btn {
          margin-top: 8px;
          width: 100%;
          background: transparent;
          border: 1px solid var(--line);
          color: var(--paper-dim);
          border-radius: 6px;
          padding: 5px;
          font-size: 11.5px;
          cursor: pointer;
        }
        .fill-btn:hover { border-color: var(--sage); color: var(--sage); }

        .sheet-preview { margin-top: 22px; }
        .sheet-head { display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; color: var(--paper-dim); margin-bottom: 8px; }
        .sheet-nav { display: flex; gap: 6px; }
        .sheet-svg {
          display: block;
          width: 100%;
          max-width: 360px;
          max-height: 520px;
          margin: 0 auto;
          border: 1px solid var(--line);
          box-shadow: 0 6px 22px rgba(0, 0, 0, 0.35);
        }

        .status-msg { margin-top: 14px; font-size: 13px; color: var(--sage); min-height: 18px; }
        .status-msg.err { color: var(--red); }

        footer { text-align: center; padding: 30px 20px; color: var(--paper-dim); font-size: 11.5px; }
      `}</style>
    </div>
  );
}