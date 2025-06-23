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

const listenForBlockedWords = async (tab) => {
    const url = new URLSearchParams(tab.url);
    const { words } = await chrome.storage.sync.get('words');
    const { blockWords } = await chrome.storage.sync.get('blockWords');

    for (let value of url.values()) {
        if (words.includes(value) && blockWords) {
            sendMessageToContentScript(tab.id, tab.url);
        }
    }
}

const listenForBlockedSites = async (tab, oldValue, newValue) => {
    const url = trimUrl(tab.url);
    const { sites } = await chrome.storage.sync.get('sites');
    const { blockSites } = await chrome.storage.sync.get('blockSites');

    if (sites.includes(url) && blockSites) {
        sendMessageToContentScript(tab.id);
    } else if (sites.includes(url) && !blockSites) {
        chrome.tabs.reload(tab.id);
    }

    // else if (!sites.includes(url) && !oldValue && newValue) {
    //     chrome.tabs.reload(tab.id);
    // } else if (sites.includes(url) && oldValue && !newValue) {
    //     chrome.tabs.reload(tab.id);
    // }
}

const setInitialValues = () => {
    chrome.storage.sync.set({sites: [
        "www.youtube.com",
        "discord.com",
        "www.twitch.tv",
        "fr-fr.facebook.com",
    ], words: []});
}

const sendMessageToContentScript = async (tabId) => {
    chrome.tabs.sendMessage(tabId, {
        type: "BLOCK",
        }, (response) => {
        if (chrome.runtime.lastError) {
            console.log(`Error: ${chrome.runtime.lastError.message}`);
        } else {
            console.log(`Received response: ${response}`);
        }
    });
}

const listenForBlockedPage = async (checked, hostname, type) => {
    const tab = await getCurrentTab();
    const currentTabHostname = trimUrl(tab['url']);
    const { sites } = await chrome.storage.sync.get('sites');

    if (!checked && sites.includes(currentTabHostname) && !type) { 
        chrome.tabs.reload(tab.id);
    } else if (checked && sites.includes(currentTabHostname) && !type) {
        sendMessageToContentScript(tab.id);
    } else if (checked && hostname === currentTabHostname && type === 'added') {
        sendMessageToContentScript(tab.id);
    } else if (checked && hostname === currentTabHostname && type === 'deleted') {
        chrome.tabs.reload(tab.id);
    }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        listenForBlockedSites(tab);
        listenForBlockedWords(tab);
    })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        listenForBlockedSites(tab);
        listenForBlockedWords(tab);
    } 
});

chrome.storage.sync.onChanged.addListener(async (changes) => {
    const tab = await getCurrentTab();

    const { blockSites } = changes;
    const { blockWords } = changes;


    listenForBlockedSites(tab, blockSites?.oldValue, blockSites?.newValue);
    listenForBlockedWords(tab, blockWords?.oldValue, blockWords?.newValue);
    // const { blockSites } = await chrome.storage.sync.get('blockSites');
    // const { sites } = changes;

    // if (!sites) {
    //     listenForBlockedPage(blockSites);
    //     return;
    // } 
    
    // if (sites['newValue'].length > sites['oldValue'].length) {
    //     const added = sites['newValue'].filter((site) => !sites['oldValue'].includes(site))[0];
    //     listenForBlockedPage(blockSites, added, 'added');
    // } else {
    //     const deleted = sites['oldValue'].filter((site) => !sites['newValue'].includes(site))[0];
    //     listenForBlockedPage(blockSites, deleted, 'deleted');
    // }
});

chrome.runtime.onInstalled.addListener((details) => {
    setInitialValues();
});