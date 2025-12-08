# SuMail

SuMail is a Chrome extension that summarizes email text, analyzes sentiment, translates content, and drafts reply templates in one place.

## Features
- **Summarize**: Quickly summarize entered or selected email text in Korean.
- **Translate**: Translate source text to Korean (separate from summarize).
- **Sentiment**: Return a single dominant emotion with a brief rationale (Korean).
- **Reply templates**: Generate English reply templates from the summary; optional custom instruction (300 chars, email-related only).
- **Context menu**: Right-click to summarize or translate selected text; opens the popup and auto-runs.
- **Auto template**: Toggle auto generation during summarize.
- **State saving**: Preserve input, summary, emotion, translation, and template outputs in local storage.
- **Themes**: Light/Dark toggle.
- **Language**: Switch UI/output between Korean and English (settings panel).

## Installation
1. Download this repository locally.
2. In Chrome, open `chrome://extensions` and enable Developer Mode.
3. Click “Load unpacked” and select the project folder.
4. Open the popup (toolbar icon) and set your API key.

## Settings
- Open the settings panel from the popup (gear icon).
  - **API key**: Enter/save/delete your OpenAI API key.
  - **Model**: gpt-4o-mini (fixed).
  - **Theme**: Light/Dark toggle.
  - **Auto template**: Toggle automatic template generation on summarize.
  - **Language**: Switch UI/output language (Korean/English).

## Usage
- **Input**: Paste up to 2,000 characters; remaining count is shown.
- **Summarize**: Shows a summary; if auto-template is on, a reply template is generated too.
- **Translate**: Shows Korean translation.
- **Sentiment**: Shows one emotion label with rationale (Korean).
- **Template**: Enter a custom instruction (300 chars, must be reply-related) or rely on auto mode.
- **Context menu**: Select text → right-click → “Summarize selection” or “Translate selection (Korean)” to open the popup and run automatically.
- **Language**: Change UI/output language in settings; buttons and prompts adapt to the chosen language.

## Permissions
- `storage`: Save API key, settings, and state.
- `activeTab`, `contextMenus`, `scripting`: Context-menu summarize/translate and tab access.

## Icons/Branding
- Toolbar and preview icons: `SuMail_biglogo.png`.
- Popup logo: `SuMail_logo.png`.

## Dev Notes
- Theme, language, and settings use `chrome.storage.sync`; outputs use `chrome.storage.local`.
- Limits: summarize/translate input 2,000 chars; custom instruction 300 chars.
- Sentiment: Returns label and rationale only (no confidence score).
