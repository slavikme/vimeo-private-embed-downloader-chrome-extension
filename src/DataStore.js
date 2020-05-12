const DataStore = (() => {
    const VIDEO_DATA_LIST_KEY = 'video-data-list';
    const CACHE_TIMEOUT_MINUTES = 10;

    const get = (name, defaultValue = null) => JSON.parse(localStorage.getItem(name) || JSON.stringify(defaultValue));
    const set = (name, data) => localStorage.setItem(name, JSON.stringify(data));

    const isCacheValid = videoData => new Date(videoData.__creationTime).getTime() + CACHE_TIMEOUT_MINUTES * 60 * 1000 > new Date().getTime();

    const getStoredVideoData = videoId =>
        get(VIDEO_DATA_LIST_KEY, [])
            .find(videoData =>
                // find the first occurence of the videoData
                videoData.id == videoId
                && (
                    // check if the data is still relevant
                    isCacheValid(videoData)
                    // otherwise, wipeout from storage
                    || clearVideoDataStorage()
                )
            );

    const storeVideoData = videoData => set(VIDEO_DATA_LIST_KEY,
        [
            // push the videoData at the beginning of the list 
            { __creationTime: new Date, ...videoData },
            ...get(VIDEO_DATA_LIST_KEY, [])
        ]
    );

    const clearVideoDataStorage = (videoId = null) => set(VIDEO_DATA_LIST_KEY,
        get(VIDEO_DATA_LIST_KEY, [])
            .filter(videoData => videoId
                ? videoData.id != videoId
                : isCacheValid(videoData)
            )
    );

    return { getStoredVideoData, storeVideoData, clearVideoDataStorage };
})();