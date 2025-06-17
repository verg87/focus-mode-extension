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
        "isBlocking": false,
        "www.youtube.com": false,
        "discord.com": false,
        "www.twitch.tv": false,
        "fr-fr.facebook.com": false,
    });
}

const sendMessageToContentScript = async (tabId, url) => {
    const storage = await chrome.storage.sync.get(null);
    const sites = Object.keys(storage).filter(key => key !== "isBlocking");

    url = trimUrl(url);

    let permission = false;

    try {
        permission = await chrome.storage.sync.get([url]);
        permission = permission[url];
    } catch(e) {
        console.log(e);
    }

    if (url && sites.includes(url) && permission) {
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

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        sendMessageToContentScript(activeInfo.tabId, tab.url)
    })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        sendMessageToContentScript(tabId, tab.url);
    } 
});

chrome.runtime.onInstalled.addListener((details) => {
    setInitialValues();
});