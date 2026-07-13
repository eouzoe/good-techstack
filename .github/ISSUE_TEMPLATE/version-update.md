---
name: Version update report
about: Report an outdated dependency or tool version (no code changes required)
title: "chore(deps): bump <package> to <version>"
labels: dependencies
assignees: ""
---

<!--
  You do NOT need to install, build, or test anything.
  Run `just check-versions` (or `just check-env`) and paste the output.
  A maintainer applies the bump, syncs the lockfiles, runs the tests, and merges.
-->

## Package

<!-- exact npm identifier, e.g. @orpc/server — NOT the tool nickname -->

- Package:
- Kind: <!-- npm dependency / nixpkgs tool / devenv / other -->

## Versions

- **Project's current pinned version**: <!-- from bun.lock / flake.lock / devenv.yaml -->
- **Latest version on official source**: <!-- e.g. 4.12.30 -->
- **Source link**: <!-- official page you checked, e.g. https://www.npmjs.com/package/hono -->

## Local environment check

<!-- paste output of `just check-env` so maintainers know your toolchain state -->

```text
<paste `just check-env` output here>
```

## Notes

<!-- Is this a major / breaking bump? Any risk you noticed? Anything the maintainer should watch? -->
