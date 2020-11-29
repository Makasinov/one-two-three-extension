currentUrl = window.location.href
if (
       currentUrl.includes("/d/", 10)
    && currentUrl.includes("orgId=", 15)
    && currentUrl.includes("viewPanel=", 15)
) {
    ((href) => {
        href = href.replace("/d/", "/render/d-solo/")
        href = href.replace("&viewPanel=", "&panelId=")
        href += "&from=$M_FROM&&to=$M_TO&"
        chrome.storage.local.set({prediction: href});
    })(window.location.href)
}
