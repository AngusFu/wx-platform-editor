chrome.browserAction.onClicked.addListener(function updateIcon() {
  chrome.tabs.query({
    url: (new URL('./option/index.html', location.href)).href
  }, function (tabs) {

    if (!tabs.length) {
      chrome.tabs.create({
        url: './option/index.html'
      });
    } else {
      chrome.tabs.update(tabs[0].id, {
        selected: true
      });
    }
  });
});