# Development

Use **pnpm 12.5.1** and Node **22.18+ on the 22.x line**, or **24.11+**. Run commands from this repository.

## Dependencies

There are no regular runtime dependencies. DSH supplies React and its client services; our client bundle imports the host's React instance. The pinned DSH **0.2.0-rc.2** frontend embeds React/React DOM **18.3.1**, so the development React version matches it. Adopt new React APIs only when the supported host does.

Development tools are TypeScript, tsdown, and Biome, plus the pinned Cordis/DSH contracts. Installing this repository does not install the complete DSH application or need an upstream checkout. `autoInstallPeers: false` prevents the optional application peer from being installed automatically.

For a fresh checkout, review the lockfile and dependencies before installing:

```sh
pnpm audit --audit-level=high
pnpm install --frozen-lockfile --ignore-scripts
```

When deliberately changing dependencies, first resolve them with `pnpm install --lockfile-only --ignore-scripts`, inspect the lockfile and audit, then install the reviewed resolution. The workspace retains release-age, trust, and lifecycle-script restrictions. Inspect any policy rejection rather than bypassing it.

## Code map

| File | Responsibility |
| --- | --- |
| `package.json`, `cordis.patch.yml` | Package identity, DSH client declaration, and profile plugin row |
| `pnpm-workspace.yaml`, `pnpm-lock.yaml` | Installation policy and pinned dependency resolution |
| `tsdown.config.ts`, `build/web-platform.ts` | Host/browser bundles, loader wrapper, and host-provided module IDs |
| `src/index.ts` | Minimal host entry; no server routes or backend services |
| `src/client/index.tsx` | Registers slots, settings, locale, and lifecycle cleanup |
| `src/client/settings.ts`, `store.ts` | Validates stored data and coordinates persisted observable settings |
| `src/client/images.ts` | Checks image formats, rejects animation, and normalizes local images |
| `src/client/Brand.tsx` | Logo, name, badge, and wordmark components |
| `src/client/BrandingPanel.tsx` | Draft editor, preview, Apply/Cancel, and reset controls |
| `src/client/title.ts` | Optional title adapter with ownership and loop protection |
| `src/client/locales.ts`, `styles.ts` | English/Chinese strings and scoped, disposable styles |
| `tests/` | Settings/image/title checks and built-bundle slot/lifecycle verification |
| `lib/` | Prebuilt entry points for installation without a consumer-side build |

## Checks and build

```sh
pnpm typecheck
pnpm check
pnpm test
pnpm build
pnpm test:bundle
```

`test:bundle` needs the current build. It loads `lib/client.js` through the DSH module-loader contract and checks replacements, reset, and disposal against the real pinned slot registry with a simulated browser and stubbed host UI components; it does not render the settings panel. Unit tests cover storage errors, untrusted settings/images, and title ownership. These checks do not prove visual behavior or live Desktop compatibility.

## First local trial

Build first, then install the local repository yourself into the Web profile:

```sh
dsh plugin --profile web add "$PWD"
```

Alternatively, paste the repository's absolute path into **Plugins → Add plugin**. Restart `dsh web` and reload the PWA. Open **Settings → Branding**.

Try Text/Image modes, an empty badge, logo size and rounding, and the new-chat logo; check preview, Apply/Cancel, reload, sidebar collapse, and **Reset all → Apply**. Test optional titles while switching sessions. Disable the plugin and confirm the original branding returns. Installing the plugin is a manual step, not part of the build.

Settings are browser-local and keyed by origin. Different server addresses, devices, and Desktop have separate storage. Removing the plugin restores the official UI but retains saved branding for a later reinstall. **Reset all → Apply** clears custom values before removal.

Desktop uses a separate profile. Its current installation flow rejects the local repository path used above; test Desktop after publishing the prebuilt package to GitHub or npm, through its Plugins page. The regular `dsh plugin --profile desktop ...` command intentionally refuses to manage that profile. The current shared renderer accepts this bundle; live macOS/Windows checks remain necessary. Document titles may affect the native window title, but hidden captions may not display it. Installed app names, system icons, native menus, and the welcome screen are outside this plugin's scope.

## Distribution

Commit reviewed `lib/` artifacts with a release so GitHub installations do not require a build. There are no `prepare`, `postinstall`, or automatic compilation hooks. Update the artifacts after source changes, and record the DSH release actually verified.

GitHub installation and npm publication use the same package. Remove `private: true` when preparing an npm release, and review the package contents before publishing.
