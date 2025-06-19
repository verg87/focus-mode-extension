export const trimUrl = (url) => {
    try {
        const urlObject = new URL(url);
        return urlObject.hostname;
    } catch (e) {
        return false
    }   
}