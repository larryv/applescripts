on isRunning(procName)
	tell application "System Events"
		if not (exists application process procName) then
			return false
		end if
	end tell
	return true
end isRunning

if isRunning("Safari") then
	tell application "Safari" to set _urls to URL of every tab of (first window whose visible is equal to true)
	tell application "Google Chrome"
		activate
		set _newWindow to (make new window)
		set URL of (first tab of _newWindow) to (first item of _urls)
		repeat with _url in rest of _urls
			tell _newWindow to make new tab with properties {URL:_url}
		end repeat
	end tell
end if