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
    chrome.storage.sync.set({
        "www.youtube.com": false,
        "discord.com": false,
        "www.twitch.tv": false,
        "fr-fr.facebook.com": false,
    });
}

const sendMessageToContentScript = async (tabId, url) => {
    const storage = await chrome.storage.sync.get(null);
    const sites = Object.keys(storage).filter(key => key !== "isBlocking");
    let block = false;

    try {
        block = await chrome.storage.sync.get([url]);
        block = block[url];
    } catch(e) {
        console.log(e);
    }

    if (url && sites.includes(url) && block) {
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

const listenForBlockedPage = async (checked, hostname) => {
    const tab = await getCurrentTab();
    const currentTabHostname = trimUrl(tab['url']);

    if (!checked && hostname === currentTabHostname) {
        chrome.tabs.reload(tab.id);
    } else if (checked && hostname === currentTabHostname) {
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

chrome.storage.sync.onChanged.addListener((changes) => {
    const url = Object.keys(changes)[0];
    
    const match = changes[url];
    const keySet = !Object.hasOwn(match, 'oldValue') && match['newValue'] === false;
    const keyRemoved = !Object.hasOwn(match, 'newValue') && match['oldValue'] === false;

    if (match && !keySet && !keyRemoved) {
        listenForBlockedPage(match['newValue'], url);
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    setInitialValues();
});