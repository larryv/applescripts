/*
 * Duplicate Window in Google Chrome
 *
 * Open a new Chrome window containing the same tabs that are open in
 * the frontmost Safari window (skipping Bookmarks, Favorites, History,
 * and Top Sites).
 *
 * Last updated 2018-10-15.
 */

'use strict';

// Ideally these would be const, but global const/let declarations
// interact poorly with OSA persistence.
var Chrome = Application('com.google.Chrome');
var Safari = Application('com.apple.Safari');

/*
 * Given a reference to a Safari window, return an array containing the
 * URIs of the window's tabs. The URIs are ordered by tab position, from
 * left to right. Safari-specific URIs (e.g., "history://") are
 * included. The URI "about:blank" is returned for blank tabs.
 */
function getSafariURIs(window) {
    // Request tab information in bulk and store it in proxy objects to
    // minimize the number of Apple events sent.
    const tabs = window.tabs().map(ref => ({ref}));
    window.tabs.name().forEach((name, idx) => { tabs[idx].name = name; });
    window.tabs.url().forEach((uri, idx) => { tabs[idx].uri = uri; });

    // There are at least two situations in which Safari returns null
    // for a tab's URI:
    //   - The tab has not been loaded. When a window is restored,
    //     Safari loads the front tab but defers loading the other tabs
    //     until the user activates them. However, unloaded tabs do have
    //     their correct names, which are the titles of their websites.
    //   - The tab is empty. Safari allows users to open new tabs with
    //     no content at all. These tabs have the name "Untitled".
    // I'm not aware of a foolproof method for distinguishing between
    // these. This function assumes that a tab with a null URI and the
    // name "Untitled" is empty and would break on an unloaded tab for
    // a silly website named "Untitled".
    let nullTabs = tabs.filter(({uri}) => !uri);
    if (nullTabs.length) {
        // Force unloaded tabs to load by activating each one.
        const initTab = window.currentTab();
        nullTabs.forEach(({ref}) => { window.currentTab = ref; });
        window.currentTab = initTab;

        // Tabs don't load instantaneously, so wait for Safari to load
        // them in parallel. It would be cleaner to use a "whose" clause
        // to count remaining null-URI tabs, but that doesn't work.
        while (nullTabs.some(({name}) => name !== 'Untitled')) {
            delay(1);
            window.tabs.url().forEach((uri, idx) => { tabs[idx].uri = uri; });
            nullTabs = nullTabs.filter(({uri}) => !uri);
        }

        // Any remaining null-URI tabs should have the name "Untitled".
        // Assume these are empty tabs and set an appropriate URI in
        // their proxy objects.
        nullTabs.forEach(tab => { tab.uri = 'about:blank'; });
    }

    // Tabs that failed to load report a Safari-specific error URI. The
    // original URI can be extracted from the text of the error page.
    // Tested with Safari 12.0 on macOS 10.13.
    tabs.filter(({uri}) =>
        uri === 'file:///Applications/Safari.app/Contents/Resources/' ||
        uri === 'safari-resource:/ErrorPage.html'
    ).forEach(tab => {
        const match = /Safari can’t open the page “(.+?)”/u.exec(tab.ref.text());
        if (match) {
            tab.uri = match[1];
        } else {
            window.currentTab = tab;
            // If there were a way to bring only the relevant window to
            // the front instead of activating the entire application,
            // that would be nice.
            throwAlert({
                message: 'Could not obtain URI of current tab.',
                as: 'critical',
                givingUpAfter: 60
            });
        }
    });

    return tabs.map(tab => tab.uri);
}

/*
 * Given a URI, returns whether it is recognized to be special to
 * Safari.
 */
function isSafariSpecialURI(uri) {
    return uri === 'bookmarks://' ||
            uri === 'favorites://' ||
            uri === 'file:///Applications/Safari.app/Contents/Resources/' ||
            uri === 'history://' ||
            uri.startsWith('safari-resource:') ||
            uri === 'topsites://';
}

/*
 * Given an array of URIs, create a new Chrome window with a tab for each.
 */
function makeNewChromeWindowWithURIs(uris) {
    let window = Chrome.Window().make();
    if (uris.length) {
        // Re-use the initial tab, create the rest.
        window.tabs[0].url = uris[0];
        uris.slice(1).forEach(u => { window.tabs.push(Chrome.Tab({url: u})); });
    }
    return window;
}

/*
 * Given an object containing named parameters for displayAlert(),
 * display an alert and throw an exception.
 */
function throwAlert(alertParameters) {
    // Should Safari display the alert instead of the script runner?
    const runner = Application.currentApplication();
    runner.includeStandardAdditions = true
    runner.displayAlert('Duplicate Window in Chrome', alertParameters);
    throw new Error(alertParameters.message);
}

function run() {
    const visibleSafariWindows = Safari.windows.whose({visible: true})();
    if (!visibleSafariWindows.length) {
        throwAlert({
            message: "There are no visible Safari windows to duplicate.",
            as: "critical",
            givingUpAfter: 60
        });
    }
    let uris = getSafariURIs(visibleSafariWindows[0]);
    let currentTabIdx = visibleSafariWindows[0].currentTab.index();

    // Safari-specific tabs to the left of the active tab will be
    // omitted. Adjust the index to account for this.
    currentTabIdx -=
        uris.slice(0, currentTabIdx - 1).filter(isSafariSpecialURI).length;

    uris = uris.filter(uri => !isSafariSpecialURI(uri));
    if (!uris.length) {
        throwAlert({
            message: "Could not duplicate because all tabs are Safari-only.",
            as: "critical",
            givingUpAfter: 60
        });
    }

    // If there were a way to bring only the relevant window to
    // the front instead of activating the entire application,
    // that would be nice.
    makeNewChromeWindowWithURIs(uris).activeTabIndex = currentTabIdx;
}
