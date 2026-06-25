/* ============================================================
   KINDA — Main JS  ·  anime.js v3 powered
   ============================================================ */



// ── Smooth scroll ─────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('.scroll-to').forEach(el => {
    el.addEventListener('click', e => {
      const id = el.dataset.target || el.getAttribute('href')?.replace('#', '');
      const target = id && document.getElementById(id);
      if (target) {
        e.preventDefault();
        if (window.lenis) {
          window.lenis.scrollTo(target);
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

// ── Split headline into per-letter spans ─────────────────
function splitLetters(el) {
  el.innerHTML = el.innerHTML
    .split(/<br\s*\/?>/i)
    .map(line =>
      line.trim().split(' ').map(word =>
        `<span style="display:inline-block;white-space:nowrap">${
          word.split('').map(ch =>
            `<span class="char-wrap"><span class="char-inner">${ch}</span></span>`
          ).join('')
        }</span>`
      ).join(' ')
    )
    .join('<br>');
  return el.querySelectorAll('.char-inner');
}

// ── Hero entrance (runs on load) ─────────────────────────
function initHeroAnimation() {
  const headline = document.querySelector('.hero-headline');
  const sub      = document.querySelector('.hero-sub');
  const badges   = document.querySelector('.hero-badges');
  const scroll   = document.querySelector('.hero-scroll-indicator');
  if (!headline) return;

  const chars = splitLetters(headline);
  anime.set(chars, { scaleY: 0, opacity: 0 });
  headline.style.opacity = '1';

  anime.set([sub, badges, scroll].filter(Boolean), { opacity: 0, translateY: 24 });

  anime.timeline({ easing: 'easeOutExpo' })
    .add({
      targets: chars,
      scaleY: [0, 1],
      opacity: [0, 1],
      duration: 860,
      delay: anime.stagger(28, { start: 80 }),
    })
    .add({
      targets: sub,
      opacity: [0, 1],
      translateY: [22, 0],
      duration: 720,
    }, '-=520')
    .add({
      targets: badges,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 600,
    }, '-=460')
    .add({
      targets: scroll,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 500,
    }, '-=380');
}



// ── Custom cursor (global, pointer-fine only) ─────────────
function initCustomCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const ring = document.getElementById('cursor-ring');
  const dot  = document.getElementById('cursor-dot');
  if (!ring || !dot) return;

  const RING_HALF = 18, DOT_HALF = 2.5;
  let mx = 0, my = 0;
  let rx = 0, ry = 0;
  let visible = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    if (!visible) {
      visible = true;
      rx = mx; ry = my;
      ring.classList.add('is-visible');
      dot.classList.add('is-visible');
    }
  });

  document.addEventListener('mouseleave', () => {
    ring.classList.remove('is-visible');
    dot.classList.remove('is-visible');
    visible = false;
  });

  document.addEventListener('mousedown', () => ring.classList.add('is-click'));
  document.addEventListener('mouseup',   () => ring.classList.remove('is-click'));

  // Expand ring over interactive elements
  document.querySelectorAll('a, button, [role="button"]').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
  });

  (function tick() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    dot.style.transform  = `translate3d(${mx  - DOT_HALF}px,${my  - DOT_HALF}px,0)`;
    ring.style.transform = `translate3d(${rx - RING_HALF}px,${ry - RING_HALF}px,0)`;
    requestAnimationFrame(tick);
  })();
}

