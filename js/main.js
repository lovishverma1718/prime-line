/* PRIME LINE MECHANICAL — interactions v2 */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Preloader */
  let loaded = false;
  const finish = () => {
    if (loaded) return; loaded = true;
    $('.preloader')?.classList.add('done');
    body.classList.add('loaded');
  };
  window.addEventListener('load', () => setTimeout(finish, 500));
  setTimeout(finish, 2600);

  /* Smooth scroll (Lenis, if the CDN loaded) */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollToEl = (el) => lenis ? lenis.scrollTo(el, { offset: -140 }) : el.scrollIntoView({ behavior: 'smooth' });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = $(a.getAttribute('href'));
    if (t) { e.preventDefault(); scrollToEl(t); }
  }));

  /* Scroll-driven bits */
  const header = $('.header');
  const bar = $('.progress');
  const pheroImg = $('.phero__img img');
  const statement = $('.statement');
  const words = statement ? $$('.w', statement) : [];
  const svcLinks = $$('.svc-nav a');
  const svcRows = svcLinks.map((a) => $(a.getAttribute('href')));

  const onScroll = () => {
    const y = scrollY;
    header?.classList.toggle('scrolled', y > 30);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (y / Math.max(max, 1)) * 100 + '%';
    if (pheroImg) pheroImg.style.transform = `translateY(${y * 0.12}px)`;
    if (words.length) {
      const r = statement.getBoundingClientRect();
      const p = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35);
      const n = Math.floor(Math.min(Math.max(p, 0), 1) * words.length * 1.05);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    if (svcRows.length) {
      let cur = 0;
      svcRows.forEach((r, i) => { if (r && r.getBoundingClientRect().top < innerHeight * 0.45) cur = i; });
      svcLinks.forEach((a, i) => a.classList.toggle('on', i === cur));
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const burger = $('.burger');
  burger?.addEventListener('click', () => {
    const open = body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
    open ? lenis?.stop() : lenis?.start();
    body.style.overflow = open ? 'hidden' : '';
  });

  /* Reveal */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .clip-in, .tline').forEach((el) => io.observe(el));

  /* Counters */
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / 2000, 1);
      el.firstChild.nodeValue = Math.round(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    cio.unobserve(el);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  /* Heating dial */
  const dial = $('.dial');
  if (dial) {
    const arc = $('.dial__arc', dial), val = $('.dial__num', dial), lbl = $('.dial__lbl', dial);
    const LEN = 2 * Math.PI * 70 * 0.75; // 270° arc
    const modes = {
      heat: { v: 22, min: 15, max: 28, label: 'Room temp', unit: '°C' },
      water: { v: 55, min: 40, max: 65, label: 'Hot water', unit: '°C' },
    };
    let mode = 'heat';
    arc.style.strokeDasharray = `${LEN} 1000`;
    const draw = () => {
      const m = modes[mode];
      val.textContent = m.v;
      lbl.textContent = m.label;
      arc.style.strokeDashoffset = LEN * (1 - (m.v - m.min) / (m.max - m.min));
    };
    $$('[data-mode]', dial).forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      $$('[data-mode]', dial).forEach((x) => x.classList.toggle('on', x === b));
      draw();
    }));
    $$('[data-step]', dial).forEach((b) => b.addEventListener('click', () => {
      const m = modes[mode];
      m.v = Math.min(m.max, Math.max(m.min, m.v + +b.dataset.step));
      draw();
    }));
    arc.style.strokeDashoffset = LEN;
    setTimeout(draw, 900);
  }

  /* Room-by-room explorer */
  const ex = $('.explorer');
  if (ex && window.EXPLORER) {
    const img = $('.ex-media img', ex), title = $('.ex-body h3', ex), desc = $('.ex-body > p', ex),
      list = $('.ex-list', ex), count = $('.ex-count b', ex);
    const check = $('#tpl-check').innerHTML;
    const show = (k) => {
      const d = window.EXPLORER[k];
      img.classList.add('out');
      setTimeout(() => { img.src = d.img; img.onload = () => img.classList.remove('out'); }, 300);
      title.textContent = d.title;
      desc.textContent = d.text;
      count.textContent = d.items.length;
      list.innerHTML = d.items.map((t, i) => `<li style="animation-delay:${i * 60}ms"><span>${check}</span>${t}</li>`).join('');
    };
    $$('.ex-tab', ex).forEach((t) => t.addEventListener('click', () => {
      $$('.ex-tab', ex).forEach((x) => x.classList.toggle('on', x === t));
      show(t.dataset.key);
    }));
  }

  /* Carousel */
  const car = $('.carousel');
  if (car) {
    const prog = $('.car-progress i');
    const upd = () => {
      const max = car.scrollWidth - car.clientWidth;
      const vis = car.clientWidth / car.scrollWidth;
      prog.style.width = Math.max(vis, (car.scrollLeft / Math.max(max, 1)) * (1 - vis) + vis) * 100 + '%';
    };
    car.addEventListener('scroll', upd, { passive: true }); upd();
    $$('.car-nav button').forEach((b, i) => b.addEventListener('click', () =>
      car.scrollBy({ left: (i ? 1 : -1) * car.clientWidth * 0.7, behavior: 'smooth' })));
    let down = false, sx = 0, sl = 0, moved = false;
    car.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = car.scrollLeft; });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      if (Math.abs(e.clientX - sx) > 5) { moved = true; car.classList.add('drag'); }
      car.scrollLeft = sl - (e.clientX - sx);
    });
    addEventListener('pointerup', () => { down = false; setTimeout(() => car.classList.remove('drag'), 0); });
    car.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  /* Service-area toggle */
  $$('.area-toggle button').forEach((b) => b.addEventListener('click', () => {
    const wrap = b.closest('.area-wrap');
    $$('.area-toggle button', wrap).forEach((x) => x.classList.toggle('on', x === b));
    $$('.area-media img', wrap).forEach((im) => im.classList.toggle('out', im.dataset.area !== b.dataset.area));
    $$('[data-area-list]', wrap).forEach((l) => (l.hidden = l.dataset.areaList !== b.dataset.area));
    const fc = $('.area-media .float-card', wrap);
    if (fc) { $('strong', fc).textContent = b.dataset.title; $('small', fc).textContent = b.dataset.sub; }
  }));

  /* FAQ */
  $$('.faq__q').forEach((q) => q.addEventListener('click', () => {
    const item = q.parentElement, open = item.classList.contains('open');
    $$('.faq__item', item.parentElement).forEach((o) => { o.classList.remove('open'); $('.faq__q', o).setAttribute('aria-expanded', 'false'); });
    if (!open) { item.classList.add('open'); q.setAttribute('aria-expanded', 'true'); }
  }));

  /* Project filters */
  $$('.filter').forEach((btn) => btn.addEventListener('click', () => {
    $$('.filter').forEach((b) => b.classList.toggle('on', b === btn));
    const f = btn.dataset.filter;
    $$('.pgrid .proj').forEach((p) => p.classList.toggle('hide', f !== 'all' && !p.dataset.cat.includes(f)));
  }));

  /* Lightbox */
  const lb = $('.lightbox');
  if (lb) {
    const img = $('img', lb), cap = $('.lightbox__cap', lb);
    $$('.proj').forEach((p) => p.addEventListener('click', () => {
      img.src = $('img', p).src.replace(/w=\d+/, 'w=1800');
      img.alt = $('h3', p)?.textContent || '';
      cap.innerHTML = `<small>${$('.proj__tag', p)?.textContent || ''}</small>${$('h3', p)?.textContent || ''}`;
      lb.classList.add('open'); lenis?.stop();
    }));
    const close = () => { lb.classList.remove('open'); lenis?.start(); };
    $('.lightbox__close', lb).addEventListener('click', close);
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* Contact form → opens the visitor's email app, pre-filled */
  const form = $('#quote-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const subject = `Quote request: ${d.service || 'General'} (${d.name})`;
    const lines = [`Name: ${d.name}`, `Phone: ${d.phone}`, `Email: ${d.email}`, `Service: ${d.service}`,
      `Property type: ${d.property}`, `City: ${d.city}`, '', d.message];
    location.href = `mailto:mechanicalprimeline@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    $('.form-success')?.classList.add('show');
  });

  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
