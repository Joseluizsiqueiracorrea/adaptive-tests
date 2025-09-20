#!/bin/bash

# Close old Dependabot PRs so they'll be recreated with new config

echo "🤖 Closing old Dependabot PRs..."
echo "They will be recreated with the new configuration"
echo ""

# List all open Dependabot PRs
gh pr list --author "dependabot[bot]" --state open --json number,title --limit 50 | \
  jq -r '.[] | "PR #\(.number): \(.title)"'

echo ""
echo "Found $(gh pr list --author 'dependabot[bot]' --state open --json number | jq length) Dependabot PRs"
echo ""

read -p "Close all these PRs? They'll be recreated with better grouping. (y/n): " confirm

if [ "$confirm" = "y" ]; then
  # Close each PR with a comment
  gh pr list --author "dependabot[bot]" --state open --json number --limit 50 | \
    jq -r '.[].number' | \
    while read pr_number; do
      echo "Closing PR #$pr_number..."
      gh pr close $pr_number --comment "Closing to allow recreation with updated Dependabot configuration. This PR will be automatically recreated with better grouping and auto-merge settings."
    done

  echo ""
  echo "✅ All Dependabot PRs closed"
  echo ""
  echo "Next steps:"
  echo "1. Commit and push the new configuration files"
  echo "2. Wait for Dependabot to recreate PRs (usually within 24 hours)"
  echo "3. New PRs will auto-merge if they pass tests (patch/minor only)"
else
  echo "Cancelled"
fi