// ── Hero canvas glow — spring-physics orb ─────────────────
function initHeroCursorGlow() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const hero     = document.getElementById('hero');
  const canvas   = hero && hero.querySelector('.hero-glow-canvas');
  const headline = document.querySelector('.hero-headline');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Target cursor position inside hero
  let tx = -1, ty = -1;
  let entered = false;
  // Spring glow position (lerps toward target)
  let gx, gy;

  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
    entered = true;
    if (gx === undefined) { gx = tx; gy = ty; }
  }, { passive: true });

  hero.addEventListener('mouseleave', () => { entered = false; }, { passive: true });

  let pmx = 0, pmy = 0, vel = 0, smoothVel = 0, chromaOffset = 0;

  (function draw() {
    // Init glow position to hero center on first frame
    if (gx === undefined) { gx = canvas.width * 0.5; gy = canvas.height * 0.42; }

    const targetX = entered ? tx : canvas.width  * 0.5;
    const targetY = entered ? ty : canvas.height * 0.42;
    const speed   = entered ? 0.09 : 0.025;
    gx += (targetX - gx) * speed;
    gy += (targetY - gy) * speed;

    const velX = gx - pmx;
    const velY = gy - pmy;
    pmx = gx; pmy = gy;
    vel       = Math.sqrt(velX * velX + velY * velY);
    smoothVel = smoothVel * 0.92 + vel * 0.08;
    chromaOffset = chromaOffset * 0.90 + Math.min(smoothVel * 0.10, 4) * 0.10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const W = canvas.width, H = canvas.height;

    // 1 — ambient base haze (always present, large + soft)
    const R0 = Math.min(W, H) * 0.6;
    const g0 = ctx.createRadialGradient(gx, gy, 0, gx, gy, R0);
    g0.addColorStop(0,   'rgba(160,200,255,0.055)');
    g0.addColorStop(0.5, 'rgba(100,140,255,0.022)');
    g0.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g0;
    ctx.fillRect(0, 0, W, H);

    // 2 — warm core orb (follows cursor tightly)
    const R1 = 220 + smoothVel * 1.2;
    const g1 = ctx.createRadialGradient(gx, gy, 0, gx, gy, R1);
    g1.addColorStop(0,   `rgba(255,245,200,${0.10 + smoothVel * 0.0012})`);
    g1.addColorStop(0.3, `rgba(255,200,100,${0.045 + smoothVel * 0.0006})`);
    g1.addColorStop(1,   'rgba(255,160,40,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    // 3 — cool blue halo (leads the direction of movement)
    const ox = velX * 2.8;
    const oy = velY * 2.8;
    const R2 = 320 + smoothVel * 0.9;
    const g2 = ctx.createRadialGradient(gx + ox, gy + oy, 0, gx + ox, gy + oy, R2);
    g2.addColorStop(0,   `rgba(80,140,255,${0.06 + smoothVel * 0.0008})`);
    g2.addColorStop(0.5, `rgba(60,100,255,0.025)`);
    g2.addColorStop(1,   'rgba(40,60,255,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    // 4 — amber trail (lags behind, opposite direction)
    const R3 = 260 + smoothVel * 0.7;
    const g3 = ctx.createRadialGradient(gx - ox * 0.5, gy - oy * 0.5, 0, gx - ox * 0.5, gy - oy * 0.5, R3);
    g3.addColorStop(0,   `rgba(255,130,60,${0.05 + smoothVel * 0.0006})`);
    g3.addColorStop(1,   'rgba(255,80,0,0)');
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, W, H);

    // Chromatic aberration on headline (fast movement only)
    if (headline) {
      headline.style.filter = chromaOffset < 0.25
        ? ''
        : `drop-shadow(${chromaOffset}px 0 rgba(255,40,80,0.28)) drop-shadow(${-chromaOffset}px 0 rgba(40,180,255,0.28))`;
    }

    requestAnimationFrame(draw);
  })();
}

// ── Hero parallax — content vs video depth ─────────────────
function initHeroParallax() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const hero     = document.getElementById('hero');
  const inner    = hero && hero.querySelector('.hero-inner');
  const videoBg  = hero && hero.querySelector('.hero-video-bg');
  if (!hero || !inner) return;

  let itx = 0, ity = 0;   // inner target
  let icx = 0, icy = 0;   // inner current
  let vtx = 0, vty = 0;   // video target
  let vcx = 0, vcy = 0;   // video current

  hero.addEventListener('mousemove', e => {
    const r  = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width  - 0.5;   // −0.5 → 0.5
    const py = (e.clientY - r.top)  / r.height - 0.5;
    itx =  px * 16;   vty =  py * 12;   // inner follows cursor
    ity =  py * 10;   vtx =  px * 14;
    vtx = -px * 22;   // video moves opposite (depth illusion)
    vty = -py * 16;
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    itx = ity = vtx = vty = 0;
  }, { passive: true });

  (function tick() {
    icx += (itx - icx) * 0.08;
    icy += (ity - icy) * 0.08;
    vcx += (vtx - vcx) * 0.05;
    vcy += (vty - vcy) * 0.05;

    inner.style.transform = `translate3d(${icx}px,${icy}px,0)`;
    if (videoBg) videoBg.style.transform = `translate3d(${vcx}px,${vcy}px,0) scale(1.06)`;

    requestAnimationFrame(tick);
  })();
}

