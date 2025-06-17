(() => {
    let body;

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, message } = obj;
        console.log(type, message);

        if (type === 'BLOCK') {
            removeBodyElements();
            informThatPageIsBlockedToUser();
        }
    })

    const removeBodyElements = () => {
        body = document.querySelector('body')
        const bodyChildren = [...body.children];

        bodyChildren.forEach((el) => el.remove());
    }

    const informThatPageIsBlockedToUser = () => {
        const div = document.createElement('div');

        div.className = "blocked-page";
        div.innerHTML = `<img src="${chrome.runtime.getURL('src/assets/focus-mode-icon.png')}">`
        div.innerHTML += `<p class="blocked-page-para">This page is blocked so you can go and touch grass</p>`;

        body.appendChild(div);
    }
})();