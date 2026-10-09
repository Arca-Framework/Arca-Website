// Playground: interactive mini versions of Arca's UI (inventory, HUD, death screen,
// loading screen, third eye) plus a few playful effects around the page.
(() => {
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const root = $('#playground');
    if (!root) return;

    // ------------------------------------------------------------ shared
    const toastEl = $('.pg-toast', root);
    let toastTimer;
    function toast(text, kind = 'success') {
        toastEl.textContent = text;
        toastEl.className = `pg-toast ${kind}`;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2200);
    }

    let current = 'inv';
    const onShow = {};
    $$('.pg-tab', root).forEach((tab) => tab.addEventListener('click', () => {
        current = tab.dataset.pg;
        $$('.pg-tab', root).forEach((t) => t.classList.toggle('active', t === tab));
        $$('.pg-pane', root).forEach((p) => p.classList.toggle('active', p.dataset.pg === current));
        if (onShow[current]) onShow[current]();
    }));
    const inView = () => {
        const r = root.getBoundingClientRect();
        return r.top < innerHeight * 0.8 && r.bottom > innerHeight * 0.2;
    };

    // ------------------------------------------------------------ inventory
    const RARITY = { common: '#9aa3ad', uncommon: '#3ecf72', rare: '#4c8dff', legendary: '#ffb547' };
    const DEFS = {
        cash: { label: 'Cash', icon: 'fa-money-bill-wave', w: 0, r: 'legendary', stack: true, desc: 'Cold hard cash.' },
        water: { label: 'Water', icon: 'fa-bottle-water', w: 0.5, r: 'common', stack: true, use: 'You drank some water', desc: 'Fresh bottled water.' },
        sandwich: { label: 'Sandwich', icon: 'fa-burger', w: 0.3, r: 'common', stack: true, use: 'Mmm, sandwich', desc: 'Fills you up.' },
        bandage: { label: 'Bandage', icon: 'fa-bandage', w: 0.1, r: 'uncommon', stack: true, use: 'Bleeding slowed', desc: 'Heals a little health.' },
        phone: { label: 'Phone', icon: 'fa-mobile-screen', w: 0.2, r: 'uncommon', desc: 'Your smartphone.' },
        lockpick: { label: 'Lockpick', icon: 'fa-key', w: 0.15, r: 'uncommon', stack: true, desc: 'For doors that are not yours.' },
        pistol: { label: 'Pistol', icon: 'fa-gun', w: 1, r: 'rare', weapon: true, desc: 'A standard 9mm pistol.' },
        repairkit: { label: 'Repair Kit', icon: 'fa-screwdriver-wrench', w: 2.5, r: 'rare', stack: true, desc: 'Fixes a vehicle engine.' },
        armor: { label: 'Body Armor', icon: 'fa-shield-halved', w: 3, r: 'legendary', stack: true, use: 'Armor on', desc: 'Bulletproof vest.' },
        goldbar: { label: 'Gold Bar', icon: 'fa-bars-staggered', w: 12, r: 'legendary', stack: true, desc: 'Heavy and shiny.' },
        copper: { label: 'Copper', icon: 'fa-cubes', w: 0.2, r: 'common', stack: true, desc: 'Scrap metal.' },
    };
    const inv = {
        pockets: { slots: 16, max: 30, items: { 1: ['phone', 1], 2: ['pistol', 1, { ammo: 36, durability: 72 }], 3: ['water', 3], 4: ['cash', 2450], 6: ['bandage', 4], 9: ['lockpick', 2] } },
        trunk: { slots: 16, max: 60, items: { 1: ['repairkit', 1], 2: ['armor', 1], 5: ['goldbar', 2], 6: ['copper', 14], 7: ['sandwich', 5] } },
        shop: { slots: 8, shop: true, items: { 1: ['water', 1, { price: 5 }], 2: ['sandwich', 1, { price: 8 }], 3: ['bandage', 1, { price: 50 }], 4: ['phone', 1, { price: 500 }], 5: ['lockpick', 1, { price: 150 }], 6: ['repairkit', 1, { price: 250 }], 7: ['armor', 1, { price: 1200 }], 8: ['copper', 1, { price: 12 }] } },
    };
    let bank = 5000;
    const cart = {}; // [item name] = count
    const weight = (id) => inv[id].shop ? 0 : Object.values(inv[id].items).reduce((t, [n, c]) => t + DEFS[n].w * c, 0);

    function renderInv() {
        $$('.inv-win', root).forEach((win) => {
            const id = win.dataset.inv;
            const box = inv[id];
            if (box.shop) {
                $('.bank', win).textContent = bank.toLocaleString();
            } else {
                const w = weight(id);
                $('.inv-w b', win).textContent = w.toFixed(1);
                const bar = $('.inv-bar i', win);
                bar.style.width = `${Math.min(100, (w / box.max) * 100)}%`;
                bar.classList.toggle('full', w / box.max > 0.9);
            }
            const grid = $('.inv-grid', win);
            grid.innerHTML = '';
            for (let s = 1; s <= box.slots; s++) {
                const slot = document.createElement('div');
                slot.className = 'inv-slot';
                slot.dataset.inv = id;
                slot.dataset.slot = s;
                if (id === 'pockets' && s <= 4) slot.innerHTML = `<span class="key">${s}</span>`;
                const it = box.items[s];
                if (it) {
                    const d = DEFS[it[0]];
                    const meta = it[2] || {};
                    slot.insertAdjacentHTML('beforeend', `<div class="inv-item" style="--r:${RARITY[d.r]}">
                        <i class="fa-solid ${d.icon}"></i>
                        ${box.shop ? `<span class="price">$${meta.price}</span><i class="fa-solid fa-plus add"></i>` : d.weapon ? `<span class="cnt">${meta.ammo}</span><span class="dur"><b style="width:${meta.durability}%"></b></span>` : `<span class="cnt">${it[0] === 'cash' ? '$' + it[1].toLocaleString() : 'x' + it[1]}</span>`}
                    </div>`);
                }
                grid.appendChild(slot);
            }
        });
    }

    // tooltip
    const tip = $('.inv-tip', root);
    const pane = $('.pg-pane[data-pg="inv"]', root);
    pane.addEventListener('mousemove', (e) => {
        const slot = e.target.closest('.inv-slot');
        const it = slot && inv[slot.dataset.inv].items[slot.dataset.slot];
        if (!it || drag) return tip.classList.add('hidden');
        const d = DEFS[it[0]];
        const meta = it[2] || {};
        tip.innerHTML = `<strong>${d.label}</strong><span class="tag" style="--r:${RARITY[d.r]}">${d.r}</span><div>${d.desc}</div>` +
            (d.weapon ? `<div style="margin-top:6px">Ammo <b>${meta.ammo}</b> · Durability <b>${meta.durability}%</b></div>` : '') +
            (slot.dataset.inv === 'shop'
                ? `<div style="margin-top:6px;color:#00ff6a;font-weight:700">$${meta.price} · click or drag to the cart</div>`
                : `<div style="margin-top:6px;color:#8f96a3">${(d.w * it[1]).toFixed(1)} kg</div>`);
        const r = pane.getBoundingClientRect();
        tip.style.left = `${Math.min(r.width - 215, e.clientX - r.left + 16)}px`;
        tip.style.top = `${e.clientY - r.top + 16}px`;
        tip.classList.remove('hidden');
    });
    pane.addEventListener('mouseleave', () => tip.classList.add('hidden'));

    // drag & drop (pointer events: mouse + touch)
    let drag = null;
    pane.addEventListener('pointerdown', (e) => {
        const el = e.target.closest('.inv-item');
        if (!el) return;
        const slot = el.parentElement;
        const it = inv[slot.dataset.inv].items[slot.dataset.slot];
        drag = { from: slot.dataset.inv, slot: +slot.dataset.slot, el, ghost: null, x: e.clientX, y: e.clientY, half: e.shiftKey };
        tip.classList.add('hidden');
        e.preventDefault();
        drag.it = it;
    });
    addEventListener('pointermove', (e) => {
        if (!drag) return;
        if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) {
            drag.ghost = document.createElement('div');
            drag.ghost.className = 'inv-ghost';
            drag.ghost.innerHTML = `<i class="fa-solid ${DEFS[drag.it[0]].icon}"></i>`;
            document.body.appendChild(drag.ghost);
            drag.el.classList.add('dragging');
        }
        if (!drag.ghost) return;
        drag.ghost.style.left = `${e.clientX}px`;
        drag.ghost.style.top = `${e.clientY}px`;
        $$('.inv-slot.over, .cart.over', root).forEach((s) => s.classList.remove('over'));
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const over = under?.closest('.inv-slot') || (drag.from === 'shop' && under?.closest('.cart'));
        if (over) over.classList.add('over');
    });
    addEventListener('pointerup', (e) => {
        if (!drag) return;
        const d = drag;
        drag = null;
        $$('.inv-slot.over, .cart.over', root).forEach((s) => s.classList.remove('over'));
        // a click on a shop item (no drag) puts one in the cart
        if (!d.ghost) {
            if (d.from === 'shop') addToCart(d.it[0]);
            return;
        }
        d.ghost.remove();
        const under = document.elementFromPoint(e.clientX, e.clientY);
        if (d.from === 'shop') {
            // shop items go into the cart, wherever they're dropped (except back on the shop)
            if (under?.closest('.cart') || (under?.closest('.inv-slot') && under.closest('.inv-slot').dataset.inv !== 'shop')) addToCart(d.it[0]);
            return renderInv();
        }
        const target = under?.closest('.inv-slot');
        if (!target) return renderInv();
        if (target.dataset.inv === 'shop') { toast('You can\'t sell to this shop', 'error'); return renderInv(); }
        move(d.from, d.slot, target.dataset.inv, +target.dataset.slot, d.half);
    });

    // ---------- shop cart
    const shopWin = $('.inv-win.shop', root);
    const priceOf = (name) => Object.values(inv.shop.items).find(([n]) => n === name)[2].price;
    function addToCart(name, n = 1) {
        cart[name] = Math.max(0, (cart[name] || 0) + n);
        if (!cart[name]) delete cart[name];
        renderCart();
    }
    function cartTotal() {
        return Object.entries(cart).reduce((t, [name, c]) => t + priceOf(name) * c, 0);
    }
    function renderCart() {
        const list = $('.cart-list', shopWin);
        const rows = Object.entries(cart);
        list.innerHTML = rows.length ? rows.map(([name, c]) => `<div class="cart-row">
            <i class="fa-solid ${DEFS[name].icon} ico"></i><span>${DEFS[name].label}</span>
            <button data-cart="-" data-name="${name}">−</button><b>${c}</b><button data-cart="+" data-name="${name}">+</button>
            <em>$${(priceOf(name) * c).toLocaleString()}</em></div>`).join('') : '<div class="cart-empty">Your cart is empty</div>';
        $('.cart-total', shopWin).textContent = `$${cartTotal().toLocaleString()}`;
    }
    shopWin.addEventListener('click', (e) => {
        const b = e.target.closest('[data-cart]');
        if (b) return addToCart(b.dataset.name, b.dataset.cart === '+' ? 1 : -1);
        const pay = e.target.closest('[data-pay]');
        if (pay) checkout(pay.dataset.pay);
    });

    // would all these cart lines fit in the pockets (weight + free slots)?
    function fitsPockets(lines) {
        const p = inv.pockets;
        let w = weight('pockets'), free = 0;
        for (let s = 1; s <= p.slots; s++) if (!p.items[s]) free++;
        for (const [name, c] of lines) {
            w += DEFS[name].w * c;
            const stacks = DEFS[name].stack && Object.values(p.items).some(([n]) => n === name);
            if (!stacks) free -= DEFS[name].stack ? 1 : c;
        }
        return w <= p.max && free >= 0;
    }
    function giveToPockets(name, c) {
        const p = inv.pockets.items;
        const d = DEFS[name];
        if (d.stack) {
            const slot = Object.keys(p).find((s) => p[s][0] === name);
            if (slot) { p[slot][1] += c; return; }
        }
        for (let i = 0; i < (d.stack ? 1 : c); i++) {
            for (let s = 1; s <= inv.pockets.slots; s++) {
                if (!p[s]) { p[s] = [name, d.stack ? c : 1]; break; }
            }
        }
    }
    function checkout(method) {
        const lines = Object.entries(cart);
        if (!lines.length) return toast('Your cart is empty', 'error');
        const total = cartTotal();
        if (!fitsPockets(lines)) return toast('You can\'t carry all of that', 'error');
        if (method === 'cash') {
            const cashSlot = Object.keys(inv.pockets.items).find((s) => inv.pockets.items[s][0] === 'cash');
            const have = cashSlot ? inv.pockets.items[cashSlot][1] : 0;
            if (have < total) return toast(`Not enough cash ($${total.toLocaleString()} needed)`, 'error');
            inv.pockets.items[cashSlot][1] -= total;
            if (inv.pockets.items[cashSlot][1] <= 0) delete inv.pockets.items[cashSlot];
        } else {
            if (bank < total) return toast(`Not enough in the bank ($${total.toLocaleString()} needed)`, 'error');
            bank -= total;
        }
        for (const [name, c] of lines) giveToPockets(name, c);
        for (const name of Object.keys(cart)) delete cart[name];
        toast(`Paid $${total.toLocaleString()} by ${method}`);
        renderInv();
        renderCart();
    }

    // ---------- dragging the windows around by their header
    const invArea = $('.pg-inv', root);
    let winDrag = null, topZ = 6;
    const canMoveWindows = () => matchMedia('(min-width: 761px)').matches;
    function freeLayout() {
        if (invArea.classList.contains('free')) return;
        // pin every window where it currently is, then switch to absolute positioning
        const base = invArea.getBoundingClientRect();
        const spots = $$('.inv-win', invArea).map((w) => { const r = w.getBoundingClientRect(); return [w, r.left - base.left, r.top - base.top]; });
        invArea.classList.add('free');
        spots.forEach(([w, x, y]) => { w.style.left = `${x}px`; w.style.top = `${y}px`; });
    }
    invArea.addEventListener('pointerdown', (e) => {
        const head = e.target.closest('.inv-head');
        if (!head || !canMoveWindows()) return;
        freeLayout();
        const win = head.parentElement;
        win.style.zIndex = ++topZ;
        win.classList.add('moving');
        winDrag = { win, dx: e.clientX - win.offsetLeft, dy: e.clientY - win.offsetTop };
        e.preventDefault();
    });
    addEventListener('pointermove', (e) => {
        if (!winDrag) return;
        const { win } = winDrag;
        const maxX = invArea.clientWidth - win.offsetWidth, maxY = invArea.clientHeight - win.offsetHeight;
        win.style.left = `${Math.max(0, Math.min(maxX, e.clientX - winDrag.dx))}px`;
        win.style.top = `${Math.max(0, Math.min(maxY, e.clientY - winDrag.dy))}px`;
    });
    addEventListener('pointerup', () => {
        if (!winDrag) return;
        winDrag.win.classList.remove('moving');
        winDrag = null;
    });
    // the layout snaps back if the window is resized
    addEventListener('resize', () => {
        invArea.classList.remove('free');
        $$('.inv-win', invArea).forEach((w) => { w.style.left = w.style.top = w.style.zIndex = ''; });
    });

    function move(fromId, fromSlot, toId, toSlot, half) {
        if (fromId === toId && fromSlot === toSlot) return renderInv();
        const from = inv[fromId].items, to = inv[toId].items;
        const it = from[fromSlot];
        const def = DEFS[it[0]];
        const count = half && it[1] > 1 ? Math.floor(it[1] / 2) : it[1];
        const target = to[toSlot];
        if (fromId !== toId) {
            const extra = def.w * count - (target && !(target[0] === it[0] && def.stack) ? DEFS[target[0]].w * target[1] : 0);
            if (weight(toId) + extra > inv[toId].max) { toast('Not enough space', 'error'); return renderInv(); }
        }
        if (!target) {
            to[toSlot] = [it[0], count, it[2]];
            it[1] -= count;
            if (it[1] <= 0) delete from[fromSlot];
        } else if (target[0] === it[0] && def.stack) {
            target[1] += count;
            it[1] -= count;
            if (it[1] <= 0) delete from[fromSlot];
        } else {
            from[fromSlot] = target;
            to[toSlot] = it;
        }
        renderInv();
    }

    pane.addEventListener('dblclick', (e) => {
        const slot = e.target.closest('.inv-slot');
        const it = slot && inv[slot.dataset.inv].items[slot.dataset.slot];
        if (!it || slot.dataset.inv === 'shop') return;
        const d = DEFS[it[0]];
        if (d.weapon) return toast(`${d.label} equipped`);
        if (!d.use) return toast(`${d.label} can't be used`, 'error');
        it[1] -= 1;
        if (it[1] <= 0) delete inv[slot.dataset.inv].items[slot.dataset.slot];
        toast(d.use);
        renderInv();
    });
    renderInv();
    renderCart();

    // ------------------------------------------------------------ hud
    const hud = { health: 100, armor: 0, hunger: 80, thirst: 65, speed: 0, cash: 2450 };
    const hudPane = $('.pg-pane[data-pg="hud"]', root);
    function renderRings() {
        $$('.ring', hudPane).forEach((r) => {
            const v = Math.max(0, Math.min(100, hud[r.dataset.k]));
            $('.v', r).style.strokeDashoffset = 94.25 * (1 - v / 100);
            r.classList.toggle('low', v > 0 && v < 25);
        });
        $('.cash', hudPane).textContent = hud.cash.toLocaleString();
    }
    const bump = () => { const m = $('.hud-money span', hudPane); m.classList.add('bump'); setTimeout(() => m.classList.remove('bump'), 200); };
    const actions = {
        eat: () => { hud.hunger = Math.min(100, hud.hunger + 35); toast('+35 hunger'); },
        drink: () => { hud.thirst = Math.min(100, hud.thirst + 35); toast('+35 thirst'); },
        hurt: () => { hud.health = Math.max(5, hud.health - 30); hud.armor = Math.max(0, hud.armor - 40); toast('Ouch!', 'error'); },
        armor: () => { hud.armor = 100; toast('Armor equipped'); },
        pay: () => { hud.cash += 250; bump(); toast('Paycheck: +$250'); },
    };
    hudPane.addEventListener('click', (e) => {
        const b = e.target.closest('[data-hud]');
        if (b && actions[b.dataset.hud]) { actions[b.dataset.hud](); renderRings(); }
    });
    // hold to drive
    let gas = false;
    const gasBtn = $('[data-hud="gas"]', hudPane);
    gasBtn.addEventListener('pointerdown', () => { gas = true; });
    addEventListener('pointerup', () => { gas = false; });
    addEventListener('keydown', (e) => { if (current === 'hud' && (e.key === 'w' || e.key === 'W') && inView()) gas = true; });
    addEventListener('keyup', (e) => { if (e.key === 'w' || e.key === 'W') gas = false; });
    let last = performance.now();
    (function tick(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (current === 'hud') {
            hud.speed = gas ? Math.min(160, hud.speed + 70 * dt * (1 - hud.speed / 190)) : Math.max(0, hud.speed - 45 * dt);
            const s = Math.round(hud.speed);
            $('.spd', hudPane).textContent = s;
            $('.hud-speedo .val', hudPane).style.strokeDashoffset = 157 * (1 - hud.speed / 160);
            $('.gear', hudPane).textContent = s === 0 ? 'N' : Math.min(6, 1 + Math.floor(s / 28));
            // slowly get hungry
            hud.hunger = Math.max(0, hud.hunger - dt * 0.6);
            hud.thirst = Math.max(0, hud.thirst - dt * 0.8);
            if (Math.random() < 0.05) renderRings();
        }
        requestAnimationFrame(tick);
    })(last);
    renderRings();

    // ------------------------------------------------------------ death screen
    const dz = $('.pg-pane[data-pg="death"]', root);
    const dzScreen = $('.dz-screen', dz);
    let dzState = 'alive', dzEnds = 0, dzTotal = 1, holdStart = 0, dzTimer;
    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    function dzSet(state) {
        dzState = state;
        $('.dz-alive', dz).classList.toggle('hidden', state !== 'alive');
        dzScreen.classList.toggle('hidden', state === 'alive');
        dzScreen.classList.toggle('dead', state === 'dead');
        $('.dz-title', dz).textContent = state === 'dead' ? 'UNCONSCIOUS' : 'DOWN';
        $('.dz-icon i', dz).className = state === 'dead' ? 'fa-solid fa-skull' : 'fa-solid fa-heart-crack';
        dzTotal = state === 'dead' ? 6 : 10;
        dzEnds = Date.now() + dzTotal * 1000;
        $('.dz-medic', dz).classList.add('hidden');
        clearInterval(dzTimer);
        if (state !== 'alive') dzTimer = setInterval(dzTick, 250);
        dzTick();
    }
    function dzTick() {
        if (dzState === 'alive') return;
        const left = Math.max(0, Math.ceil((dzEnds - Date.now()) / 1000));
        const ready = dzState === 'dead' && left === 0;
        dzScreen.classList.toggle('ready', ready);
        $('.dz-label', dz).textContent = ready ? 'You can respawn' : dzState === 'dead' ? 'Respawn available in' : 'Bleeding out in';
        $('.dz-time', dz).textContent = ready ? 'Now' : fmt(left);
        $('.dz-bar i', dz).style.width = `${ready ? 100 : (left / dzTotal) * 100}%`;
        $('[data-death="respawn"]', dz).classList.toggle('hidden', !ready);
        if (dzState === 'laststand' && left === 0) dzSet('dead');
        if (holdStart && ready) {
            const p = Math.min(1, (Date.now() - holdStart) / 1500);
            $('.dz-hold i', dz).style.width = `${p * 100}%`;
            if (p >= 1) { holdStart = 0; respawn(); }
        }
    }
    function respawn() {
        dzSet('alive');
        $('.dz-hold i', dz).style.width = '0';
        toast('Respawned at Pillbox · Hospital bill $500');
    }
    function callEms() {
        if (dzState === 'alive') return;
        const medic = $('.dz-medic', dz);
        if (!medic.classList.contains('hidden')) return toast('You already called for help', 'error');
        medic.classList.remove('hidden');
        toast('EMS have been notified');
        setTimeout(() => {
            if (dzState === 'alive') return;
            dzSet('alive');
            toast('A medic revived you!');
        }, 3500);
    }
    dz.addEventListener('click', (e) => {
        const b = e.target.closest('[data-death]');
        if (!b) return;
        if (b.dataset.death === 'shoot') dzSet('laststand');
        if (b.dataset.death === 'ems') callEms();
    });
    const respawnBtn = $('[data-death="respawn"]', dz);
    respawnBtn.addEventListener('pointerdown', () => { holdStart = Date.now(); });
    addEventListener('pointerup', () => { holdStart = 0; $('.dz-hold i', dz).style.width = '0'; });
    addEventListener('keydown', (e) => {
        if (current !== 'death' || !inView() || e.repeat) return;
        if (e.key === 'g' || e.key === 'G') callEms();
        if (e.key === 'e' || e.key === 'E') holdStart = Date.now();
    });
    addEventListener('keyup', (e) => { if (e.key === 'e' || e.key === 'E') { holdStart = 0; $('.dz-hold i', dz).style.width = '0'; } });

    // ------------------------------------------------------------ loading screen
    const ld = $('.pg-pane[data-pg="load"]', root);
    const TIPS = ['Press Z to open the radial menu.', 'Hold Left Alt to interact with the world.', 'Use /job to see your job.', 'Eat and drink regularly!', 'Respect other players and have fun.'];
    const STAGES = ['Loading game systems', 'Loading map data', 'Loading resources', 'Spawning city', 'Almost there'];
    let ldTimer, tipTimer;
    function startLoad() {
        clearInterval(ldTimer); clearInterval(tipTimer);
        let pct = 0, tipI = 0;
        $('.ld-replay', ld).classList.add('hidden');
        $('.ld-progress', ld).classList.remove('hidden');
        ldTimer = setInterval(() => {
            pct = Math.min(100, pct + Math.random() * 6 + 1);
            $('.ld-bar i', ld).style.width = `${pct}%`;
            $('.ld-pct', ld).textContent = `${Math.floor(pct)}%`;
            $('.ld-stage', ld).textContent = STAGES[Math.min(STAGES.length - 1, Math.floor(pct / 21))];
            if (pct >= 100) {
                clearInterval(ldTimer); clearInterval(tipTimer);
                $('.ld-stage', ld).textContent = 'Welcome to the city!';
                setTimeout(() => $('.ld-replay', ld).classList.remove('hidden'), 400);
            }
        }, 160);
        tipTimer = setInterval(() => {
            const t = $('.ld-tip', ld);
            t.style.opacity = 0;
            setTimeout(() => { tipI = (tipI + 1) % TIPS.length; $('.ld-tip span', ld).textContent = TIPS[tipI]; t.style.opacity = 1; }, 300);
        }, 2600);
    }
    onShow.load = startLoad;
    $('.ld-replay', ld).addEventListener('click', startLoad);

    // ------------------------------------------------------------ third eye
    const tg = $('.pg-target', root);
    const cross = $('.tg-cross', tg);
    const opts = $('.tg-opts', cross);
    let locked = false, hotThing = null;
    function setHot(thing) {
        if (thing === hotThing) return;
        if (hotThing) hotThing.classList.remove('hot');
        hotThing = thing;
        cross.classList.toggle('hot', !!thing);
        opts.innerHTML = '';
        if (!thing) return;
        thing.classList.add('hot');
        JSON.parse(thing.dataset.opts).forEach(([icon, label]) => {
            const b = document.createElement('button');
            b.innerHTML = `<i class="fa-solid ${icon}"></i>${label}`;
            b.addEventListener('click', (e) => { e.stopPropagation(); toast(label); locked = false; setHot(null); });
            opts.appendChild(b);
        });
    }
    tg.addEventListener('mousemove', (e) => {
        if (locked) return;
        const r = tg.getBoundingClientRect();
        cross.style.left = `${e.clientX - r.left}px`;
        cross.style.top = `${e.clientY - r.top}px`;
        cross.style.visibility = 'hidden';
        const under = document.elementFromPoint(e.clientX, e.clientY);
        cross.style.visibility = '';
        setHot(under?.closest('.tg-thing') || null);
    });
    tg.addEventListener('click', (e) => {
        if (e.target.closest('.tg-opts')) return;
        locked = !!hotThing && !locked;
        if (!locked && !hotThing) setHot(null);
    });
    tg.addEventListener('mouseleave', () => { if (!locked) setHot(null); });
})();