// ── Scroll-triggered animations ───────────────────────────
function initScrollAnimations() {
  const seen = new WeakSet();

  const run = (el) => {
    if (seen.has(el)) return;
    seen.add(el);

    const type  = el.dataset.anime;
    const delay = parseInt(el.dataset.animeDelay || '0', 10);

    if (type === 'fade-up') {
      anime({
        targets: el,
        opacity: [0, 1],
        translateY: [44, 0],
        duration: 820,
        delay,
        easing: 'easeOutExpo',
      });
    }

    if (type === 'fade-device') {
      anime({
        targets: el,
        opacity: [0, 1],
        translateY: [60, 0],
        scale: [0.94, 1],
        duration: 1050,
        delay,
        easing: 'easeOutExpo',
      });
    }

    if (type === 'fade-screen') {
      anime({
        targets: el,
        opacity: [0, 1],
        translateY: [80, 0],
        scale: [0.92, 1],
        duration: 1200,
        delay,
        easing: 'easeOutExpo',
      });
    }
  };

  // Set initial hidden states before observing
  document.querySelectorAll('[data-anime]').forEach(el => {
    const type = el.dataset.anime;
    if (type === 'fade-up')     anime.set(el, { opacity: 0, translateY: 44 });
    if (type === 'fade-device') anime.set(el, { opacity: 0, translateY: 60, scale: 0.94 });
    if (type === 'fade-screen') anime.set(el, { opacity: 0, translateY: 80, scale: 0.92 });
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          run(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('[data-anime]').forEach(el => observer.observe(el));
}

// ── 3D Carousel — failure mode cards ─────────────────────
const carouselCards = [
  { code: 'ACT', label: 'Activation failure',  color: '#7EC8E3', icon: 'ph-bold ph-lightning', quote: '"I know exactly what I need to do. I just can\'t make myself start."' },
  { code: 'DEC', label: 'Decision paralysis',  color: '#F0B429', icon: 'ph-bold ph-arrows-split', quote: '"I have so many things I could do that I end up doing none of them."' },
  { code: 'PER', label: 'Perfectionism trap',  color: '#B0A0E0', icon: 'ph-bold ph-target', quote: '"It\'s not ready yet. It needs to be right before I can send it."' },
  { code: 'MOM', label: 'Momentum dependency', color: '#7AC8B8', icon: 'ph-bold ph-gauge', quote: '"I work well — but only when I\'m already in the zone. Getting there is the problem."' },
  { code: 'BUR', label: 'Burnout / depletion', color: '#E8A598', icon: 'ph-bold ph-battery-empty', quote: '"I used to be productive. Now even small tasks feel like too much."' },
  { code: 'IDN', label: 'Identity fog',        color: '#9DB89A', icon: 'ph-bold ph-compass', quote: '"I\'m busy all the time but I don\'t feel like I\'m moving toward anything."' },
];

function initCarousel() {
  const rotor   = document.getElementById('carousel-rotor');
  const scene   = document.getElementById('carousel-scene');
  const stage   = scene && scene.parentElement;
  const pipsEl  = document.getElementById('carousel-pips');
  const glowEl  = document.getElementById('carousel-glow');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  if (!rotor) return;

  const N = carouselCards.length;
  let active = 0;
  let touchStartX = 0;
  let mouseStartX = 0;
  let isDragging  = false;
  let isHovered   = false;
  let autoPlayInterval = null;

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayInterval = setInterval(() => {
      goTo(active + 1);
    }, 2000);
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  function handleManualGoTo(idx) {
    goTo(idx);
    if (!isHovered) {
      startAutoPlay();
    }
  }

  function getCardWidth() {
    const w = window.innerWidth;
    if (w <= 600) return 280;
    if (w <= 900) return 340;
    return 460;
  }

  function hexToRgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ].join(',');
  }

  // Circular signed offset: how far card i is from active (-N/2 … N/2)
  function getOffset(i) {
    let off = i - active;
    while (off >  N / 2) off -= N;
    while (off < -N / 2) off += N;
    return off;
  }

  // Build cards
  carouselCards.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.dataset.index = i;
    card.innerHTML = `
      <div class="card-dot" style="background:${c.color};box-shadow:0 0 16px ${c.color}66">
        <i class="${c.icon}"></i>
      </div>
      <div class="card-code" style="color:${c.color}">${c.code}</div>
      <div class="card-label">${c.label}</div>
      <p class="card-quote">${c.quote}</p>
    `;
    rotor.appendChild(card);
  });

  // Build pips
  carouselCards.forEach((_, i) => {
    const pip = document.createElement('button');
    pip.className = 'carousel-pip';
    pip.setAttribute('aria-label', `Card ${i + 1}`);
    pip.setAttribute('role', 'tab');
    pip.addEventListener('click', () => handleManualGoTo(i));
    pipsEl.appendChild(pip);
  });

  function goTo(idx) {
    active = ((idx % N) + N) % N;
    const cw = getCardWidth();

    rotor.querySelectorAll('.carousel-card').forEach((card, i) => {
      const off = getOffset(i);
      const abs = Math.abs(off);
      const sign = off < 0 ? -1 : off > 0 ? 1 : 0;

      let tx, ry, tz, rz, scale, opacity, zIndex, bg, border, shadow;

      if (abs === 0) {
        tx = 0;                   ry =  0;   tz =   0; rz = 1.9; scale = 1;    opacity = 1;    zIndex = 10;
        bg     = 'var(--carousel-card-bg-0)';
        border = 'var(--carousel-card-border-0)';
        shadow = 'var(--carousel-card-shadow-0)';
      } else if (abs === 1) {
        tx = sign * cw * 1.08;   ry = sign * 50; tz = -50; rz = 0; scale = 0.88; opacity = 0.75; zIndex = 6;
        bg     = 'var(--carousel-card-bg-1)';
        border = 'var(--carousel-card-border-1)';
        shadow = 'var(--carousel-card-shadow-1)';
      } else if (abs === 2) {
        tx = sign * cw * 1.95;   ry = sign * 65; tz = -120; rz = 0; scale = 0.7; opacity = 0.28; zIndex = 3;
        bg     = 'var(--carousel-card-bg-2)';
        border = 'var(--carousel-card-border-2)';
        shadow = 'var(--carousel-card-shadow-2)';
      } else {
        tx = sign * cw * 2.6;    ry = sign * 75; tz = -200; rz = 0; scale = 0.5; opacity = 0;    zIndex = 0;
        bg     = 'var(--carousel-card-bg-3)';
        border = 'var(--carousel-card-border-3)';
        shadow = 'none';
      }

      card.style.transform     = `translateX(${tx}px) rotateY(${ry}deg) translateZ(${tz}px) scale(${scale}) rotateZ(${rz}deg)`;
      card.style.opacity       = String(opacity);
      card.style.zIndex        = String(zIndex);
      card.style.background    = bg;
      card.style.borderColor   = border;
      card.style.boxShadow     = shadow;
      card.style.pointerEvents = abs === 0 ? 'auto' : 'none';
    });

    pipsEl.querySelectorAll('.carousel-pip').forEach((pip, i) => {
      const on = i === active;
      pip.classList.toggle('is-active', on);
      pip.style.background = on ? carouselCards[i].color : '';
    });

    const rgb = hexToRgb(carouselCards[active].color);
    glowEl.style.background =
      `radial-gradient(ellipse 72% 60% at 50% 50%, rgba(${rgb},0.16), transparent 62%)`;
  }

  prevBtn.addEventListener('click', () => handleManualGoTo(active - 1));
  nextBtn.addEventListener('click', () => handleManualGoTo(active + 1));

  // Touch — listen on the full stage so side cards are swipeable
  const dragTarget = stage || scene;
  if (dragTarget) {
    dragTarget.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    dragTarget.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 36) {
        handleManualGoTo(active + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });

    // Mouse drag
    dragTarget.addEventListener('mousedown', e => {
      mouseStartX = e.clientX;
      isDragging = true;
    });
    
    dragTarget.addEventListener('mouseup', e => {
      if (!isDragging) return;
      isDragging = false;
      const dx = e.clientX - mouseStartX;
      if (Math.abs(dx) > 36) {
        handleManualGoTo(active + (dx < 0 ? 1 : -1));
      } else if (!isHovered) {
        startAutoPlay();
      }
    });
    
    dragTarget.addEventListener('mouseleave', () => {
      isDragging = false;
      isHovered = false;
      startAutoPlay();
    });
    
    dragTarget.addEventListener('mouseenter', () => {
      isHovered = true;
      stopAutoPlay();
    });
  }

  // Keyboard
  document.addEventListener('keydown', e => {
    const sf = document.getElementById('features');
    if (!sf) return;
    const r = sf.getBoundingClientRect();
    if (r.top > window.innerHeight || r.bottom < 0) return;
    if (e.key === 'ArrowLeft')  handleManualGoTo(active - 1);
    if (e.key === 'ArrowRight') handleManualGoTo(active + 1);
  });

  // Reposition on resize
  window.addEventListener('resize', () => goTo(active));

  goTo(0);
  startAutoPlay();
}

