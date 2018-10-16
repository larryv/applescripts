#!/bin/sh

# Compile the AppleScript or JavaScript for Automation source files
# provided as arguments. Place each compiled script in the same
# directory as its source. Hide the outputs' filename extensions, as
# Apple's Script Editor does.

if [ "$#" -lt 1 ]; then
    printf 'Usage: %s script1 [script2 ...]\n' "$0" >&2
    exit 1
fi

for infile; do
    if [ "${infile##*.}" = js ]; then
        osalang='-l JavaScript'
    else
        osalang=
    fi
    outfile=${infile%.*}.scpt
    osacompile $osalang -x -o "$outfile" "$infile" || exit

    # Transform the positional parameters into a list of output
    # filenames, which will be passed all at once to the final
    # AppleScript.
    shift
    set -- "$@" "$outfile"
done

# osascript(1) prints the result to stdout, which is pointless here.
osascript - "$@" >/dev/null <<'EOF'
on run _argv
    repeat with _arg in _argv
        -- "POSIX file" must remain outside the "tell app 'Finder'"
        -- block to avoid a terminology conflict.
        set _f to POSIX file _arg as alias
        tell application "Finder" to set (extension hidden) of _f to true
    end repeat
end run
EOF
