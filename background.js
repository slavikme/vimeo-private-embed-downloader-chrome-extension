const { getStoredVideoData, storeVideoData } = DataStore;
const { retrieveVideoData, getEmbedURL } = DataRetriever;

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (["complete"].indexOf(changeInfo.status) == -1)
        return;

    try {
        const embedUrl = await getEmbedURL(tabId);
        chrome.pageAction.show(tabId);
        try {
            await doProcessVideoDataRetrieval(tabId, embedUrl);
        } catch (e) {
            console.error(e);
        }
    } catch (e) {
        chrome.pageAction.hide(tabId);
    }
});

const doProcessVideoDataRetrieval = async (tabId, url) => {
    url = url || await getEmbedURL(tabId);

    const cachedData = getStoredVideoData(tabId);
    if (cachedData) {
        console.log('Using cache. No need to update.')
        return cachedData;
    }

    const videoData = await retrieveVideoData(url);
    storeVideoData(videoData, tabId);
    return videoData;
};

const get = async (url, headers = {}) => {
    const response = await fetch(url, { headers });
    if (response.status != 200)
        throw new Error(`Response from fetching the URL '${url}' has returned status code ${response.status}: ${response.statusText}`);
    return response;
}