// ── Confession Card Fanning scrollytelling ─────────────────
function initConfessionSection() {
  const section = document.getElementById('features');
  const deck = document.querySelector('.confession-deck');
  if (!section || !deck) return;

  // Split scroll text into spans for word-by-word highlights
  const highlightText = document.getElementById('scroll-text');
  let wordSpans = [];
  if (highlightText) {
    const text = highlightText.innerText.trim();
    highlightText.innerHTML = text.split(/\s+/).map(word => `<span class="highlight-word">${word}</span>`).join(' ');
    wordSpans = highlightText.querySelectorAll('.highlight-word');
  }

  function updateConfessionFanning() {
    const rect = section.getBoundingClientRect();
    const totalScroll = section.offsetHeight - window.innerHeight;
    
    // Calculate scroll progress (0 to 1) when the section is scrolling through viewport
    let progress = -rect.top / totalScroll;
    progress = Math.max(0, Math.min(1, progress));

    const label = section.querySelector('.confession-label');
    const cards = deck.querySelectorAll('.confession-card');
    const isMobile = window.innerWidth <= 768;
    const currentScroll = window.scrollY;

    // A. Sequentially highlight text words (progress 0.05 to 0.45)
    if (wordSpans.length > 0) {
      wordSpans.forEach((span, idx) => {
        const thresh = 0.04 + (idx / wordSpans.length) * 0.40;
        if (progress >= thresh) {
          span.classList.add('active');
        } else {
          span.classList.remove('active');
        }
      });
    }

    // 1. Animate the title label ("Sound familiar?")
    if (label) {
      // Oscillation (Wobble / Sway): gentle tilt and translation based on scroll
      const labelWobbleFreq = isMobile ? 0.004 : 0.003;
      const labelWobbleAngle = Math.sin(currentScroll * labelWobbleFreq) * 2; // swing angle in degrees
      const labelWobbleX = Math.cos(currentScroll * labelWobbleFreq) * 5;      // horizontal sway in px
      const labelWobbleY = Math.sin(currentScroll * (labelWobbleFreq * 1.2)) * 4; // vertical sway in px

      // Fly-Up & Fade Out Phase (Progress 0.62 to 0.92)
      // The label flies up slightly earlier/faster than the rest of the cards
      const flyStart = 0.62;
      const flyEnd = 0.92;
      
      let flyProgress = 0;
      if (progress > flyStart) {
        flyProgress = (progress - flyStart) / (flyEnd - flyStart);
        flyProgress = Math.max(0, Math.min(1, flyProgress));
      }

      // Accelerated lift-off using cubic easing
      const flyEase = flyProgress * flyProgress * flyProgress;
      
      const flyY = flyEase * -850;            // fly up by up to 850px
      const opacity = 1 - flyEase;            // fade out completely

      // Smoothly scale down the scroll oscillation as the label exits
      const oscillationScale = Math.max(0, 1 - flyEase);
      const finalWobbleRot = labelWobbleAngle * oscillationScale;
      const finalWobbleX = labelWobbleX * oscillationScale;
      const finalWobbleY = labelWobbleY * oscillationScale;

      const totalX = finalWobbleX;
      const totalY = flyY + finalWobbleY;
      const totalRot = finalWobbleRot;

      label.style.transform = `translate3d(${totalX}px, ${totalY}px, 0) rotate(${totalRot}deg)`;
      label.style.opacity = opacity;

      // Animate highlight text together with label
      if (highlightText) {
        highlightText.style.transform = `translate3d(${totalX}px, ${totalY}px, 0) rotate(${totalRot}deg)`;
        highlightText.style.opacity = opacity;
      }
    }

    // 2. Animate the fanning cards
    cards.forEach((card, idx) => {
      const offset = idx - 2; // -2, -1, 0, 1, 2
      
      // Fanning Phase Progress (completes fanning by progress = 0.65)
      const fanLimit = 0.65;
      const fanProgress = Math.min(1, progress / fanLimit);
      
      let spreadX, rot;
      if (isMobile) {
        spreadX = offset * 48 * fanProgress;
        rot = offset * 5 * fanProgress;
      } else {
        spreadX = offset * 160 * fanProgress;
        rot = offset * 8 * fanProgress;
      }

      // Scroll-Driven Oscillation (Wobble / Sway back and forth)
      // Tied to actual window.scrollY to react dynamically to active scrolling speed/direction
      const wobbleFreq = isMobile ? 0.005 : 0.0035;
      const wobbleAngle = Math.sin(currentScroll * wobbleFreq + idx * 1.2) * 5; // swing angle in degrees
      const wobbleX = Math.cos(currentScroll * wobbleFreq + idx * 1.2) * 8;   // horizontal sway in px
      const wobbleY = Math.sin(currentScroll * (wobbleFreq * 1.2) + idx * 0.8) * 5; // vertical sway in px

      // Staggered Fly-Up & Fade Out Phase (Progress 0.65 to 0.95)
      // Cards start flying up in sequential order
      const flyStart = 0.65 + idx * 0.06; // Staggered start: 0.65, 0.71, 0.77, 0.83, 0.89
      const flyEnd = 0.96;
      
      let flyProgress = 0;
      if (progress > flyStart) {
        flyProgress = (progress - flyStart) / (flyEnd - flyStart);
        flyProgress = Math.max(0, Math.min(1, flyProgress));
      }

      // Accelerated lift-off using cubic easing
      const flyEase = flyProgress * flyProgress * flyProgress;
      
      const flyY = flyEase * -900;            // fly up by up to 900px
      const flyRot = flyEase * (offset * 12); // add a stylized twist as card exits
      const opacity = 1 - flyEase;            // fade out completely

      // Smoothly scale down the scroll oscillation as the card exits
      const oscillationScale = Math.max(0, 1 - flyEase);
      const finalWobbleRot = wobbleAngle * oscillationScale;
      const finalWobbleX = wobbleX * oscillationScale;
      const finalWobbleY = wobbleY * oscillationScale;

      // Combine fanning, oscillation, and exit animations
      const baseRot = offset * 3;
      const totalX = spreadX + finalWobbleX;
      const totalY = flyY + finalWobbleY;
      const totalRot = baseRot + rot + finalWobbleRot + flyRot;

      card.style.transform = `translate3d(${totalX}px, ${totalY}px, 0) rotate(${totalRot}deg)`;
      card.style.opacity = opacity;
    });
  }

  window.addEventListener('scroll', updateConfessionFanning, { passive: true });
  window.addEventListener('resize', updateConfessionFanning, { passive: true });
  updateConfessionFanning();
}

