/* Small, dependency-free interactions for the portfolio. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menuButton = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navItems = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = [...document.querySelectorAll('main section[id]')];

  // Mobile navigation stays keyboard-operable and closes after selection.
  const closeMenu = () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open navigation menu');
    navLinks?.classList.remove('open');
  };
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    navLinks?.classList.toggle('open', open);
  });
  navItems.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  // Reveal content as it enters the viewport; show everything if unsupported.
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // Counters read their values from data attributes so content can be edited in HTML.
  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = element => {
    const target = Number(element.dataset.count);
    const decimals = Number(element.dataset.decimals || 0);
    const suffix = element.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const value = (target * eased).toFixed(decimals);
      element.textContent = `${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window && !reducedMotion) {
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    }), { threshold: 0.55 });
    counters.forEach(counter => counterObserver.observe(counter));
  } else {
    counters.forEach(counter => {
      const decimals = Number(counter.dataset.decimals || 0);
      counter.textContent = `${Number(counter.dataset.count).toFixed(decimals)}${counter.dataset.suffix || ''}`;
    });
  }

  // Project category filters update cards and accessible pressed state together.
  const filterButtons = document.querySelectorAll('.filter-button');
  const projectCards = document.querySelectorAll('.project-card');
  const projectsToggle = document.querySelector('#projects-toggle');
  const collapsedProjectLimit = 2;
  let activeProjectFilter = 'all';
  let projectsExpanded = false;

  const updateProjectVisibility = () => {
    const matchingCards = [...projectCards].filter(card => {
      const categories = card.dataset.categories.split(' ');
      return activeProjectFilter === 'all' || categories.includes(activeProjectFilter);
    });
    const visibleCards = new Set(projectsExpanded ? matchingCards : matchingCards.slice(0, collapsedProjectLimit));

    projectCards.forEach(card => { card.hidden = !visibleCards.has(card); });
    projectsToggle.hidden = matchingCards.length <= collapsedProjectLimit;
    projectsToggle.setAttribute('aria-expanded', String(projectsExpanded));
    projectsToggle.innerHTML = projectsExpanded
      ? 'Show fewer projects <span aria-hidden="true">↑</span>'
      : `Show all projects (${matchingCards.length}) <span aria-hidden="true">↓</span>`;
  };

  filterButtons.forEach(button => button.addEventListener('click', () => {
    activeProjectFilter = button.dataset.filter;
    projectsExpanded = false;
    filterButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    updateProjectVisibility();
  }));

  projectsToggle.addEventListener('click', () => {
    const wasExpanded = projectsExpanded;
    projectsExpanded = !projectsExpanded;
    updateProjectVisibility();
    if (wasExpanded) {
      document.querySelector('#experience')?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  });
  updateProjectVisibility();

  // Mark the section currently occupying the reading area in the sticky navigation.
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navItems.forEach(link => {
            const active = link.getAttribute('href') === `#${entry.target.id}`;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    sections.forEach(section => navObserver.observe(section));
  }

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
