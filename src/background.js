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

    url = trimUrl(url);

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