// OBJETIVO: dar comportamento ao site do GTA VI com JavaScript.

// Passos:
// 1. MENU QUE SOME AO ROLAR
//    - achar o menu no HTML
//    - escutar o evento de rolagem da janela
//    - se a página desceu mais de 50px, adicionar a classe "menu-rolado"
//    - se voltou pro topo, remover a classe

// 2. BLOCOS QUE APARECEM
//    - achar todos os elementos com a classe "aparecer"
//    - avisar quando cada um entrar na tela
//    - ao entrar, adicionar a classe "visivel"

// 3. VÍDEO QUE ANDA COM O SCROLL
//    - achar o vídeo da capa
//    - prender a capa na tela enquanto a pessoa rola
//    - sumir com o conteúdo da capa e revelar o vídeo
//    - avançar o tempo do vídeo conforme o scroll

const menu = document.getElementById("menu");
const blocos = document.querySelectorAll(".aparecer");
const video = document.querySelector(".capa-video");
const capaVideoFundo = document.querySelector(".capa-video-fundo");
const capa = document.querySelector(".capa");
const capaPainel = document.querySelector(".capa-painel");
const capaConteudo = document.querySelector(".capa-conteudo");
const capaBarra = document.querySelector(".capa-barra");
const capaSeta = document.querySelector(".capa-seta");

if (menu) {
    window.addEventListener("scroll", function () {
        if (window.scrollY > 50) {
            menu.classList.add("menu-rolado");
        } else {
            menu.classList.remove("menu-rolado");
        }
    });
}

