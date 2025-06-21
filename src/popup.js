import { trimUrl } from "./utils.js";

const blockedSitesDiv = document.getElementById('blocked-sites-list');
const checkbox = document.querySelector('input[type="checkbox"]');
const isBlocking = await chrome.storage.sync.get('isBlocking');

checkbox.checked = isBlocking['isBlocking'] ? true : false;

const makeParagraph = (url) => `<p id="blocked-site"><strong>${url}</strong><img src="assets/delete.png"></p>`;

const loadSitesList = async () => {
    const storage = await chrome.storage.sync.getKeys();
    const sites = storage.filter(key => key !== 'isBlocking');

    const paragraphs = [...blockedSitesDiv.children].map((para) => para.textContent);
        
    sites.forEach((site) => {
        if (!paragraphs.includes(site)) {
            blockedSitesDiv.innerHTML += makeParagraph(site);
        }
    });
};

loadSitesList();

blockedSitesDiv.addEventListener('click', (e) => {
    if (e.target.nodeName !== 'IMG') 
        return;

    const url = e.target.parentNode.textContent;

    chrome.storage.sync.remove(url);
    e.target.parentNode.remove();
});

document.getElementById('add-site').addEventListener('keydown', async (e) => {
    const url = trimUrl(e.target.value);
    const storage = await chrome.storage.sync.getKeys();

    if (e.key !== 'Enter' || !url) return;
    if (storage.includes(url)) return;

    const { isBlocking } = await chrome.storage.sync.get('isBlocking');

    chrome.storage.sync.set({[url]: isBlocking}, () => console.log(`Set ${url} to ${isBlocking}`));

    e.target.value = '';
    blockedSitesDiv.innerHTML += makeParagraph(url);
});

checkbox.addEventListener('change', (e) => {
    const sites = [...blockedSitesDiv.children];
    
    chrome.storage.sync.set({"isBlocking": e.target.checked})
        
    sites.forEach((blockedSite) => {
        const hostname = blockedSite.textContent;

        chrome.storage.sync.set({[hostname]: e.target.checked}, () => console.log(`Set ${hostname} to ${e.target.checked}`));
    })
});