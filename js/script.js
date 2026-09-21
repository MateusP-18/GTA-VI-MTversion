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
    const observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("visivel");
            }
        });
    });

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
        ScrollTrigger.normalizeScroll(true);
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
    const PIXELS_POR_SEGUNDO = 500; // quanto maior, mais "espaço" o scroll dá pro vídeo

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

            gsap.set(capaConteudo, {
                opacity: 1 - progressoSaidaConteudo,
                y: -40 * progressoSaidaConteudo,
                scale: 1 - 0.08 * progressoSaidaConteudo,
            });

            if (capaBarra) {
                gsap.set(capaBarra, { opacity: 1 - progressoSaidaConteudo });
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

    const abrirModal = function (src) {
        modal.classList.add("aberto");

        // avisa o player de música para parar e não sobrepor os dois áudios
        document.dispatchEvent(new CustomEvent("trailer:abriu"));

        if (src) {
            player.src = src;
            player.classList.add("ativo");
            indisponivel.classList.remove("ativo");
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
        player.load();
    };

    botoesPlay.forEach(function (botao) {
        botao.addEventListener("click", function () {
            abrirModal(botao.getAttribute("data-video"));
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

// 7. LIGHTBOX DA GALERIA
(function () {
    const lightbox = document.getElementById("galeria-lightbox");
    const imagem = document.getElementById("galeria-lightbox-imagem");
    const legenda = document.getElementById("galeria-lightbox-legenda");
    const fechar = document.getElementById("galeria-lightbox-fechar");
    const itens = document.querySelectorAll(".galeria-item");

    if (!lightbox || !imagem || !legenda || !itens.length) {
        return;
    }

    const fecharLightbox = function () {
        lightbox.classList.remove("aberto");
    };

    itens.forEach(function (item) {
        item.addEventListener("click", function () {
            const src = item.getAttribute("data-imagem");
            const texto = item.getAttribute("data-legenda") || "";

            legenda.textContent = texto;
            imagem.src = src || "";
            imagem.alt = texto;
            lightbox.classList.add("aberto");
        });
    });

    if (fechar) {
        fechar.addEventListener("click", fecharLightbox);
    }

    lightbox.addEventListener("click", function (evento) {
        if (evento.target === lightbox) {
            fecharLightbox();
        }
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape" && lightbox.classList.contains("aberto")) {
            fecharLightbox();
        }
    });

    // Fundo da seção reagindo à imagem em destaque.
    // Mouse: hover. Toque (celular/tablet): já entra com a primeira imagem
    // e atualiza conforme o dedo desliza sobre as miniaturas.
    const secaoGaleria = document.getElementById("galeria");
    const gradeGaleria = document.querySelector(".galeria-grade");
    const temHoverReal =
        window.matchMedia &&
        window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const mostrarFundoDaImagem = function (src) {
        if (!secaoGaleria || !src) {
            return;
        }

        // IMPORTANTE: url() dentro de uma custom property é resolvida
        // relativa ao arquivo CSS que consome o var() (css/style.css),
        // não ao index.html. Por isso o caminho relativo "assets/..."
        // quebrava (o navegador procurava em css/assets/...).
        // Resolvendo para uma URL absoluta aqui, o caminho funciona
        // não importa onde a variável é usada.
        const urlAbsoluta = new URL(src, document.baseURI).href;

        secaoGaleria.style.setProperty(
            "--galeria-imagem",
            "url('" + urlAbsoluta + "')"
        );
        secaoGaleria.classList.add("galeria-ativa");
    };

    if (secaoGaleria && temHoverReal) {
        const limparFundo = function () {
            secaoGaleria.classList.remove("galeria-ativa");
        };

        itens.forEach(function (item) {
            item.addEventListener("mouseenter", function () {
                mostrarFundoDaImagem(item.getAttribute("data-imagem"));
            });

            item.addEventListener("mouseleave", limparFundo);
        });

        // rede de segurança: se o cursor sair da seção inteira, o fundo
        // nunca fica preso ligado
        secaoGaleria.addEventListener("mouseleave", limparFundo);
    } else if (secaoGaleria && gradeGaleria && itens.length) {
        // Toque: sem hover, então o fundo começa já com a primeira imagem
        // (nunca fica "sem nada") e troca conforme o dedo passa por cima
        // de cada miniatura — sem interferir no toque que abre o lightbox.
        let itemAtual = itens[0];
        mostrarFundoDaImagem(itemAtual.getAttribute("data-imagem"));

        const atualizarPeloToque = function (toque) {
            const alvo = document.elementFromPoint(toque.clientX, toque.clientY);
            const item = alvo ? alvo.closest(".galeria-item") : null;

            if (item && item !== itemAtual) {
                itemAtual = item;
                mostrarFundoDaImagem(item.getAttribute("data-imagem"));
            }
        };

        gradeGaleria.addEventListener("touchstart", function (evento) {
            if (evento.touches[0]) {
                atualizarPeloToque(evento.touches[0]);
            }
        }, { passive: true });

        gradeGaleria.addEventListener("touchmove", function (evento) {
            if (evento.touches[0]) {
                atualizarPeloToque(evento.touches[0]);
            }
        }, { passive: true });
    }
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
