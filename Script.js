/* Portfolio interactions: scroll progress, scroll reveal, active nav,
   animated counters, card spotlight, hero parallax and back-to-top. */
(function () {
    'use strict';

    var doc = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasObserver = 'IntersectionObserver' in window;

    function $(selector, ctx) { return (ctx || document).querySelector(selector); }
    function $$(selector, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(selector)); }

    /* ---------- Skills: turn "A · B · C" text into chips ---------- */
    $$('.skill-group p').forEach(function (p) {
        var items = p.textContent.split('·').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!items.length) { return; }
        var list = document.createElement('ul');
        list.className = 'chips';
        items.forEach(function (text, i) {
            var li = document.createElement('li');
            li.className = 'chip';
            li.style.setProperty('--i', i);
            li.textContent = text;
            list.appendChild(li);
        });
        p.replaceWith(list);
    });

    /* ---------- Scroll reveal ---------- */
    var REVEAL = '.section-heading, .about-me-text, .about-me img, .stat, .project-card, ' +
        '.experience-item, .skill-group, .f_widget';
    var revealEls = $$(REVEAL);

    // stagger siblings that share a parent
    var siblingCount = new Map();
    revealEls.forEach(function (el) {
        var parent = el.parentElement;
        var index = siblingCount.get(parent) || 0;
        siblingCount.set(parent, index + 1);
        el.style.setProperty('--d', Math.min(index, 6) * 90 + 'ms');
    });

    function markIn(el) {
        el.classList.add('is-in');
        var delay = parseInt(el.style.getPropertyValue('--d'), 10) || 0;
        // hand transitions back to the element's own hover styles once revealed
        window.setTimeout(function () { el.classList.add('reveal-done'); }, delay + 1800);
    }

    if (hasObserver) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) { return; }
                markIn(entry.target);
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        revealEls.forEach(function (el) { revealObserver.observe(el); });
    } else {
        revealEls.forEach(markIn);
    }

    /* ---------- Animated counters ---------- */
    var counters = $$('[data-count]');

    function runCounter(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        if (reduceMotion || isNaN(target)) { el.textContent = target + suffix; return; }
        var duration = 1400;
        var start = performance.now();
        function tick(now) {
            var p = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) { window.requestAnimationFrame(tick); }
        }
        window.requestAnimationFrame(tick);
    }

    if (hasObserver && !reduceMotion) {
        counters.forEach(function (el) { el.textContent = '0' + (el.getAttribute('data-suffix') || ''); });
        var counterObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) { return; }
                runCounter(entry.target);
                counterObserver.unobserve(entry.target);
            });
        }, { threshold: 0.6 });
        counters.forEach(function (el) { counterObserver.observe(el); });
    }

    /* ---------- Scrollspy: highlight the nav link of the section in view ---------- */
    var navLinks = $$('.navitems li a');
    var spyIds = ['Home', 'About', 'Projects', 'Experience', 'Stack', 'Contact'];

    function setActive(id) {
        navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
    }

    if (hasObserver) {
        var spyObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { setActive(entry.target.id); }
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        spyIds.forEach(function (id) {
            var section = document.getElementById(id);
            if (section) { spyObserver.observe(section); }
        });
    }

    /* ---------- Scroll-linked UI (progress bar, header, timeline, back-to-top) ---------- */
    var progressBar = $('.scroll-progress');
    var header = $('header');
    var toTop = $('.to-top');
    var timeline = $('.experience-list');
    var ticking = false;

    function onScroll() {
        var y = window.pageYOffset || doc.scrollTop;
        var max = doc.scrollHeight - window.innerHeight;

        if (progressBar) { progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')'; }
        if (header) { header.classList.toggle('is-scrolled', y > 10); }
        if (toTop) { toTop.classList.toggle('show', y > window.innerHeight * 0.6); }

        if (timeline) {
            var rect = timeline.getBoundingClientRect();
            var progress = (window.innerHeight * 0.65 - rect.top) / rect.height;
            timeline.style.setProperty('--progress', Math.max(0, Math.min(progress, 1)).toFixed(3));
        }

        // the contact footer is short, so mark it active once the page bottoms out
        if (max > 0 && y >= max - 4) { setActive('Contact'); }

        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(onScroll);
        }
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    if (toTop) {
        toTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    }

    /* ---------- Cursor spotlight on project cards ---------- */
    $$('.project-card').forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
            var rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
            card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
        });
    });

    /* ---------- Hero parallax (mouse devices only) ---------- */
    var hero = $('.intro');
    if (hero && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
        hero.addEventListener('pointermove', function (e) {
            var rect = hero.getBoundingClientRect();
            hero.style.setProperty('--px', ((e.clientX - rect.left) / rect.width - 0.5).toFixed(3));
            hero.style.setProperty('--py', ((e.clientY - rect.top) / rect.height - 0.5).toFixed(3));
        });
        hero.addEventListener('pointerleave', function () {
            hero.style.setProperty('--px', 0);
            hero.style.setProperty('--py', 0);
        });
    }
})();
