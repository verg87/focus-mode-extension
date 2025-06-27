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

const checkCurrentTab = async () => {
    const { blockSites, sites, blockWords, words } = 
        await chrome.storage.sync.get(['blockSites', 'sites', 'blockWords', 'words']);
    
    const dataSites = {
        blockItems: { type: 'blockSites', value: blockSites },
        items: { type: 'sites', value: sites, modified: 'CCTCalle' }
    };
    const dataWords = {
        blockItems: { type: 'blockWords', value: blockWords },
        items: { type: 'words', value: words, modified: 'CCTCalle' }
    };

    console.log(dataSites, dataWords);

    listenForBlockedPage(dataSites);
    listenForBlockedPage(dataWords);
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


const listenForBlockedPage = async ({blockItems, items}) => {
    const tab = await getCurrentTab();
    const currentTabHostname = trimUrl(tab['url']);

    const checked = blockItems.hasOwnProperty('newValue') ? blockItems['newValue'] : blockItems['value'];
    const values = items.hasOwnProperty('newValue') ? items['newValue'] : items['value'];
    const type = items['modified'];

    const hasBlockedItems = items.type === 'sites'
        ? values.includes(currentTabHostname)
        : values.some(value => tab.url.includes(value));

    if (hasBlockedItems && checked && (!type || type === 'CCTCalle')) {
        sendMessageToContentScript(tab.id);
    } else if (hasBlockedItems && !checked && !type) {
        chrome.tabs.reload(tab.id);
    } else if (!hasBlockedItems && checked && type === 'deleted') {
        chrome.tabs.reload(tab.id);
    } else if (hasBlockedItems && checked && type === 'added') {
        sendMessageToContentScript(tab.id)
    }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        checkCurrentTab();
    })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        checkCurrentTab();
    } 
});

chrome.storage.sync.onChanged.addListener(async (changes) => {
    const key = Object.keys(changes)[0];
    const { newValue, oldValue } = changes[key];

    const data = {
        blockItems: {},
        items: {},
    };
   
    if (key === "blockSites" || key === 'blockWords') {
        const itemsName = key === "blockSites" ? "sites" : "words"
        const obj = await chrome.storage.sync.get(itemsName);

        data.blockItems['type'] = key;
        data.blockItems['newValue'] = newValue;
        data.blockItems['oldValue'] = oldValue;

        data.items['type'] = itemsName;
        data.items['value'] = obj[itemsName];
    } else {
        const blockItemsName = key === 'sites' ? 'blockSites' : 'blockWords';
        const obj = await chrome.storage.sync.get(blockItemsName);

        data.blockItems['type'] = blockItemsName;
        data.blockItems['value'] = obj[blockItemsName];

        data.items['type'] = key;
        data.items['newValue'] = newValue;
        data.items['oldValue'] = oldValue;

        data.items['modified'] = newValue.length > oldValue.length ? 'added' : 'deleted';
    }

    listenForBlockedPage(data);
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        setInitialValues();
    }
});