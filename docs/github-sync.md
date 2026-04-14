# GitHub Sync (DEV_MODE)

Link a LearnPack package to a GitHub repository and sync lesson content in both directions. Available only in **DEV_MODE** and **creator** mode.

## Setup

Add to `learnpack-cli/.env`:

```env
GITHUB_USERNAME=your-github-username
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

Create the token at: GitHub → Settings → Developer settings → Personal access tokens → scope: `repo`.

## Where to Find It

In the sidebar, under "Sync Syllabus (Dev)", when in creator mode with DEV_MODE enabled.

## Actions

| Action | When to Use |
|--------|-------------|
| **Create repo in GitHub** | First time: creates a new repo with the full package content |
| **Push Bucket → GitHub** | After creating/removing lessons in the IDE, or any structural change |
| **Check changes in GitHub** | See if there are edits in the repo since last sync |
| **Pull GitHub → Bucket** | Bring changes from the repo into the package |

## Workflow

1. **Create a lesson in the IDE** → Push → Repo updated
2. **Edit README or code in GitHub** → Check changes → Pull → Bucket updated
3. **Delete a lesson in the IDE** → Push → Repo updated
4. **Add an image in GitHub** (in `.learn/assets/`) → Pull → Image in bucket

## Adding images from GitHub

1. Upload the image to `.learn/assets/` in the repo.
2. In the lesson README, add the image with this format:

   `![GENERATING: Description of the image](/.learn/assets/image-file-name.png)`

   The `GENERATING: ` prefix before the description is required for correct frontend rendering.
3. Pull from GitHub → the image and the lesson content are synced to the bucket together.

## What Syncs (Pull: GitHub → Bucket)

- **Lesson content**: Only *modified* files of *existing* lessons (e.g. README.md)
- **Images**: All changes in `.learn/assets/` (add, modify, remove, rename)

## What Does NOT Sync (Pull)

- **Structural files**: `learn.json`, `.learn/config.json`, `.learn/initialSyllabus.json`, `.learn/sidebar.json`, `.learn/memory_bank.txt`
- **New lessons** created directly in GitHub
- **Structural changes** inside lessons: adding/removing/renaming files within a lesson folder

These must be done from the IDE. Changes in GitHub to these files are reported as "skipped".

## Golden Rule

**The IDE/bucket is the source of truth** for structure. Create and delete lessons in the IDE, then Push. Use GitHub to edit content, then Pull.
