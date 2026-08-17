# GTA VI — Site de Divulgação (clone)

Site estático de divulgação do GTA VI, feito com HTML, CSS e JavaScript puro (com GSAP + ScrollTrigger para as animações de rolagem). Projeto da Semana do Zero ao Programador Contratado.

Demo de referência: https://dev-em-deobro-do-zero-gtavi.vercel.app/

## Estrutura

```
szpc-clone-gta/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── assets/
    ├── video-capa.mp4
    ├── gta-box-art.jpeg
    ├── card-trailer.png
    ├── icone-play.png
    └── seta-baixo.png
```

## Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex: `szpc-clone-gta`) e suba o conteúdo desta pasta para a branch `main`.
2. No repositório, vá em **Settings → Pages**.
3. Em **Source**, selecione a branch `main` e a pasta `/root`, depois clique em **Save**.
4. Aguarde alguns instantes — o GitHub vai gerar o link no formato `https://SEU-USUARIO.github.io/szpc-clone-gta/`.

Todos os caminhos do projeto (CSS, JS e imagens) são relativos, então o site funciona tanto na raiz de um domínio quanto em um subdiretório de projeto do GitHub Pages, sem precisar de ajustes.

## Rodando localmente

Basta abrir o `index.html` no navegador, ou usar a extensão "Live Server" do VS Code (já configurada em `.vscode/settings.json`, porta 5501).
