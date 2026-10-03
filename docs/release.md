# Releases

| Trigger | Version | npm tag | GitHub release |
| --- | --- | --- | --- |
| Push or merge to `main` | `0.0.1-beta.<run-number>` | `beta` | Prerelease |
| Run **Release** manually from `main` | Exact `package.json` version, such as `0.0.1` | `latest` | Stable |

`package.json` holds the intended stable version. Beta numbering comes from the Release workflow's run number; rerunning a failed run keeps the same number. Beta publication never moves npm's `latest` tag. After a stable release, bump the package version to the next intended release before continuing development.

The PR workflow checks changes without publishing. The Release workflow runs the same checks on `main` before publishing: frozen dependency installation, high/critical vulnerability audit, lint, types, tests, build, and comparison with committed `lib/`. Commit rebuilt bundles whenever the client source changes.

## One-time setup

1. Create the **public** GitHub repository `qiweiii/dsh-brand-studio` and push `main`, including these workflows and prebuilt `lib/` files. Publishing remains disabled until the last setup step; CI still runs.
2. Sign in to npm with your own account, enable 2FA, and confirm that `dsh-brand-studio` is available or owned by you. Make the first publication using the commands below. Trusted-publisher configuration lives on an existing npm package, so establish the package first.
3. In GitHub **Settings → Environments**, create an environment named **`npm`**. Restrict its deployment branches to **`main`**. No required reviewer is needed for automatic betas; stable releases are initiated manually.
4. On npm, open **dsh-brand-studio → Settings → Trusted publishing → Add trusted publisher → GitHub Actions** and enter:

   | Field | Value |
   | --- | --- |
   | Organization or user | `qiweiii` |
   | Repository | `dsh-brand-studio` |
   | Workflow filename | `release.yml` |
   | Environment name | `npm` |
   | Allowed actions | Enable **direct publishing with `npm publish`** |

   Use the filename only, not `.github/workflows/release.yml`. Dist-tag management permission is unnecessary: each publication supplies its own `--tag`.
5. In GitHub **Settings → Secrets and variables → Actions → Variables**, add **`RELEASE_ENABLED`** with the value **`true`**. The next push to `main` publishes a beta after checks pass.

No manually created GitHub or npm token is needed. GitHub provides the release's `GITHUB_TOKEN`; npm exchanges the workflow's OIDC identity for short-lived publishing credentials. The workflow has no `NPM_TOKEN` secret or token fallback. See [npm's trusted-publishing setup](https://docs.npmjs.com/trusted-publishers/).

### First npm publication

Run these commands yourself from the repository after reviewing the package. Use Node 24 and npm 11.5.1 or newer. The preparation command packs the committed artifacts without installing dependencies or running lifecycle scripts; it temporarily changes the archive's version and restores `package.json`.

```sh
npm login
RELEASE_CHANNEL=beta RELEASE_NUMBER=0 node scripts/release.mjs prepare
npm publish .local/release/dsh-brand-studio-0.0.1-beta.0.tgz --tag beta --access public --ignore-scripts
```

The example uses the current `0.0.1` base version. If it has changed, use the tarball path printed by `prepare`. This reserves the package under your npm account without declaring the first build stable. Then configure trusted publishing and enable releases as described above.

After the first successful Actions publication, npm recommends **Publishing access → Require two-factor authentication and disallow tokens**. Trusted publishing continues to work with that setting. [npm publishing-access guidance](https://docs.npmjs.com/trusted-publishers/).

### Token expiration

There is no npm publishing token to rotate in this setup. If you use a granular token for another tool, create it under npm **Profile → Access Tokens → Generate New Token**, restrict its packages and permissions, choose an expiration, and replace/revoke it before expiry. Do not add it to this workflow. [npm token creation](https://docs.npmjs.com/creating-and-viewing-access-tokens/).

## Stable release

1. Set the intended stable version in `package.json`, for example `0.1.0`. Keep it as plain `x.y.z`, without a prerelease suffix.
2. Rebuild and review the plugin, commit any changed `lib/` artifacts, and merge/push to `main`.
3. Open **GitHub → Actions → Release → Run workflow**, choose **main**, and enter the exact version from `package.json`.

The workflow checks the source, publishes that version to npm's `latest` tag, and creates a stable GitHub release with generated notes and the npm `.tgz` attached. Beta releases get the `beta` tag and GitHub's prerelease flag. npm's tagging behavior is documented in [distribution tags](https://docs.npmjs.com/adding-dist-tags-to-packages/).

Consumers enter `dsh-brand-studio` for stable npm releases or `dsh-brand-studio@beta` to opt into betas. GitHub release tags identify the original source commit; the attached beta tarball contains the generated prerelease version, while source `package.json` keeps the intended stable version. Prefer npm's beta tag when testing a numbered beta package.

## Permissions and recovery

Actions are pinned to verified commit SHAs from GitHub's `actions/checkout`, `actions/setup-node`, and pnpm's `action-setup` repositories. Review these pins before updating them. Verification has only repository read permission and receives no publishing credentials. The separate publish job has repository write and OIDC permissions, installs no dependencies, and packs only the checked prebuilt files. Caching and install/publish lifecycle scripts are disabled.

GitHub can supersede older pending beta runs when pushes arrive faster than releases finish; the latest queued push remains eligible. Stable dispatches use a separate concurrency group.

If npm succeeds but the GitHub release fails, rerun the failed run. The script reuses an already-published npm version only when its archive integrity matches, then completes the GitHub release. If a stable version contains different contents, bump the version; npm versions are immutable. Network/authentication failures stop the release rather than being treated as a missing package.

For authentication failures, check the npm publisher's owner/repository/workflow/environment fields, its direct-publish permission, the `npm` environment's branch restriction, and `RELEASE_ENABLED`. The publish script requires npm 11.5.1+. The workflow uses a GitHub-hosted Ubuntu runner with Node 24. No remote settings or publication are performed by adding these files.
