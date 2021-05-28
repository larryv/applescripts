#!/usr/bin/osascript

(*
 * Count Safari Windows and Tabs
 *
 * Counts Safari's visible/minimized windows and tabs and displays the
 * results.
 *
 * Last updated 2021-05-28.
 *
 * Copyright 2018, 2021 Lawrence Andrew Velázquez
 * SPDX-License-Identifier: MIT
 *)

property name : "Count Safari Windows and Tabs"

tell application id "com.apple.Safari"
    set _windows to a reference to ¬
            every window where it is visible or it is miniaturized
    set _windowCount to count _windows
    set _tabCount to count every tab of _windows
end tell

set _alertText to (_windowCount as string) & " window"
if _windowCount is not 1 then set _alertText to _alertText & "s"

set _alertText to _alertText & ", " & (_tabCount as string) & " tab"
if _tabCount is not 1 then set _alertText to _alertText & "s"

if id of current application is "at.obdev.LaunchBar" then
    using terms from application id "at.obdev.LaunchBar"
        display in large type _alertText with title (my name)
    end using terms from
else
    display alert _title message _alertText
end if
