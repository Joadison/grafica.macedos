'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';

function buildShapePath(ctx, w, h, shape) {
  ctx.beginPath();
  if (shape === 'circle') {
    const r = Math.min(w, h) / 2;
    ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
  } else {
    ctx.rect(0, 0, w, h);
  }
  ctx.closePath();
}

function cmToPx(cm, dpi = 300) {
  return Math.round((cm / 2.54) * dpi);
}

function computeGrid({ diameter, margin, spacing }) {
  const pageW = 210;
  const pageH = 297;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2;
  const cols = Math.max(0, Math.floor((usableW + spacing) / (diameter + spacing)));
  const rows = Math.max(0, Math.floor((usableH + spacing) / (diameter + spacing)));
  const totalGridW = cols * diameter + (cols - 1) * spacing;
  const totalGridH = rows * diameter + (rows - 1) * spacing;
  const offsetX = (usableW - totalGridW) / 2;
  const offsetY = (usableH - totalGridH) / 2;
  return { diameter, margin, spacing, cols, rows, offsetX, offsetY };
}

let idCounter = 0;
function newId() {
  idCounter += 1;
  return `q${Date.now()}_${idCounter}`;
}

export default function EditorPage() {
  const [activeTab, setActiveTab] = useState('editor');

  // ---------- Photo editor state ----------
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const edRef = useRef({ baseScale: 1, zoom: 1, offX: 0, offY: 0 });
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const [shape, setShape] = useState('circle');
  const [wCm, setWCm] = useState(5);
  const [hCm, setHCm] = useState(5);
  const [zoomPct, setZoomPct] = useState(100);
  const [editorStatus, setEditorStatus] = useState({ text: '', err: false });

  function updateCanvasSize() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxDim = 380;
    const ratio = wCm / hCm;
    let cw, ch;
    if (ratio >= 1) {
      cw = maxDim;
      ch = maxDim / ratio;
    } else {
      ch = maxDim;
      cw = maxDim * ratio;
    }
    canvas.width = Math.round(cw);
    canvas.height = Math.round(ch);
  }

  function fitImage() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    edRef.current.baseScale = Math.max(canvas.width / img.width, canvas.height / img.height);
    edRef.current.offX = 0;
    edRef.current.offY = 0;
    edRef.current.zoom = 1;
    setZoomPct(100);
  }

  function render() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    buildShapePath(ctx, canvas.width, canvas.height, shape);
    ctx.clip();
    if (img) {
      const scale = edRef.current.baseScale * edRef.current.zoom;
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (canvas.width - dw) / 2 + edRef.current.offX;
      const dy = (canvas.height - dh) / 2 + edRef.current.offY;
      ctx.drawImage(img, dx, dy, dw, dh);
    }
    ctx.restore();
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#E2412D';
    ctx.lineWidth = 1.5;
    buildShapePath(ctx, canvas.width, canvas.height, shape);
    ctx.stroke();
    ctx.restore();
  }

  // Recompute canvas size + refit whenever the target shape/dimensions change
  useEffect(() => {
    updateCanvasSize();
    fitImage();
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, wCm, hCm]);

  // Zoom slider only changes zoom, keeps pan
  useEffect(() => {
    edRef.current.zoom = zoomPct / 100;
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomPct]);

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const image = new Image();
      image.onload = () => {
        imgRef.current = image;
        updateCanvasSize();
        fitImage();
        render();
        setEditorStatus({ text: '', err: false });
      };
      image.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleShapeChange(e) {
    const value = e.target.value;
    setShape(value);
    if (value !== 'rect') {
      setHCm(wCm);
    }
  }

  function handlePointerDown(e) {
    if (!imgRef.current) return;
    draggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    e.target.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e) {
    if (!draggingRef.current) return;
    edRef.current.offX += e.clientX - lastPosRef.current.x;
    edRef.current.offY += e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    render();
  }
  function handlePointerUp() {
    draggingRef.current = false;
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!img) {
      setEditorStatus({ text: 'Envie uma foto primeiro.', err: true });
      return;
    }
    const outW = cmToPx(wCm);
    const outH = cmToPx(hCm);
    const off = document.createElement('canvas');
    off.width = outW;
    off.height = outH;
    const octx = off.getContext('2d');
    buildShapePath(octx, outW, outH, shape);
    octx.save();
    octx.clip();
    const scaleFactor = outW / canvas.width;
    const scale = edRef.current.baseScale * edRef.current.zoom * scaleFactor;
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = (outW - dw) / 2 + edRef.current.offX * scaleFactor;
    const dy = (outH - dh) / 2 + edRef.current.offY * scaleFactor;
    octx.drawImage(img, dx, dy, dw, dh);
    octx.restore();
    const link = document.createElement('a');
    link.download = 'foto-editada.png';
    link.href = off.toDataURL('image/png');
    link.click();
    setEditorStatus({ text: `Imagem baixada em ${wCm}×${hCm}cm (300dpi).`, err: false });
  }

  function handleAddToQueue() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!img) {
      setEditorStatus({ text: 'Envie uma foto primeiro.', err: true });
      return;
    }
    const size = 600;
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const octx = off.getContext('2d');
    const scaleFactor = size / Math.min(canvas.width, canvas.height);
    const scale = edRef.current.baseScale * edRef.current.zoom * scaleFactor;
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = (size - dw) / 2 + edRef.current.offX * scaleFactor;
    const dy = (size - dh) / 2 + edRef.current.offY * scaleFactor;
    octx.drawImage(img, dx, dy, dw, dh);
    const dataURL = off.toDataURL('image/jpeg', 0.92);
    setTagQueue((q) => [...q, { id: newId(), dataURL, copies: 1, name: `Editada ${q.length + 1}` }]);
    setEditorStatus({ text: 'Adicionada à folha de tags ✓', err: false });
  }

  // ---------- Tag generator state ----------
  const [tagQueue, setTagQueue] = useState([]);
  const [diameterMm, setDiameterMm] = useState(50);
  const [marginMm, setMarginMm] = useState(1);
  const [spacingMm, setSpacingMm] = useState(2);
  const [genStatus, setGenStatus] = useState({ text: '', err: false });

  const grid = computeGrid({ diameter: diameterMm, margin: marginMm, spacing: spacingMm });
  const perPage = grid.cols * grid.rows;
  const totalTags = tagQueue.reduce((s, i) => s + i.copies, 0);
  const totalPages = perPage > 0 ? Math.ceil(totalTags / perPage) : 0;

  function handleExtraImages(e) {
    const files = Array.from(e.target.files);
    let remaining = files.length;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const image = new Image();
        image.onload = () => {
          const size = 600;
          const off = document.createElement('canvas');
          off.width = size;
          off.height = size;
          const octx = off.getContext('2d');
          const scale = Math.max(size / image.width, size / image.height);
          const dw = image.width * scale;
          const dh = image.height * scale;
          const dx = (size - dw) / 2;
          const dy = (size - dh) / 2;
          octx.drawImage(image, dx, dy, dw, dh);
          setTagQueue((q) => [
            ...q,
            { id: newId(), dataURL: off.toDataURL('image/jpeg', 0.92), copies: 1, name: file.name },
          ]);
          remaining -= 1;
        };
        image.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function updateCopies(id, value) {
    setTagQueue((q) => q.map((it) => (it.id === id ? { ...it, copies: Math.max(1, parseInt(value) || 1) } : it)));
  }
  function removeItem(id) {
    setTagQueue((q) => q.filter((it) => it.id !== id));
  }
  function clearQueue() {
    setTagQueue([]);
    setGenStatus({ text: '', err: false });
  }

  function handleGeneratePdf() {
    setGenStatus({ text: '', err: false });
    if (tagQueue.length === 0) {
      setGenStatus({ text: 'Adicione ao menos uma imagem antes de gerar.', err: true });
      return;
    }
    const g = computeGrid({ diameter: diameterMm, margin: marginMm, spacing: spacingMm });
    if (g.cols === 0 || g.rows === 0) {
      setGenStatus({ text: 'O diâmetro é grande demais para a folha A4.', err: true });
      return;
    }

    const flat = [];
    tagQueue.forEach((item) => {
      for (let i = 0; i < item.copies; i += 1) flat.push(item.dataURL);
    });

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const perPageLocal = g.cols * g.rows;

    flat.forEach((dataURL, index) => {
      if (index > 0 && index % perPageLocal === 0) doc.addPage();
      const posInPage = index % perPageLocal;
      const row = Math.floor(posInPage / g.cols);
      const col = posInPage % g.cols;
      const x = g.margin + g.offsetX + col * (g.diameter + g.spacing);
      const y = g.margin + g.offsetY + row * (g.diameter + g.spacing);
      const cx = x + g.diameter / 2;
      const cy = y + g.diameter / 2;
      const r = g.diameter / 2;

      doc.saveGraphicsState();
      doc.circle(cx, cy, r);
      doc.clip();
      doc.discardPath();
      doc.addImage(dataURL, 'JPEG', x, y, g.diameter, g.diameter);
      doc.restoreGraphicsState();

      doc.setDrawColor(226, 65, 45);
      doc.setLineWidth(0.2);
      doc.setLineDashPattern([1, 1], 0);
      doc.circle(cx, cy, r + 0.5, 'S');
      doc.setLineDashPattern([], 0);
    });

    const totalPagesLocal = Math.ceil(flat.length / perPageLocal);
    doc.save(`tags_${g.diameter}mm_${Date.now()}.pdf`);
    setGenStatus({ text: `PDF gerado: ${flat.length} tags em ${totalPagesLocal} folha(s) A4.`, err: false });
  }

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
            <p>Editor de fotos &amp; gerador de tags circulares 5×5cm</p>
          </div>
        </div>
        <Link href="/" className="back-link">← Voltar ao site</Link>
      </header>

      <nav className="tabs">
        <button className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>
          01 — Editor de Foto
        </button>
        <button className={`tab-btn ${activeTab === 'gerador' ? 'active' : ''}`} onClick={() => setActiveTab('gerador')}>
          02 — Gerador de Tags
        </button>
      </nav>

      <main>
        {activeTab === 'editor' && (
          <section className="panel active">
            <h2 className="section-title"><span className="num">01</span> Recorte, redimensione e baixe</h2>
            <div className="grid-2">
              <div>
                <div className="field">
                  <label>Foto</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                </div>
                <div className="field">
                  <label>Forma do recorte</label>
                  <select value={shape} onChange={handleShapeChange}>
                    <option value="circle">Círculo (tag)</option>
                    <option value="square">Quadrado</option>
                    <option value="rect">Retângulo personalizado</option>
                  </select>
                </div>
                <div className="row2">
                  <div className="field">
                    <label>{shape === 'circle' ? 'Diâmetro (cm)' : shape === 'square' ? 'Lado (cm)' : 'Largura (cm)'}</label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={wCm}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 5;
                        setWCm(v);
                        if (shape !== 'rect') setHCm(v);
                      }}
                    />
                  </div>
                  {shape === 'rect' && (
                    <div className="field">
                      <label>Altura (cm)</label>
                      <input type="number" min="1" step="0.1" value={hCm} onChange={(e) => setHCm(parseFloat(e.target.value) || 5)} />
                    </div>
                  )}
                </div>
                <div className="field">
                  <label>Zoom</label>
                  <input type="range" min="100" max="400" value={zoomPct} onChange={(e) => setZoomPct(parseFloat(e.target.value))} />
                </div>
                <div className="btn-row">
                  <button className="btn btn-secondary" onClick={() => { fitImage(); render(); }}>Centralizar</button>
                </div>
                <div className="btn-row" style={{ marginTop: 18 }}>
                  <button className="btn btn-primary btn-block" onClick={handleDownload}>Baixar imagem</button>
                </div>
                <div className="btn-row">
                  <button className="btn btn-sage btn-block" onClick={handleAddToQueue}>＋ Adicionar à folha de tags</button>
                </div>
                <p className={`status-msg ${editorStatus.err ? 'err' : ''}`}>{editorStatus.text}</p>
              </div>
              <div>
                <div className="canvas-wrap">
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={380}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  />
                </div>
                <p className="hint">Arraste a foto para posicionar · use o zoom para ajustar o enquadramento</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'gerador' && (
          <section className="panel active">
            <h2 className="section-title"><span className="num">02</span> Monte a folha de tags para corte</h2>
            <div className="grid-2">
              <div>
                <div className="field">
                  <label>Diâmetro da tag (mm)</label>
                  <input type="number" min="10" step="1" value={diameterMm} onChange={(e) => setDiameterMm(parseFloat(e.target.value) || 50)} />
                </div>
                <div className="row2">
                  <div className="field">
                    <label>Margem da folha (mm)</label>
                    <input type="number" min="0" step="0.5" value={marginMm} onChange={(e) => setMarginMm(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="field">
                    <label>Espaço entre tags (mm)</label>
                    <input type="number" min="0" step="0.5" value={spacingMm} onChange={(e) => setSpacingMm(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="upload-extra">
                  <div className="dropzone">imagem<br />de tag</div>
                  <label htmlFor="extraImgInput">Enviar fotos direto para a folha</label>
                  <input id="extraImgInput" type="file" accept="image/*" multiple onChange={handleExtraImages} />
                </div>
              </div>
              <div>
                <div className="stats-bar">
                  <div><span className="k">Grade</span><span className="v">{grid.cols}×{grid.rows}</span></div>
                  <div><span className="k">Tags/folha</span><span className="v">{perPage}</span></div>
                  <div><span className="k">Total de tags</span><span className="v">{totalTags}</span></div>
                  <div><span className="k">Folhas A4</span><span className="v">{totalPages}</span></div>
                </div>
                {tagQueue.length === 0 ? (
                  <div className="queue-empty">
                    Nenhuma imagem ainda. Edite uma foto na aba <strong>Editor de Foto</strong> ou envie imagens direto aqui.
                  </div>
                ) : (
                  <div className="queue-grid">
                    {tagQueue.map((item) => (
                      <div className="queue-card" key={item.id}>
                        <div className="thumb-wrap">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.dataURL} alt={item.name} />
                        </div>
                        <div className="meta">
                          <div className="name">{item.name}</div>
                          <div className="copies-row">
                            <span>cópias</span>
                            <input type="number" min="1" value={item.copies} onChange={(e) => updateCopies(item.id, e.target.value)} />
                            <button className="remove-btn" onClick={() => removeItem(item.id)} title="Remover">✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="btn-row" style={{ marginTop: 22 }}>
              <button className="btn btn-primary" onClick={handleGeneratePdf}>Gerar PDF da folha (A4)</button>
              <button className="btn btn-secondary" onClick={clearQueue}>Limpar tudo</button>
            </div>
            <p className={`status-msg ${genStatus.err ? 'err' : ''}`}>{genStatus.text}</p>
          </section>
        )}
      </main>

      <footer>Ferramenta interna Gráfica Macedo&apos;s — recorte, monte e imprima suas tags de 5×5cm.</footer>

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
          text-transform: uppercase;
          letter-spacing: 0.4px;
          font-size: 15px;
          color: var(--mustard);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-title .num { font-family: 'IBM Plex Mono', monospace; color: var(--paper-dim); font-size: 12px; }

        .grid-2 { display: grid; grid-template-columns: 340px 1fr; gap: 28px; }
        @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }

        .field { margin-bottom: 16px; }
        .field label { display: block; font-size: 12.5px; color: var(--paper-dim); margin-bottom: 6px; letter-spacing: 0.2px; }
        .field :global(input[type='number']),
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
        .field :global(input[type='file']) { font-family: 'Inter', sans-serif; font-size: 12.5px; padding: 8px; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field :global(input[type='range']) { width: 100%; accent-color: var(--red); }

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
          min-height: 420px;
        }
        .canvas-wrap :global(canvas) { touch-action: none; cursor: grab; border-radius: 2px; }
        .hint { font-size: 12px; color: var(--paper-dim); margin-top: 10px; text-align: center; }

        .dropzone {
          border: 2px dashed var(--paper-dim);
          border-radius: 50%;
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--paper-dim);
          font-size: 11px;
          text-align: center;
          margin: 0 auto 6px;
        }
        .upload-extra { text-align: center; padding: 18px; border: 1px dashed var(--line); border-radius: 10px; background: var(--panel); }
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
        .stats-bar :global(span.k) { color: var(--paper-dim); display: block; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; }
        .stats-bar :global(span.v) { color: var(--mustard); font-size: 16px; font-weight: 600; }

        .queue-empty { text-align: center; padding: 40px 10px; color: var(--paper-dim); font-size: 13.5px; }
        .queue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 14px; margin-top: 4px; }
        .queue-card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
        .thumb-wrap { position: relative; aspect-ratio: 1 / 1; overflow: hidden; }
        .thumb-wrap :global(img) { width: 100%; height: 100%; object-fit: cover; display: block; }
        .thumb-wrap::after {
          content: '';
          position: absolute;
          inset: 6px;
          border: 1.5px dashed rgba(226, 65, 45, 0.75);
          border-radius: 50%;
          pointer-events: none;
        }
        .meta { padding: 10px; }
        .name { font-size: 11.5px; color: var(--paper-dim); margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .copies-row { display: flex; align-items: center; gap: 6px; }
        .copies-row :global(input) {
          width: 48px;
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

        .status-msg { margin-top: 14px; font-size: 13px; color: var(--sage); min-height: 18px; }
        .status-msg.err { color: var(--red); }

        footer { text-align: center; padding: 30px 20px; color: var(--paper-dim); font-size: 11.5px; }
      `}</style>
    </div>
  );
}
