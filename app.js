(() => {
  'use strict';
  const content = window.SITE_CONTENT;
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const pages = $$('.page');
  let activePage = 'home';
  let activeProjectId = null;
  let language = 'en';
  let routeVersion = 0;
  let toastTimer;
  const t = key => window.SITE_LOCALES[language][key] ?? window.SITE_LOCALES.en[key] ?? key;
  const localizedProject = project => ({ ...project, ...window.SITE_LOCALES[language].projects[project.id] });
  const contactEmail = () => content.email[language] || '';
  const gallery = window.createWorkGallery({ content, localize: localizedProject });

  function updateHomeButton() {
    const button = $('.home-button');
    const isProject = activePage === 'project';
    button.href = isProject
      ? (history.state?.homeReturn?.section === 'more-work' ? '#more-work' : '#work')
      : '#home';
    if (isProject) button.setAttribute('data-project-back', '');
    else button.removeAttribute('data-project-back');
    const label = isProject ? t('project.back') : t('home.label');
    button.setAttribute('aria-label', label);
    button.dataset.tooltip = label;
  }

  function showToast(message) {
    const toast = $('.toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  $('#about-intro').textContent = content.aboutIntro;
  $('#about-body').textContent = content.aboutBody;
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  const details = $('[data-contact-details]');
  if (contactEmail()) {
    const row = document.createElement('div');
    row.className = 'contact-email-row';
    const email = document.createElement('a');
    email.className = 'say-hello';
    email.href = `mailto:${contactEmail()}`;
    const address = document.createElement('span');
    address.className = 'email-address';
    address.textContent = contactEmail();
    const arrow = document.createElement('img');
    arrow.src = 'assets/arrow-up-right.svg';
    arrow.alt = '';
    email.append(address, arrow);
    const copy = document.createElement('button');
    copy.className = 'copy-email icon-button';
    copy.type = 'button';
    copy.dataset.i18nAria = 'contact.copy';
    copy.dataset.i18nTitle = 'contact.copy';
    copy.innerHTML = '<img src="assets/copy.svg" alt="">';
    copy.addEventListener('click', async () => {
      const addressToCopy = contactEmail();
      try {
        await navigator.clipboard.writeText(addressToCopy);
      } catch {
        // Local-network previews may not expose the Clipboard API.
        const field = document.createElement('textarea');
        field.value = addressToCopy;
        field.className = 'clipboard-field';
        field.setAttribute('readonly', '');
        document.body.append(field);
        field.select();
        let copied = false;
        try { copied = document.execCommand('copy'); } catch { /* Show the address when clipboard access is blocked. */ }
        field.remove();
        copy.focus({ preventScroll: true });
        if (!copied) { showToast(addressToCopy); return; }
      }
      showToast(t('contact.copied'));
    });
    row.append(email, copy);
    details.append(row);
  } else {
    const pending = document.createElement('button');
    pending.className = 'say-hello';
    pending.type = 'button';
    pending.innerHTML = '<span data-i18n="contact.hello">Say hello</span> <img src="assets/arrow-up-right.svg" alt="">';
    pending.addEventListener('click', () => $('.contact-dialog').showModal());
    const note = document.createElement('p');
    note.className = 'contact-pending';
    note.dataset.i18n = 'contact.pending';
    details.append(pending, note);
  }
  const socials = document.createElement('div');
  socials.className = 'social-links';
  for (const [name, url] of [['Instagram', content.instagram], ['Behance', content.behance]]) {
    if (!url || !/^https?:\/\//i.test(url)) continue;
    const link = document.createElement('a');
    link.textContent = name;
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    socials.append(link);
  }
  if (socials.children.length) details.append(socials);

  const dialog = $('.contact-dialog');
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });

  function updateThemeLabels() {
    const pink = root.dataset.theme === 'pink';
    $('.theme-button').setAttribute('aria-label', t(pink ? 'theme.white' : 'theme.pink'));
    $('.theme-button').dataset.tooltip = t(pink ? 'theme.whiteTip' : 'theme.pinkTip');
  }

  function setTheme(theme, save = true) {
    const pink = theme === 'pink';
    root.dataset.theme = pink ? 'pink' : 'white';
    const button = $('.theme-button');
    button.setAttribute('aria-pressed', String(pink));
    updateThemeLabels();
    $('meta[name="theme-color"]').content = pink ? '#ff9092' : '#ffffff';
    if (save) { try { localStorage.setItem('zorya-theme', theme); } catch { /* Storage is optional for file previews. */ } }
  }
  try { setTheme(localStorage.getItem('zorya-theme') || 'white', false); } catch { setTheme('white', false); }
  $('.theme-button').addEventListener('click', () => setTheme(root.dataset.theme === 'pink' ? 'white' : 'pink'));

  function loadProject(id) {
    const index = content.projects.findIndex(project => project.id === id);
    if (index < 0) return false;
    activeProjectId = id;
    const project = localizedProject(content.projects[index]);
    const collection = content.featured.includes(id) ? content.featured : content.more;
    $('#project-page').classList.toggle('is-empty', Boolean(project.detailEmpty));
    const isTwinkle = id === 'twinkle-twinkle';
    const isAmigo = id === 'amigo';
    const isTagi = id === 'tagi';
    const isScat = id === 's-cat';
    const isSummer = id === 'to-summer';
    const isCupshe = id === 'cupshe';
    const isBmw = id === 'bmw';
    const isXiannv = id === 'xiannv-lake';
    const isYan = id === 'yan-family';
    const isJinling = id === 'dream-in-jinling';
    const isTakeout = id === 'stole-my-takeout';
    const isOneleaf = id === 'one-leaf';
    document.body.classList.toggle('is-cupshe-project', isCupshe);
    document.body.classList.toggle('is-bmw-project', isBmw);
    $('#project-page').classList.toggle('is-twinkle', isTwinkle);
    $('#project-page').classList.toggle('is-amigo', isAmigo);
    $('#project-page').classList.toggle('is-tagi', isTagi);
    $('#project-page').classList.toggle('is-scat', isScat);
    $('#project-page').classList.toggle('is-summer', isSummer);
    $('#project-page').classList.toggle('is-cupshe', isCupshe);
    $('#project-page').classList.toggle('is-bmw', isBmw);
    $('#project-page').classList.toggle('is-xiannv', isXiannv);
    $('#project-page').classList.toggle('is-yan', isYan);
    $('#project-page').classList.toggle('is-jinling', isJinling);
    $('#project-page').classList.toggle('is-takeout', isTakeout);
    $('#project-page').classList.toggle('is-oneleaf', isOneleaf);
    $('#twinkle-detail').hidden = !isTwinkle;
    $('#amigo-detail').hidden = !isAmigo;
    $('#tagi-detail').hidden = !isTagi;
    $('#scat-detail').hidden = !isScat;
    $('#summer-detail').hidden = !isSummer;
    $('#cupshe-detail').hidden = !isCupshe;
    $('#bmw-detail').hidden = !isBmw;
    $('#xiannv-detail').hidden = !isXiannv;
    $('#yan-detail').hidden = !isYan;
    $('#jinling-detail').hidden = !isJinling;
    $('#takeout-detail').hidden = !isTakeout;
    $('#oneleaf-detail').hidden = !isOneleaf;
    if (isTwinkle) {
      $('#twinkle-title').textContent = project.title;
      $$('[data-twinkle]').forEach(element => { element.textContent = window.SITE_LOCALES[language].twinkle[element.dataset.twinkle]; });
    }
    if (isAmigo) {
      $('#amigo-title').textContent = project.title;
      $$('[data-amigo]').forEach(element => { element.textContent = window.SITE_LOCALES[language].amigo[element.dataset.amigo]; });
    }
    if (isTagi) {
      $('#tagi-title').textContent = project.title;
      $$('[data-tagi]').forEach(element => { element.textContent = window.SITE_LOCALES[language].tagiDetail[element.dataset.tagi]; });
    }
    if (isScat) {
      $('#scat-title').textContent = project.title;
      $$('[data-scat]').forEach(element => { element.textContent = window.SITE_LOCALES[language].scatDetail[element.dataset.scat]; });
    }
    if (isSummer) {
      $('#summer-title').textContent = project.title;
      $$('[data-summer]').forEach(element => { element.textContent = window.SITE_LOCALES[language].summerDetail[element.dataset.summer]; });
    }
    if (isCupshe) {
      $('#cupshe-title').textContent = project.title;
      $$('[data-cupshe]').forEach(element => { element.textContent = window.SITE_LOCALES[language].cupsheDetail[element.dataset.cupshe]; });
    }
    if (isBmw) {
      $('#bmw-title').textContent = project.title;
      $$('[data-bmw]').forEach(element => { element.textContent = window.SITE_LOCALES[language].bmwDetail[element.dataset.bmw]; });
    }
    if (isXiannv) {
      $('#xiannv-title').textContent = project.title;
      $$('[data-xiannv]').forEach(element => { element.textContent = window.SITE_LOCALES[language].xiannvDetail[element.dataset.xiannv]; });
    }
    if (isYan) {
      $('#yan-title').textContent = project.title;
      $$('[data-yan]').forEach(element => { element.textContent = window.SITE_LOCALES[language].yanDetail[element.dataset.yan]; });
    }
    if (isJinling) {
      $('#jinling-title').textContent = project.title;
      $$('[data-jinling]').forEach(element => { element.textContent = window.SITE_LOCALES[language].jinlingDetail[element.dataset.jinling]; });
    }
    if (isTakeout) {
      $('#takeout-title').textContent = project.title;
      $$('[data-takeout]').forEach(element => { element.textContent = window.SITE_LOCALES[language].takeoutDetail[element.dataset.takeout]; });
    }
    if (isOneleaf) {
      $('#oneleaf-title').textContent = project.title;
      $$('[data-oneleaf]').forEach(element => { element.textContent = window.SITE_LOCALES[language].oneleafDetail[element.dataset.oneleaf]; });
    }
    $('#project-category').textContent = project.category.toUpperCase();
    $('#project-title').textContent = project.title;
    $('#project-summary').textContent = project.summary;
    $('#project-concept').textContent = project.concept;
    $('#project-description').textContent = project.description;
    $('#project-discipline').textContent = project.category;
    $('#project-year').textContent = project.year;
    $('#project-cover').style.background = project.color;
    $('#project-image-one').style.background = project.secondary;
    $('#project-image-two').style.background = project.tertiary;
    const nextId = collection[(collection.indexOf(id) + 1) % collection.length];
    const next = localizedProject(content.projects.find(project => project.id === nextId));
    $('[data-project-back]').href = history.state?.homeReturn?.section === 'more-work' ? '#more-work' : '#work';
    $('#next-project').href = `#project/${next.id}`;
    $('#next-project-title').textContent = next.title;
    return true;
  }

  function updatePageTitle() {
    const title = activePage === 'about' ? t('page.about') : activePage === 'project' ? $('#project-title').textContent : t('page.home');
    document.title = `${t('identity.fullName')} | ${title}`;
  }

  function setLanguage(value) {
    language = value === 'zh' ? 'zh' : 'en';
    root.lang = language === 'zh' ? 'zh-CN' : 'en';
    $$('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
    $$('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label', t(element.dataset.i18nAria)); });
    $$('[data-i18n-alt]').forEach(element => { element.alt = t(element.dataset.i18nAlt); });
    $$('[data-i18n-tooltip]').forEach(element => { element.dataset.tooltip = t(element.dataset.i18nTooltip); });
    $$('[data-i18n-title]').forEach(element => { element.title = t(element.dataset.i18nTitle); });
    $$('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    $('meta[name="description"]').content = t('meta.description');
    $('#about-intro').textContent = language === 'en' ? content.aboutIntro : t('about.intro');
    $('#about-body').textContent = language === 'en' ? content.aboutBody : t('about.body');
    const emailLink = $('.contact-email-row .say-hello');
    if (emailLink) {
      emailLink.href = `mailto:${contactEmail()}`;
      $('.email-address', emailLink).textContent = contactEmail();
    }
    gallery.updateLanguage();
    if (activeProjectId) loadProject(activeProjectId);
    updateThemeLabels();
    updateHomeButton();
    updatePageTitle();
  }
  setLanguage('en');
  $$('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));

  async function route(hash, { initial = false, focus = false, restore = false } = {}) {
    const token = ++routeVersion;
    let target = hash.replace(/^#/, '') || 'home';
    const projectId = target.startsWith('project/') ? target.slice(8) : null;
    if (activeProjectId === 'twinkle-twinkle' && projectId !== 'twinkle-twinkle') $('#twinkle-detail video').pause();
    if (activeProjectId === 's-cat' && projectId !== 's-cat') $('#scat-detail video').pause();
    let nextPage = target === 'about' ? 'about' : projectId ? 'project' : 'home';
    if (projectId && !content.projects.some(project => project.id === projectId)) { nextPage = 'home'; target = 'work'; }
    document.body.classList.toggle('is-cupshe-project', nextPage === 'project' && projectId === 'cupshe');
    document.body.classList.toggle('is-bmw-project', nextPage === 'project' && projectId === 'bmw');
    const switching = activePage !== nextPage || nextPage === 'project';
    if (switching && !initial && !reducedMotion.matches) {
      const visible = pages.find(page => !page.hidden);
      if (visible) {
        const animation = visible.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-8px)' }], { duration: 150, easing: 'ease-out' });
        await animation.finished.catch(() => {});
      }
    }
    if (token !== routeVersion) return;
    if (projectId && nextPage === 'project') loadProject(projectId);
    pages.forEach(page => {
      page.hidden = page.dataset.page !== nextPage;
      page.classList.remove('is-entering');
    });
    activePage = nextPage;
    const visible = $(`[data-page="${nextPage}"]`);
    updateHomeButton();
    updatePageTitle();
    const destination = nextPage === 'home' ? document.getElementById(['home', 'work', 'more-work', 'contact'].includes(target) ? target : 'home') : visible;
    const saved = nextPage === 'home' && restore ? history.state?.homePosition : null;
    if (nextPage === 'home') gallery.restore(saved?.gallery || null);
    const scrollTop = saved ? saved.scrollY : nextPage === 'home' && destination.id !== 'home' ? destination.getBoundingClientRect().top + window.scrollY : 0;
    window.scrollTo({ top: scrollTop, behavior: initial || switching || restore || reducedMotion.matches ? 'instant' : 'smooth' });
    if (saved?.projectId) {
      const sourceCard = $(`[data-project="${saved.projectId}"]`);
      sourceCard?.focus({ preventScroll: true });
    }
    // Measure the destination before the entrance transform changes its bounds.
    if (switching && !initial) {
      void visible.offsetWidth;
      visible.classList.add('is-entering');
    }
    if (focus) {
      const heading = nextPage === 'home' ? destination.querySelector('h1,h2') : visible.querySelector('h1');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute('href');
    if (hash === '#main') return;
    event.preventDefault();
    if (link.hasAttribute('data-project-back') && history.state?.projectDepth > 0) {
      history.go(-history.state.projectDepth);
      return;
    }
    let homePosition = null;
    if (activePage === 'home') {
      homePosition = {
        scrollY: window.scrollY,
        gallery: gallery.snapshot(),
        section: link.closest('#more-work') ? 'more-work' : 'work',
        projectId: link.dataset.project || null,
      };
      history.replaceState({ ...history.state, homePosition }, '', location.href);
    }
    const nextState = hash.startsWith('#project/') ? {
      homeReturn: homePosition || history.state?.homeReturn || null,
      projectDepth: homePosition ? 1 : history.state?.projectDepth ? history.state.projectDepth + 1 : 0,
    } : {};
    if (location.hash !== hash) history.pushState(nextState, '', hash);
    route(hash, { focus: event.detail === 0 });
  });
  // Both events can fire for one history traversal; coalesce them before restoring.
  let historyRouteTimer;
  function routeHistory() {
    clearTimeout(historyRouteTimer);
    historyRouteTimer = setTimeout(() => route(location.hash, { restore: true }), 0);
  }
  window.addEventListener('popstate', routeHistory);
  window.addEventListener('hashchange', routeHistory);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
      }
    }, { threshold: .08, rootMargin: '0px 0px 30px 0px' });
    $$('.reveal').forEach(element => revealObserver.observe(element));
    root.classList.add('js-ready');
  }

  const stage = $('.card-stage');
  const avatar = $('.avatar');
  const homeButton = $('.home-button');
  const cards = $$('.motion-card').map(element => ({ element, x: 0, y: 0, r: 0, vx: 0, vy: 0, driftX: 0, driftY: 0, inputX: 0, inputY: 0 }));
  const links = $$('[data-magnetic]').map(element => ({ element, x: 0, y: 0, scale: 1, tx: 0, ty: 0, ts: 1 }));
  const head = { x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, tx: 0, ty: 0, tr: 0 };
  let pointer = null;
  let animationFrame = 0;
  let lastFrame = 0;

  function spring(state, key, velocity, target, stiffness, damping, dt) {
    state[velocity] += ((target - state[key]) * stiffness - state[velocity] * damping) * dt;
    state[key] += state[velocity] * dt;
    if (Math.abs(state[key] - target) < .005 && Math.abs(state[velocity]) < .01) { state[key] = target; state[velocity] = 0; }
  }

  function animate(time) {
    const dt = Math.min((time - lastFrame) / 1000 || 1 / 60, 1 / 30);
    lastFrame = time;
    let alive = false;
    const frame = dt * 60;
    for (const card of cards) {
      // Pointer momentum moves the card; a separate spring pulls it home.
      // Coupling rotation to the spring velocity gives the reference's swinging return.
      card.driftX = card.driftX * Math.pow(.9, frame) + card.inputX;
      card.driftY = card.driftY * Math.pow(.9, frame) + card.inputY;
      card.inputX = card.inputY = 0;
      card.x += card.driftX * frame;
      card.y += card.driftY * frame;
      card.vx = card.vx * Math.pow(.8, frame) - card.x * .05 * frame;
      card.vy = card.vy * Math.pow(.8, frame) - card.y * .05 * frame;
      card.x += card.vx * frame;
      card.y += card.vy * frame;
      const energy = Math.abs(card.x) + Math.abs(card.y) + Math.abs(card.vx) + Math.abs(card.vy) + Math.abs(card.driftX) + Math.abs(card.driftY);
      if (energy < .025) card.x = card.y = card.vx = card.vy = card.driftX = card.driftY = 0;
      const limit = card.element.offsetWidth * .85;
      card.r = clamp(-(card.vx - card.vy) * .25, -36, 36);
      card.element.style.setProperty('--mx', `${(limit * Math.tanh(card.x / limit)).toFixed(3)}px`);
      card.element.style.setProperty('--my', `${(limit * .65 * Math.tanh(card.y / (limit * .65))).toFixed(3)}px`);
      card.element.style.setProperty('--mr', `${card.r.toFixed(3)}deg`);
      alive ||= energy >= .025;
    }
    spring(head, 'x', 'vx', head.tx, 170, 13, dt);
    spring(head, 'y', 'vy', head.ty, 170, 13, dt);
    spring(head, 'r', 'vr', head.tr, 145, 11, dt);
    avatar.style.transform = `translate(${head.x.toFixed(2)}px,${head.y.toFixed(2)}px) rotate(${head.r.toFixed(2)}deg)`;
    alive ||= Math.abs(head.x - head.tx) + Math.abs(head.y - head.ty) + Math.abs(head.r - head.tr) + Math.abs(head.vr) > .04;
    for (const link of links) {
      const ease = 1 - Math.exp(-14 * dt);
      link.x += (link.tx - link.x) * ease;
      link.y += (link.ty - link.y) * ease;
      link.scale += (link.ts - link.scale) * ease;
      link.element.style.setProperty('--lx', `${link.x.toFixed(2)}px`);
      link.element.style.setProperty('--ly', `${link.y.toFixed(2)}px`);
      link.element.style.setProperty('--ls', link.scale.toFixed(4));
      alive ||= Math.abs(link.x - link.tx) + Math.abs(link.y - link.ty) + Math.abs(link.scale - link.ts) > .005;
    }
    animationFrame = alive ? requestAnimationFrame(animate) : 0;
  }

  function wake() {
    if (!animationFrame && !reducedMotion.matches) { lastFrame = performance.now(); animationFrame = requestAnimationFrame(animate); }
  }

  // Distance to the swept pointer segment keeps a fast swipe from skipping a card.
  function segmentDistance(x, y, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const length = dx * dx + dy * dy;
    const t = length ? clamp(((x - ax) * dx + (y - ay) * dy) / length, 0, 1) : 0;
    return Math.hypot(x - ax - t * dx, y - ay - t * dy);
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch' || reducedMotion.matches) return;
    const x = event.clientX, y = event.clientY;
    const button = homeButton.getBoundingClientRect();
    const hx = x - button.left - button.width / 2, hy = y - button.top - button.height / 2;
    const proximity = Math.max(0, 1 - Math.hypot(hx, hy) / 155);
    head.tx = clamp(hx * .055 * proximity, -4, 4);
    head.ty = clamp(hy * .045 * proximity, -3, 3);
    head.tr = clamp(hx * .55 * proximity - hy * .13 * proximity, -18, 18);
    if (activePage === 'home') {
      for (const link of links) {
        const box = link.element.getBoundingClientRect();
        const dx = x - (box.left + box.width / 2), dy = y - (box.top + box.height / 2);
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / 135);
        link.tx = dx * near * .07;
        link.ty = dy * near * .07;
        link.ts = 1 + near * .085;
      }
      if (pointer) {
        const dx = clamp(x - pointer.x, -220, 220);
        const dy = clamp(y - pointer.y, -220, 220);
        const bounds = stage.getBoundingClientRect();
        const scale = bounds.width / stage.offsetWidth;
        for (const card of cards) {
          const width = card.element.offsetWidth * scale;
          const cx = bounds.left + card.element.offsetLeft * scale + width / 2;
          const cy = bounds.top + card.element.offsetTop * scale + width / 2;
          if (cy < -width || cy > innerHeight + width) continue;
          const distance = segmentDistance(cx / innerWidth * 2, cy / innerHeight * 2, pointer.x / innerWidth * 2, pointer.y / innerHeight * 2, x / innerWidth * 2, y / innerHeight * 2);
          const influence = Math.pow(Math.max(0, 1 - distance), 6) * .4;
          if (!influence) continue;
          card.inputX += dx * influence;
          card.inputY += dy * influence;
        }
      }
    }
    pointer = { x, y, time: event.timeStamp };
    wake();
  }
  document.addEventListener('pointermove', onPointerMove, { passive: true });

  function resetPointer() {
    pointer = null;
    head.tx = head.ty = head.tr = 0;
    links.forEach(link => { link.tx = link.ty = 0; link.ts = 1; });
    wake();
  }
  document.documentElement.addEventListener('pointerleave', resetPointer);
  window.addEventListener('blur', resetPointer);
  window.addEventListener('scroll', () => { pointer = null; }, { passive: true });
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || reducedMotion.matches) return;
    cards.forEach((card, index) => { card.driftY = -5 - index; card.driftX = (index % 2 ? -1 : 1) * 4; });
    wake();
  }, { passive: true });
  links.forEach(link => {
    link.element.addEventListener('focus', () => { link.ts = 1.07; wake(); });
    link.element.addEventListener('blur', () => { link.ts = 1; wake(); });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(animationFrame); animationFrame = 0; pointer = null; }
    else wake();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      cancelAnimationFrame(animationFrame); animationFrame = 0;
      for (const card of cards) {
        card.x = card.y = card.r = card.vx = card.vy = card.driftX = card.driftY = card.inputX = card.inputY = 0;
        ['--mx', '--my', '--mr', '--ms'].forEach(name => card.element.style.removeProperty(name));
      }
      Object.keys(head).forEach(key => { head[key] = 0; });
      avatar.style.transform = '';
      links.forEach(link => {
        link.x = link.y = link.tx = link.ty = 0;
        link.scale = link.ts = 1;
        ['--lx', '--ly', '--ls'].forEach(name => link.element.style.removeProperty(name));
      });
    }
  });

  $$('[data-scroll-phone]').forEach(phone => {
    const screen = $('.cupshe-phone-screen', phone);
    let dragging = false;
    let startY = 0;
    let startScroll = 0;
    const updateProgress = () => {
      const max = Math.max(1, screen.scrollHeight - screen.clientHeight);
      phone.style.setProperty('--phone-progress', `${Math.min(100, screen.scrollTop / max * 100)}%`);
    };
    screen.addEventListener('scroll', updateProgress, { passive: true });
    screen.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch' || event.button !== 0) return;
      dragging = true;
      startY = event.clientY;
      startScroll = screen.scrollTop;
      screen.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    screen.addEventListener('pointermove', event => {
      if (!dragging) return;
      screen.scrollTop = startScroll - (event.clientY - startY) * 1.35;
    });
    const stopDragging = event => {
      if (!dragging) return;
      dragging = false;
      if (screen.hasPointerCapture(event.pointerId)) screen.releasePointerCapture(event.pointerId);
    };
    screen.addEventListener('pointerup', stopDragging);
    screen.addEventListener('pointercancel', stopDragging);
    screen.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const step = event.key.startsWith('Page') ? screen.clientHeight * .8 : 80;
      if (event.key === 'Home') screen.scrollTo({ top: 0, behavior: 'smooth' });
      else if (event.key === 'End') screen.scrollTo({ top: screen.scrollHeight, behavior: 'smooth' });
      else screen.scrollBy({ top: event.key.endsWith('Down') ? step : -step, behavior: 'smooth' });
    });
    $('.cupshe-phone-content', phone).addEventListener('load', updateProgress);
    updateProgress();
  });
  route(location.hash, { initial: true, restore: true });
  const initialRouteVersion = routeVersion;
  document.fonts.ready.then(() => {
    if (routeVersion === initialRouteVersion && location.hash) route(location.hash, { initial: true, restore: true });
  });
})();
