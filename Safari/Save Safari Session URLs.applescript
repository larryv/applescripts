#!/usr/bin/osascript

(*
 * Save Safari Session URLs
 *
 * Given one or more Safari session files, extracts all URLs contained
 * therein.  Each URL is output with a newline terminator; URLs from the
 * same window are grouped together and separated from other windows'
 * URLs with blank lines.
 *
 * If saved as a script or script bundle, accepts session files from
 * a file picker and saves the URLs to a user-chosen file.
 *
 * If saved as a script application, accepts session files from a file
 * picker or drag-and-drop and saves the URLs to a user-chosen file.
 *
 * If run via osascript(1), accepts session files as command-line
 * arguments and prints the extracted URLs to standard output.
 *
 * (Session files can be found at ~/Library/Safari/LastSession.plist and
 * at corresponding locations in backups.)
 *
 * Last updated 2023-06-20.
 *
 * Copyright 2021, 2023 Lawrence Andrew Velázquez
 * SPDX-License-Identifier: MIT
 *)


(*
 * On modern versions of macOS, Safari's session files are often stored
 * in locations requiring full disk access.  I manage property lists
 * with Foundation instead of System Events so that users won't have to
 * grant full disk access to a seemingly unrelated application.
 *)
use AppleScript version "2.4"
use framework "Foundation"
use scripting additions

(*
 * Given a POSIX path to a property list file, returns a record
 * containing the file's data.  Throws an error if the file cannot be
 * parsed as a property list.
 *)
on deserializePlist(_posixPath as text)
	local _data, _error
	tell class "NSData"
		set {_data, _error} to ¬
			its dataWithContentsOfFile:_posixPath ¬
			                   options:0 ¬
			                   |error|:(reference)
	end tell
	if _data is missing value then
		-- This could be more useful but it's not really worth it.
		error localizedDescription of _error as text
	end if

	local _plist
	tell class "NSPropertyListSerialization"
		set {_plist, _error} to ¬
			its propertyListWithData:_data ¬
			                 options:(my NSPropertyListImmutable) ¬
			                  format:(missing value) ¬
			                 |error|:(reference)
	end tell
	if _plist is missing value then
		error localizedDescription of _error as text
	end if

	return _plist as record
end deserializePlist


(*
 * Given a record containing the property list data from a Safari
 * session file, returns a list of lists containing the session's URLs.
 * Each inner list contains the URLs from a single window's tabs.
 *)
on getUrlsFromSessionData({SessionWindows:_sessionWindows as list})
	local _sessionUrls, _windowUrls
	set _sessionUrls to {}
	repeat with _window in _sessionWindows
		set _windowUrls to {}
		repeat with _tab in TabStates of _window
			set end of _windowUrls to TabURL of _tab
		end repeat
		copy _windowUrls to end of _sessionUrls
	end repeat
	return _sessionUrls
end getUrlsFromSessionData


(*
 * Given a list of Safari session files represented as aliases or file
 * objects, returns a text object containing all of the sessions' URLs.
 * Each URL is terminated by a newline character, and URLs from the same
 * window are grouped together and separated from other windows' URLs by
 * a blank line.  Throws an error if the argument list contains any
 * elements that cannot be parsed as a Safari session file.
 *)
on makeUrlListFromPlists(_plists as list)
	local _result, _plistData, _urlLists
	set _result to {}
	repeat with _plist in _plists
		set _plistData to deserializePlist(POSIX path of _plist)
		set _urlLists to getUrlsFromSessionData(_plistData)
		repeat with _urlList in _urlLists
			set end of _result to contents of _urlList
			set end of _result to ""
		end repeat
	end repeat

	set text item delimiters to "\n"
	return _result as text
end makeUrlListFromPlists


on open _plistAliases
	local _result, _prompt, _output, _f
	set _result to makeUrlListFromPlists(_plistAliases)
	set _prompt to "Specify name and location for the output text file."
	set _output to choose file name with prompt _prompt
	set _f to open for access _output with write permission
	write _result to _f as text
	close access _f
end open


on run _argv
	local _types, _prompt, _plists
	(*
	 * When this is run as an applet, _argv is the script application
	 * itself; within Script Editor, it is an object I don't recognize.
	 * I can't find documentation on this (but honestly haven't looked
	 * very hard), so I'm not sure that this test is robust.
	 *)
	if _argv is current application or class of _argv is not list then
		-- https://developer.apple.com/documentation/uniformtypeidentifiers/uttypepropertylist
		set _types to {"com.apple.property-list"}
		set _prompt to "Select one or more Safari session files."
		try
			set _plists to choose file of type _types ¬
			                           with prompt _prompt ¬
			                           with multiple selections allowed
		on error number -128
			-- The user canceled the file picker.  This is fine.
			return
		end try

		-- Reuse the open handler to ask for the destination location.
		open _plists
	else
		set _plists to {}
		repeat with _arg in _argv
			set end of _plists to POSIX file _arg as alias
		end repeat

		-- Let osascript(1) print the result to standard output.
		return makeUrlListFromPlists(_plists)
	end if
end run
