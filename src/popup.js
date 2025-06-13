const blockedSitesDiv = document.getElementById('blocked-sites-list');

const validateURL = (text) => /^https?:\/\/.+\.[a-z]+/.test(text)

blockedSitesDiv.addEventListener('click', (e) => {
    if (e.target.nodeName !== 'IMG') 
        return;

    e.target.parentNode.remove();
});

document.getElementById('add-site').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !validateURL(e.target.value)) 
        return;

    blockedSitesDiv.innerHTML += `<p><strong>${e.target.value}</strong><img src="assets/delete.png"></img></p>`;
});