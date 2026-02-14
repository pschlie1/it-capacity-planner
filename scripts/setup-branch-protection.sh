#!/bin/bash
# Set up GitHub Flow branch protection for main
# Run once: bash scripts/setup-branch-protection.sh

REPO="pschlie1/it-capacity-planner"

echo "Setting branch protection on main..."
gh api repos/$REPO/branches/main/protection \
  --method PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": true
  },
  "restrictions": null
}
EOF

echo "Done. Branch protection enabled on main."
echo "  - PRs required (no direct push)"
echo "  - CI must pass before merge"
echo "  - Stale reviews dismissed on new commits"
