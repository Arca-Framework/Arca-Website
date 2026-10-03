// Home page: loader, nav, reveal-on-scroll, copy buttons, code tabs, counters.
(() => {
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------------------------------------------------------------- loader
    // plays once per visit (session); boot text + percentage, then the screen wipes up
    const loader = $('#loader');
    let seen = false;
    try { seen = sessionStorage.getItem('arca-loaded') === '1'; } catch (e) {}
    if (!loader) {
        // nothing to do
    } else if (seen || reduce) {
        loader.classList.add('skip');
    } else {
        document.documentElement.style.overflow = 'hidden';
        const stages = ['booting core', 'loading modules', 'syncing players', 'ready'];
        const fill = $('.ld-line i', loader), pct = $('#ld-pct'), text = $('#ld-text');
        let p = 0;
        const timer = setInterval(() => {
            p = Math.min(100, p + 4 + Math.random() * 9);
            fill.style.width = `${p}%`;
            pct.textContent = String(Math.floor(p)).padStart(2, '0');
            text.textContent = stages[Math.min(stages.length - 1, Math.floor(p / 34))];
            if (p >= 100) {
                clearInterval(timer);
                setTimeout(() => {
                    loader.classList.add('done');
                    document.documentElement.style.overflow = '';
                    try { sessionStorage.setItem('arca-loaded', '1'); } catch (e) {}
                    setTimeout(() => loader.classList.add('skip'), 900);
                }, 250);
            }
        }, 70);
    }

    // ---------------------------------------------------------------- nav background after scrolling
    const nav = $('.bnav');
    const onScroll = () => nav && nav.classList.toggle('solid', scrollY > 40);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ---------------------------------------------------------------- reveal on scroll
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            io.unobserve(e.target);
        });
    }, { threshold: 0.12 });
    $$('.reveal').forEach((el, i) => {
        el.style.transitionDelay = `${(i % 4) * 60}ms`;
        io.observe(el);
    });

    // ---------------------------------------------------------------- copy buttons
    const toast = $('#copied');
    $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(btn.dataset.copy); } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = btn.dataset.copy; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
        }
        toast.classList.add('on');
        setTimeout(() => toast.classList.remove('on'), 1400);
    }));

    // ---------------------------------------------------------------- code tabs
    $$('.code-tabs button').forEach((b) => b.addEventListener('click', () => {
        $$('.code-tabs button').forEach((x) => x.classList.toggle('on', x === b));
        $$('.code-pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === b.dataset.code));
    }));

    // ---------------------------------------------------------------- counters
    const counters = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            counters.unobserve(e.target);
            const end = Number(e.target.dataset.count);
            if (reduce) return;
            let n = 0;
            const step = () => { n++; e.target.textContent = n; if (n < end) setTimeout(step, 700 / end); };
            e.target.textContent = '0';
            step();
        });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((el) => counters.observe(el));
})();
