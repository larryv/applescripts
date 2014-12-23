tell application "System Events"
	set gc to (application process "Google Chrome" exists)
	set lb to (application process "LaunchBar" exists)
end tell
if gc and lb then run countWindowsAndTabs

script countWindowsAndTabs
	set text item delimiters to " "
	set displayText to {}
	
	set browserText to {"Chrome" & ":"}
	tell application "Google Chrome"
		set end of browserText to count windows
		set end of browserText to "windows,"
		set end of browserText to count every window's tabs
		set end of browserText to "tabs"
	end tell
	set end of displayText to browserText as string
	
	set text item delimiters to "
"
	tell application "LaunchBar" to display in large type displayText as string
end script
