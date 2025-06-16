const trimUrl = (url) => {
    try {
        const urlObject = new URL(url);
        return urlObject.hostname;
    } catch (e) {
        return false
    }   
}

const setValues = () => {
    chrome.storage.sync.set({'isBlocking': false});
}

const sendMessageToContentScript = async (tabId, url) => {
    const storage = await chrome.storage.sync.getKeys();
    const sites = storage.filter(key => key !== "isBlocking");

    url = trimUrl(url);

    let permission = false;

    try {
        permission = await chrome.storage.sync.get([url]);
        permission = permission[url];
    } catch(e) {
        console.log(e);
    }

    console.log(url);
    console.log(sites);
    console.log(permission);

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
    console.log(details);
    setValues();
});