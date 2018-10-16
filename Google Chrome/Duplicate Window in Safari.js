/*
 * Duplicate Window in Safari
 *
 * Open a new Safari window containing the same tabs that are open in
 * the frontmost Chrome window (excluding Chrome-specific tabs like
 * Bookmarks, Extensions, History, and Settings).
 *
 * Last updated 2018-10-18.
 */

'use strict';

// Ideally these would be const, but global const/let declarations
// interact poorly with OSA persistence.
var Chrome = Application('com.google.Chrome');
var Safari = Application('com.apple.Safari');

/*
 * Given a reference to a Chrome window, return an array containing the
 * URIs of the window's tabs. The URIs are ordered by tab position, from
 * left to right. Chrome-specific URIs (e.g., "chrome://settings") are
 * included.
 */
function getChromeURIs(window) {
    while (window.tabs.whose({loading: true}).length) {
        delay(1);
    }
    return window.tabs.url();
}

/*
 * Given a URI, returns whether it is recognized to be special to
 * Chrome.
 */
function isChromeSpecialURI(uri) {
    return uri.startsWith('chrome:') || uri.startsWith('chrome-extension:');
}

/*
 * Given an array of URIs, create a new Safari window with a tab for each.
 */
function makeNewSafariWindowWithURIs(uris) {
    // Does creating a new document always open a new window?
    Safari.Document(uris.length ? {url: uris[0]} : {}).make();
    let window = Safari.windows.whose({visible: true})[0]();
    uris.slice(1).forEach(u => { window.tabs.push(Safari.Tab({url: u})); });
    return window;
}

/*
 * Given an object containing named parameters for displayAlert(),
 * display an alert and throw an exception.
 */
function throwAlert(alertParameters) {
    // Should Chrome display the alert instead of the script runner?
    const runner = Application.currentApplication();
    runner.includeStandardAdditions = true
    runner.displayAlert('Duplicate Window in Safari', alertParameters);
    throw new Error(alertParameters.message);
}

function run() {
    const visibleChromeWindows = Chrome.windows.whose({visible: true})();
    if (!visibleChromeWindows.length) {
        throwAlert({
            message: "There are no visible Chrome windows to duplicate.",
            as: "critical",
            givingUpAfter: 60
        });
    }
    let uris = getChromeURIs(visibleChromeWindows[0]);

    // Unlike activeTabIndex(), JavaScript arrays are zero-indexed.
    let activeTabIdx = visibleChromeWindows[0].activeTabIndex() - 1;

    // Chrome-specific tabs to the left of the active tab will be
    // omitted. Adjust the index to account for this.
    activeTabIdx -=
        uris.slice(0, activeTabIdx).filter(isChromeSpecialURI).length;

    uris = uris.filter(uri => !isChromeSpecialURI(uri));
    if (!uris.length) {
        throwAlert({
            message: "Could not duplicate because all tabs are Chrome-only.",
            as: "critical",
            givingUpAfter: 60
        });
    }

    // If there were a way to bring only the relevant window to
    // the front instead of activating the entire application,
    // that would be nice.
    const newSafariWindow = makeNewSafariWindowWithURIs(uris);
    newSafariWindow.currentTab = newSafariWindow.tabs[activeTabIdx];
}
