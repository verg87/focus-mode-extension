export const trimUrl = (url) => {
    try {
        const urlObject = new URL(url);
        return urlObject.hostname;
    } catch (e) {
        return false
    }   
}

export function elt(name, attributes) {
    const node = document.createElement(name);
    if (attributes) {
        for (let attr in attributes) {
            if (attributes.hasOwnProperty(attr)) {
                node.setAttribute(attr, attributes[attr]);
            }
        }
    }

    for (let i = 2; i < arguments.length; i++) {
        let child = arguments[i];
        if (typeof child === 'string')
            child = document.createTextNode(child);

        node.appendChild(child);
    }

    return node;
}