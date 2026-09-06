# Changelog

All notable changes to CasaOS UI are documented here.

## [0.4.36] - 2026-09-06

### Changed

- The dashboard is fully translated into French: the seventy-six strings of the
  system package updates, merged storage, the Compose editor, share accounts and
  Time Machine shares that were still shown in English.

## [0.4.35] - 2026-09-05

### Fixed

- The "App launching" row of the settings panel has the shape of its
  neighbours: an icon, a title line and the panel's spacing, where it sat as a
  bare label and button against the edge. Its description line shows the
  current mode.

### Changed

- The settings panel and the App launching dialog are translated into French.
- The CI and release workflows run on Node 24.

## [0.4.34] - 2026-09-05

### Fixed

- The update dialog shows the upgrade log as text. It used to feed the log to
  the Markdown renderer, which merged its lines into paragraphs and left the
  installer's colour codes in view. The log now follows its own tail, and a read
  that fails while the services restart is ignored instead of becoming an
  unhandled rejection.

## [0.4.33] - 2026-09-05

Groundwork for the move to Vue 3, all of it landing on Vue 2 so that the day the
framework changes carries as little as possible.

### Fixed

- The production build was built in development mode. `.env.production` set
  `NODE_ENV=prod` while the build tool tests for `production`, so every release
  shipped Vue's development branches: warnings, the devtools hook and the
  unminified paths. The emitted JavaScript drops from 31.3 MB to 13.0 MB.
- The build no longer writes the build machine's entire environment into the
  bundle. `vue.config.js` replaced the tool's own definitions with
  `JSON.stringify(process.env)`, so the last local build carried the user name
  and home directory of whoever ran it, and a CI build would carry the runner's.
- An app's memory limit that is not one of the slider's marks (a compose file
  edited by hand) no longer displays as 256 MB. The slider snaps to the nearest
  mark instead of falling back to the first.
- The rightmost tooltip of the contact bar no longer hangs off the right edge of
  the window.
- Leaving the drop page within a second of opening it no longer throws.

### Changed

- Seven abandoned dependencies were replaced by their equivalent in code we own:
  the socket plugin, the tooltips, the memory slider, the breakpoint mixin, the
  animation directive, the share links and the CodeMirror wrapper. Eight more
  were removed as unused. Two visible differences came with that, both
  deliberate: the "start sharing your files" hint now stays until its close
  button is used rather than disappearing on any click elsewhere, which is also
  the only way it stops coming back.
- The event bus is a plain emitter rather than a Vue instance, with the same
  `$on`/`$off`/`$emit` surface and each subscriber still isolated from a
  neighbour that throws.

### Added

- Component mount tests. The suite was 37 pure-function tests for 123 components;
  it now also mounts the shell and the highest-traffic surfaces and fails on any
  Vue warning, which is what the framework change will be checked against.

## [0.4.32] - 2026-09-04

### Added

