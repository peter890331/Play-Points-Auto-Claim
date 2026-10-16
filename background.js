let isProcessing = false;

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({ claimCount: 0, nextClaimDate: 0 });
  }
  chrome.alarms.create('checkIdleAlarm', { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkIdleAlarm') {
    chrome.idle.queryState(600, (state) => {
      if ((state === 'idle' || state === 'locked') && !isProcessing) {
        chrome.storage.local.get(['nextClaimDate'], (result) => {
          const nextDate = result.nextClaimDate || 0;
          if (Date.now() >= nextDate) {
            isProcessing = true;
            chrome.storage.local.set({ autoRunFlag: Date.now() }, () => {
              chrome.tabs.create({ url: "https://play.google.com/store/points/perks", active: true });
            });
            setTimeout(() => { isProcessing = false; }, 300000);
          }
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'closeTab' && sender.tab) {
    chrome.tabs.remove(sender.tab.id);
  }
});