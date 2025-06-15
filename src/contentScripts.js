(() => {
    chrome.runtime.onMessage.addListener((message, sender, response) => {
        const { type, hostname } = message;
        console.log(type, hostname);

        return true;
    })
})