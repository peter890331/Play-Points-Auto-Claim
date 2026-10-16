chrome.storage.local.get(['nextClaimDate', 'autoRunFlag'], (initResult) => {
  
  if (initResult.nextClaimDate && Date.now() < initResult.nextClaimDate) {
    if (initResult.autoRunFlag) {
      chrome.storage.local.remove('autoRunFlag', () => {
        setTimeout(() => {
          chrome.runtime.sendMessage({ action: 'closeTab' });
        }, 500);
      });
    }
    return;
  }

  const startTime = Date.now();
  let hasClickedClaim = false;
  let hasClickedChest = false;
  let chestWaitCycles = 0;

  const intervalId = setInterval(() => {
    if (Date.now() - startTime >= 60000) {
      finishProcess(false, false);
      return;
    }

    const chestBtn = document.querySelector('button[jslog*="TE9ZQUxUWV9SRVdBUkRf"]');
    const rewardCard = document.querySelector('div[jscontroller="KRZHBd"]');
    const nextRewardCard = document.querySelector('div[jscontroller="qtCXJb"]');

    if (chestBtn) {
      chestBtn.removeAttribute('inert');
      chestBtn.click();
      hasClickedChest = true;
      chestWaitCycles++;

      if (chestWaitCycles >= 15) {
        finishProcess(true, false);
      }
      return;
    }

    if (rewardCard) {
      if (!hasClickedClaim) {
        const btn = rewardCard.querySelector('button');
        const span = rewardCard.querySelector('span[jsname="V67aGc"]');
        if (btn) {
          btn.removeAttribute('inert');
          if (span) span.click();
          btn.click();
          hasClickedClaim = true;
        }
      }
      return;
    }

    if (nextRewardCard && !rewardCard && !chestBtn) {
      let isSuccessfullyClaimed = hasClickedChest;
      let isAlreadyClaimed = !hasClickedChest && !hasClickedClaim;
      finishProcess(isSuccessfullyClaimed, isAlreadyClaimed);
      return;
    }
  }, 200);

  function finishProcess(isSuccessfullyClaimed, isAlreadyClaimed) {
    clearInterval(intervalId);
    const isChinese = navigator.language.startsWith('zh');
    const noDataText = isChinese ? '尚未取得資料' : 'No data available';
    
    chrome.storage.local.get(['claimCount', 'nextClaimDate', 'dateString', 'autoRunFlag'], (result) => {
      let count = result.claimCount || 0;
      let nextDate = result.nextClaimDate || 0;
      let finalStr = result.dateString || noDataText;
      let shouldAutoClose = false;
      
      if (result.autoRunFlag) {
        shouldAutoClose = true;
        chrome.storage.local.remove('autoRunFlag');
      }
      
      const now = new Date();
      const currentDay = now.getDay();
      let daysUntilFriday = (5 - currentDay + 7) % 7;
      if (daysUntilFriday === 0) {
        daysUntilFriday = 7;
      }
      
      const nextFridayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFriday).getTime();
      const nextFridayString = new Date(nextFridayTime).toLocaleDateString();

      if (isSuccessfullyClaimed) {
        count += 1;
        nextDate = nextFridayTime;
        finalStr = nextFridayString;
      } else if (isAlreadyClaimed) {
        nextDate = nextFridayTime;
        finalStr = nextFridayString;
      } else {
        if (nextDate === 0) {
          nextDate = nextFridayTime;
          finalStr = nextFridayString;
        } else if (Date.now() >= nextDate) {
          nextDate = Date.now() + 6 * 60 * 60 * 1000;
        }
      }
      
      chrome.storage.local.set({
        nextClaimDate: nextDate, 
        claimCount: count,
        dateString: finalStr
      }, () => {
        if (shouldAutoClose) {
          setTimeout(() => {
            chrome.runtime.sendMessage({ action: 'closeTab' });
          }, 500);
        }
      });
    });
  }
});