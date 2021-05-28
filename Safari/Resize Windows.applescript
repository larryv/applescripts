#!/usr/bin/osascript

(*
 * Resize Safari Windows
 *
 * Resizes all resizable Safari windows to 1080 points by 877 points.
 *
 * Last updated 2021-05-28.
 *
 * Copyright 2018, 2021 Lawrence Andrew Velázquez
 * SPDX-License-Identifier: MIT
 *)

-- Desired dimensions on a display of 1440 points by 900 points.
property width : 1080
property height : 877

tell application id "com.apple.Safari"
    set _windows to every window where (it is resizable)
    repeat with _window in _windows
        set {x0, y0} to bounds of _window
        set bounds of _window to {x0, y0, x0 + width, y0 + height}
    end repeat
end tell
