# Insight NG

[![Get the add-on for Firefox](docs/get-the-addon.svg)](https://addons.mozilla.org/firefox/addon/insight-ng/)

See [Releases](https://github.com/probecat/firefox-insight/releases) for additional signed builds.

## Why

Firefox has many website blocker add-ons, but I wanted one that simply tracks my time with minimal runtime overhead. *Insight by Freedom* was the simplest option I came across, but it hasn't been updated since 2020, so this add-on reworks it.

There's no point in reimplementing what other add-ons already do well. So I don't plan to rework rest of the Freedom suite (Pause, Limit, Block). I recommend proginosko's excellent [LeechBlockNG](https://github.com/proginosko/LeechBlockNG). It doesn't track time, so Insight NG works well as its companion.

## Design

Insight NG tracks how much time you spend on each website and shows it as a daily, weekly, or custom-range report. Everything stays in your browser's local storage; the add-on makes no network requests. Click the toolbar icon to open the report. Time counts only while the browser window is focused and you are active, or while the active tab is playing audio.

## Changes

- **Low footprint:** 99% smaller than the original.
- **Zero bloat:** removed third-party libraries, analytics, error reporting, "leave a rating" pitch, and uninstall survey.
- **Fewer permissions:** "Access your data for all websites" is requested only if you turn on the timer overlay.
- **Conveniences:** dark theme, simpler controls, and bug fixes.

## License

[MIT](LICENSE)

## Disclaimer

Not created by, affiliated with, or supported by Freedom.
