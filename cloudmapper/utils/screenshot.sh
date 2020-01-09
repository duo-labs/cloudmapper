#!/bin/bash
# Screenshot the host passed as a parameter.
# Kills any existing Firefox, and tries to run it in headless mode for 10 seconds.
# Must set `toolkit.startup.max_resumed_crashes` to `-1` in `about:config`

killall firefox-bin
echo $1
mkdir -p screenshots
gtimeout -s9 10 /Applications/Firefox.app/Contents/MacOS/firefox-bin --headless --window-size=1024,1024 --screenshot screenshots/$1.png $1
