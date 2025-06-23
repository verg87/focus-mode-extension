import { trimWord, makeParagraph, loadBlockedList } from "./utils.js";

(async () => {
    const toggleBlockingWordsCheckbox = document.querySelector('#words-switch');
    const addWordInput = document.querySelector('#add-word');
    const blockedWordsDiv = document.querySelector('#blocked-words-list');

    const removeWord = async (e) => {
        const wordToRemove = e.target.parentNode.textContent.trim();

        if (e.target.nodeName !== "IMG") return;
        if (!wordToRemove) return;

        let { words } = await chrome.storage.sync.get('words');

        words = words.filter((word) => word !== wordToRemove);
        chrome.storage.sync.set({words}, () => console.log(`Removed ${wordToRemove} from blocked words`));

        e.target.parentNode.remove();
    }

    const addWord = async (e) => {
        const word = e.target.value;
        const { words } = await chrome.storage.sync.get('words');

        if (e.key !== "Enter" || !word) return;
        if (!trimWord(word) || words.includes(word)) return;
        
        words.push(word);
        chrome.storage.sync.set({words}, () => console.log(`Added ${word} to blocked words`));

        e.target.value = '';
        blockedWordsDiv.innerHTML += makeParagraph('blocked-word', word);
    }

    const toggleBlockingWords = (e) => {
        chrome.storage.sync.set({"blockWords": e.target.checked});
    }

    const initializeWordSection = async () => {
        const { blockWords } = await chrome.storage.sync.get("blockWords");
        toggleBlockingWordsCheckbox.checked = blockWords ? true : false;

        loadBlockedList('words', blockedWordsDiv);

        blockedWordsDiv.addEventListener('click', removeWord);
        addWordInput.addEventListener('keydown', addWord);

        toggleBlockingWordsCheckbox.addEventListener('change', toggleBlockingWords);
    }

    initializeWordSection();
})();