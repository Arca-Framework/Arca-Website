// Theme toggle shared by every page
function arcaApplyCodeTheme(theme) {
    const dark = document.getElementById('hl-dark');
    const light = document.getElementById('hl-light');
    if (dark) dark.disabled = theme === 'light';
    if (light) light.disabled = theme !== 'light';
}

arcaApplyCodeTheme(document.documentElement.dataset.theme);

document.querySelectorAll('.theme-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = next;
        arcaApplyCodeTheme(next);
        try { localStorage.setItem('arca-theme', next); } catch (e) {}
    });
});
