# Insight NG

[![Build][build-image]][build-url] [![Version][version-image]][release-url]

[![Get the add-on for Firefox](docs/get-the-addon.svg)](https://addons.mozilla.org/firefox/addon/insight-ng/)

See [Releases](https://github.com/probecat/insight-ng/releases) for additional signed builds.

## Design

Insight NG tracks how much time you spend on each website and shows it as a daily, weekly, or custom-range report. Everything stays in your browser's local storage; the add-on makes no network requests. Time counts only while the browser window is focused and you are active, or while the active tab is playing audio.

It is a lightweight Manifest V3 rework of the abandoned Insight add-on, with no third-party libraries, analytics, or error reporting.

## Disclaimer

Not created by, affiliated with, or supported by Freedom.

[build-url]: https://github.com/probecat/insight-ng/actions/workflows/ci.yml
[build-image]: https://img.shields.io/github/actions/workflow/status/probecat/insight-ng/ci.yml?branch=main
[release-url]: https://github.com/probecat/insight-ng/releases/latest
[version-image]: https://img.shields.io/github/v/release/probecat/insight-ng?label=version
