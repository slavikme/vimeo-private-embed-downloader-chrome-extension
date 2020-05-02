const DataStore = (() => {
    const VIDEO_DATA_LIST_KEY = 'video-data-list';
    const CACHE_TIMEOUT_MINUTES = 10;

    const get = (name, defaultValue = null) => JSON.parse(localStorage.getItem(name) || JSON.stringify(defaultValue));
    const set = (name, data) => localStorage.setItem(name, JSON.stringify(data));

    const getStoredVideoData = tabId =>
        get(VIDEO_DATA_LIST_KEY, [])
            .find(videoData =>
                // find for the first occurence of the videoData
                videoData.tabId == tabId
                && (
                    // check if the data is still relevant
                    new Date(videoData.__creationTime).getTime() + CACHE_TIMEOUT_MINUTES * 60 * 1000 > new Date().getTime()
                    // otherwise, wipeout from storage
                    || clearVideoDataStorage(tabId)
                )
            );

    const storeVideoData = (videoData, tabId) => set(VIDEO_DATA_LIST_KEY,
        [
            // push the videoData at the beginning of the list 
            { tabId, __creationTime: new Date, ...videoData },
            ...get(VIDEO_DATA_LIST_KEY, [])
        ]
    );

    const clearVideoDataStorage = (tabId = null) => set(VIDEO_DATA_LIST_KEY,
        tabId
            ? get(VIDEO_DATA_LIST_KEY, [])
                .filter(videoData => videoData.tabId != tabId)
            : []
    );
    
    return { getStoredVideoData, storeVideoData, clearVideoDataStorage };
})();