(() => {
    let body;

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, message } = obj;
        console.log(type, message);

        if (type === 'BLOCK') {
            setDisplayToNone();
            informThatPageIsBlockedToUser();

            return response({status: ok});
        }

        return true;
    })

    const setDisplayToNone = () => {
        body = document.querySelector('body')
        const bodyChildren = [...body.children];

        bodyChildren.forEach((el) => el.style.display = 'none');
    }

    const informThatPageIsBlockedToUser = () => {
        const div = document.createElement('div');

        div.className = "blocked-page";
        div.textContent = "This page is blocked, so you can go and touch grass"

        body.appendChild(div);
    }
})