(*
 * Count Windows and Tabs
 *
 * Count Google Chrome's windows and tabs and display the results. Only
 * windows that are visible or minimized are included.
 *
 * Last updated 2018-10-15.
 *)

tell application id "com.google.Chrome"
    set _windows to a reference to ¬
            every window whose visible is true or minimized is true
    set _winCount to count of _windows
    set _tabCount to count of every tab of _windows
end tell

set _text to (_winCount as string) & " window"
if _winCount is not 1 then set _text to _text & "s"

set _text to _text & ", " & (_tabCount as string) & " tab"
if _tabCount is not 1 then set _text to _text & "s"

set _title to (my name) & " (Chrome)"
if id of current application is "at.obdev.LaunchBar" then
    using terms from application id "at.obdev.LaunchBar"
        display in large type _text with title _title
    end using terms from
else
    display alert _title message _text
end if