// ── Hero video crossfade ──────────────────────────────────
function initHeroVideos() {
  const vids = Array.from(document.querySelectorAll('.hero-vid'));
  if (!vids.length) return;

  let current    = 0;
  let busy       = false;
  const FADE_MS  = 1800;  // must match CSS transition duration
  const CUE_SECS = 1.6;   // start crossfade this many seconds before end

  function advance() {
    if (busy) return;
    busy = true;

    const prev = current;
    current = (current + 1) % vids.length;
    const next = vids[current];

    next.currentTime = 0;
    next.play().catch(() => {});
    next.classList.add('active');

    setTimeout(() => {
      vids[prev].classList.remove('active');
      vids[prev].pause();
      busy = false;
    }, FADE_MS);
  }

  vids.forEach((vid, i) => {
    vid.addEventListener('timeupdate', () => {
      if (i !== current || !vid.duration) return;
      if (vid.currentTime >= vid.duration - CUE_SECS) advance();
    });
    vid.addEventListener('ended', () => {
      if (i === current) advance();
    });
  });

  // Kick off the first video
  vids[0].play().catch(() => {});
}

// ── Waitlist form ─────────────────────────────────────────
function initForm() {
  const form       = document.getElementById('waitlist-form');
  if (!form) return;

  const nameInput  = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const nameError  = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const turnstileError = document.getElementById('turnstile-error');
  const submitBtn  = document.getElementById('submit-btn');
  const formWrap   = document.getElementById('form-wrap');
  const confirm    = document.getElementById('confirm');

  const WORKER_URL = 'https://kinda-waitlist.project-mvp-bluepill.workers.dev';

  const showError  = (err, inp, msg) => { err.textContent = msg; err.classList.add('visible'); inp.classList.add('error'); };
  const clearError = (err, inp)      => { err.textContent = '';  err.classList.remove('visible'); inp.classList.remove('error'); };

  nameInput.addEventListener('input',  () => clearError(nameError,  nameInput));
  emailInput.addEventListener('input', () => clearError(emailError, emailInput));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const nameVal  = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    let valid = true;

    clearError(nameError,  nameInput);
    clearError(emailError, emailInput);

    if (!nameVal)  { showError(nameError,  nameInput,  'Your first name is required.'); valid = false; }
    if (!emailVal) { showError(emailError, emailInput, 'Your email address is required.'); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) { showError(emailError, emailInput, 'Please enter a valid email address.'); valid = false; }

    if (!valid) return;

    // Cloudflare Turnstile — token must be present before we contact the Worker
    const turnstileToken = window.turnstile ? window.turnstile.getResponse() : '';
    if (!turnstileToken) {
      if (turnstileError) { turnstileError.textContent = 'Please complete the verification.'; turnstileError.classList.add('visible'); }
      return;
    }
    if (turnstileError) { turnstileError.textContent = ''; turnstileError.classList.remove('visible'); }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const res  = await fetch(WORKER_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: nameVal, email: emailVal, turnstileToken }),
      });
      const data = await res.json();

      if (res.status === 409 || data.error === 'duplicate') {
        showError(emailError, emailInput, "You're already on the list — we'll be in touch.");
      } else if (!res.ok) {
        showError(emailError, emailInput, 'Something went wrong. Please try again.');
      } else {
        formWrap.style.display = 'none';
        confirm.classList.add('visible');
      }
    } catch {
      showError(emailError, emailInput, 'Something went wrong. Please try again.');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      // Each token is single-use — reset so a fresh challenge is required next attempt
      if (window.turnstile) window.turnstile.reset();
    }
  });
}

