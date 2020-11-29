const tlog = chrome.extension.getBackgroundPage().console.log;
tlog('E | Extension id ', chrome.runtime.id);

chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.onUpdated.addListener((tabId, info) => {
        if (info.status === 'complete') {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                chrome.tabs.executeScript(tabs[0].id, {
                    file: "injectScript.js",
                })
            })
        }
    });
    let interval
    chrome.storage.local.set({url: null, image: null, range: null, interval: null});
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        tlog('E |', request)
        if (request.cmd === "new") {
            let intervalNumber = 10
            if (request.interval && request.interval.length >= 2) {
                intervalNumber = parseIntervalString(request.interval)
            }
            chrome.storage.local.set({url: request.url, range: request.range, interval: request.interval}, () => {
                clearInterval(interval)
                interval = setInterval(() => {
                    chrome.storage.local.get(['url', 'range'], ({url, range}) => {
                        if (!url) {
                            tlog("E | no url in local storage, bug probably")
                            return
                        }
                        let rangeNumber = 3 * 60 * 60 * 1000 // 3 hour
                        if (range && range.length >= 2) {
                            rangeNumber = parseIntervalString(range) * 1000
                        }
                        url = replaceMacros(url, [
                            /\$M_FROM/g, `${Date.now() - rangeNumber}`,
                            /\$M_TO/g,   `${Date.now()}`,
                        ])
                        tlog(' E |', url)
                        return fetchImage(url)
                            .then(base64Img => {
                                chrome.storage.local.set({image: base64Img}, () => {
                                    tlog('E | new image', base64Img.slice(-50))
                                })
                            })
                    })
                }, intervalNumber * 1000)
            });
        }
        if (request.cmd === "reset") {
            clearInterval(interval)
            chrome.storage.local.set({url: null, image: null, range: null, interval: null});
        }
    });
});

const replaceMacros = (str, paramsArray) => {
    for (let it = 0; it <= (paramsArray.length / 2); it += 2) {
        str = str.replace(paramsArray[it], paramsArray[it+1])
    }
    return str
}

const fetchImage = (url) => {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(response => arrayBufferToBase64(response))
        .catch((e) => console.error(e))
};

const arrayBufferToBase64 = (buffer) => {
    var binary = '';
    var bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach((b) => binary += String.fromCharCode(b));
    return 'data:image/jpeg;base64,' + window.btoa(binary);
};

const parseIntervalString = (intervalString) => {
    let interval = Number(intervalString.slice(0, intervalString.length - 1))
    switch (intervalString.slice(-1)) {
        case 'h': interval *= 60;
        case 'm': interval *= 60;
    }
    return interval
}

// chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
//         if (changeInfo.status === 'complete') {
//         chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//             if (!tabs[0].url) {
//                 tlog('application have no <tabs> permission')
//                 return
//             }
//
//             if(tabs[0].url.slice(0, 6) !== 'chrome') {
//                 tlog(tab)
//             }
//         })
//     }
// });
