# Insight NG

[![Build][build-image]][build-url] [![Version][version-image]][release-url] [![License][license-image]][license-url]

[![Get the add-on for Firefox](docs/get-the-addon.svg)](https://addons.mozilla.org/firefox/addon/insight-ng/)

See [Releases](https://github.com/probecat/firefox-insight/releases) for additional signed builds.

## Design

Insight NG tracks how much time you spend on each website and shows it as a daily, weekly, or custom-range report. Everything stays in your browser's local storage; the add-on makes no network requests. Click the toolbar icon to open the report. Time counts only while the browser window is focused and you are active, or while the active tab is playing audio.

## Differences from Insight

Insight NG is a Manifest V3 rework of *Insight by Freedom*, which has had no update since 2020.

- **Low footprint:** 99% smaller than the original.
- **Zero bloat:** removed third-party libraries, analytics, error reporting, "leave a rating" pitch, and uninstall survey.
- **Fewer permissions:** "Access your data for all websites" is requested only if you turn on the timer overlay.
- **Conveniences:** dark theme, simpler controls, and bug fixes.

## License

[MIT](LICENSE)

## Disclaimer

Not created by, affiliated with, or supported by Freedom.

[build-url]: https://github.com/probecat/firefox-insight/actions/workflows/ci.yml
[build-image]: https://img.shields.io/github/actions/workflow/status/probecat/firefox-insight/ci.yml?branch=main
[release-url]: https://github.com/probecat/firefox-insight/releases/latest
[version-image]: https://img.shields.io/github/v/release/probecat/firefox-insight?label=version
[license-url]: LICENSE
[license-image]: https://img.shields.io/github/license/probecat/firefox-insight
