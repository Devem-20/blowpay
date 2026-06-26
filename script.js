/**
 * ============================================================
 * BLOWPAY — Enhanced JavaScript
 * ============================================================
 * Features:
 *   1.  Cursor glow that follows the mouse
 *   2.  Mobile menu toggle (works on ALL pages)
 *   3.  IntersectionObserver scroll reveals (all types)
 *   4.  Word-split hero headline animation
 *   5.  3D perspective card tilt on mouse move
 *   6.  Magnetic button pull effect
 *   7.  Count-up animation for stat numbers
 *   8.  Dark mode toggle with localStorage
 *   9.  FAQ accordion
 *   10. Active nav link via scroll spy
 *   11. Smooth scroll for anchor links
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', function () {

  /* ─── 1. CURSOR GLOW ──────────────────────────────────────── */

  const cursorGlow = document.createElement('div');
  cursorGlow.classList.add('cursor-glow');
  document.body.appendChild(cursorGlow);

  let mouseX = -9999, mouseY = -9999;
  let glowX = -9999, glowY = -9999;
  let rafId;

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mouseleave', function () {
    cursorGlow.style.opacity = '0';
  });

  document.addEventListener('mouseenter', function () {
    cursorGlow.style.opacity = '1';
  });

  function animateCursor () {
    // Lerp for smooth follow
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top  = glowY + 'px';
    rafId = requestAnimationFrame(animateCursor);
  }
  rafId = requestAnimationFrame(animateCursor);


  /* ─── 2. MOBILE MENU ──────────────────────────────────────── */

  const menuBtn    = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  function setHamburgerIcon (isOpen) {
    if (!menuBtn) return;
    const icon = menuBtn.querySelector('svg');
    if (!icon) return;
    icon.innerHTML = isOpen
      ? '<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
      : '<path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = mobileMenu.classList.toggle('open');
      setHamburgerIcon(isOpen);
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        setHamburgerIcon(false);
      });
    });

    document.addEventListener('click', function (e) {
      if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        mobileMenu.classList.remove('open');
        setHamburgerIcon(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        setHamburgerIcon(false);
      }
    });
  }


  /* ─── 3. SCROLL REVEAL (ALL TYPES) ───────────────────────── */

  const revealClasses = [
    '.fade-in',
    '.reveal-scale',
    '.reveal-wipe',
    '.reveal-blur',
    '.reveal-left',
    '.reveal-right',
    '.split-word',
  ];

  const revealEls = document.querySelectorAll(revealClasses.join(','));

  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target); // fire once
      }
    });
  }, {
    threshold:   0.08,
    rootMargin: '0px 0px -60px 0px',
  });

  revealEls.forEach(function (el) { revealObserver.observe(el); });

  // Immediately reveal anything already on screen
  setTimeout(function () {
    revealEls.forEach(function (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('visible');
      }
    });
  }, 80);


  /* ─── 4. WORD-SPLIT HERO HEADLINE ────────────────────────── */

  /*
    Wraps each word in the headline inside a .split-word span,
    then animates each word sliding up from below on page load.
    Targets elements with [data-split="words"] attribute.
  */

  const splitTargets = document.querySelectorAll('[data-split="words"]');

  splitTargets.forEach(function (el) {
    const originalHTML = el.innerHTML;

    // Collect text nodes and span nodes separately
    const words = [];
    el.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (part.trim()) {
            words.push({ type: 'word', text: part });
          } else if (part) {
            words.push({ type: 'space', text: part });
          }
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Keep <span>, <br>, etc. intact
        words.push({ type: 'element', node: node.cloneNode(true) });
      }
    });

    el.innerHTML = '';

    words.forEach(function (item, idx) {
      if (item.type === 'space') {
        el.appendChild(document.createTextNode(item.text));
      } else if (item.type === 'element') {
        el.appendChild(item.node);
      } else {
        const wrapper = document.createElement('span');
        wrapper.className = 'split-word';
        wrapper.style.transitionDelay = (idx * 60) + 'ms';

        const inner = document.createElement('span');
        inner.className = 'word-inner';
        inner.textContent = item.text;

        wrapper.appendChild(inner);
        el.appendChild(wrapper);

        // Trigger on next frame
        requestAnimationFrame(function () {
          setTimeout(function () { wrapper.classList.add('visible'); }, 80 + idx * 60);
        });
      }
    });
  });


  /* ─── 5. 3D CARD TILT ─────────────────────────────────────── */

  /*
    Applies a perspective tilt to cards on mouse hover.
    Add class "tilt-card" to any card element to opt in.
    The parent container should have class "perspective-grid".
  */

  const TILT_MAX     = 12; // degrees
  const TILT_SCALE   = 1.025;
  const TILT_EASE_IN = 0.1;  // lerp speed during move
  const TILT_EASE_OUT = 0.06; // lerp speed on leave

  function applyTilt (el) {
    let targetRX = 0, targetRY = 0;
    let currentRX = 0, currentRY = 0;
    let animating = false;
    let isHovered = false;

    function loop () {
      const deltaX = targetRX - currentRX;
      const deltaY = targetRY - currentRY;

      if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01 && !isHovered) {
        currentRX = 0;
        currentRY = 0;
        el.style.transform = '';
        animating = false;
        return;
      }

      const ease = isHovered ? TILT_EASE_IN : TILT_EASE_OUT;
      currentRX += deltaX * ease;
      currentRY += deltaY * ease;

      const scale = isHovered ? TILT_SCALE : 1;
      el.style.transform =
        `perspective(800px) rotateX(${currentRX}deg) rotateY(${currentRY}deg) scale(${scale})`;
      el.style.transition = 'none';

      requestAnimationFrame(loop);
    }

    el.addEventListener('mousemove', function (e) {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / (rect.width  / 2);
      const dy   = (e.clientY - cy) / (rect.height / 2);

      targetRY =  dx * TILT_MAX;
      targetRX = -dy * TILT_MAX;
      isHovered = true;

      if (!animating) {
        animating = true;
        requestAnimationFrame(loop);
      }
    });

    el.addEventListener('mouseleave', function () {
      targetRX = 0;
      targetRY = 0;
      isHovered = false;
      el.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)';

      if (!animating) {
        animating = true;
        requestAnimationFrame(loop);
      }
    });
  }

  document.querySelectorAll('.tilt-card').forEach(applyTilt);


  /* ─── 6. MAGNETIC BUTTONS ─────────────────────────────────── */

  /*
    Buttons with class "btn-magnetic" are softly pulled toward
    the cursor when the cursor is near them.
  */

  document.querySelectorAll('.btn-magnetic').forEach(function (btn) {
    const PULL = 0.35; // 0 = no pull, 1 = full pull

    btn.addEventListener('mousemove', function (e) {
      const rect = btn.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * PULL;
      const dy   = (e.clientY - cy) * PULL;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    btn.addEventListener('mouseleave', function () {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    });
  });


  /* ─── 7. COUNT-UP STATS ───────────────────────────────────── */

  /*
    Elements with class "count-up" and a data-target attribute
    will animate from 0 to the target value when they enter view.
    data-prefix / data-suffix for symbols like "$", "M+".
    Example: <span class="count-up" data-target="3" data-suffix="M+"></span>
  */

  function easeOutExpo (t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animateCountUp (el) {
    const target   = parseFloat(el.dataset.target) || 0;
    const prefix   = el.dataset.prefix  || '';
    const suffix   = el.dataset.suffix  || '';
    const decimals = (el.dataset.decimals !== undefined)
                       ? parseInt(el.dataset.decimals)
                       : (target % 1 !== 0 ? 1 : 0);
    const duration = parseInt(el.dataset.duration) || 1800;
    const start    = performance.now();

    function tick (now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = target * easeOutExpo(progress);
      el.textContent = prefix + value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const countEls = document.querySelectorAll('.count-up[data-target]');

  if (countEls.length) {
    const countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCountUp(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    countEls.forEach(function (el) { countObserver.observe(el); });
  }


  /* ─── 8. DARK MODE TOGGLE ─────────────────────────────────── */

  const darkToggle = document.getElementById('dark-mode-toggle');
  const darkIcon   = document.getElementById('dark-mode-icon');

  const MOON_PATH = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  const SUN_PATHS = `
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  `;

  function setDarkIcon (isDark) {
    if (darkIcon) darkIcon.innerHTML = isDark ? SUN_PATHS : MOON_PATH;
  }

  function applyDarkMode (isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    setDarkIcon(isDark);
    localStorage.setItem('darkMode', isDark);
  }

  // Restore saved preference on load
  const savedDark = localStorage.getItem('darkMode');
  if (savedDark === 'true') {
    applyDarkMode(true);
  } else if (savedDark === null) {
    // Default to dark mode (matches site's default dark aesthetic)
    applyDarkMode(true);
  }

  if (darkToggle) {
    darkToggle.addEventListener('click', function () {
      const isDark = !document.body.classList.contains('dark-mode');
      applyDarkMode(isDark);
    });
  }


  /* ─── 9. FAQ ACCORDION ────────────────────────────────────── */

  window.toggleFaq = function (questionEl) {
    const container = questionEl.closest('.faq-item') || questionEl.parentElement;
    const answer    = container.querySelector('.faq-answer');
    const icon      = questionEl.querySelector('.faq-icon');

    if (!answer) return;

    const isOpen = answer.classList.contains('open');

    // Close all open answers first (accordion behaviour)
    document.querySelectorAll('.faq-answer.open').forEach(function (a) {
      a.classList.remove('open');
    });
    document.querySelectorAll('.faq-icon.rotated').forEach(function (i) {
      i.classList.remove('rotated');
    });

    // Then open this one if it was closed
    if (!isOpen) {
      answer.classList.add('open');
      if (icon) icon.classList.add('rotated');
    }
  };


  /* ─── 10. SCROLL SPY NAV ──────────────────────────────────── */

  const sections   = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('#nav-links a, #mobile-menu a:not(#mobile-cta)');

  if (sections.length && navAnchors.length) {
    const spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navAnchors.forEach(function (a) {
            const isActive = a.getAttribute('href') === '#' + id;
            a.classList.toggle('active-nav-link', isActive);
          });
        }
      });
    }, { threshold: 0.4 });

    sections.forEach(function (s) { spyObserver.observe(s); });
  }


  /* ─── 11. SMOOTH SCROLL ───────────────────────────────────── */

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const target = this.getAttribute('href');
      if (target && target !== '#') {
        const el = document.querySelector(target);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });


  /* ─── 12. ADD SHIMMER CLASS TO CTA BUTTONS ────────────────── */

  document.querySelectorAll(
    '#hero-cta, #nav-cta-btn, #mobile-cta, #cta-btn, .cta-btn'
  ).forEach(function (btn) {
    btn.classList.add('btn-shimmer', 'btn-magnetic');
  });


  /* ─── 13. AUTO-INIT TILT ON NEWLY OBSERVED CARDS ─────────── */

  /*
    Cards with .tilt-card that are added after DOMContentLoaded
    (e.g. via templating) won't get tilt automatically.
    This MutationObserver handles that edge case.
  */

  if (typeof MutationObserver !== 'undefined') {
    const mutObs = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.classList && node.classList.contains('tilt-card')) {
            applyTilt(node);
          }
          node.querySelectorAll && node.querySelectorAll('.tilt-card').forEach(applyTilt);
        });
      });
    });

    mutObs.observe(document.body, { childList: true, subtree: true });
  }


  /* ─── DONE ────────────────────────────────────────────────── */
  console.log('🚀 BlowPay enhanced JS loaded.');
});