# Super Styles

Write your own **CSS and JavaScript** for any website and have it applied automatically every time you visit.

[Get Super Styles from the Microsoft Edge Add-ons store](https://microsoftedge.microsoft.com/addons/detail/lgcjpmgldoadgddlhigdadahfdecchcp)

![Super Styles screenshot](img/Screenshot_1.png)

## Features

- **Per-site styles and scripts**: open the popup on a website and write CSS and JavaScript for it. They are saved per website (hostname) and applied automatically on every visit.
- **Live preview**: changes are applied to the page as you type.
- **Real code editors**: CodeMirror editors with syntax highlighting and line numbers for CSS and JavaScript.
- **Adjustable popup**: word wrap, popup width (450-780 px) and font size.
- **Private and local**: everything is stored on your device in the browser's extension storage. Nothing is sent anywhere.

## Usage

1. Open the website you want to change and click the Super Styles icon.
2. Write CSS in the top editor and/or JavaScript in the bottom one.
3. Close the popup. Your styles are saved and applied each time you open that website.

Works on `http` and `https` pages. Browser pages such as `edge://` and `chrome://` are not supported.

## Good to know

- Your JavaScript runs in the page as a `<script>` element, so websites with a strict Content Security Policy may block it. CSS is not affected.
- Updating from version 1.0 moves your earlier styles over automatically.
- Only run JavaScript you wrote or trust: it runs with the same access as the website's own scripts.

## Permissions

| Permission | Why |
|---|---|
| `tabs` | Read the address of the current tab to know which website your styles belong to |
| `storage` | Save your CSS, JavaScript and popup settings on your device |
| `scripting` | Insert your CSS and run your JavaScript in the page |
| `offscreen` | One-time import of styles saved by version 1.0 |
| `http://*/*`, `https://*/*` | Apply your styles on any website you choose |

## Privacy

No data is collected or sent anywhere. See the [privacy policy](privacy-policy.md).

## Development

There is no build step. Load the folder as an unpacked extension from `edge://extensions` (or `chrome://extensions`) with Developer mode on.