- A shared folder can be marked as a Time Machine destination, in the Share Folder dialog and on an existing share. Macs on the network then offer it as a backup disk ([CasaOS #1030](https://github.com/IceWhaleTech/CasaOS/issues/1030)).

### Fixed

- The App Store no longer stops rendering when no category has apps — with only a third-party store registered the backend answers a single "All" category with a count of 0, which the menu filter dropped, leaving nothing selected ([CasaOS #2537](https://github.com/IceWhaleTech/CasaOS/issues/2537)).

## [0.4.31] - 2026-09-04

First release of the inkly distribution, cut from alvins82's v0.4.30.

### Added

- Edit the Compose file of an installed app from its settings, with server-side validation before apply ([CasaOS-UI #18](https://github.com/alvins82/CasaOS-UI/pull/18)).
- Choose whether apps open inside CasaOS or in a new tab, with a per-app exception list; the default matches the previous behaviour ([CasaOS-UI #19](https://github.com/alvins82/CasaOS-UI/pull/19)).
- Require an account on a shared folder, manage share accounts, and change who can open an existing share ([CasaOS-UI #20](https://github.com/alvins82/CasaOS-UI/pull/20)).

### Changed

- The release workflow builds and publishes the dashboard tarball with the default token; the previous one needed the `@icewhale` npm scope and IceWhale's object storage. CI now runs on pull requests and on `main` instead of skipping on every fork.

### Fixed

- `vitest` is a dependency, so `pnpm test` runs; it had been declared in `package.json` since December 2024 without ever being installed ([CasaOS-UI #17](https://github.com/alvins82/CasaOS-UI/pull/17)).

### Security

- The dashboard no longer sends `baseinfo.conf` — an MD5 of the MAC address, the version and the UI language — to the feed host on every load. The device id stays on the box.

### Verification

- 34 tests pass with `pnpm exec vitest run`; production build completed with `pnpm build`.

## [0.4.30] - 2026-08-15

### Changed

- Keep restart polling and page reload behavior while leaving the shutdown modal in place after a successful shutdown request ([CasaOS-UI #15](https://github.com/alvins82/CasaOS-UI/pull/15)).

### Fixed

- Surface power API failures in the dashboard instead of silently reloading after a failed shutdown or restart ([CasaOS-UI #15](https://github.com/alvins82/CasaOS-UI/pull/15)).

### Verification

- Production build completed with `pnpm exec vue-cli-service build`.

## [0.4.29] - 2026-08-13

### Added

- Open the Files app in an App Store-style dialog on desktop while retaining edge-to-edge behavior on smaller screens ([CasaOS-UI #11](https://github.com/alvins82/CasaOS-UI/pull/11)).
- Add a Rename action for non-system, non-merged storage volumes and refresh Storage Manager after a successful rename ([CasaOS-UI #14](https://github.com/alvins82/CasaOS-UI/pull/14)).

### Changed

- Keep the dashboard sidebar in normal document flow so the dashboard has one scroll surface and lower widgets remain reachable ([CasaOS-UI #12](https://github.com/alvins82/CasaOS-UI/pull/12)).

### Fixed

- Use the CasaOS icon font's `eye-outline` and `eye-off-outline` glyphs for the hidden-files toggle ([CasaOS-UI #13](https://github.com/alvins82/CasaOS-UI/pull/13)).

### Verification

- Production build completed with `pnpm build`.

## [0.4.28] - 2026-08-13

### Added

- Add a Settings flow for checking and applying Debian-family system package updates, including package review, confirmation, live logs, reboot status, and completion reconciliation ([CasaOS-UI #10](https://github.com/alvins82/CasaOS-UI/pull/10)).

### Changed

- Add a persistent Show Search Bar setting and let the sidebar grow with its contents instead of clipping lower widgets behind a fixed scrollbar ([CasaOS-UI #8](https://github.com/alvins82/CasaOS-UI/pull/8)).
- Show the physical parent disk model and path alongside storage filesystems ([CasaOS-UI #9](https://github.com/alvins82/CasaOS-UI/pull/9)).

### Fixed

- Use actual filesystem usage for storage bars and display an em dash for unmounted filesystems instead of misleading `NaN` values ([CasaOS-UI #9](https://github.com/alvins82/CasaOS-UI/pull/9)).

### Verification

- Production build completed with `pnpm build`.

## [0.4.27] - 2026-08-12

### Fixed

- Keep system storage out of merged storage sources.
- Preserve system AppData at `/DATA/AppData` while `/DATA` uses external storage.
- Preserve disconnected merged sources and provide an explicit merged-storage removal flow.

### Verification

- Production build completed with `pnpm build`.

## [0.4.26] - 2026-08-12

### Fixed

- Open qBittorrent in a top-level browser tab instead of the in-app iframe. Its WebUI does not initialize correctly when embedded in CasaOS because it relies on cross-origin `window.parent` behavior.

### Verification

- Production build completed with `pnpm build`.

## [0.4.25] - 2026-08-12

### Added

- Dedicated merged-storage tab for merged disks.
- In-page app iframe dialogs with the App Store modal layout, backdrop, header, close button, transition, and responsive mobile behavior.
