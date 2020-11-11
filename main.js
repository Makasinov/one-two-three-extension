const tlog = chrome.extension.getBackgroundPage().console.log;
tlog('Extension id ', chrome.runtime.id);

chrome.runtime.onInstalled.addListener(() => {
    let interval
    chrome.storage.local.set({url: null});
    chrome.storage.local.set({image: null});
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        tlog(request)
        if (request.cmd === "new") {
            clearInterval(interval)
            interval = setInterval(() => {
                chrome.storage.local.get(['url'], ({url}) => {
                    if (!url) {
                        tlog("no url in local storage")
                        return
                    }
                    return fetchImage(url)
                        .then(base64Img => {
                            chrome.storage.local.set({url, image: base64Img}, () => {
                                tlog("new image set in storage")
                            })
                        })
                })
            }, 10 * 1000)
        }
        if (request.cmd === "reset") {
            clearInterval(interval)
            chrome.storage.local.set({url: null});
            chrome.storage.local.set({image: null});
        }
    });
});



const fetchImage = (url) => {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(response => arrayBufferToBase64(response))
        .then((base64Img) => {
            tlog('set new image and url in local storage')
            try {
                chrome.storage.local.set({url});
                chrome.storage.local.set({image: base64Img});
            } catch(e) {
                tlog('error set new value to storage', e)
            }
            return base64Img
        })
        .catch((e) => console.error(e))
};

const arrayBufferToBase64 = (buffer) => {
    var binary = '';
    var bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach((b) => binary += String.fromCharCode(b));
    return 'data:image/jpeg;base64,' + window.btoa(binary);
};

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
