#!/bin/sh

# Compile the AppleScript or JavaScript for Automation source files
# provided as arguments. Place each compiled script in the same
# directory as its source.

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
    osacompile $osalang -o "$outfile" "$infile" || exit

    # osascript(1) prints the result to stdout, which is pointless here.
    osascript - "$outfile" >/dev/null <<'EOF'
on run argv
    tell application "Finder"
        set extension hidden of (POSIX file (item 1 of argv) as alias) to true
    end tell
end run
EOF
done
