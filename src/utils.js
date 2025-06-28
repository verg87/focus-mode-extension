const trimUrl = (url) => {
    try {
        const urlObject = new URL(url);
        return urlObject.hostname;
    } catch (e) {
        return false
    }   
}

// Could make something more sofisticated but there's no need for that
const makeParagraph = (id, text) => 
    `<div class="position-relative" id="${id}">
        <strong>${text}</strong>
        <img src="assets/delete.png" class="position-absolute end-0" style="width: 20px; height: 20px">
    </div>`;

const trimWord = (word) => {
    return /^[a-zA-Z']+$/.test(word.trim());
}

const loadBlockedList = async (type, listElement) => {
    const obj = await chrome.storage.sync.get(type);
    const items = obj[type];  

    const id = type === 'sites' ? "blocked-site" : "blocked-word";
            
    items.forEach((item) => {
        listElement.innerHTML += makeParagraph(id, item);
    });
};

export {trimUrl, makeParagraph, trimWord, loadBlockedList};