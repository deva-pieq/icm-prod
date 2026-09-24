---
description: Move files/directories to the Recycle Bin instead of hard-deleting. Usage: /recycle <path1> [path2 ...]
agent: build
---

Move the listed file/directory paths to the Recycle Bin so they can be restored later. NEVER permanently delete with `rm`, `del`, or `Remove-Item`.

Run the recycle script for each path:

```
powershell -NoProfile -ExecutionPolicy Bypass -File ".opencode/scripts/recycle.ps1" -Paths "<path1>","<path2>"
```

Then confirm each path was reported as `Recycled: <path>`. If any path is missing or the script reports a failure, tell the user — do NOT fall back to a hard delete.

Paths to recycle: $ARGUMENTS