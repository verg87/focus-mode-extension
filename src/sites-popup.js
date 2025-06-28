import { trimUrl, makeParagraph, loadBlockedList } from "./utils.js";

(async () => {
    const blockedSitesDiv = document.getElementById('blocked-sites-list');
    const toggleBlockingSitesCheckbox = document.querySelector('#sites-switch');
    const sitesSection = document.querySelector('.sites');
    const wordsSection = document.querySelector('.words');
    const blockedSitesBtn = document.querySelector('#blocked-sites');
    const blockedWordsBtn = document.querySelector('#blocked-words');
    const addSiteInput = document.querySelector('#add-site');
    
    const toggleDisplay = (e) => {
        if (e.target.id === 'blocked-sites') {
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
        chrome.storage.sync.set({sites}, () => console.log(`Removed ${url} from blocked sites`));

        e.target.parentNode.remove();
    }

    const addSite = async (e) => {
        const url = trimUrl(e.target.value);
        const { sites } = await chrome.storage.sync.get('sites');

        if (e.key !== 'Enter' || !url) return;
        if (sites.includes(url)) return;

        sites.push(url);
        chrome.storage.sync.set({sites}, () => console.log(`Added ${url} to blocked sites`));

        e.target.value = '';
        blockedSitesDiv.innerHTML += makeParagraph("blocked-site", url);
    }

    const toggleBlockingSites = (e) => {
        chrome.storage.sync.set({"blockSites": e.target.checked});
    }

    const initializeSiteSection = async () => {
        const { blockSites } = await chrome.storage.sync.get('blockSites');
        toggleBlockingSitesCheckbox.checked = blockSites ? true : false;

        loadBlockedList('sites', blockedSitesDiv);

        blockedSitesDiv.addEventListener('click', removeSite);
        addSiteInput.addEventListener('keydown', addSite);

        toggleBlockingSitesCheckbox.addEventListener('change', toggleBlockingSites);

        blockedWordsBtn.addEventListener('click', toggleDisplay);
        blockedSitesBtn.addEventListener('click', toggleDisplay);
    }

    initializeSiteSection();
})();