#!/bin/sh
# Fail when .cursor/plans still has files in the tree that would merge.
# Plans stay in pull request commits; delete them before merge (ADR-0031).
set -eu

cd "$(git rev-parse --show-toplevel)"

if [ ! -d .cursor/plans ]; then
  exit 0
fi

files=$(find .cursor/plans -type f | sort)
if [ -z "$files" ]; then
  exit 0
fi

echo "Plan files are still in this tree. Delete them in a later commit before merge (ADR-0031):"
echo "$files"
exit 1
