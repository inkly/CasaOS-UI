# Changelog

All notable changes to CasaOS UI are documented here.

## [Unreleased]

### Fixed

- The QR code on the two-factor enrolment screen rendered as an unscannable
  192x28 band. The account panel is mounted inside the top bar's dropdown, so
  Bulma's `.navbar-item img { max-height: 1.75rem }` clamped the image height
  while `width="192"` held the width: the QR is now capped-free and square, and
  it is drawn with the 4-module quiet zone the QR spec asks for.

## [0.4.41] - 2026-09-06

A disk without SMART is no longer shown as damaged, and a machine without sensors shows no CPU wattage or temperature.

### Fixed

- On a virtual machine the storage widget tagged the system disk "Damaged"
  while the Storage manager called the same disk healthy: smartctl answers
  for a QEMU disk without any `smart_status`, and LocalStorage read that
  absence as a failure. LocalStorage now sends `smart_status` per disk
  ("passed", "failed" or "unavailable"); the widget and the Storage
  manager's Disk tab both follow it, showing "No SMART data" / "N/A" where
  there is none, and fall back to the `health` Boolean of an older
  LocalStorage.
- The System Status widget printed "0.0W / 0°C" under the CPU dial of a
  machine without a power counter or a thermal zone; the readout is gone
  when neither is available.

## [0.4.40] - 2026-09-06

The contact bar and the app installer point at this distribution, and the news feed from the upstream blog is gone.

### Removed

- The contact bar's Discord link, in-app feedback form and share dialog.
  The feedback form collected a title and a description, appended the
  output of the debug-info endpoint and the browser name and version, and
  opened a prefilled new issue on github.com/IceWhaleTech/CasaOS in a new
  tab; nothing was posted from the page itself. The share dialog offered
  Facebook, Twitter and Reddit buttons for a fixed CasaOS blurb. The form
  and the dialog reported to the message bus on open (connect_feedback,
  connect_sharecasaos), the two links on click (connect_discord,
  connect_github); those events are gone with them, as is the
  browser-info dependency only the form used. The device id the feed
  used to read from baseinfo.conf has no reader left, so its store
  mutation goes too.
- The news feed from the upstream blog. The brand bar fetched an RSS feed
  from blog-casaos.zimaspace.com and scrolled the latest posts next to the
  logo, behind a "Show news feed from CasaOS Blog" switch in the settings
  menu and a consent dialog shown once after the first login. The switch,
  both dialogs, the rss_switch field of the dashboard settings, the store
  flag, the two message bus events (connect_news, dashboardsetting_news)
  and the rss-to-json dependency are removed; nothing in the dashboard
  contacts that blog any more. Fourteen locale keys those features alone
  used are dropped from the 31 language files.

### Changed

- The "In development" button of the smart-home block and the AutoFill
  hint of the app installer pointed at the upstream Discord; they point
  at the issues of inkly/CasaOS now.
- Two links remain in the contact bar: the feedback icon, "Report an
  issue", opens https://github.com/inkly/CasaOS/issues, and the GitHub
  icon, "Visit our GitHub", opens https://github.com/inkly/CasaOS, both in
  a new tab with rel="noopener".

### Fixed

- The rule that anchors the contact bar's last tooltip inside the window
  selected `a:last-child .b-tooltip`, but Buefy renders the anchor inside
  the tooltip rather than around it, so the rule never matched. It now
  selects the last tooltip, which is the one the GitHub link carries.

## [0.4.39] - 2026-09-06

### Fixed

- After an update the user signed in on the new services and was thrown back
  to the login page a second or two later. The update dialog signed out
  through the router, whose guard awaits an API call before it navigates;
  started while the services restarted, that call settled only after the
  next login, and the guard then removed the fresh tokens. The upgrade
  rotates the token keys, so the session is over either way: the dialog now
  clears it locally and reloads the page - into the UI just installed - once
  the backend answers, or after two minutes regardless; each probe is given
  three seconds, and log responses still in flight start no second reload.

## [0.4.38] - 2026-09-06

Two-factor authentication, an Environment tab per app, a lint gate, and four dark-theme follow-ups.

### Added

- An Environment tab in the settings of an installed app, beside Settings and
  Compose, edits the app's `.env` file. The file is fetched the first time the
  tab opens, and a read that fails shows the server's message inside the tab.
  Before Apply, the editor checks locally that every line is blank, a `#`
  comment or a key line as compose-go's dotenv parser takes one — `KEY=`,
  `KEY:`, a bare `KEY`, an `export` prefix, names with `.`, `-`, `[` and `]` —
  and names the first line that is none of these. Everything after the `=`,
  the quoting, and the keys CasaOS sets itself (TZ, PUID, PGID) are checked by
  the server, which is asked for a dry run before the real apply; its
  rejection is shown under the editor and the real apply is not sent.
  Applying an empty file deletes `.env`. Applying re-creates the app, so the
  panel closes as it does for Compose, and leaving the Compose or the
  Environment tab with unapplied changes asks before discarding them. The
  Compose tab's notice now says that values defined in the app's `.env` are
  kept as `${VAR}` and that only the other environment values are shown
  resolved. The two `.env` requests bypass the generated client: the read
  takes the body as text, so a file that is only `123` is not parsed as a
  number, and the write goes out as `text/plain`, so an empty file reaches the
  server as nothing rather than as `""` — a request retried after a token
  refresh now keeps its own headers instead of falling back to the JSON
  default.
