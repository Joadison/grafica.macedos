'use client';

import Link from 'next/link';

const WHATSAPP_NUMBER = '5585987596656'; // TODO: troque pelo número real com DDD
const WHATSAPP_MSG = encodeURIComponent('Olá! Quero fazer um orçamento.');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;
const INSTAGRAM_URL = 'https://www.instagram.com/grafica.macedos/';

export default function Home() {
  return (
    <div className="site-page">
      <header className="header">
        <div className="wrap header-inner">
          <div className="logo">
            <div className="marks">
              <span className="g-gold" />
              <span className="g-pink" />
              <span className="g-blue" />
            </div>
            <strong>Macedo&apos;s</strong>
          </div>
          <nav className="links">
            <a href="#servicos">Serviços</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#sobre">Sobre</a>
            <Link href="/editor">Editor de tags</Link>
            <a href="#contato">Contato</a>
          </nav>
          <a className="btn btn-wpp" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 20l1.6-4.8A8 8 0 1 1 9 18.4L4 20z" />
              <path d="M9 9c0 3 2.5 6 6 6" strokeLinecap="round" />
            </svg>
            WhatsApp
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">Gráfica &amp; personalização</div>
            <h1>
              Sua ideia,
              <br />
              <span>impressa com precisão.</span>
            </h1>
            <p className="lead">
              Tags, etiquetas, adesivos e impressos personalizados — do design ao corte certinho, prontos pra
              vender. Envie sua arte e receba tudo pronto pra colar.
            </p>
            <div className="hero-ctas">
              <a className="btn btn-wpp" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 20l1.6-4.8A8 8 0 1 1 9 18.4L4 20z" />
                  <path d="M9 9c0 3 2.5 6 6 6" strokeLinecap="round" />
                </svg>
                Peça seu orçamento
              </a>
              <a className="btn btn-outline" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                Ver no Instagram ↗
              </a>
              <Link href="/editor" className="btn btn-outline">
                Abrir editor de tags →
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="icon-row">
              <div className="icon-card g-gold">
                <svg viewBox="0 0 24 24" fill="#17130A">
                  <path d="M12 2c2 3 4 6 4 9a4 4 0 1 1-8 0c0-3 2-6 4-9z" />
                  <rect x="10" y="16.5" width="4" height="3" rx="0.6" />
                </svg>
              </div>
              <div className="icon-card g-pink">
                <svg viewBox="0 0 24 24" fill="#160A11">
                  <path d="M12 3l4 6-4 3-4-3z" />
                  <path d="M8.5 12L12 14l3.5-2v5c0 1.5-1 3-1.7 3.7L12 22l-1.8-1.3C9.5 20 8.5 18.5 8.5 17z" />
                </svg>
              </div>
              <div className="icon-card g-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0A1420" strokeWidth="1.6">
                  <path d="M6 5h13v13H12V12H6z" />
                  <path d="M13 6.5h2M13 8h1.5M13 9.5h2M13 11h1.5" />
                </svg>
              </div>
            </div>
            <div className="wordmark">Arte · Design · Precisão</div>
          </div>
        </div>
      </section>

      <section id="servicos">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">O que fazemos</div>
            <h2>Serviços feitos sob medida</h2>
            <p>Cada peça sai com o corte, a cor e o formato certos — pronta pra ser usada no seu produto ou na sua loja.</p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <div className="badge g-gold">
                <svg viewBox="0 0 24 24" fill="#17130A">
                  <path d="M12 2c2 3 4 6 4 9a4 4 0 1 1-8 0c0-3 2-6 4-9z" />
                </svg>
              </div>
              <h3>Identidade &amp; arte</h3>
              <p>Criação e adaptação de artes para etiquetas, tags e materiais personalizados, mantendo a identidade da sua marca.</p>
            </div>
            <div className="service-card">
              <div className="badge g-pink">
                <svg viewBox="0 0 24 24" fill="#160A11">
                  <path d="M12 3l4 6-4 3-4-3z" />
                  <path d="M8.5 12L12 14l3.5-2v5c0 1.5-1 3-1.7 3.7L12 22l-1.8-1.3C9.5 20 8.5 18.5 8.5 17z" />
                </svg>
              </div>
              <h3>Design personalizado</h3>
              <p>Ajustamos forma, tamanho e enquadramento de cada foto ou arte antes da impressão, sem perder qualidade.</p>
            </div>
            <div className="service-card">
              <div className="badge g-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0A1420" strokeWidth="1.6">
                  <path d="M6 5h13v13H12V12H6z" />
                  <path d="M13 6.5h2M13 8h1.5M13 9.5h2M13 11h1.5" />
                </svg>
              </div>
              <h3>Corte de precisão</h3>
              <p>Tags circulares de 5×5cm e outros formatos, com linha de corte marcada e medidas exatas, folha por folha.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Como funciona</div>
            <h2>Do arquivo à folha pronta pra cortar</h2>
            <p>Um fluxo simples pensado pra quem precisa de várias tags e etiquetas rápido.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <h3>Envie sua foto ou arte</h3>
              <p>Você manda a imagem — a gente ajusta forma, corte e tamanho no nosso editor.</p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <h3>Escolha o formato</h3>
              <p>Círculo, quadrado ou tamanho personalizado, com o zoom e enquadramento do jeito que você quer.</p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <h3>Receba pronta pra corte</h3>
              <p>Geramos a folha A4 com todas as tags organizadas e a linha de corte marcada, prontas pra imprimir.</p>
            </div>
          </div>
          <div style={{ marginTop: 36 }}>
            <Link href="/editor" className="btn btn-wpp">
              Experimentar o editor de tags →
            </Link>
          </div>
        </div>
      </section>

      <section id="sobre">
        <div className="wrap about-grid">
          <div className="about-figure">
            <div className="marks-big">
              <span className="g-gold" />
              <span className="g-pink" />
              <span className="g-blue" />
            </div>
          </div>
          <div>
            <div className="eyebrow">Sobre a Macedo&apos;s</div>
            <h2 style={{ fontSize: 30, marginBottom: 20 }}>
              Impressão com cuidado, do primeiro rascunho ao último corte.
            </h2>
            <p>
              A <strong>Gráfica Macedo&apos;s</strong> nasceu pra atender quem precisa de peças personalizadas com
              acabamento profissional — tags, etiquetas, adesivos e materiais gráficos sob medida.
            </p>
            <p>
              Cada pedido passa pelas mesmas três etapas que estão no nosso logo: <strong>arte</strong>,{' '}
              <strong>desenho</strong> e <strong>precisão</strong> — do jeito que a gente acredita que impressão de
              qualidade deve ser feita.
            </p>
            <a className="btn btn-outline" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              Conheça nosso trabalho no Instagram ↗
            </a>
          </div>
        </div>
      </section>

      <section id="contato">
        <div className="wrap">
          <div className="cta-banner">
            <div>
              <h2>Vamos colocar sua ideia pra imprimir?</h2>
              <p>Manda uma mensagem no WhatsApp com o que você precisa — a gente responde com o orçamento rapidinho.</p>
            </div>
            <div className="cta-actions">
              <a className="btn btn-wpp" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 20l1.6-4.8A8 8 0 1 1 9 18.4L4 20z" />
                  <path d="M9 9c0 3 2.5 6 6 6" strokeLinecap="round" />
                </svg>
                Chamar no WhatsApp
              </a>
              <a className="btn btn-outline" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                Instagram ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap footer-inner">
          <p>© 2026 Gráfica Macedo&apos;s — impressão e personalização sob medida.</p>
          <div className="social">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram</a>
            <Link href="/editor">Editor de tags</Link>
          </div>
        </div>
      </footer>

      <a className="fab" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Chamar no WhatsApp">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M4 20l1.6-4.8A8 8 0 1 1 9 18.4L4 20z" />
          <path d="M9 9c0 3 2.5 6 6 6" strokeLinecap="round" />
        </svg>
      </a>

      <style jsx>{`
        .wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 24px;
        }
        h1, h2, h3 {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--gold-1);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .eyebrow::before {
          content: '';
          width: 22px;
          height: 1px;
          background: var(--gold-1);
        }
        .g-gold { background: linear-gradient(135deg, var(--gold-1), var(--gold-2)); }
        .g-pink { background: linear-gradient(135deg, var(--pink-1), var(--pink-2)); }
        .g-blue { background: linear-gradient(135deg, var(--blue-1), var(--blue-2)); }

        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(11, 14, 25, 0.85);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--line);
        }
        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
        }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo .marks { display: flex; gap: 3px; }
        .logo .marks span { width: 15px; height: 15px; border-radius: 4px; }
        .logo strong {
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .links { display: flex; gap: 26px; font-size: 13.5px; }
        .links a { color: var(--dim); transition: color 0.15s; }
        .links a:hover { color: var(--white); }
        @media (max-width: 860px) { .links { display: none; } }

        .btn {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          font-weight: 600;
          font-size: 13px;
          border: none;
          border-radius: 28px;
          padding: 12px 22px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          transition: transform 0.12s, filter 0.15s;
        }
        .btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .btn-wpp { background: linear-gradient(135deg, var(--pink-1), var(--gold-2)); color: var(--white); }
        .btn-outline { border: 1px solid var(--line); color: var(--white); background: transparent; }
        .btn-outline:hover { border-color: var(--white); }

        .hero { padding: 100px 0 90px; position: relative; }
        .hero::before {
          content: '';
          position: absolute;
          inset: -10% -10% auto -10%;
          height: 600px;
          z-index: -1;
          background:
            radial-gradient(circle at 15% 20%, rgba(247, 162, 39, 0.14), transparent 45%),
            radial-gradient(circle at 85% 10%, rgba(236, 21, 119, 0.12), transparent 45%),
            radial-gradient(circle at 60% 60%, rgba(63, 173, 232, 0.1), transparent 50%);
        }
        .hero-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 50px; align-items: center; }
        @media (max-width: 900px) { .hero-grid { grid-template-columns: 1fr; } }
        .hero h1 { font-size: 52px; line-height: 1.05; margin-bottom: 20px; }
        @media (max-width: 900px) { .hero h1 { font-size: 38px; } }
        .hero h1 :global(span) {
          background: linear-gradient(135deg, var(--gold-1), var(--pink-1) 60%, var(--blue-1));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .lead { color: var(--dim); font-size: 16.5px; line-height: 1.6; max-width: 480px; margin-bottom: 32px; }
        .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; }

        .hero-visual { display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .icon-row { display: flex; gap: 14px; }
        .icon-card {
          width: 96px;
          height: 96px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.55);
          transition: transform 0.25s;
        }
        .icon-card:hover { transform: translateY(-6px) rotate(-2deg); }
        .icon-card svg { width: 42px; height: 42px; }
        .wordmark {
          font-family: 'Oswald', sans-serif;
          font-size: 15px;
          letter-spacing: 1px;
          color: var(--dim);
          text-transform: uppercase;
          margin-top: 6px;
        }

        section { padding: 80px 0; border-top: 1px solid var(--line); }
        .section-head { max-width: 640px; margin-bottom: 48px; }
        .section-head h2 { font-size: 32px; }
        .section-head p { color: var(--dim); margin-top: 12px; font-size: 15px; line-height: 1.6; }

        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
        @media (max-width: 860px) { .services-grid { grid-template-columns: 1fr; } }
        .service-card { background: var(--navy-2); border: 1px solid var(--line); border-radius: 16px; padding: 30px 26px; }
        .service-card .badge { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 22px; }
        .service-card .badge svg { width: 26px; height: 26px; }
        .service-card h3 { font-size: 18px; margin-bottom: 10px; text-transform: none; letter-spacing: 0.2px; }
        .service-card p { color: var(--dim); font-size: 14px; line-height: 1.6; }

        .steps { display: grid; grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 860px) { .steps { grid-template-columns: 1fr; } }
        .step { padding: 0 26px 0 0; position: relative; }
        .step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 26px;
          right: -11px;
          width: 22px;
          height: 1px;
          background: var(--line);
        }
        @media (max-width: 860px) {
          .step:not(:last-child)::after { display: none; }
          .step { padding-bottom: 34px; }
        }
        .step-num {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 1px dashed var(--dim);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
          color: var(--white);
        }
        .step h3 { font-size: 16px; text-transform: none; margin-bottom: 8px; }
        .step p { color: var(--dim); font-size: 13.5px; line-height: 1.6; }

        .about-grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 50px; align-items: center; }
        @media (max-width: 860px) { .about-grid { grid-template-columns: 1fr; } }
        .about-figure {
          aspect-ratio: 1 / 1;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(247, 162, 39, 0.18), rgba(236, 21, 119, 0.16) 50%, rgba(63, 173, 232, 0.16));
          border: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .marks-big { display: flex; gap: 10px; }
        .marks-big span { width: 64px; height: 64px; border-radius: 16px; }
        .about-grid p { color: var(--dim); font-size: 15.5px; line-height: 1.75; margin-bottom: 16px; }
        .about-grid :global(strong) { color: var(--white); }

        .cta-banner {
          background: linear-gradient(120deg, var(--navy-3), var(--navy-2));
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 56px 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          flex-wrap: wrap;
          position: relative;
          overflow: hidden;
        }
        .cta-banner::before {
          content: '';
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236, 21, 119, 0.25), transparent 70%);
          right: -60px;
          top: -90px;
        }
        .cta-banner h2 { font-size: 28px; max-width: 420px; }
        .cta-banner p { color: var(--dim); margin-top: 10px; font-size: 14.5px; max-width: 420px; }
        .cta-actions { display: flex; gap: 14px; flex-wrap: wrap; }

        footer { border-top: 1px solid var(--line); padding: 34px 0; }
        .footer-inner { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; }
        .footer-inner p { color: var(--dim); font-size: 12.5px; }
        .social { display: flex; gap: 16px; }
        .social a { color: var(--dim); font-size: 13px; }
        .social a:hover { color: var(--white); }

        .fab {
          position: fixed;
          bottom: 22px;
          right: 22px;
          z-index: 60;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--pink-1), var(--gold-2));
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 30px -8px rgba(236, 21, 119, 0.55);
        }
        .fab svg { width: 26px; height: 26px; }
      `}</style>
    </div>
  );
}