if (blocos.length) {
    // no desktop a tela é mais alta/larga e muitos blocos já nascem dentro
    // (ou quase dentro) da área visível assim que a página carrega — então
    // o "surgimento" acontecia de forma instantânea, sem dar pra perceber
    // a rolagem. Com threshold + rootMargin, o bloco só vira "visivel"
    // quando a pessoa realmente rolar até ele, em qualquer tamanho de tela.
    const observador = new IntersectionObserver(
        function (entradas) {
            entradas.forEach(function (entrada) {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add("visivel");
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: "0px 0px -10% 0px",
        }
    );

    blocos.forEach(function (bloco) {
        observador.observe(bloco);
    });
}

if (window.gsap && window.ScrollTrigger && video && capa && capaPainel && capaConteudo) {
    gsap.registerPlugin(ScrollTrigger);

    // Em touch (celular/tablet), o scroll por inércia manda poucos eventos
    // "grandes" em vez de muitos pequenos — isso fazia o vídeo "pular"
    // frames em vez de acompanhar suavemente. normalizeScroll faz o GSAP
    // assumir o scroll nesses dispositivos e emitir atualizações a cada
    // frame, como acontece nativamente no desktop. Não é chamado em
    // ponteiro fino (mouse/trackpad) para não alterar nada no desktop.
    const ehTouch = window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    if (ehTouch && typeof ScrollTrigger.normalizeScroll === "function") {
        // leve redução do momentum (inércia) do touch — só suaviza o
        // "deslizar" depois que o dedo solta a tela nas seções normais.
        // Não mexe na sincronia do hero: o vídeo é amarrado à posição
        // absoluta do scroll (self.progress), não à velocidade do gesto,
        // então essa mudança não altera PIXELS_POR_SEGUNDO nem o
        // enquadramento/velocidade do vídeo.
        ScrollTrigger.normalizeScroll({ momentum: 0.85 });
    }
    // O vídeo nunca fica em reprodução livre: ele só avança quando o
    // ScrollTrigger manda. Isso evita que o autoplay "compita" com o scroll.
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "auto";

    let duracaoVideo = 0;
    let videoPreparado = false;
    const LIMITE_SINCRONIA = 0.02; // segundos: evita seeks redundantes/jank
    // no celular o dedo cobre uma distância de tela pequena, então com o
    // mesmo valor do desktop o vídeo inteiro passava em pouquíssimo scroll
    // e parecia "pular". Mais pixels por segundo = mais distância de scroll
    // pro mesmo vídeo = avanço mais gradual e controlável. Desktop mantém
    // exatamente o valor de antes.
    const PIXELS_POR_SEGUNDO = ehTouch ? 900 : 500; // quanto maior, mais "espaço" o scroll dá pro vídeo

    // iOS/Safari mobile às vezes só permite currentTime funcionar de verdade
    // depois de o vídeo já ter sido "tocado" uma vez. Fazemos isso uma única
    // vez, de forma instantânea (toca e já pausa), sem deixar o vídeo rodando
    // sozinho por cima do controle do scroll.
    const prepararVideoParaSeek = function () {
        if (videoPreparado) {
            return;
        }

        videoPreparado = true;
        const promessa = video.play();

        if (promessa && typeof promessa.then === "function") {
            promessa.then(function () {
                video.pause();
            }).catch(function () {
                // autoplay bloqueado: a maioria dos navegadores já permite seek assim mesmo
            });
        } else {
            video.pause();
        }
    };

    // calcula a duração do scroll com base na duração real do vídeo, para que
    // ele nunca passe inteiro em poucos pixels de rolagem
    const calcularFimDoScroll = function () {
        if (duracaoVideo > 0 && Number.isFinite(duracaoVideo)) {
            return "+=" + Math.round(Math.max(window.innerHeight * 2.2, duracaoVideo * PIXELS_POR_SEGUNDO));
        }

        return "+=" + Math.round(window.innerHeight * 3);
    };

    // fonte única de verdade: progresso do scroll -> frame do vídeo
    const sincronizarComProgresso = function (progresso) {
        if (!duracaoVideo || !Number.isFinite(duracaoVideo)) {
            return;
        }

        const tempoAlvo = duracaoVideo * progresso;

        if (Math.abs(video.currentTime - tempoAlvo) > LIMITE_SINCRONIA) {
            video.currentTime = tempoAlvo;
        }
    };

    const capaScrollTrigger = ScrollTrigger.create({
        trigger: capa,
        start: "top top",
        end: calcularFimDoScroll,
        pin: true,
        anticipatePin: 1,
        onUpdate: function (self) {
            sincronizarComProgresso(self.progress);

            // vídeo surge gradualmente enquanto o conteúdo da capa desaparece
            // logo no início do scroll — tudo dentro do MESMO ScrollTrigger
            const progressoSaidaConteudo = Math.min(self.progress / 0.18, 1);

            gsap.set(video, { opacity: progressoSaidaConteudo });

            // fundo borrado (só existe visualmente no mobile, via CSS)
            // segue exatamente a mesma curva do vídeo: some no topo,
            // aparece junto com o vídeo, some de novo ao voltar ao topo
            if (capaVideoFundo) {
                gsap.set(capaVideoFundo, { opacity: progressoSaidaConteudo });
            }

            gsap.set(capaConteudo, {
                opacity: 1 - progressoSaidaConteudo,
                y: -40 * progressoSaidaConteudo,
                scale: 1 - 0.08 * progressoSaidaConteudo,
            });

            if (capaBarra) {
                // quando o conteúdo termina de sumir (opacity chega a 0), o
                // botão "Reserve agora" para de aceitar clique/toque; volta
                // a aceitar assim que a barra volta a ficar visível (ex.:
                // ao rolar de volta pro topo) — sempre em sincronia com o
                // mesmo progresso que controla a opacidade, sem estado
                // separado.
                const conteudoEscondido = progressoSaidaConteudo >= 1;

                gsap.set(capaBarra, {
                    opacity: 1 - progressoSaidaConteudo,
                    pointerEvents: conteudoEscondido ? "none" : "auto",
                });
            }

            if (capaSeta) {
                gsap.set(capaSeta, { opacity: 1 - progressoSaidaConteudo });
            }
        },
    });

    // assim que a duração real estiver disponível, recalcula o "end" do
    // ScrollTrigger (função calcularFimDoScroll) e resincroniza o frame atual
    const quandoDuracaoDisponivel = function () {
        if (!video.duration || !Number.isFinite(video.duration) || duracaoVideo) {
            return;
        }

        duracaoVideo = video.duration;
        ScrollTrigger.refresh();
        sincronizarComProgresso(capaScrollTrigger.progress);
    };

    video.addEventListener("loadedmetadata", function () {
        quandoDuracaoDisponivel();
        prepararVideoParaSeek();
    });
    video.addEventListener("loadeddata", quandoDuracaoDisponivel);
    video.addEventListener("canplay", quandoDuracaoDisponivel);

    if (video.readyState >= 1) {
        quandoDuracaoDisponivel();
        prepararVideoParaSeek();
    }

    let redimensionamentoPendente = null;
    window.addEventListener("resize", function () {
        clearTimeout(redimensionamentoPendente);
        redimensionamentoPendente = setTimeout(function () {
            ScrollTrigger.refresh();
        }, 200);
    });
}


// ============================================================================
// EXPANSÃO DO SITE — novas seções
// ============================================================================

// 4. MENU FULLSCREEN
//    - abrir/fechar o overlay ao clicar no botão hambúrguer
//    - fechar automaticamente ao clicar em um link (rolagem suave até a seção)
(function () {
    const botao = document.getElementById("menu-botao");
    const overlay = document.getElementById("menu-overlay");

    if (!botao || !overlay) {
        return;
    }

    const fecharMenu = function () {
        overlay.classList.remove("aberto");
        botao.setAttribute("aria-expanded", "false");
    };

    botao.addEventListener("click", function () {
        const aberto = overlay.classList.toggle("aberto");
        botao.setAttribute("aria-expanded", aberto ? "true" : "false");
    });

    overlay.querySelectorAll(".menu-overlay-link").forEach(function (link) {
        link.addEventListener("click", fecharMenu);
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
            fecharMenu();
        }
    });
})();

// 5. MAPA DE LEONIDA
//    - guardar as informações de cada região (apenas dados oficiais/conhecidos)
//    - ao passar o mouse ou focar num ponto, atualizar o painel de informação
(function () {
    const regioes = {
        "vice-city": {
            numero: "01",
            nome: "Vice City",
            texto: "A cidade que nunca dorme. Luzes, festas e oportunidades em cada esquina.",
        },
        "grassrivers": {
            numero: "02",
            nome: "Grassrivers",
            texto: "Pântanos e natureza selvagem, um lado mais cru de Leonida.",
        },
        "leonida-keys": {
            numero: "03",
            nome: "Leonida Keys",
            texto: "Ilhas, praias e liberdade no horizonte.",
        },
        "port-gellhorn": {
            numero: "04",
            nome: "Port Gellhorn",
            texto: "Indústria, comércio e negócios sem limites.",
        },
    };

    const pontos = document.querySelectorAll(".leonida-regiao-botao");
    const painelInfo = document.getElementById("leonida-info");
    const infoNumero = document.querySelector(".leonida-info-numero");
    const infoNome = document.getElementById("leonida-info-nome");
    const infoTexto = document.getElementById("leonida-info-texto");

    if (!pontos.length || !infoNome || !infoTexto) {
        return;
    }

    let regiaoAtual = "vice-city";
    let trocaPendente = null;

    const escreverRegiao = function (dados) {
        if (infoNumero) {
            infoNumero.textContent = dados.numero;
        }

        infoNome.textContent = dados.nome;
        infoTexto.textContent = dados.texto;
    };

    const mostrarRegiao = function (chave, pontoAtivo) {
        const dados = regioes[chave];

        if (!dados || chave === regiaoAtual) {
            return;
        }

        regiaoAtual = chave;

        pontos.forEach(function (ponto) {
            ponto.classList.toggle("ativo", ponto === pontoAtivo);
        });

        // fade/slide: some, troca o texto, volta — sem mexer no tamanho do bloco
        if (painelInfo) {
            clearTimeout(trocaPendente);
            painelInfo.classList.add("trocando");

            trocaPendente = setTimeout(function () {
                escreverRegiao(dados);
                painelInfo.classList.remove("trocando");
            }, 180);
        } else {
            escreverRegiao(dados);
        }
    };

    pontos.forEach(function (ponto) {
        const chave = ponto.getAttribute("data-regiao");

        ponto.addEventListener("click", function () {
            mostrarRegiao(chave, ponto);
        });

        ponto.addEventListener("focus", function () {
            mostrarRegiao(chave, ponto);
        });
    });
})();

// 6. MODAL DE VÍDEO (reutilizado pelos cards de trailer)
(function () {
    const modal = document.getElementById("video-modal");
    const player = document.getElementById("video-modal-player");
    const indisponivel = document.getElementById("video-modal-indisponivel");
    const fechar = document.getElementById("video-modal-fechar");
    const botoesPlay = document.querySelectorAll("button.card-trailer-play");

    if (!modal || !player || !indisponivel || !botoesPlay.length) {
        return;
    }

    // detecta "não-desktop" pela capacidade real do aparelho (tela sem
    // hover / toque como ponteiro principal), e não pela largura da
    // janela — assim uma janela de desktop redimensionada continua
    // abrindo o vídeo local normalmente, só celular/tablet vai pro YouTube
    const ehAparelhoNaoDesktop = function () {
        return window.matchMedia("(hover: none), (pointer: coarse)").matches;
    };

    const abrirModal = function (src, poster) {
        modal.classList.add("aberto");

        // avisa o player de música para parar e não sobrepor os dois áudios
        document.dispatchEvent(new CustomEvent("trailer:abriu"));

        if (src) {
            if (poster) {
                player.poster = poster;
            }

            player.src = src;
            player.classList.add("ativo");
            indisponivel.classList.remove("ativo");

            // load() garante um estado limpo antes do play() — em alguns
            // navegadores móveis, tocar logo após trocar o src sem isso
            // pode falhar silenciosamente
            player.load();
            player.play().catch(function () {
                // autoplay pode ser bloqueado; os controles nativos do
                // player continuam disponíveis para o usuário iniciar manualmente
            });
        } else {
            player.classList.remove("ativo");
            indisponivel.classList.add("ativo");
        }
    };

    // se o arquivo falhar de verdade (caminho errado, formato não suportado
    // pelo navegador etc.), mostra uma mensagem em vez de deixar a tela
    // muda/preta — sem isso, uma falha parece só "não fazer nada"
    player.addEventListener("error", function () {
        if (!player.currentSrc) {
            return;
        }

        player.classList.remove("ativo");
        indisponivel.textContent = "Não foi possível carregar o vídeo.";
        indisponivel.classList.add("ativo");
    });

    const fecharModal = function () {
        modal.classList.remove("aberto");
        player.pause();
        player.removeAttribute("src");
        player.removeAttribute("poster");
        player.load();
    };

    botoesPlay.forEach(function (botao) {
        botao.addEventListener("click", function () {
            const linkYoutube = botao.getAttribute("data-youtube");

            // em celular/tablet, os cards com link do YouTube abrem o
            // YouTube em vez do player local (mantendo a capa/thumbnail
            // do card como está); no desktop segue abrindo o modal com
            // o vídeo local, como antes
            if (linkYoutube && ehAparelhoNaoDesktop()) {
                window.open(linkYoutube, "_blank", "noopener");
                return;
            }

            abrirModal(botao.getAttribute("data-video"), botao.getAttribute("data-poster"));
        });
    });

    if (fechar) {
        fechar.addEventListener("click", fecharModal);
    }

    modal.addEventListener("click", function (evento) {
        if (evento.target === modal) {
            fecharModal();
        }
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape" && modal.classList.contains("aberto")) {
            fecharModal();
        }
    });
})();

