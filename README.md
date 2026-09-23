# GTA VI — Versão MT Designs

Site estático de divulgação do GTA VI, feito com HTML, CSS e JavaScript puro, com GSAP + ScrollTrigger para as animações de rolagem e a interação de vídeo controlada por scroll no Hero.

Base original: projeto da Semana do Zero ao Programador Contratado. A partir daí o site passou por uma expansão completa (novas seções, responsividade mobile dedicada e diversos ajustes finos) até chegar nesta versão final, "GTA VI - Versão MT Designs".

Demo de referência da base original: https://dev-em-deobro-do-zero-gtavi.vercel.app/

## Estrutura

```
szpc-clone-gta/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── assets/
    ├── video-capa.mp4              (vídeo do Hero, controlado por scroll)
    ├── capa-fundo-mobile.jpg       (fundo borrado atrás do vídeo, só mobile)
    ├── gta-box-art.jpeg            (logo/arte inicial do Hero)
    ├── historia-fundo-vicecity.jpg
    ├── jason.jpg / lucia.jpg
    ├── mundo-crime.jpg / mundo-estradas.jpg / mundo-natureza.jpg
    │   / mundo-nightlife.jpg / mundo-praias.jpg
    ├── mapa-leonida.png
    ├── trailers-fundo-jason.jpg
    ├── card-trailer.png / poster-trailer-1.jpg / poster-trailer-2.jpg
    ├── trailer-1.mp4 / trailer-2.mp4
    ├── galeria-01.jpg … galeria-06.jpg
    ├── album-gta6.jpg
    ├── musica-01.mp3 … musica-05.mp3
    ├── edicao-standard.jpg / edicao-ultimate.jpg
    ├── icone-play.png / seta-baixo.png
```

## Seções do site

1. **Hero** — capa inicial com logo, data de lançamento e botão "Reserve agora"; ao rolar, o conteúdo desaparece e um vídeo (controlado 1:1 pelo scroll, via GSAP ScrollTrigger com pin) assume a tela.
2. **História** — contexto/introdução do jogo.
3. **Jason & Lucia** — apresentação dos protagonistas.
4. **Leonida** — mapa e apresentação do estado fictício.
5. **Mundo Vivo** — cards temáticos (crime, estradas, natureza, nightlife, praias).
6. **Trailers** — Trailer 1, Trailer 2 e "An Extended Look", com modal de vídeo.
7. **Galeria** — grade de imagens do jogo.
8. **Sound of Vice City** — player com a lista de faixas da trilha sonora.
9. **Edições** — Standard e Ultimate.
10. **Lançamento** — data e plataformas (repete o CTA do Hero).

## Histórico de alterações desta versão estendida

### Nome e branding
- Título do site alterado para **"GTA VI - Versão MT Designs"** (era "GTA VI - Semana do Zero ao Programador Contratado"). Domínio/repositório mantidos como estavam, por pedido explícito.

### Hero — interação de scroll + vídeo
- Vídeo de capa controlado por scroll (GSAP ScrollTrigger, `pin` + `scrub` manual via `currentTime`), com distância de scroll calculada a partir da duração real do vídeo (`PIXELS_POR_SEGUNDO`).
- **Mobile:** removido um fundo estático (`capa-fundo-mobile.jpg` direto em `.capa-painel`) que aparecia atrás do Hero antes mesmo do vídeo começar — o estado inicial agora é igual ao desktop (fundo escuro normal, sem imagem auxiliar visível).
- **Botão "Reserve agora":** corrigido para não ficar clicável/tocável quando visualmente invisível (`pointer-events` sincronizado com o mesmo progresso que controla a opacidade, tanto no desktop quanto no mobile).
- **Vídeo em quadro quadrado (mobile):** no celular o vídeo passou a aparecer em um quadro quase quadrado (`min(90vw, 80vh)`, `aspect-ratio: 1/1`, cantos arredondados, sombra), centralizado, mantendo margens ao redor — sem alterar proporção, ScrollTrigger ou comportamento no desktop.
- **Fundo borrado atrás do vídeo (mobile):** reintroduzido como uma camada independente (`.capa-video-fundo`), usando a mesma imagem `capa-fundo-mobile.jpg` com blur e leve zoom — mas agora controlada pelo mesmo progresso do ScrollTrigger do vídeo: começa invisível, aparece gradualmente junto com o vídeo, some ao voltar ao topo. No desktop essa camada fica com `display:none` e não tem nenhum efeito.
- **Velocidade da rolagem do vídeo no mobile:** `PIXELS_POR_SEGUNDO` passou a ser maior em dispositivos touch (mais distância de scroll para o mesmo vídeo = avanço mais gradual), sem alterar o valor usado no desktop.
- **Rolagem geral do site em touch:** leve redução do momentum do `ScrollTrigger.normalizeScroll` (de `true` para `{ momentum: 0.85 }`), suavizando a rolagem das seções depois do Hero em celulares/tablets, sem afetar a sincronia do vídeo do Hero nem o desktop.
- **Celular na horizontal (landscape):** adicionada uma media query específica (`max-width: 900px` + `orientation: landscape`) que reduz o logo e a barra inferior do Hero, evitando o "zoom" exagerado que ocorria nessa orientação. Não afeta desktop widescreen.

