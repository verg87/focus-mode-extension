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

const listenForBlockedPage = async (checked, hostname, type) => {
    const tab = await getCurrentTab();
    const currentTabHostname = trimUrl(tab['url']);
    const { sites } = await chrome.storage.sync.get('sites');

    if (!checked && sites.includes(currentTabHostname) && !type) { 
        chrome.tabs.reload(tab.id);
    } else if (checked && sites.includes(currentTabHostname) && !type) {
        sendMessageToContentScript(tab.id, currentTabHostname);
    } else if (checked && hostname === currentTabHostname && type === 'added') {
        sendMessageToContentScript(tab.id, currentTabHostname);
    } else if (checked && hostname === currentTabHostname && type === 'deleted') {
        chrome.tabs.reload(tab.id);
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
    const { isBlocking } = await chrome.storage.sync.get('isBlocking');
    const { sites } = changes;

    if (!sites) {
        listenForBlockedPage(isBlocking);
        return;
    } 
    
    if (sites['newValue'].length > sites['oldValue'].length) {
        const added = sites['newValue'].filter((site) => !sites['oldValue'].includes(site))[0];
        listenForBlockedPage(isBlocking, added, 'added');
    } else {
        const deleted = sites['oldValue'].filter((site) => !sites['newValue'].includes(site))[0];
        listenForBlockedPage(isBlocking, deleted, 'deleted');
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    setInitialValues();
});