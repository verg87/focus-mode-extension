export const trimUrl = (url) => {
    try {
        const urlObject = new URL(url);
        return urlObject.hostname;
    } catch (e) {
        return false
    }   
}

// Could make something more sofisticated but there's no need for that
export const makeParagraph = (id, text) => 
    `<p id="${id}">
        <strong>${text}</strong>
        <img src="assets/delete.png">
    </p>`;

export const trimWord = (word) => {
    return /^[a-zA-Z']+$/.test(word.trim());
}

export const loadBlockedList = async (type, listElement) => {
    const obj = await chrome.storage.sync.get(type);
    const items = obj[type];  

    const id = type === 'sites' ? "blocked-site" : "blocked-word";
            
    items.forEach((item) => {
        listElement.innerHTML += makeParagraph(id, item);
    });
};