- Two-factor authentication. When the server answers a login with the
  two-factor status, the login page swaps the password form for a code step:
  the 6-digit code from an authenticator app, or a recovery code through the
  link under the field, with a Back link to the password step. The pre-auth
  token the server hands back is held in the page's component only — nothing
  is written to local storage until the code is verified, and the session is
  then stored by the same path a password login uses. A pre-auth token the
  server rejects, or one past its expiry, returns to the password step with a
  message; a wrong code clears the field and stays. In the account panel a new
  "Two-factor authentication" row shows On or Off and opens the enrolment: the
  password, then the QR code and the key as text with a Copy button, then the
  code from the app to enable it, then the recovery codes, shown once with a
  Copy button. Turning it off asks for the password or a code from the app,
  one or the other; every error stays under its field. The QR code is drawn in
  the browser by the new dependency `qrcode` 1.5.4, imported lazily by the
  enrolment screen, so it is a chunk of its own that the login and home
  bundles do not carry. The strings are in English and French.

### Changed

- ESLint is a CI gate. `pnpm lint` runs `eslint .` instead of
  `vue-cli-service lint`, the `.eslintrc.js` that ESLint 8 with a flat config
  never loaded is removed, and the ci workflow runs the lint before the tests
  and the build, so a pull request with a lint error fails. The lint had been
  red across the tree since the Vue 3 migration (39 564 errors) because
  @antfu/eslint-config's defaults, 2-space and script-first, met a
  tab-indented, template-first tree. The flat config now follows what the
  tree does, each option chosen by counting its violations with ESLint and
  keeping the one with fewer: tabs, single quotes, no semicolons, trailing
  commas, 1tbs braces, template before script; the Vue rule set is the Vue 3
  one. One `eslint --fix --fix-type layout` pass then reformatted 204 files —
  indentation, quotes, semicolons, commas, bracket placement, blank lines —
  and the production build before and after, with named ids and mangling
  disabled so that only the source-dependent hashes had to be normalised, is
  byte-identical for 369 of the 370 emitted files; the 370th is the static
  `public/js/custom.js`, which gained a final newline. The triage of what the
  layout pass left ran the suggestion and problem autofixes (prefer-const,
  object-shorthand, prefer-template, import order, unused imports, and the
  rest named in the commit), then by hand dropped unused catch bindings and
  callback parameters, dead variables, unused `ref` attributes and stale
  eslint-disable comments, and made five changes worth naming:
  `InputGroup.vue` declares the `emit` its computed setter called without
  declaring it; the find() callback of `ExternalLinkPanel.vue` returns false
  on the no-match path; the two Object.keys().map() loops of
  `ComposeConfig.vue` become forEach; the port/IP regex of the validation
  plugin uses non-capturing groups; the mock server's readFile callback
  answers the request on error instead of rendering undefined. What is left
  for a human — `==` comparisons, console.log calls, a prop written from a
  child, event and prop name casing — stays visible as warnings in a named
  config block, not turned off. At the gate: 0 errors, 472 warnings.

### Fixed

- The network graph was empty: apexcharts 4 rejects a chart created before its
  first sample, where apexcharts 3 tolerated it. The chart now mounts with the
  first sample, and Vue 3's reactivity feeds it - the Vue 2-era manual redraw
  is gone with the double render it caused every second.
- The app card menu had its entries centred, and the file browser's menus lost
  their styling too: Buefy 3.1 no longer copies a dropdown's class onto the
  menu it moves under `<body>` for `append-to-body`, so every class-scoped menu
  style silently fell back to Bulma's defaults. A small plugin puts the classes
  back after each rebuild.
- The Appearance list in the settings panel was unreadable in the dark theme:
  Chromium paints the native list on the select's own background, which is
  transparent there, so it came out white under light text.
- After a CasaOS update the browser kept running the previous UI until a
  manual reload - with the system in dark mode, the App Store and Files stayed
  light. The update dialog now reloads the page once it has signed out.
- A login attempted while the server could not be reached showed no message:
  the error path read the message off a response that did not exist and threw
  instead. It now falls back to the request error's own message.

## [0.4.37] - 2026-09-06

The dashboard runs on Vue 3, and it has a dark theme.

### Added

- A dark theme. Appearance is a new row in the settings panel — light, dark,
  or follow the system, which is the default when nothing has been chosen. The
  choice is remembered in the browser and applied before the first paint, so
  there is no flash, and the login and welcome pages honour it too. The
  dashboard's glass cards and widgets were already dark and are identical in
  both themes; what changes is the chrome laid over them — the top bar, the
  modals, dropdowns, forms, toasts, the file browser, the App Store, storage
  ([CasaOS #938](https://github.com/IceWhaleTech/CasaOS/issues/938)).

### Changed

- Vue 2.7 → Vue 3.5, Buefy 0.9 → 3.1, Bulma 0.9 → 1.0, vee-validate 3 → 4,
  vue-router 3 → 4, vuex 3 → 4, vue-i18n 8 → 9, vue-awesome-swiper → Swiper's
  own Vue integration. Vue 2 had been end-of-life since December 2023; the
  dashboard keeps the same components and the same look. The light theme was
  compared declaration by declaration against the previous release and did
  not move, apart from Swiper's own stylesheet.

### Fixed

- Every link had darkened to #0a52bd with Bulma 1's contrast defaults; it is
  the palette's blue again. The focus ring of switches and the placeholder of
  empty selects had vanished — Buefy 3.1 writes them in a form browsers drop.
- The disk summary in the storage widget showed only the disk name in 28
  languages: vue-i18n 9 reads `|` as a plural separator.
- The port field of the app installer rejected every port after the
  validation rules moved API. Its test now checks both accepted and rejected
  inputs.

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