### Animações de "surgimento" ao rolar
- O efeito de fade/translate ao entrar na tela (classe `.aparecer` + `IntersectionObserver`) ganhou `threshold`/`rootMargin`, para disparar de forma consistente também no desktop (antes, em telas maiores, muitos blocos já nasciam quase visíveis e o efeito passava despercebido).

### Seção História
- No **desktop**, a imagem de fundo (letreiro + avião) foi reposicionada um pouco mais para baixo e escurecida em ~10% (`object-position` + `filter: brightness`). Mobile/tablet permanecem como estavam.

### Divisórias entre seções
- A linha animada com partículas, que ficava entre Leonida e Um Mundo Vivo, foi movida para ficar entre **Um Mundo Vivo e Trailers**.

### Sound of Vice City (música)
- Ordem das faixas ajustada: **"That's It"** passou para a 1ª posição e **"Macacoa 2000"** para a 3ª — as demais faixas mantiveram a posição original.

### Trailers
- Nos cards de Trailer 1 e Trailer 2, em **dispositivos que não são desktop**, o clique agora abre o vídeo oficial no YouTube (em vez do player local), mantendo a mesma capa/thumbnail do card. No desktop o comportamento não mudou: continua abrindo o modal com o vídeo local.
- **Imagem de fundo da seção (`trailers-fundo-jason.jpg`) sumindo após publicar:** o arquivo, o nome, a capitalização e a referência no HTML estavam corretos — o problema não era de código. A causa mais provável identificada foi o arquivo não ter sido commitado/enviado ao repositório antes do último deploy (era, junto com `historia-fundo-vicecity.jpg`, o asset mais recente de todo o projeto). Resolvido do lado do versionamento/deploy.

## Notas técnicas

- Os vídeos dos trailers locais (`trailer-1.mp4` ~37MB, `trailer-2.mp4` ~70MB) e as faixas de música (~2,5–3,3MB cada) são arquivos grandes — o GitHub aceita, mas fica próximo do limite recomendado por arquivo; para repositórios com uso intenso de vídeo, considerar Git LFS.
- Todos os caminhos de assets são relativos e usam apenas letras minúsculas/hífen, para evitar problemas de case-sensitivity entre ambiente local (Windows/Mac) e produção (GitHub Pages/Vercel, que são case-sensitive).

## Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex: `szpc-clone-gta`) e suba o conteúdo desta pasta para a branch `main`.
2. No repositório, vá em **Settings → Pages**.
3. Em **Source**, selecione a branch `main` e a pasta `/root`, depois clique em **Save**.
4. Aguarde alguns instantes — o GitHub vai gerar o link no formato `https://SEU-USUARIO.github.io/szpc-clone-gta/`.
5. Confirme, na própria página do GitHub, que todos os arquivos de `assets/` (principalmente os adicionados por último) aparecem no repositório antes de considerar o deploy concluído.

Todos os caminhos do projeto (CSS, JS e imagens) são relativos, então o site funciona tanto na raiz de um domínio quanto em um subdiretório de projeto do GitHub Pages, sem precisar de ajustes.

## Rodando localmente

Basta abrir o `index.html` no navegador, ou usar a extensão "Live Server" do VS Code (já configurada em `.vscode/settings.json`, porta 5501).
