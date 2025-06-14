export async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

export function createElementFromString(html) {
    if (!html || typeof html !== 'string') {
        throw new Error('Invalid HTML string provided');
    }
    
    let template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
}