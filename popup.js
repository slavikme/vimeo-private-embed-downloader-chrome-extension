const { getStoredVideoData, storeVideoData } = DataStore;
const { retrieveVideoData, getEmbedURL } = DataRetriever;

const getActiveTab = () => new Promise((resolve, reject) =>
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => tabs.length
        ? resolve(tabs[0])
        : reject(new Error("Failed to retrieve active tab"))
    )
);

const getVideoData = async () => {
    const activeTab = await getActiveTab();
    const tabId = activeTab.id;
    let videoData = getStoredVideoData(tabId);
    if ( !videoData ) {
        showLoader();
        const embedUrl = await getEmbedURL(tabId);
        videoData = await retrieveVideoData(embedUrl);
        storeVideoData(videoData, tabId);
    }
    return videoData;
};

const showLoader = () => {
    document.body.innerHTML = `
<div class="loading"><img src="loading.svg" /></div>
`;
};

const showError = message => {
    document.body.innerHTML = `
<div class="error-icon"><img src="error.png" /></div>
<div class="error-message">${message}</div>
`;
};

const createLinkElement = ({ url, quality, size }, title = "") => {
    const filename = cleanFilename(title) + ".mp4";
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    // a.title = filename;
    a.title = new URL(url).pathname.match(/\/([^\/]+)$/)?.[1];
    a.innerText = `${quality} (${size.formatted})`;
    a.addEventListener('click', event => {
        event.preventDefault();
        chrome.runtime.sendMessage(`feebjagfliobfjohmnipeoekmenfgbng`, {url, filename});
        // downloadVideo(quality);
    });
    return a;
};

const createListItemElement = a => {
    const li = document.createElement('li');
    li.append(a);
    return li;
}

const buildPopup = ({ formats, title, thumbnail }) => {
    document.body.innerHTML = `
<div class="title">${title}</div>
<div class="thumb"><img src="${thumbnail.medium}" /></div>
<div class="subtitle">Available formats to download:</div>
<div class="download-list"><ul></ul></div>
<div class="file-name"><input disabled value="${cleanFilename(title)}.mp4" /></div>
`;
    const ul = document.querySelector('ul');
    const formatsSorted = formats.sort((a, b) => b.height - a.height);
    const links = formatsSorted.map(format => createLinkElement(format, title));
    const listItems = links.map(createListItemElement);
    listItems.forEach(li => ul.append(li));
}

const cleanFilename = text => text.replace(/[<>:"\/\\|?*\n]/g, '');

const downloadVideo = async (quality) => {
    const { formats, title } = await getVideoData();
    const filename = cleanFilename(title) + ".mp4";
    const { url } = formats.find(({ quality: q }) => q === quality);
    chrome.downloads.download({ url, filename });
};

(async () => {
    const videoData = await getVideoData();
    if (!videoData)
        return showError(`Something went terribly wrong! Try to refresh the page and open this popup again.`);

    buildPopup(videoData);
})();