// 7. GALERIA — COVERFLOW + FUNDO DINÂMICO + LIGHTBOX
(function () {
    const secaoGaleria = document.getElementById("galeria");
    const fundoGaleria = document.getElementById("galeria-fundo");
    const pista = document.getElementById("galeria-coverflow-pista");
    const slides = Array.from(document.querySelectorAll(".galeria-slide"));
    const botaoAnterior = document.getElementById("galeria-anterior");
    const botaoProxima = document.getElementById("galeria-proxima");

    const lightbox = document.getElementById("galeria-lightbox");
    const lightboxImagem = document.getElementById("galeria-lightbox-imagem");
    const lightboxLegenda = document.getElementById("galeria-lightbox-legenda");
    const lightboxFechar = document.getElementById("galeria-lightbox-fechar");

    if (!secaoGaleria || !pista || !slides.length) {
        return;
    }

    const total = slides.length;
    let atual = 0;

    // ---------- fundo dinâmico: mesma mecânica de sempre (--galeria-imagem
    // + .galeria-ativa em .secao-galeria) — agora alimentada pelo item
    // central do coverflow, com um fade suave quando ele muda. ----------
    const aplicarImagemDeFundo = function (src) {
        if (!src) {
            return;
        }

        // url() numa custom property é resolvida relativa ao CSS que
        // consome o var(), não ao HTML — por isso resolvemos pra
        // absoluta aqui, senão o caminho "assets/..." quebra.
        const urlAbsoluta = new URL(src, document.baseURI).href;

        secaoGaleria.style.setProperty("--galeria-imagem", "url('" + urlAbsoluta + "')");
        secaoGaleria.classList.add("galeria-ativa");
    };

    const atualizarFundo = function (src, comTransicao) {
        if (!fundoGaleria || !window.gsap || !comTransicao) {
            aplicarImagemDeFundo(src);
            return;
        }

        gsap.to(fundoGaleria, {
            opacity: 0,
            duration: 0.25,
            ease: "power1.out",
            overwrite: "auto",
            onComplete: function () {
                aplicarImagemDeFundo(src);
                gsap.to(fundoGaleria, { opacity: 0.85, duration: 0.45, ease: "power1.out" });
            },
        });
    };

    // ---------- coverflow: distância circular pro loop infinito, sem
    // duplicar nenhum elemento (são sempre as mesmas 6 imagens). ----------
    const distanciaCircular = function (indice) {
        let d = indice - atual;
        if (d > total / 2) d -= total;
        if (d < -total / 2) d += total;
        return d;
    };

    const espacamentoAtual = function () {
        return window.innerWidth <= 800 ? 118 : 190;
    };

    const renderizar = function (instantaneo) {
        const espacamento = espacamentoAtual();

        slides.forEach(function (slide, indice) {
            const distancia = distanciaCircular(indice);
            const absoluta = Math.abs(distancia);
            const oculto = absoluta > 2;

            slide.setAttribute("data-atual", indice === atual ? "true" : "false");
            slide.style.pointerEvents = oculto ? "none" : "auto";
            slide.setAttribute("tabindex", oculto ? "-1" : "0");

            if (!window.gsap) {
                return;
            }

            gsap.to(slide, {
                xPercent: -50,
                x: distancia * espacamento,
                z: -absoluta * 140,
                rotateY: distancia * -26,
                scale: absoluta === 0 ? 1 : Math.max(0.6, 1 - absoluta * 0.17),
                opacity: oculto ? 0 : (absoluta === 0 ? 1 : 1 - absoluta * 0.32),
                zIndex: 100 - absoluta,
                duration: instantaneo ? 0 : 0.6,
                ease: "power3.out",
                overwrite: "auto",
            });
        });
    };

    const abrirLightbox = function (slide) {
        if (!lightbox || !lightboxImagem || !lightboxLegenda) {
            return;
        }

        const src = slide.getAttribute("data-imagem");
        const texto = slide.getAttribute("data-legenda") || "";

        lightboxLegenda.textContent = texto;
        lightboxImagem.src = src || "";
        lightboxImagem.alt = texto;
        lightbox.classList.add("aberto");
    };

    const fecharLightbox = function () {
        if (lightbox) {
            lightbox.classList.remove("aberto");
        }
    };

    const irPara = function (indice) {
        atual = ((indice % total) + total) % total;
        renderizar(false);
        atualizarFundo(slides[atual].getAttribute("data-imagem"), true);
    };

    const proximo = function () {
        irPara(atual + 1);
    };

    const anterior = function () {
        irPara(atual - 1);
    };

    // clique numa lateral: centraliza ela. clique na já-central: amplia.
    slides.forEach(function (slide, indice) {
        slide.addEventListener("click", function () {
            if (indice === atual) {
                abrirLightbox(slide);
            } else {
                irPara(indice);
            }
        });
    });

    if (botaoAnterior) {
        botaoAnterior.addEventListener("click", anterior);
    }

    if (botaoProxima) {
        botaoProxima.addEventListener("click", proximo);
    }

    pista.addEventListener("keydown", function (evento) {
        if (evento.key === "ArrowRight") {
            evento.preventDefault();
            proximo();
        } else if (evento.key === "ArrowLeft") {
            evento.preventDefault();
            anterior();
        }
    });

    // swipe: só mede início/fim do toque (sem touchmove, sem
    // preventDefault) — não interfere em nada no scroll vertical da página.
    let toqueInicioX = null;
    let toqueInicioY = null;

    pista.addEventListener("touchstart", function (evento) {
        const toque = evento.touches[0];
        if (!toque) {
            return;
        }
        toqueInicioX = toque.clientX;
        toqueInicioY = toque.clientY;
    }, { passive: true });

    pista.addEventListener("touchend", function (evento) {
        if (toqueInicioX === null) {
            return;
        }

        const toque = evento.changedTouches[0];
        if (!toque) {
            toqueInicioX = null;
            toqueInicioY = null;
            return;
        }

        const deltaX = toque.clientX - toqueInicioX;
        const deltaY = toque.clientY - toqueInicioY;
        toqueInicioX = null;
        toqueInicioY = null;

        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            if (deltaX < 0) {
                proximo();
            } else {
                anterior();
            }
        }
    }, { passive: true });

    let redimensionarTimeout;
    window.addEventListener("resize", function () {
        clearTimeout(redimensionarTimeout);
        redimensionarTimeout = setTimeout(function () {
            renderizar(true);
        }, 150);
    });

    if (lightboxFechar) {
        lightboxFechar.addEventListener("click", fecharLightbox);
    }

    if (lightbox) {
        lightbox.addEventListener("click", function (evento) {
            if (evento.target === lightbox) {
                fecharLightbox();
            }
        });
    }

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape" && lightbox && lightbox.classList.contains("aberto")) {
            fecharLightbox();
        }
    });

    // estado inicial: primeira imagem já centralizada e já é o fundo, sem
    // transição (é o carregamento da página, não uma troca).
    renderizar(true);
    atualizarFundo(slides[0].getAttribute("data-imagem"), false);
})();

