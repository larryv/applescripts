property Apps : {"Safari", "Google Chrome", "Terminal", "MacVim"}

repeat with _App in Apps
	tell application "System Events"
		set _isRunning to (application process _App exists)
	end tell
	if _isRunning then
		tell application _App
			set _windows to (every window where it is visible and it is resizable)
			repeat with _window in _windows
				set _bounds to _window's bounds
				set item 2 of _bounds to 0
				set item 4 of _bounds to 9000
				set _window's bounds to _bounds
			end repeat
		end tell
	end if
end repeat
