import { getCurrentTab, createElementFromString } from "./utils.js"; 

const blockedSitesDiv = document.getElementById('blocked-sites-list');

const validateURL = (text) => /^https?:\/\/.+\.[a-z]+/.test(text)
const makeParagraph = (url) => `<strong>${url}</strong><img src="assets/delete.png">`;

const loadSitesList = (sites) => {
    const htmlStrings = sites.map((site) => makeParagraph(site));
    const paragraphs = [...blockedSitesDiv.children].map((para) => para.innerHTML);
    
    htmlStrings.forEach((str) => {
        if (!paragraphs.includes(str)) {
            const element = `<p id="blocked-site">${str}</p>`
            blockedSitesDiv.innerHTML += element;
        }
    });
};

chrome.storage.sync.getKeys(loadSitesList);

blockedSitesDiv.addEventListener('click', (e) => {
    if (e.target.nodeName !== 'IMG') 
        return;

    e.target.parentNode.remove();
});

document.getElementById('add-site').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !validateURL(e.target.value)) 
        return;

    blockedSitesDiv.innerHTML += `<p id="blocked-site">${makeParagraph(e.target.value)}</p>`;
});

document.querySelector('.switch').addEventListener('click', (e) => {
    if (e.target.nodeName === "INPUT") return;

    const sites = [...blockedSitesDiv.children];

    sites.forEach(async (blockedSite) => {
        const key = blockedSite.innerText;
        const keyExists = await chrome.storage.sync.get(key);

        if (keyExists[key]) {
            chrome.storage.sync.remove(key, () => console.log(`Removed ${key} key`));
        } else {
            chrome.storage.sync.set({[key]: key}, () => console.log(`Set ${key} to itself`));
        }
    })
})