// ── How It Works — scroll-driven moments ─────────────────
function initHowSection() {
  // ── Initialize Lenis Smooth Scroll ──
  try {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    document.documentElement.classList.add('lenis', 'lenis-smooth');
    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } catch (e) {
    console.warn("Lenis failed to initialize. Falling back to native scrolling.", e);
  }

  // ── Robust Letter-Splitting Helper ──
  function splitLettersRobust(el) {
    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent;
        if (!text.trim()) return;
        text = text.replace(/\s+/g, ' ').trim();

        const words = text.split(' ');
        const frag = document.createDocumentFragment();

        words.forEach((word, wordIdx) => {
          if (wordIdx > 0) {
            frag.appendChild(document.createTextNode(' '));
          }

          const wordSpan = document.createElement('span');
          wordSpan.style.display = 'inline-block';
          wordSpan.style.whiteSpace = 'nowrap';

          word.split('').forEach(ch => {
            const charWrap = document.createElement('span');
            charWrap.className = 'char-wrap';
            const charInner = document.createElement('span');
            charInner.className = 'char-inner';
            charInner.textContent = ch;
            charWrap.appendChild(charInner);
            wordSpan.appendChild(charWrap);
          });

          frag.appendChild(wordSpan);
        });

        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const children = Array.from(node.childNodes);
        children.forEach(child => processNode(child));
      }
    }

    processNode(el);
    return el.querySelectorAll('.char-inner');
  }

  // ── Split-letter Reveal Animations for Timeline & Stats Headers ──
  const timelineHeader = document.querySelector('.timeline-intro-headline');
  const statsHeader = document.querySelector('.c-numbers-stack_title');

  const headerObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const chars = splitLettersRobust(el);
        
        anime.set(chars, { scaleY: 0, opacity: 0 });
        el.style.opacity = '1';

        anime({
          targets: chars,
          scaleY: [0, 1],
          opacity: [0, 1],
          easing: 'easeOutExpo',
          duration: 800,
          delay: anime.stagger(20)
        });

        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  if (timelineHeader) {
    timelineHeader.style.opacity = '0';
    headerObserver.observe(timelineHeader);
  }
  if (statsHeader) {
    statsHeader.style.opacity = '0';
    headerObserver.observe(statsHeader);
  }

  // ── Tile Intersection Observer ──
  const inViewObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-inview');
        console.log('[IntersectionObserver] Element in view:', entry.target);
        
        // Fail-safe: if parent row is in view, force child card/illustration/corner elements to be marked in-view immediately
        if (entry.target.classList.contains('timeline-row')) {
          entry.target.querySelectorAll('.c-tile-animated, .c-illustration-card, .c-corner-asset').forEach(child => {
            if (!child.classList.contains('is-inview')) {
              child.classList.add('is-inview');
              console.log('[IntersectionObserver] Propagated is-inview to child:', child);
            }
          });
        }
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -60px 0px'
  });

  document.querySelectorAll('.c-tile-animated, .c-illustration-card, .c-corner-asset, .timeline-row').forEach(el => {
    inViewObserver.observe(el);
  });

  // ── Scrollytelling Character & Icon Parallax Updates ──
  const characters = document.querySelectorAll('.c-illustration-char');
  const physicsIcons = document.querySelectorAll('.c-illustration-icon');
  const cornerAssets = document.querySelectorAll('.c-corner-asset');

  // Initialize smooth animation state variables on elements
  characters.forEach(char => {
    char._currentOpacity = 0;
    char._currentScale = 0.85;
    char._currentY = 50;
  });

  physicsIcons.forEach(icon => {
    icon._currentY = undefined;
    icon._currentRot = undefined;
  });

  cornerAssets.forEach(asset => {
    asset._currentX = undefined;
    asset._currentY = undefined;
    asset._currentRot = undefined;
  });

  let isTickRunning = false;

  function runTick() {
    const viewportHeight = window.innerHeight || 800;
    const viewportCenterY = viewportHeight / 2;
    let needsMoreTicks = false;

    // 1. Polished Scroll-driven Entrance & Parallax for Mockup Characters
    characters.forEach(char => {
      const parentCard = char.closest('.c-illustration-card');
      if (!parentCard) return;

      const rect = parentCard.getBoundingClientRect();

      // Calculate scroll entrance progress (0 at 100% of viewport height, 1 at 60% of viewport height)
      const startY = viewportHeight * 1.0;
      const endY = viewportHeight * 0.60;
      const denom = startY - endY;
      
      let targetProgress = denom > 0 ? (startY - rect.top) / denom : 0;
      if (isNaN(targetProgress) || !isFinite(targetProgress)) {
        targetProgress = 0;
      }
      targetProgress = Math.max(0, Math.min(1, targetProgress));

      // Parallax scroll translation speed
      const speed = parseFloat(char.dataset.scrollSpeed) || -0.08;
      const charCenter = rect.top + rect.height / 2;
      const offset = viewportCenterY - charCenter;
      const parallaxY = isNaN(offset) ? 0 : offset * speed;

      // Entrance translation (slides up from 50px as it scrolls into view)
      const entranceY = (1 - targetProgress) * 50;
      const targetY = parallaxY + entranceY;

      // Scale goes from 0.85 to 1.0 based on progress
      const targetScale = 0.85 + 0.15 * targetProgress;
      const targetOpacity = targetProgress;

      // Ensure persistent states are valid numbers
      if (char._currentOpacity === undefined || isNaN(char._currentOpacity)) char._currentOpacity = 0;
      if (char._currentScale === undefined || isNaN(char._currentScale)) char._currentScale = 0.85;
      if (char._currentY === undefined || isNaN(char._currentY)) char._currentY = 50;

      // Smoothly interpolate values (lerp)
      const ease = 0.08;
      char._currentOpacity += (targetOpacity - char._currentOpacity) * ease;
      char._currentScale += (targetScale - char._currentScale) * ease;
      char._currentY += (targetY - char._currentY) * ease;

      const flip = char.alt === 'Run 2' ? 'scaleX(-1)' : '';
      
      char.style.opacity = char._currentOpacity;
      char.style.transform = `translate3d(0, ${char._currentY}px, 0) scale(${char._currentScale}) ${flip}`;

      // Check if we still have visible differences to animate
      const opacityDiff = Math.abs(targetOpacity - char._currentOpacity);
      const scaleDiff = Math.abs(targetScale - char._currentScale);
      const yDiff = Math.abs(targetY - char._currentY);
      if (opacityDiff > 0.001 || scaleDiff > 0.001 || yDiff > 0.1) {
        needsMoreTicks = true;
      }
    });

    // 2. Parallax and Rotation on Floating Icons
    physicsIcons.forEach(icon => {
      const parentCard = icon.closest('.c-illustration-card');
      if (!parentCard) return;

      const rect = parentCard.getBoundingClientRect();
      const scrollSpeed = parseFloat(icon.dataset.scrollSpeed) || 0.08;
      const rotateSpeed = parseFloat(icon.dataset.rotateSpeed) || 0.2;
      const iconCenter = rect.top + rect.height / 2;
      const offset = viewportCenterY - iconCenter;
      
      const translateY = offset * scrollSpeed;
      const rotation = offset * rotateSpeed;

      if (icon._currentY === undefined) {
        icon._currentY = translateY;
        icon._currentRot = rotation;
      }

      const ease = 0.08;
      icon._currentY += (translateY - icon._currentY) * ease;
      icon._currentRot += (rotation - icon._currentRot) * ease;
      
      icon.style.transform = `translate3d(0, ${icon._currentY}px, 0) rotate(${icon._currentRot}deg)`;

      const yDiff = Math.abs(translateY - icon._currentY);
      const rotDiff = Math.abs(rotation - icon._currentRot);
      if (yDiff > 0.1 || rotDiff > 0.1) {
        needsMoreTicks = true;
      }
    });

    // 3. Parallax and Rotation on Corner Assets
    cornerAssets.forEach(asset => {
      const parentRow = asset.closest('.timeline-row');
      if (!parentRow) return;

      const rect = parentRow.getBoundingClientRect();
      const speed = parseFloat(asset.dataset.scrollSpeed) || 0.05;
      const rotateSpeed = parseFloat(asset.dataset.rotateSpeed) || 0.2;
      const assetCenter = rect.top + rect.height / 2;
      const offset = viewportCenterY - assetCenter;

      let dirX = 0;
      let dirY = 0;
      if (asset.classList.contains('-top-left')) {
        dirX = 1; dirY = 1;
      } else if (asset.classList.contains('-bottom-left')) {
        dirX = 1; dirY = -1;
      } else if (asset.classList.contains('-top-right')) {
        dirX = -1; dirY = 1;
      } else if (asset.classList.contains('-bottom-right')) {
        dirX = -1; dirY = -1;
      }

      const translateX = offset * speed * dirX;
      const translateY = offset * speed * dirY;
      const rotation = offset * rotateSpeed;

      const img = asset.querySelector('.c-corner-asset-img');
      const flip = (img && img.style.transform.includes('scaleX(-1)')) ? 'scaleX(-1)' : '';

      if (asset._currentX === undefined) {
        asset._currentX = translateX;
        asset._currentY = translateY;
        asset._currentRot = rotation;
      }

      const ease = 0.08;
      asset._currentX += (translateX - asset._currentX) * ease;
      asset._currentY += (translateY - asset._currentY) * ease;
      asset._currentRot += (rotation - asset._currentRot) * ease;

      asset.style.transform = `translate3d(${asset._currentX}px, ${asset._currentY}px, 0) rotate(${asset._currentRot}deg) ${flip}`;

      const xDiff = Math.abs(translateX - asset._currentX);
      const yDiff = Math.abs(translateY - asset._currentY);
      const rotDiff = Math.abs(rotation - asset._currentRot);
      if (xDiff > 0.1 || yDiff > 0.1 || rotDiff > 0.1) {
        needsMoreTicks = true;
      }
    });

    if (needsMoreTicks) {
      requestAnimationFrame(runTick);
    } else {
      isTickRunning = false;
    }
  }

  function requestTick() {
    if (!isTickRunning) {
      isTickRunning = true;
      requestAnimationFrame(runTick);
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick, { passive: true });
  requestTick();

  // ── Stats Stacking Scroll Animation (Stepped Sticking Progress) ──
  const statsSection = document.querySelector('.c-numbers-stack');
  const statsListItems = document.querySelectorAll('.c-numbers-stack_list_item');

  function updateStatsStacking() {
    if (!statsSection || statsListItems.length === 0) return;

    statsListItems.forEach((item, index) => {
      const card = item.querySelector('.c-numbers-stack_card');
      if (!card) return;

      const itemRect = item.getBoundingClientRect();
      
      const cardIndex = index + 1;
      const stickyThreshold = 120 + cardIndex * 30;
      const progressStart = stickyThreshold + 220;
      const progressEnd = stickyThreshold;

      let progress = 0;
      if (itemRect.top <= progressStart) {
        progress = (progressStart - itemRect.top) / (progressStart - progressEnd);
      }
      progress = Math.max(0, Math.min(1, progress));

      card.style.setProperty('--progress', progress);
    });
  }

  window.addEventListener('scroll', updateStatsStacking, { passive: true });
  updateStatsStacking();
}

