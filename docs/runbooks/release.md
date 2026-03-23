# Release Runbook

## Distribution

The Capacitor SDK is published to **npm** as `@encorekit/capacitor`. This is the sole distribution channel.

Native dependencies are resolved automatically:
- **iOS**: CocoaPods resolves `EncoreKit` from the podspec
- **Android**: Gradle resolves `com.encorekit:encore` from Maven Central

## Release Methods

### 1. Local Release (Interactive)

```bash
make release
```

This runs `scripts/release/publish-release.sh` which:
1. Validates repo state (main branch, clean, synced, npm login)
2. Detects current version from git tags
3. Prompts for new version (supports `patch`, `minor`, `major` shortcuts)
4. Shows commits since last release
5. Confirms before proceeding
6. Updates `package.json`, builds, commits, tags, pushes
7. Publishes to npm with `--access public`

### 2. Automated Release (CI/CD)

1. Create a GitHub Release with tag `vX.Y.Z` on main
2. `.github/workflows/release.yml` triggers automatically:
   - Extracts version from tag
   - Updates `package.json`
   - Builds TypeScript
   - Commits version bump back to main
   - Publishes to npm with `--provenance --access public`

## Native SDK Version Management

Native SDK versions are pinned in `package.json`:

```json
"sdkVersions": {
  "ios": { "EncoreKit": "1.4.39" },
  "android": { "com.encorekit:encore": "1.4.38" }
}
```

These flow to:
- `EncoreCapacitorPlugin.podspec` → `s.dependency 'EncoreKit', ios_version`
- `android/build.gradle` → `implementation("com.encorekit:encore:${version}")`

### Bumping Native SDK Versions

**Automated** (recommended):
1. Go to Actions → "Bump Native SDK Version"
2. Select SDK (ios/android/both) and enter new version
3. Workflow creates branch and opens PR

**Manual**:
1. Edit `sdkVersions` in `package.json`
2. Commit, push, open PR
3. Verify with `make demo-ios` / `make demo-android`

## Required Secrets

| Secret | Purpose |
|:-------|:--------|
| `GITHUB_TOKEN` | Auto-provided, for PR creation and push |
| npm OIDC | Trusted publishing via `--provenance` |

## Post-Release Verification

```bash
npm install @encorekit/capacitor@<version>
```

Check https://www.npmjs.com/package/@encorekit/capacitor

## Testing the Published Package

### Dry run (before publishing)

Build a tarball of exactly what npm would publish, without actually publishing:

```bash
npm pack
```

Then point the example app at the tarball instead of the local source:

```json
// example/package.json — change:
"@encorekit/capacitor": "file:.."

// to:
"@encorekit/capacitor": "file:../encorekit-capacitor-0.1.0.tgz"
```

Run `make clean && make demo-ios` to test the full consumer experience.

### After publishing

Swap the example app to the real npm package:

```json
// example/package.json — change:
"@encorekit/capacitor": "file:.."

// to:
"@encorekit/capacitor": "0.1.0"
```

Run `make clean && make demo-ios` — this pulls from npm, exactly like a consumer.

**Remember** to revert `example/package.json` back to `"file:.."` after testing.
