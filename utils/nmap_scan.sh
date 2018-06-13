#!/bin/bash
# Expected format:
# ```
# 127.0.0.1:22,80,443
# ```

# Convert the `public` output with:
# python cloudmapper.py public --account demo | jq -r '.hostname+":"+.ports' | sort | uniq > /tmp/host_ports.txt
# ./utils/nmap_scan.sh /tmp/host_ports.txt 

cat $1 | while read line;do IP=$(echo -n $line | awk -F\: '{ print $1 }'); PLIST=$(echo -n $line | awk -F\: '{ print $2 }'); nmap -sV -oG - -PN -p$PLIST $IP;done
