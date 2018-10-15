README
======

Little utilities that I've written in AppleScript and [JavaScript for
Automation][JXA] (JXA).

While most [OSA][] script runners can directly handle `.applescript`
files, I expect that few (if any) support `.js` files. Any of these
scripts can be run directly using `osascript(1)` or compiled using
`osacompile(1)`. (The [`build.sh`][build] script is a convenience
wrapper for the latter.)

[build]: build.sh
[JXA]: https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation
    "JavaScript for Automation Release Notes - Apple Developer Documentation Archive"
[OSA]: https://developer.apple.com/library/archive/documentation/AppleScript/Conceptual/AppleScriptX/Concepts/osa.html
    "Open Scripting Architecture - AppleScript Overview - Apple Developer Documentation Archive"