// 8. THE SOUND OF VICE CITY — player real das faixas do álbum
(function () {
    const vinil = document.getElementById("sound-vinil");
    const onda = document.getElementById("sound-onda");
    const faixas = document.querySelectorAll(".sound-faixa");
    const audio = document.getElementById("sound-audio");
    const progresso = document.getElementById("sound-barra-progresso");

    if (!vinil || !onda || !faixas.length || !audio) {
        return;
    }

    // gera as barras da onda sonora full-width. Cada uma recebe uma
    // duração/atraso levemente aleatórios para o movimento parecer
    // orgânico (nada de repetição uniforme) quando não há áudio real.
    const NUM_BARRAS = 72;
    const barras = [];

    for (let i = 0; i < NUM_BARRAS; i++) {
        const barra = document.createElement("span");
        const amplitude = 25 + Math.round(Math.random() * 60); // 25%–85%
        const duracao = (1.6 + Math.random() * 1.8).toFixed(2); // 1.6s–3.4s
        const atraso = (Math.random() * 2).toFixed(2);

        barra.style.setProperty("--max", amplitude + "%");
        barra.style.setProperty("--dur", duracao + "s");
        barra.style.setProperty("--delay", atraso + "s");

        onda.appendChild(barra);
        barras.push(barra);
    }

    let faixaAtiva = null;

    const marcarParado = function () {
        vinil.classList.remove("tocando");
        onda.classList.remove("tocando");

        faixas.forEach(function (f) {
            f.classList.remove("tocando");
            const icone = f.querySelector(".sound-faixa-play");
            if (icone) {
                icone.textContent = "\u25BA";
            }
        });
    };

    const marcarTocando = function (faixa) {
        marcarParado();
        faixa.classList.add("ativa", "tocando");

        const icone = faixa.querySelector(".sound-faixa-play");
        if (icone) {
            icone.textContent = "\u2016";
        }

        vinil.classList.add("tocando");
        onda.classList.add("tocando");
    };

    const zerarProgresso = function () {
        if (progresso) {
            progresso.style.width = "0";
        }
    };

    faixas.forEach(function (faixa) {
        faixa.addEventListener("click", function () {
            const src = faixa.getAttribute("data-audio");

            if (!src) {
                return;
            }

            // mesma faixa: alterna play/pause sem recarregar o arquivo
            if (faixa === faixaAtiva) {
                if (audio.paused) {
                    audio.play().catch(function () {});
                    marcarTocando(faixa);
                } else {
                    audio.pause();
                    marcarParado();
                    faixa.classList.add("ativa");
                }
                return;
            }

            // faixa diferente: troca a fonte e começa do início
            faixas.forEach(function (f) {
                f.classList.remove("ativa");
            });

            faixaAtiva = faixa;
            audio.src = src;
            zerarProgresso();

            audio.play().then(function () {
                marcarTocando(faixa);
            }).catch(function () {
                // navegador pode bloquear até haver interação; o clique já é uma,
                // mas se falhar deixamos a interface em estado parado
                marcarParado();
                faixa.classList.add("ativa");
            });
        });
    });

    audio.addEventListener("timeupdate", function () {
        if (!progresso || !audio.duration || !Number.isFinite(audio.duration)) {
            return;
        }

        progresso.style.width = (audio.currentTime / audio.duration) * 100 + "%";
    });

    audio.addEventListener("ended", function () {
        marcarParado();
        zerarProgresso();

        // toca a próxima faixa da lista automaticamente
        const lista = Array.prototype.slice.call(faixas);
        const indice = lista.indexOf(faixaAtiva);
        const proxima = lista[indice + 1];

        if (proxima) {
            proxima.click();
        } else {
            faixaAtiva = null;
        }
    });

    audio.addEventListener("pause", function () {
        vinil.classList.remove("tocando");
        onda.classList.remove("tocando");
    });

    // se o usuário abrir um trailer, a música para para não sobrepor o áudio
    document.addEventListener("trailer:abriu", function () {
        if (!audio.paused) {
            audio.pause();
            marcarParado();
        }
    });
})();

