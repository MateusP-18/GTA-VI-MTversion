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

    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");

    const tocarVideo = function () {
        const playPromise = video.play();

        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {
                // autoplay pode ser bloqueado até o usuário interagir
            });
        }
    };

    if (video.readyState >= 2) {
        tocarVideo();
    } else {
        video.addEventListener("loadeddata", tocarVideo, { once: true });
    }

    gsap.timeline({
        scrollTrigger: {
            trigger: capa,
            start: "top top",
            end: "+=2500",
            scrub: 1,
            pin: true,
        }
    })
        .to(video, { opacity: 1, ease: "none" }, 0)
        .to(".capa-conteudo, .capa-barra, .capa-seta", {
            opacity: 0,
            y: -40,
            scale: 0.6,
            duration: 0.1,
            ease: "none",
        }, 0.02)

    gsap.to(video, {
        currentTime: function () {
            if (!video.duration || Number.isNaN(video.duration)) {
                return 0;
            }

            return video.duration;
        },
        ease: "none",
        scrollTrigger: {
            trigger: capa,
            start: "top top",
            end: "+=1200",
            scrub: 1.2,
            invalidateOnRefresh: true,
        }
    });
}

