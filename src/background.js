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
    const { words } = await chrome.storage.sync.get('words');
    const { blockWords } = await chrome.storage.sync.get('blockWords');

    if (words.some((word) => tab.url.search(word) !== -1) && blockWords) {
        sendMessageToContentScript(tab.id);
    }
}

const listenForBlockedSites = async (tab, newValue, oldValue) => {
    const url = trimUrl(tab.url);
    const { sites } = await chrome.storage.sync.get('sites');
    const { blockSites } = await chrome.storage.sync.get('blockSites');

    if (sites.includes(url) && blockSites) {
        sendMessageToContentScript(tab.id);
    } else if (sites.includes(url) && !blockSites) {
        // chrome.tabs.reload(tab.id);
    }

    // else if (sites.includes(url) && newValue.length < oldValue.length) {
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

const sendMessageToContentScript = (tabId) => {
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

const listenForBlockedPage = async (checked, items, hostname, type) => {
    const tab = await getCurrentTab();
    const currentTabHostname = trimUrl(tab['url']);

    checked = checked['newValue'] !== undefined ? checked['newValue'] : checked;
    const keywordIn = items.some((item) => tab.url.search(item) !== -1)

    if (keywordIn && checked) {
        sendMessageToContentScript(tab.id);
    } else if (keywordIn && !checked && !type) {
        chrome.tabs.reload(tab.id);
    } else if (type === 'deleted' && checked) {
        chrome.tabs.reload(tab.id);
    } else if (type === 'added' && checked) {
        sendMessageToContentScript(tab.id)
    }

    if (!checked && items.includes(currentTabHostname) && !type) { 
        chrome.tabs.reload(tab.id);
    } else if (checked && items.includes(currentTabHostname) && !type) {
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
    let key = Object.keys(changes)[0];
    let blockItems, items;
   
    if (key === "blockSites") {
        const obj = await chrome.storage.sync.get('sites');

        blockItems = changes['blockSites'];
        items = obj['sites'];
    } else if (key === "blockWords") {
        const obj = await chrome.storage.sync.get('words');

        blockItems = changes['blockWords'];
        items = obj['words'];
    } else if (key === "sites") {
        const obj = await chrome.storage.sync.get('blockSites');

        blockItems = obj['blockSites'];
        items = changes['sites'];
    } else if (key === "words") {
        const obj = await chrome.storage.sync.get('blockWords');

        blockItems = obj['blockWords'];
        items = changes['words'];
    }

    if (items['newValue'] && items['oldValue']) {
        if (items['newValue'].length > items['oldValue'].length) {
            const added = items['newValue'].filter((item) => !items['oldValue'].includes(item))[0];
            listenForBlockedPage(blockItems, items['newValue'], added, 'added');
        } else {
            const deleted = items['oldValue'].filter((item) => !items['newValue'].includes(item))[0];
            listenForBlockedPage(blockItems, items['newValue'], deleted, 'deleted');
        }
    } else {
        listenForBlockedPage(blockItems, items);
    }
    
});

chrome.runtime.onInstalled.addListener((details) => {
    setInitialValues();
});