// 9. COUNTDOWN — contagem real até 19/11/2026
(function () {
    const elDias = document.getElementById("cd-dias");
    const elHoras = document.getElementById("cd-horas");
    const elMinutos = document.getElementById("cd-minutos");
    const elSegundos = document.getElementById("cd-segundos");
    const elNumeros = document.getElementById("countdown-numeros");
    const elMensagem = document.getElementById("countdown-mensagem");

    if (!elDias || !elHoras || !elMinutos || !elSegundos) {
        return;
    }

    const dataLancamento = new Date("2026-11-19T00:00:00");

    const doisDigitos = function (valor) {
        return String(valor).padStart(2, "0");
    };

    const atualizarContagem = function () {
        const agora = new Date();
        const diferenca = dataLancamento.getTime() - agora.getTime();

        if (diferenca <= 0) {
            if (elNumeros) {
                elNumeros.hidden = true;
            }

            if (elMensagem) {
                elMensagem.hidden = false;
            }

            clearInterval(intervalo);
            return;
        }

        const segundosTotais = Math.floor(diferenca / 1000);
        const dias = Math.floor(segundosTotais / 86400);
        const horas = Math.floor((segundosTotais % 86400) / 3600);
        const minutos = Math.floor((segundosTotais % 3600) / 60);
        const segundos = segundosTotais % 60;

        elDias.textContent = doisDigitos(dias);
        elHoras.textContent = doisDigitos(horas);
        elMinutos.textContent = doisDigitos(minutos);
        elSegundos.textContent = doisDigitos(segundos);
    };

    atualizarContagem();
    const intervalo = setInterval(atualizarContagem, 1000);
})();
