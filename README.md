# Gráfica Macedo's — site + editor de tags (Next.js)

Projeto Next.js (App Router) que junta as duas peças em um só app:

- `/` — página de apresentação da gráfica, com as cores do logo, botão de WhatsApp e link do Instagram.
- `/editor` — a ferramenta com duas abas: editor de fotos (recorte em círculo/quadrado/retângulo, zoom e download) e o gerador de folhas A4 de tags circulares em PDF (porta o `GeradorTagsCirculares` original para o navegador, usando a lib `jspdf`).

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000

## Antes de publicar

Troque o número de WhatsApp de exemplo em `app/page.js` (constante `WHATSAPP_NUMBER`, linha 3) pelo número real da gráfica, com DDD e código do país (ex: `5585912345678`).

## Build de produção

```bash
npm run build
npm start
```

## Estrutura

```
app/
  layout.js        # fontes + metadata globais
  globals.css       # reset + paletas de cor (site e editor)
  page.js           # página de apresentação
  editor/
    page.js         # editor de fotos + gerador de tags (client component)
```
"# grafica.macedos" 
