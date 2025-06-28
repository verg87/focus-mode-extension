(() => {
    let body;

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type } = obj;

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
        const message = document.createElement('p');

        div.className = "blocked-page";

        message.className = "message-container";
        message.innerHTML += `<span>
            <img src="${chrome.runtime.getURL('src/assets/focus-mode-icon.png')}">
            <br>This page is blocked<br><span class="msg-hint"><i>so you can go and touch some grass</i></span>
        </span>`;

        div.appendChild(message);

        body.appendChild(div);
    }
})();