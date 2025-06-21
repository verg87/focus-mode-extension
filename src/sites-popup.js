import { trimUrl } from "./utils.js";

const blockedSitesDiv = document.getElementById('blocked-sites-list');
const checkbox = document.querySelector('#sites-switch');
const isBlocking = await chrome.storage.sync.get('isBlocking');
const sites = document.querySelector('.sites');
const words = document.querySelector('.words');
const blockedSitesBtn = document.querySelector('.blocked-sites');
const blockedWordsBtn = document.querySelector('.blocked-words');

checkbox.checked = isBlocking['isBlocking'] ? true : false;

const makeParagraph = (url) => `<p id="blocked-site"><strong>${url}</strong><img src="assets/delete.png"></p>`;

const loadSitesList = async () => {
    const { sites } = await chrome.storage.sync.get('sites');

    const paragraphs = [...blockedSitesDiv.children].map((para) => para.textContent);
        
    sites.forEach((site) => {
        if (!paragraphs.includes(site)) {
            blockedSitesDiv.innerHTML += makeParagraph(site);
        }
    });
};

loadSitesList();

blockedSitesDiv.addEventListener('click', async (e) => {
    if (e.target.nodeName !== 'IMG') 
        return;

    const url = e.target.parentNode.textContent;

    let { sites } = await chrome.storage.sync.get('sites');
    sites = sites.filter((site) => site !== url);
    chrome.storage.sync.set({sites,}, () => console.log(`Removed ${url} from blocked sites`));

    e.target.parentNode.remove();
});

document.getElementById('add-site').addEventListener('keydown', async (e) => {
    const url = trimUrl(e.target.value);
    const { sites } = await chrome.storage.sync.get('sites');

    if (e.key !== 'Enter' || !url) return;
    if (sites.includes(url)) return;

    sites.push(url);
    chrome.storage.sync.set({sites,}, () => console.log(`Added ${url} to blocked sites`));

    e.target.value = '';
    blockedSitesDiv.innerHTML += makeParagraph(url);
});

checkbox.addEventListener('change', (e) => {  
    chrome.storage.sync.set({"isBlocking": e.target.checked})
});

const toggleDisplay = (e) => {
    if (e.target.className === 'blocked-sites') {
        words.style.display = 'none';
        sites.style.display = '';
    } else {
        sites.style.display = 'none';
        words.style.display = '';
    }
}

blockedWordsBtn.addEventListener('click', toggleDisplay);
blockedSitesBtn.addEventListener('click', toggleDisplay);