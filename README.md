# ChatGPT Clean Markdown Exporter

Lightweight Tampermonkey/Violentmonkey userscript for exporting a single ChatGPT conversation as clean, text-first Markdown.

No embedded Base64 images. No `data:image` blobs. No `sediment://` image downloads. No heavy inline media.

Part of the broader LexTurboAI workflow, but published as a standalone tool.

## Why this exists

Long ChatGPT conversations can become difficult to export after UI changes, virtualization and media-heavy messages. Some exporters preserve images by embedding Base64 blobs directly inside Markdown. That can turn a mostly text conversation into a huge file that is hard to open on mobile, hard to process in Markdown editors and inconvenient for LLM-based knowledge workflows.

This userscript takes the opposite approach:

- keep the conversation text;
- keep a simple Markdown structure;
- replace user uploads and generated images with explicit placeholders;
- avoid external dependencies;
- work in field mode, including mobile Firefox + Tampermonkey on Android.

## Features

- Exports the currently opened ChatGPT conversation to Markdown.
- Adds a floating `MD` button on the ChatGPT page.
- Adds a Tampermonkey menu command: `Export Clean Markdown`.
- Uses simple conversation headers:

```markdown
#### You:
#### ChatGPT:
```

- Replaces uploaded images with:

```markdown
[IMAGE REMOVED: user-upload]
```

- Replaces generated images/tool images with:

```markdown
[IMAGE REMOVED: generated-image]
```

- Does not fetch image assets.
- Does not embed Base64.
- Does not use `html2canvas`.
- Does not use `JSZip`.
- Does not include external `@require` dependencies.

## Installation

1. Install Tampermonkey or Violentmonkey.
2. Open `ChatGPT-Clean-Markdown-Exporter.user.js`.
3. Install the userscript.
4. Open a specific ChatGPT conversation.
5. Click the floating `MD` button or use the userscript menu command.

## Output

The script downloads a file named like:

```text
ChatGPT-CLEAN-Conversation title-2026-07-05.md
```

The resulting Markdown is designed for:

- NotebookLM;
- Obsidian;
- Markor;
- Typora;
- Claude;
- Gemini;
- ChatGPT;
- other LLM and knowledge-base workflows.

## Safety model

The script is intentionally conservative:

- it does not send your conversation to any third-party service;
- it does not load external JavaScript dependencies;
- it only uses the active ChatGPT session to read the currently opened conversation;
- it downloads a local `.md` file through the browser;
- it removes heavy inline media instead of preserving it.

## Known limitations

- ChatGPT internal APIs and page structure may change.
- The script focuses on one opened conversation, not bulk export.
- It intentionally does not preserve images.
- Some unusual message types may be represented as placeholders.

## Related tool

If you already have bloated Markdown exports containing Base64 images, use Blob Exorcist from Phoenix Markdown Toolkit.

Clean Markdown Exporter prevents the problem at export time.
Blob Exorcist cleans files that are already bloated.

## Motto

> Ex chao Markdownico ordinem feci.  
> Facilius. Simplicius. Melius.

## License

MIT License.