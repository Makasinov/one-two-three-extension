const tlog = chrome.extension.getBackgroundPage().console.log;

const interval = setInterval(() => {
    chrome.storage.local.get(['image'], ({image}) => {
        if (!image) {
            return
        }
        tlog('set from cache')
        document.getElementById("grafana_image").src = image
        document.getElementById("grafana_image").style.display = "block"
        document.getElementById("form_body").style.display = "none"
    })
}, 1000);

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
    chrome.storage.local.get(['url'], ({url}) => {
        tlog('refresh from', url)
        return fetchImage(url)
    })
});

document.getElementById("close_button").addEventListener("click", () => {
    clearInterval(interval)
    chrome.storage.local.set({url: null});
    chrome.storage.local.set({image: null});
    document.getElementById("form_body").style.display = "block"
    document.getElementById("grafana_image").style.display = "none"
    chrome.runtime.sendMessage({cmd: "reset"});
});

document.getElementById("apply_button").addEventListener("click", () => {
    const closeButton = document.getElementById("apply_button")
    closeButton.innerHTML =
        "<div class=\"spinner-border\" role=\"status\">" +
        "  <span class=\"sr-only\">Loading...</span>" +
        "</div>"
    closeButton.disabled = true

    let panelUrl = document.getElementById("panel_url").value
    const refreshInterval = document.getElementById("refresh_interval").value
    let timeRange = document.getElementById("time_range").value
    chrome.runtime.sendMessage({cmd: "new", interval: refreshInterval, range: timeRange});
    let range = 3 * 60 * 60 // 3 hour
    if (timeRange && timeRange.length >= 2) {
        range = parseIntervalString(timeRange) * 1000
    }
    panelUrl = replaceMacros(panelUrl, [
        /\$M_FROM/g, `${Date.now() - range}`,
        /\$M_TO/g,   `${Date.now()}`,
    ])
    tlog(panelUrl, [refreshInterval], [timeRange, range])
    return fetchImage(panelUrl)
        .then(() => {
            closeButton.disabled = false
            closeButton.innerHTML = "Apply"
        })
});

const replaceMacros = (str, paramsArray) => {
    for (let it = 0; it <= (paramsArray.length / 2); it += 2) {
        str = str.replace(paramsArray[it], paramsArray[it+1])
        tlog(paramsArray[it], paramsArray[it+1])
    }
    tlog('replaced str -', str)
    return str
}

const parseIntervalString = (intervalString) => {
    let interval = Number(intervalString.slice(0, intervalString.length - 1))
    switch (intervalString.slice(-1)) {
        case 'h': interval *= 60;
        case 'm': interval *= 60;
    }
    return interval
}

const fetchImage = (url) => {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(response => arrayBufferToBase64(response))
        .then((base64Img) => {
            document.getElementById("grafana_image").src = base64Img
            document.getElementById("grafana_image").style.display = "block"
            document.getElementById("form_body").style.display = "none"
            tlog('set new image and url in local storage')
            try {
                chrome.storage.local.set({url});
                chrome.storage.local.set({image: base64Img});
            } catch(e) {
                tlog('error set new value to storage', e)
            }
        })
        .catch((e) => tlog(e))
};

const arrayBufferToBase64 = (buffer) => {
    var binary = '';
    var bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach((b) => binary += String.fromCharCode(b));
    return 'data:image/jpeg;base64,' + window.btoa(binary);
};
