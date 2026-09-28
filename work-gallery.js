window.createWorkGallery = ({ content, localize }) => {
  const track = document.querySelector('#featured-track');
  const grid = document.querySelector('#more-work-grid');
  const previous = document.querySelector('[data-gallery-direction="-1"]');
  const next = document.querySelector('[data-gallery-direction="1"]');
  const counter = document.querySelector('.gallery-counter');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const projects = new Map(content.projects.map(project => [project.id, project]));
  const featured = content.featured.map(id => projects.get(id)).filter(Boolean);
  const more = content.more.filter(id => !content.featured.includes(id)).map(id => projects.get(id)).filter(Boolean);
  let activeIndex = Math.min(1, featured.length - 1);
  let initialized = false;
  let pendingSnapshot = null;
  let frame = 0;
  let drag = null;
  let suppressClickUntil = 0;
  let settleTimer;

  const featuredCards = featured.map(project => {
    const link = document.createElement('a');
    link.className = 'featured-card';
    link.href = `#project/${project.id}`;
    link.dataset.project = project.id;
    link.draggable = false;
    link.style.setProperty('--project-color', project.color);
    link.innerHTML = '<img class="featured-cover" src="' + project.cover + '" alt="" draggable="false"><div class="featured-caption"><h3 class="featured-name"></h3><p class="featured-category"></p><p class="featured-summary"></p></div>';
    track.append(link);
    return link;
  });
  const moreCards = more.map((project, index) => {
    const link = document.createElement('a');
    link.className = 'more-card reveal';
    if (more.length % 3 === 2 && index >= more.length - 2) link.classList.add(index === more.length - 2 ? 'last-pair-first' : 'last-pair-second');
    if (more.length % 3 === 1 && index === more.length - 1) link.classList.add('last-single');
    link.href = `#project/${project.id}`;
    link.dataset.project = project.id;
    link.style.setProperty('--project-color', project.color);
    link.innerHTML = '<img class="more-cover" src="' + project.cover + '" alt="" draggable="false"><div class="more-caption"><h3 class="more-name"></h3><div class="more-meta"><span class="more-category"></span><time class="more-year"></time></div></div>';
    grid.append(link);
    return link;
  });

  const stride = () => featuredCards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap);
  const nearest = () => Math.max(0, Math.min(featured.length - 1, Math.round(track.scrollLeft / stride())));
  function paint() {
    frame = 0;
    if (!track.clientWidth) return;
    const step = stride();
    const position = track.scrollLeft / step;
    activeIndex = nearest();
    featuredCards.forEach((card, index) => {
      const distance = index - position;
      const arc = Math.min(Math.abs(distance), 2);
      card.style.setProperty('--arc-y', `${arc * arc * (innerWidth <= 600 ? 12 : 48)}px`);
      card.style.setProperty('--arc-rotation', `${Math.max(-26, Math.min(26, distance * 15))}deg`);
      card.style.setProperty('--caption-opacity', Math.max(0, 1 - Math.abs(distance) * 1.7));
      card.toggleAttribute('data-active', index === activeIndex);
      card.tabIndex = index === activeIndex ? 0 : -1;
    });
    previous.disabled = activeIndex === 0;
    next.disabled = activeIndex === featured.length - 1;
    const label = `${String(activeIndex + 1).padStart(2, '0')} / ${String(featured.length).padStart(2, '0')}`;
    if (counter.textContent !== label) counter.textContent = label;
  }
  function schedulePaint() { if (!frame) frame = requestAnimationFrame(paint); }
  function goTo(index, immediate = false) {
    activeIndex = Math.max(0, Math.min(featured.length - 1, index));
    track.scrollTo({ left: activeIndex * stride(), behavior: immediate || motion.matches ? 'instant' : 'smooth' });
    schedulePaint();
  }
  function settle() { clearTimeout(settleTimer); goTo(nearest()); }
  track.addEventListener('scroll', schedulePaint, { passive: true });
  track.addEventListener('scrollend', schedulePaint);
  previous.addEventListener('click', () => goTo(activeIndex - 1));
  next.addEventListener('click', () => goTo(activeIndex + 1));
  document.querySelector('.featured-gallery').addEventListener('keydown', event => {
    const movement = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!movement || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    track.focus({ preventScroll: true });
    goTo(activeIndex + movement);
  });

  // Native scrolling handles touch and trackpads. Only mouse dragging is synthesized.
  track.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: track.scrollLeft, moved: false };
    suppressClickUntil = 0;
  });
  track.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(event.clientY - drag.y)) {
      drag.moved = true;
      track.classList.add('is-dragging');
      track.setPointerCapture(event.pointerId);
    }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  function finishDrag(event) {
    if (!drag || (event.pointerId !== undefined && event.pointerId !== drag.id)) return;
    const { id, moved } = drag;
    drag = null;
    if (track.hasPointerCapture(id)) track.releasePointerCapture(id);
    if (moved) {
      suppressClickUntil = performance.now() + 450;
      track.classList.remove('is-dragging');
      settle();
    }
  }
  window.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  window.addEventListener('blur', () => finishDrag({}));
  track.addEventListener('dragstart', event => event.preventDefault());
  track.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  track.addEventListener('wheel', event => {
    if (event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      track.scrollLeft += event.deltaY;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 130);
    }
  }, { passive: false });

  function snapshot() { return { left: track.scrollLeft, width: track.clientWidth, index: activeIndex }; }
  function restore(saved) {
    if (!track.clientWidth) { pendingSnapshot = saved; return; }
    initialized = true;
    activeIndex = saved?.index ?? activeIndex;
    const left = saved && saved.width === track.clientWidth ? saved.left : activeIndex * stride();
    track.scrollTo({ left, behavior: 'instant' });
    paint();
  }
  new ResizeObserver(() => {
    if (!track.clientWidth) return;
    if (pendingSnapshot) { const saved = pendingSnapshot; pendingSnapshot = null; restore(saved); }
    else if (!initialized) restore(null);
    else goTo(activeIndex, true);
  }).observe(track);

  function updateLanguage() {
    featuredCards.forEach((card, index) => {
      const project = localize(featured[index]);
      card.setAttribute('aria-label', `${project.title}, ${project.category}. ${project.summary}`);
      card.querySelector('.featured-name').textContent = project.title;
      card.querySelector('.featured-category').textContent = project.category;
      card.querySelector('.featured-summary').textContent = project.summary;
    });
    moreCards.forEach((card, index) => {
      const project = localize(more[index]);
      card.setAttribute('aria-label', `${project.title}, ${project.category}, ${project.year}`);
      card.querySelector('.more-name').textContent = project.title;
      card.querySelector('.more-category').textContent = project.category;
      const year = card.querySelector('.more-year');
      year.textContent = project.year;
      year.dateTime = project.year;
    });
  }
  updateLanguage();
  return { snapshot, restore, updateLanguage };
};