// ── Split button labels into individual characters for rolling animation ──
function initButtons() {
  document.querySelectorAll('.c-button_label').forEach(label => {
    const text = label.textContent.trim();
    label.innerHTML = text.split('').map(ch => {
      if (ch === ' ') return '&nbsp;';
      return `<span class="char">${ch}</span>`;
    }).join('');
  });
}

// ── Throttle ──────────────────────────────────────────────
function throttle(fn, ms) {
  let last = 0;
  return (...args) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...args); } };
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initHeroVideos();
  initHeroAnimation();
  initCustomCursor();
  initHeroCursorGlow();
  initHeroParallax();
  initScrollAnimations();
  initConfessionSection();
  initCarousel();
  initForm();
  initHowSection();
  initButtons();
  initBackgroundVideoRotation();
});

// ── Rotate global background videos with seamless cross-fades ──
function initBackgroundVideoRotation() {
  const videos = document.querySelectorAll('.global-video-bg video.bg-video');
  if (videos.length < 2) return;

  // Make sure all videos are playing
  videos.forEach(v => {
    v.play().catch(err => console.log("Video autoplay blocked or failed:", err));
  });

  let currentIndex = 0;
  const transitionInterval = 15000; // Rotate every 15 seconds

  setInterval(() => {
    const currentVideo = videos[currentIndex];
    currentIndex = (currentIndex + 1) % videos.length;
    const nextVideo = videos[currentIndex];

    // Cross-fade: set next active, remove active from current
    nextVideo.classList.add('active');
    
    // Give it a tiny delay to start fading out current, ensuring overlap
    setTimeout(() => {
      currentVideo.classList.remove('active');
    }, 100);
  }, transitionInterval);
}

