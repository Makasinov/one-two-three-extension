const tlog = chrome.extension.getBackgroundPage().console.log;
tlog('Extension id ', chrome.runtime.id);

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.set({url: null, image: null}, function() {
        tlog('Cache reset');
    });
});









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
