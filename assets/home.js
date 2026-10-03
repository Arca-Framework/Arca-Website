// Showcase tabs + reveal-on-scroll
(() => {
    const tabs = document.querySelectorAll('.tab');
    const panes = document.querySelectorAll('.pane');
    let index = 0;
    let timer;

    function select(name) {
        tabs.forEach((t, i) => {
            const on = t.dataset.tab === name;
            t.classList.toggle('active', on);
            if (on) index = i;
        });
        panes.forEach((p) => p.classList.toggle('active', p.dataset.pane === name));
    }

    // cycle through the showcase until someone clicks a tab
    function auto() {
        timer = setInterval(() => select(tabs[(index + 1) % tabs.length].dataset.tab), 4500);
    }

    tabs.forEach((t) => t.addEventListener('click', () => {
        clearInterval(timer);
        select(t.dataset.tab);
    }));
    auto();

    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('.section-head, .feature, .resource, .steps li, .screen, .split > *, .cta').forEach((el) => {
        el.classList.add('reveal');
        io.observe(el);
    });
})();
