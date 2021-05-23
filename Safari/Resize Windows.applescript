(*
 * Resize Windows
 *
 * Resize all resizable Safari windows to 1080 points × 877 points.
 *
 * Last updated 2018-10-16.
 *
 * Copyright 2018 Lawrence Andrew Velázquez
 * SPDX-License-Identifier: MIT
 *)

-- Desired dimensions on a display of 1440 pts × 900 pts.
property width : 1080
property height : 877

tell application id "com.apple.Safari"
    set _windows to every window where (it is resizable)
    repeat with _window in _windows
        set {x0, y0, x1, y1} to _window's bounds
        set x1 to x0 + width
        set y1 to y0 + height
        set _window's bounds to {x0, y0, x1, y1}
    end repeat
end tell
