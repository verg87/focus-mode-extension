import { trimUrl } from "./utils.js";

(async () => {
    const blockedSitesDiv = document.getElementById('blocked-sites-list');
    const toggleBlockingCheckbox = document.querySelector('#sites-switch');
    const sitesSection = document.querySelector('.sites');
    const wordsSection = document.querySelector('.words');
    const blockedSitesBtn = document.querySelector('.blocked-sites');
    const blockedWordsBtn = document.querySelector('.blocked-words');
    const addSiteInput = document.querySelector('#add-site');

    const makeParagraph = (url) => 
        `<p id="blocked-site">
            <strong>${url}</strong>
            <img src="assets/delete.png">
        </p>`;
    
    const toggleDisplay = (e) => {
        if (e.target.className === 'blocked-sites') {
            wordsSection.style.display = 'none';
            sitesSection.style.display = '';
        } else {
            sitesSection.style.display = 'none';
            wordsSection.style.display = '';
        }
    }

    const removeSite = async (e) => {
        if (e.target.nodeName !== 'IMG') 
            return;

        const url = e.target.parentNode.textContent.trim();

        let { sites } = await chrome.storage.sync.get('sites');
        sites = sites.filter((site) => site !== url);
        chrome.storage.sync.set({sites,}, () => console.log(`Removed ${url} from blocked sites`));

        e.target.parentNode.remove();
    }

    const addSite = async (e) => {
        const url = trimUrl(e.target.value);
        const { sites } = await chrome.storage.sync.get('sites');

        if (e.key !== 'Enter' || !url) return;
        if (sites.includes(url)) return;

        sites.push(url);
        chrome.storage.sync.set({sites,}, () => console.log(`Added ${url} to blocked sites`));

        e.target.value = '';
        blockedSitesDiv.innerHTML += makeParagraph(url);
    }

    const loadSiteList = async () => {
        const { sites } = await chrome.storage.sync.get('sites');

        const paragraphs = [...blockedSitesDiv.children].map((para) => para.textContent);
            
        sites.forEach((site) => {
            if (!paragraphs.includes(site)) {
                blockedSitesDiv.innerHTML += makeParagraph(site);
            }
        });
    };

    const toggleBlocking = (e) => {
        chrome.storage.sync.set({"isBlocking": e.target.checked});
    }

    const initialize = async () => {
        const { isBlocking } = await chrome.storage.sync.get('isBlocking');
        toggleBlockingCheckbox.checked = isBlocking ? true : false;

        loadSiteList();

        blockedSitesDiv.addEventListener('click', removeSite);
        addSiteInput.addEventListener('keydown', addSite);

        toggleBlockingCheckbox.addEventListener('change', toggleBlocking);

        blockedWordsBtn.addEventListener('click', toggleDisplay);
        blockedSitesBtn.addEventListener('click', toggleDisplay);
    }

    initialize();
})();