// Arca wiki: hash router, sidebar, "on this page", search, code blocks
(() => {
    const docs = [...document.querySelectorAll('.doc')];
    const sidebar = document.querySelector('.sidebar');
    const tocList = document.querySelector('.toc ul');
    const crumbs = document.querySelector('.crumbs');
    const pager = document.querySelector('.pager');
    let current = null;

    /* ---------- code blocks: header + copy button + highlight ---------- */
    document.querySelectorAll('.doc pre > code').forEach((code) => {
        const pre = code.parentElement;
        const lang = (code.className.match(/language-(\w+)/) || [])[1] || 'text';
        const wrap = document.createElement('div');
        wrap.className = 'code';
        const head = document.createElement('div');
        head.className = 'code-head';
        head.innerHTML = `<span>${pre.dataset.title || lang}</span><button class="copy">Copy</button>`;
        pre.replaceWith(wrap);
        wrap.append(head, pre);
        // trim the leading newline left by HTML indentation
        code.textContent = code.textContent.replace(/^\n/, '').replace(/\s+$/, '');
        head.querySelector('.copy').addEventListener('click', (e) => {
            navigator.clipboard?.writeText(code.textContent);
            e.target.textContent = 'Copied!';
            setTimeout(() => (e.target.textContent = 'Copy'), 1400);
        });
        if (window.hljs && lang !== 'text') hljs.highlightElement(code);
    });

    /* ---------- sidebar from data-group ---------- */
    const groups = new Map();
    docs.forEach((doc) => {
        const g = doc.dataset.group;
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(doc);
    });
    groups.forEach((list, name) => {
        const section = document.createElement('div');
        section.className = 'side-group';
        section.innerHTML = `<h4>${name}</h4>` +
            list.map((d) => `<a href="#${d.id}" data-page="${d.id}">${d.dataset.title}</a>`).join('');
        sidebar.appendChild(section);
    });

    /* ---------- headings get ids ---------- */
    const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
    docs.forEach((doc) => {
        doc.querySelectorAll('h2, h3').forEach((h) => {
            if (!h.id) h.id = `${doc.id}--${slug(h.textContent)}`;
        });
    });

    /* ---------- router ---------- */
    function show(hash) {
        const [pageId, anchor] = decodeURIComponent(hash.replace(/^#/, '')).split('--');
        const doc = docs.find((d) => d.id === pageId) || docs[0];
        if (current !== doc) {
            docs.forEach((d) => d.classList.toggle('active', d === doc));
            sidebar.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.dataset.page === doc.id));
            current = doc;
            document.title = `${doc.dataset.title} · Arca Docs`;
            crumbs.innerHTML = `<a href="index.html">Home</a><span>›</span><span>${doc.dataset.group}</span><span>›</span><span class="here">${doc.dataset.title}</span>`;
            buildToc(doc);
            buildPager(doc);
        }
        const target = anchor ? document.getElementById(`${doc.id}--${anchor}`) : null;
        if (target) target.scrollIntoView();
        else window.scrollTo(0, 0);
        sidebar.classList.remove('open');
    }

    function buildToc(doc) {
        tocList.innerHTML = [...doc.querySelectorAll('h2, h3')]
            .map((h) => `<li class="${h.tagName === 'H3' ? 'sub' : ''}"><a href="#${h.id}">${h.textContent}</a></li>`)
            .join('');
        document.querySelector('.toc').style.visibility = tocList.children.length ? 'visible' : 'hidden';
        spy();
    }

    function buildPager(doc) {
        const i = docs.indexOf(doc);
        const prev = docs[i - 1], next = docs[i + 1];
        const arrowL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';
        const arrowR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
        pager.innerHTML =
            (prev ? `<a href="#${prev.id}" class="prev">${arrowL}<div><small>${prev.dataset.group} · Previous</small><strong>${prev.dataset.title}</strong></div></a>` : '') +
            (next ? `<a href="#${next.id}" class="next"><div><small>${next.dataset.group} · Next</small><strong>${next.dataset.title}</strong></div>${arrowR}</a>` : '');
    }

    // anchors inside a page use "page--heading" so the router can find them
    window.addEventListener('hashchange', () => show(location.hash));
    show(location.hash);

    /* ---------- scroll spy ---------- */
    function spy() {
        if (!current) return;
        const heads = [...current.querySelectorAll('h2, h3')];
        let active = heads[0];
        for (const h of heads) {
            if (h.getBoundingClientRect().top < 120) active = h;
        }
        tocList.querySelectorAll('a').forEach((a) => a.classList.toggle('active', active && a.getAttribute('href') === `#${active.id}`));
    }
    window.addEventListener('scroll', spy, { passive: true });

    /* ---------- mobile menu ---------- */
    document.querySelector('.menu-btn').addEventListener('click', () => sidebar.classList.toggle('open'));

    /* ---------- search ---------- */
    const modal = document.querySelector('.search-modal');
    const input = modal.querySelector('input');
    const results = modal.querySelector('.results');
    let sel = 0;

    const index = [];
    docs.forEach((doc) => {
        index.push({ href: `#${doc.id}`, title: doc.dataset.title, where: doc.dataset.group, text: doc.textContent.toLowerCase() });
        doc.querySelectorAll('h2, h3').forEach((h) => {
            let text = '';
            let el = h.nextElementSibling;
            while (el && !/^H[23]$/.test(el.tagName)) { text += ' ' + el.textContent; el = el.nextElementSibling; }
            index.push({ href: `#${h.id}`, title: h.textContent, where: doc.dataset.title, text: (h.textContent + text).toLowerCase() });
        });
    });

    function render() {
        const q = input.value.trim().toLowerCase();
        if (!q) {
            results.innerHTML = '<div class="empty">Type to search the docs</div>';
            return;
        }
        const words = q.split(/\s+/);
        const hits = index
            .map((item) => {
                const t = item.title.toLowerCase();
                if (!words.every((w) => item.text.includes(w) || t.includes(w))) return null;
                return { item, score: (t.includes(q) ? 10 : 0) + (t.startsWith(q) ? 5 : 0) + words.filter((w) => t.includes(w)).length };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score)
            .slice(0, 12);
        sel = 0;
        results.innerHTML = hits.length
            ? hits.map((h, i) => `<a href="${h.item.href}" class="${i === 0 ? 'sel' : ''}"><strong>${h.item.title}</strong><span>${h.item.where}</span></a>`).join('')
            : '<div class="empty">No results</div>';
    }

    const open = () => { modal.classList.add('open'); input.value = ''; render(); setTimeout(() => input.focus(), 0); };
    const close = () => modal.classList.remove('open');

    document.querySelector('.search-btn').addEventListener('click', open);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    results.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
        const links = [...results.querySelectorAll('a')];
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!links.length) return;
            sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
            links.forEach((l, i) => l.classList.toggle('sel', i === sel));
            links[sel].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter' && links[sel]) {
            location.hash = links[sel].getAttribute('href');
            close();
        }
    });
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
        else if (e.key === '/' && document.activeElement === document.body) { e.preventDefault(); open(); }
        else if (e.key === 'Escape') close();
    });
})();
