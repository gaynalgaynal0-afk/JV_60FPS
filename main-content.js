function showToast(isActive) {
    const existing = document.getElementById('xy-status-toast');
    if (existing) existing.remove();

    if (!isActive) return;

    const toast = document.createElement('div');
    toast.id = 'xy-status-toast';
    toast.textContent = 'EXTENSION IS READY TO USE';
    
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(10, 15, 30, 0.85)',
        backdropFilter: 'blur(10px)',
        color: '#00e5ff',
        border: '1px solid rgba(0, 229, 255, 0.4)',
        boxShadow: '0 0 15px rgba(0, 229, 255, 0.3)',
        padding: '12px 24px',
        borderRadius: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px',
        fontWeight: '800',
        letterSpacing: '1.5px',
        zIndex: '2147483647',
        pointerEvents: 'none',
        opacity: '0',
        transform: 'translateY(-10px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease'
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function init() {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('app-utils.js');
    s.onload = function() {
        this.remove();
        
        chrome.storage.local.get(['sysActive'], (res) => {
            const isActive = !!res.sysActive;
            document.dispatchEvent(new CustomEvent('SysStateUpdate', {
                detail: { active: isActive }
            }));
            
            if (isActive) showToast(true);
        });
    };
    (document.head || document.documentElement).appendChild(s);
}

init();

chrome.runtime.onMessage.addListener((req, sender, sendResp) => {
    if (req.type === 'TOGGLE_STATE') {
        document.dispatchEvent(new CustomEvent('SysStateUpdate', {
            detail: { active: req.enabled }
        }));
        
        showToast(req.enabled);
    }
});