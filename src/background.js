const trimUrl = (url) => {
    try {
        const urlObject = new URL(url);
        return urlObject.hostname;
    } catch (e) {
        return false
    }   
}

const sendMessageToContentScript = async (tabId, url) => {
    const storage = await chrome.storage.sync.getKeys();
    const sites = storage.filter(key => key !== "isBlocking");

    url = trimUrl(url);

    const permission = await chrome.storage.sync.get([url]);
    console.log(url);
    console.log(permission);

    if (url && sites.includes(url) && permission[url]) {
        chrome.tabs.sendMessage(tabId, {
            type: "BLOCK",
            hostname: url,
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