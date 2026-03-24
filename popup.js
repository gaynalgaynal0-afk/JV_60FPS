// ── JV-60FPS Telegram API Key System ──
// Bot: @Secret_120fps_methud_tiktok_bot
// Channel: @jv60fps
const TELEGRAM_BOT_TOKEN = "7846522852:AAGK5i6FzxTzqRUIClxItcfobFJAJ00T-50";
const TELEGRAM_CHANNEL_ID = "@jv60fps";
const TELEGRAM_API = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN;

async function validateApiKey(apiKey) {
    if (!/^\d{5,15}$/.test(apiKey)) return { valid: false, reason: "invalid_format" };
    try {
        const r = await fetch(`${TELEGRAM_API}/getChatMember?chat_id=${TELEGRAM_CHANNEL_ID}&user_id=${apiKey}`);
        const d = await r.json();
        if (!d.ok) return { valid: false, reason: "bot_error" };
        const status = d.result && d.result.status;
        const isMember = ["member", "administrator", "creator"].includes(status);
        if (isMember) {
            const user = d.result.user;
            const username = user.username ? "@" + user.username : (user.first_name || "User");
            return { valid: true, username };
        }
        return { valid: false, reason: "not_member" };
    } catch(e) { return { valid: false, reason: "network_error" }; }
}

document.addEventListener('DOMContentLoaded', () => {

    // ── Lock Screen Elements ──
    const lockScreen = document.getElementById('lockScreen');
    const idInput    = document.getElementById('idInput');
    const unlockBtn  = document.getElementById('unlockBtn');
    const lockError  = document.getElementById('lockError');

    const unlock = () => {
        lockScreen.classList.add('hidden');
    };

    // Check if already unlocked (saved key still valid)
    chrome.storage.local.get(['jvUnlocked', 'jvApiKey'], async (res) => {
        if (res.jvUnlocked === true && res.jvApiKey) {
            const result = await validateApiKey(res.jvApiKey);
            if (result.valid) {
                unlock();
            } else {
                // Key no longer valid (left channel etc), clear and show lock
                chrome.storage.local.remove(['jvUnlocked', 'jvApiKey']);
            }
        }
    });

    // ── Unlock Button ──
    unlockBtn.addEventListener('click', async () => {
        const entered = idInput.value.trim();
        if (!entered) return;

        unlockBtn.textContent = 'CHECKING...';
        unlockBtn.disabled = true;
        lockError.textContent = '';

        const result = await validateApiKey(entered);

        unlockBtn.textContent = '▶ UNLOCK';
        unlockBtn.disabled = false;

        if (result.valid) {
            chrome.storage.local.set({ jvUnlocked: true, jvApiKey: entered });
            lockError.style.color = '#00e5ff';
            lockError.textContent = '✓ Welcome ' + (result.username || '');
            setTimeout(() => unlock(), 600);
        } else {
            const msgs = {
                invalid_format: '✗ Invalid format — numbers only',
                not_member:     '✗ Not a member — join @jv60fps first',
                bot_error:      '✗ Bot error — try again',
                network_error:  '✗ Network error — check connection'
            };
            lockError.style.color = '#ff4d6d';
            lockError.textContent = msgs[result.reason] || '✗ Invalid ID';
            idInput.style.borderColor = '#ff4d6d';
            idInput.style.boxShadow = '0 0 10px rgba(255,77,109,0.3)';
            setTimeout(() => {
                idInput.style.borderColor = '';
                idInput.style.boxShadow = '';
            }, 1500);
        }
    });

    idInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') unlockBtn.click();
    });

    // ── Main Toggle Logic ──
    const toggle = document.getElementById('masterSwitch');
    const label  = document.getElementById('masterLabel');

    if (!toggle || !label) return;

    const updateUI = (isActive) => {
        toggle.checked = isActive;
        if (isActive) {
            label.textContent = 'ENABLED';
            label.classList.add('active');
        } else {
            label.textContent = 'DISABLED';
            label.classList.remove('active');
        }
    };

    chrome.storage.local.get(['sysActive'], (res) => {
        updateUI(!!res.sysActive);
    });

    toggle.addEventListener('change', (e) => {
        const isActive = e.target.checked;
        updateUI(isActive);
        chrome.storage.local.set({ sysActive: isActive });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'TOGGLE_STATE',
                    enabled: isActive
                });
            }
        });
    });

});
