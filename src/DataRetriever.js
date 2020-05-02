const DataRetriever = (() => {

    const VIMEO_EMBED_URL_PATTERN = /^https:\/\/embed\.vhx\.tv\/videos\/\d+\?/;
    const VIMEO_API_URL = "https://api.vhx.tv";

    class API {
        #auth_user_token;
        #access_token;
        #baseApiUrl;

        constructor(videoId, auth_user_token, access_token) {
            if (!videoId || !auth_user_token || !access_token)
                throw new Error(`'videoId', 'access_token' and 'auth_user_token' are required in order to perform a Vimeo API call`);

            this.#auth_user_token = auth_user_token;
            this.#access_token = access_token;
            this.#baseApiUrl = VIMEO_API_URL + '/videos/' + videoId;
        }

        async call(path = "") {
            const authorization = "Bearer " + this.#access_token;
            const response = await get(this.#baseApiUrl + path + "?auth_user_token=" + this.#auth_user_token, { authorization });
            return await response.json();
        }
    }

    const get = async (url, headers = {}) => {
        const response = await fetch(url, { headers });
        if (response.status != 200)
            throw new Error(`Response from fetching the URL '${url}' has returned status code ${response.status}: ${response.statusText}`);
        return response;
    };

    const extractCredentialsFromContent = content => ({
        access_token: content.match(/"([0-9a-f]{64})"/)?.[1],
        auth_user_token: content.match(/"(\w{20}\.\w{50}\.[\w-]{43})"/)?.[1]
    });

    const extractVideoIdFromUrl = url => url.match(/\/videos\/(\d+)\?/)?.[1];

    const getCredentials = async (url) => extractCredentialsFromContent(await (await get(url)).text());

    const getVideoDataFromApi = async (api) => {
        // Get metadata
        const { thumbnail, id, title } = await api.call();

        // Get file formats
        const formats = (await api.call("/files"))
            .filter(file => file.format == "mp4")
            .map(({ size, codec, quality, created_at, updated_at, _links }) =>
                ({ size, codec, quality, created_at, updated_at, url: _links.source.href }));

        return { formats, title, id, thumbnail };
    };

    const retrieveVideoData = async (embedUrl) => {
        const { access_token, auth_user_token } = await getCredentials(embedUrl);
        const videoId = extractVideoIdFromUrl(embedUrl);
        const api = new API(videoId, auth_user_token, access_token);
        return await getVideoDataFromApi(api);
    };

    const getEmbedURL = tabId => new Promise((resolve, reject) =>
        chrome.webNavigation.getAllFrames({ tabId }, frames => {
            const frame = frames?.find(({ url }) => VIMEO_EMBED_URL_PATTERN.test(url));
            frame ? resolve(frame.url) : reject(new Error(`No Vimeo embed frames found in tab ${tabId}`));
        })
    );

    return { retrieveVideoData, getEmbedURL };
})();