chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['sysActive'], (res) => {
        if (res.sysActive === undefined) {
            chrome.storage.local.set({ sysActive: false });
        }
    });
});