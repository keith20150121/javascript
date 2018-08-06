// Set up a click handler so that we can merge all the windows.
chrome.browserAction.onClicked.addListener(tab => {    
    chrome.tabs.executeScript(tab.id, {file: 'embedded.js'});
});