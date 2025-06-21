async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

const trimUrl = (url) => {
    try {
        const urlObject = new URL(url);
        return urlObject.hostname;
    } catch (e) {
        return false
    }   
}

const setInitialValues = () => {
    chrome.storage.sync.set({sites: [
        "www.youtube.com",
        "discord.com",
        "www.twitch.tv",
        "fr-fr.facebook.com",
    ]});
}

const sendMessageToContentScript = async (tabId, url) => {
    const { sites } = await chrome.storage.sync.get('sites');
    const { isBlocking } = await chrome.storage.sync.get('isBlocking');

    if (url && sites.includes(url) && isBlocking) {
        chrome.tabs.sendMessage(tabId, {
            type: "BLOCK",
            message: url,
            }, (response) => {
            if (chrome.runtime.lastError) {
                console.log(`Error: ${chrome.runtime.lastError.message}`);
            } else {
                console.log(`Received response: ${response}`);
            }
        });
    }
}

const listenForBlockedPage = async (checked, deleted, added) => {
    const tab = await getCurrentTab();
    const currentTabHostname = trimUrl(tab['url']);
    const { sites } = await chrome.storage.sync.get('sites');

    if ((!checked && sites.includes(currentTabHostname)) || (!checked && deleted)) { // Doesn't work
        chrome.tabs.reload(tab.id);
    } else if ((checked && sites.includes(currentTabHostname)) || (checked && added)) {
        sendMessageToContentScript(tab.id, currentTabHostname);
    }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        sendMessageToContentScript(activeInfo.tabId, trimUrl(tab.url))
    })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        sendMessageToContentScript(tabId, trimUrl(tab.url));
    } 
});

chrome.storage.sync.onChanged.addListener(async (changes) => {
    const changedKeys = Object.keys(changes);
    console.log(changes);
    if (changedKeys.length === 0) return; 
  
    const url = changedKeys[0];
    const { oldValue, newValue } = changes[url] || {};
    let deleted, added;
    
    // Doesn't work
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        if (oldValue.length < newValue.length) {
            added = true;
            deleted = false;
        } else {
            added = false;
            deleted = true;
        }
    }

    //* listenForBlockedPage should be only called when:
    //* either newValue is true and oldValue is false/undefiend or the other way around
    if (newValue && !oldValue) {
        listenForBlockedPage(true, deleted, added);
    } else if (oldValue && !newValue) {
        listenForBlockedPage(false, deleted, added);
    }

    // const { isBlocking } = await chrome.storage.sync.get('isBlocking');
    
    // listenForBlockedPage(isBlocking, sites);
});

chrome.runtime.onInstalled.addListener((details) => {
    setInitialValues();
});