#!/bin/bash

# Opens the PR that bumps the IDE version, the step before a latest release.
# master is protected, so the bump goes through a PR; once it is merged, run
# ./autoUpload.sh --tag latest from master.
#
# Usage: ./bump.sh "Message" [--minor | --major] [--dry-run]
#   Message:  what this release contains. It goes into the commit and the PR description.
#   --minor / --major: bump that part instead of the patch (default: 5.0.417 -> 5.0.418).
#   --dry-run: create the commit locally, show it and undo it; nothing is pushed.
#
# Steps: creates release/v<version> from origin/master, sets the version in package.json,
# commits, pushes and opens the PR with the GitHub CLI (gh). Then it returns to your branch.

# Everything runs inside main(): bash reads the whole function before running it, so
# switching branches (which can change this file on disk) does not break the script.
main() {
    usage() {
        echo "Usage: ./bump.sh \"Message\" [--minor | --major] [--dry-run]"
    }

    fail() {
        echo "Error: $1"
        exit 1
    }

    local PART="patch" MESSAGE="" DRY_RUN=false

    while [[ "$#" -gt 0 ]]; do
        case $1 in
            --minor) PART="minor"; shift ;;
            --major) PART="major"; shift ;;
            --patch) PART="patch"; shift ;;
            --dry-run) DRY_RUN=true; shift ;;
            -h|--help) usage; exit 0 ;;
            -*)
                echo "Error: unknown option '$1'."
                usage
                exit 1
                ;;
            *)
                [[ -n "$MESSAGE" ]] && fail "only one message is allowed. Quote it: ./bump.sh \"My message\""
                MESSAGE="$1"
                shift
                ;;
        esac
    done

    if [[ -z "${MESSAGE// }" ]]; then
        echo "Error: a message is required."
        usage
        exit 1
    fi

    if [ "$DRY_RUN" = false ]; then
        command -v gh >/dev/null 2>&1 || fail "the GitHub CLI (gh) is not installed: https://cli.github.com"
        gh auth status >/dev/null 2>&1 || fail "gh is not logged in. Run: gh auth login"
    fi

    # Switching branches needs a clean tree.
    [[ -z "$(git status --porcelain --untracked-files=no)" ]] || fail "there are uncommitted changes. Commit or stash them first."

    # Branch name, or the commit when HEAD is detached.
    local ORIGINAL
    ORIGINAL="$(git symbolic-ref -q --short HEAD || git rev-parse HEAD)"

    git fetch -q origin master || fail "could not fetch origin/master."

    # The new version is computed from origin/master, not from the local checkout.
    local CURRENT
    CURRENT="$(git show origin/master:package.json | node -e '
        let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => console.log(JSON.parse(s).version))
    ')"
    [[ "$CURRENT" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]] || fail "invalid version in origin/master package.json: '$CURRENT'"

    local MAJOR="${BASH_REMATCH[1]}" MINOR="${BASH_REMATCH[2]}" PATCH="${BASH_REMATCH[3]}" NEW
    case $PART in
        major) NEW="$((MAJOR + 1)).0.0" ;;
        minor) NEW="$MAJOR.$((MINOR + 1)).0" ;;
        patch) NEW="$MAJOR.$MINOR.$((PATCH + 1))" ;;
    esac

    local BRANCH="release/v$NEW"
    local TITLE="chore(release): set version to $NEW"

    git show-ref --verify --quiet "refs/heads/$BRANCH" && fail "the local branch $BRANCH already exists."
    [[ -z "$(git ls-remote --heads origin "$BRANCH")" ]] || fail "the branch $BRANCH already exists on origin. Is there an open release PR?"

    # Leaves the release branch and deletes it (used on failures and in --dry-run).
    undo() {
        git checkout -q -- package.json 2>/dev/null
        git checkout -q "$ORIGINAL"
        git branch -q -D "$BRANCH"
    }

    echo "Bumping $CURRENT -> $NEW on $BRANCH"

    git switch -q -c "$BRANCH" --no-track origin/master || fail "could not create $BRANCH."

    # Only the "version" line changes, so the rest of package.json keeps its formatting.
    if ! NEW_VERSION="$NEW" node -e '
        const fs = require("fs")
        const text = fs.readFileSync("package.json", "utf8")
        const updated = text.replace(/("version"\s*:\s*")[^"]*(")/, `$1${process.env.NEW_VERSION}$2`)
        if (updated === text) { console.error("version not found in package.json"); process.exit(1) }
        fs.writeFileSync("package.json", updated)
    '; then
        undo
        fail "could not update package.json."
    fi

    if ! git commit -q -am "$TITLE" -m "$MESSAGE"; then
        undo
        fail "git commit failed."
    fi

    if [ "$DRY_RUN" = true ]; then
        git show --stat --format='%n%s%n%n%b'
        git diff HEAD~1 HEAD -- package.json
        undo
        echo "Dry run: nothing was pushed and $BRANCH was deleted."
        exit 0
    fi

    git push -q -u origin "$BRANCH" || fail "git push failed. You are on $BRANCH; push it and open the PR by hand."

    local BODY
    BODY="$MESSAGE

---
After merging, publish it from master:

\`\`\`
git checkout master && git pull
./autoUpload.sh --tag latest
\`\`\`"

    local PR_URL
    PR_URL="$(gh pr create --base master --head "$BRANCH" --title "$TITLE" --body "$BODY")" \
        || fail "gh pr create failed. $BRANCH is pushed; open the PR by hand. You are on $BRANCH."

    git checkout -q "$ORIGINAL"

    echo ""
    echo "PR opened: $PR_URL"
    echo "After it is merged: git checkout master && git pull && ./autoUpload.sh --tag latest"
}

main "$@"
