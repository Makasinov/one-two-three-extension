const tlog = chrome.extension.getBackgroundPage().console.log;

chrome.storage.local.get(['url', 'image'], (storage) => {
    tlog(storage)
    if (storage.image) {
        document.getElementById("grafana_image").src = storage.image
        document.getElementById("form_body").style.display = "none"
        document.getElementById("grafana_image").style.display = "block"
    } else {
        document.getElementById("form_body").style.display = "block"

    }
});

document.getElementById("refresh_button").addEventListener("click", () => {
    tlog("refresh")
})

document.getElementById("close_button").addEventListener("click", () => {
    chrome.storage.local.set({url: null});
    chrome.storage.local.set({image: null});
    document.getElementById("form_body").style.display = "block"
    document.getElementById("grafana_image").style.display = "none"
})

document.getElementById("apply_button").addEventListener("click", () => {
    const closeButton = document.getElementById("apply_button")
    closeButton.innerHTML =
        "<div class=\"spinner-border\" role=\"status\">" +
        "  <span class=\"sr-only\">Loading...</span>" +
        "</div>"
    closeButton.disabled = true

    const panelUrl = document.getElementById("panel_url").value
    const refreshInterval = document.getElementById("refresh_interval").value
    const timeRange = document.getElementById("time_range").value
    tlog(panelUrl, refreshInterval, timeRange)
    fetch(panelUrl)
        .then(response => response.arrayBuffer())
        .then(response => arrayBufferToBase64(response))
        .then((base64Img) => {
            tlog('set src')
            document.getElementById("grafana_image").src = base64Img
            document.getElementById("grafana_image").style.display = "block"
            document.getElementById("form_body").style.display = "none"
            tlog('set new storage')
            try {
                chrome.storage.local.set({url: panelUrl});
                chrome.storage.local.set({image: base64Img});
            } catch(e) {
                tlog('error set new value to storage', e)
            }
        })
        .catch((e) => console.error(e))
})

const arrayBufferToBase64 = (buffer) => {
    var binary = '';
    var bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach((b) => binary += String.fromCharCode(b));
    return 'data:image/jpeg;base64,' + window.btoa(binary);
}
