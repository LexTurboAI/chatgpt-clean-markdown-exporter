// ==UserScript==
// @name         ChatGPT Clean Markdown Exporter
// @name:pl      ChatGPT Czysty Eksporter Markdown
// @namespace    https://github.com/LexTurboAI/phoenix-markdown-toolkit
// @version      0.1.0
// @description  Export a single ChatGPT conversation as clean, text-first Markdown. No Base64 images, no data URIs, no heavy inline media. Part of the Phoenix Markdown Toolkit.
// @description:pl Eksport pojedynczej rozmowy ChatGPT do czystego Markdown. Bez obrazow Base64, bez data URI, bez ciezkich mediow. Czesc Phoenix Markdown Toolkit.
// @author       Lex Turbo / lexturboai
// @license      MIT
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @noframes
// ==/UserScript==

/*
 * Phoenix Markdown Toolkit - ChatGPT Clean Markdown Exporter
 *
 * Design goals (field mode / low friction):
 *  - Single conversation -> single small .md file.
 *  - NEVER fetches, embeds or converts images. No data:image, no base64,
 *    no sediment:// downloads, no <img> tags. Placeholders only.
 *  - Zero external dependencies. No JSZip, no html2canvas.
 *  - Works on desktop and mobile (Firefox + Tampermonkey on Android).
 *
 * Based on the public conversation JSON structure used by
 * pionxzh/chatgpt-exporter (MIT), reimplemented as a minimal standalone script.
 */

(function () {
    'use strict';

    const BASE = location.origin;
    const PLACEHOLDER = {
        userUpload: '[IMAGE REMOVED: user-upload]',
        generated: '[IMAGE REMOVED: generated-image]',
        unknownMedia: '[MEDIA REMOVED: unsupported]',
    };

    // ---------------------------------------------------------------- utils

    function sanitizeFileName(name) {
        return (name || 'ChatGPT Conversation')
            .replace(/[\\/:*?"<>|\n\r]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 100);
    }

    function dateStamp() {
        const d = new Date();
        const p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    }

    function downloadTextFile(fileName, text) {
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    // ------------------------------------------------------------- API auth

    async function getSession() {
        const res = await fetch(`${BASE}/api/auth/session`);
        if (!res.ok) throw new Error(`Session request failed: ${res.status}`);
        return res.json();
    }

    async function apiFetch(path, accessToken) {
        const res = await fetch(`${BASE}${path}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Authorization': `Bearer ${accessToken}`,
            },
        });
        if (!res.ok) throw new Error(`API request failed: ${res.status} ${res.statusText}`);
        return res.json();
    }

    function getChatIdFromUrl() {
        const m = location.pathname.match(/\/c\/([a-z0-9-]+)/i);
        return m ? m[1] : null;
    }

    // ------------------------------------------------- conversation walking

    function walkConversation(conversation) {
        // Walk from current_node up through parents, then reverse.
        const mapping = conversation.mapping || {};
        let nodeId = conversation.current_node
            || Object.values(mapping).find(n => !n.children || n.children.length === 0)?.id;
        const nodes = [];
        while (nodeId) {
            const node = mapping[nodeId];
            if (!node) break;
            nodes.push(node);
            nodeId = node.parent;
        }
        return nodes.reverse();
    }

    function shouldSkip(message) {
        if (!message || !message.content) return true;
        if (message.recipient && message.recipient !== 'all') return true;
        const ct = message.content.content_type;
        if (ct === 'thoughts' || ct === 'reasoning_recap') return true;
        if (message.metadata && message.metadata.is_visually_hidden_from_conversation) return true;
        if (message.author && message.author.role === 'tool') {
            // Keep tool output only when it carries generated images
            // (we replace them with placeholders, but the position is kept).
            const hasExecImages = ct === 'execution_output'
                && message.metadata
                && message.metadata.aggregate_result
                && Array.isArray(message.metadata.aggregate_result.messages)
                && message.metadata.aggregate_result.messages.some(m => m.message_type === 'image');
            const hasMmImages = ct === 'multimodal_text'
                && Array.isArray(message.content.parts)
                && message.content.parts.some(p => typeof p === 'object' && p && p.content_type === 'image_asset_pointer');
            if (!hasExecImages && !hasMmImages) return true;
        }
        return false;
    }

    function transformContent(message) {
        const content = message.content;
        const metadata = message.metadata || {};
        switch (content.content_type) {
            case 'text':
                return (content.parts || []).join('\n');
            case 'code':
                return 'Code:\n```\n' + (content.text || '') + '\n```';
            case 'execution_output': {
                const msgs = metadata.aggregate_result && metadata.aggregate_result.messages;
                if (Array.isArray(msgs) && msgs.some(m => m.message_type === 'image')) {
                    return msgs
                        .filter(m => m.message_type === 'image')
                        .map(() => PLACEHOLDER.generated)
                        .join('\n');
                }
                return 'Result:\n```\n' + (content.text || '') + '\n```';
            }
            case 'tether_quote':
                return '> ' + (content.title || content.text || '');
            case 'tether_browsing_display': {
                const list = metadata._cite_metadata && metadata._cite_metadata.metadata_list;
                if (Array.isArray(list) && list.length > 0) {
                    return list.map(x => `> [${x.title}](${x.url})`).join('\n');
                }
                return '';
            }
            case 'multimodal_text': {
                return (content.parts || []).map((part) => {
                    if (typeof part === 'string') return part;
                    if (!part || typeof part !== 'object') return null;
                    if (part.content_type === 'image_asset_pointer') return PLACEHOLDER.userUpload;
                    if (part.content_type === 'audio_transcription') return `[audio] ${part.text || ''}`;
                    if (part.content_type === 'audio_asset_pointer') return null;
                    if (part.content_type === 'real_time_user_audio_video_asset_pointer') return null;
                    return PLACEHOLDER.unknownMedia;
                }).filter(x => x !== null).join('\n');
            }
            default:
                return `[Unsupported content: ${content.content_type}]`;
        }
    }

    function authorLabel(message) {
        const role = message.author && message.author.role;
        if (role === 'user') return '#### You:';
        if (role === 'assistant') return '#### ChatGPT:';
        if (role === 'tool') return '#### Tool output:';
        return `#### ${role || 'Unknown'}:`;
    }

    function conversationToMarkdown(conversation) {
        const title = conversation.title || 'ChatGPT Conversation';
        const nodes = walkConversation(conversation);
        const blocks = [];

        for (const node of nodes) {
            const message = node.message;
            if (shouldSkip(message)) continue;
            const body = transformContent(message).trim();
            if (!body) continue;
            blocks.push(`${authorLabel(message)}\n${body}`);
        }

        const header = `# ${title}\n`;
        return header + '\n' + blocks.join('\n\n---\n\n') + '\n';
    }

    // ----------------------------------------------------------- main flow

    let busy = false;

    async function exportCleanMarkdown() {
        if (busy) return;
        busy = true;
        setButtonState('...');
        try {
            const chatId = getChatIdFromUrl();
            if (!chatId) {
                alert('Open a specific conversation first (URL should contain /c/...).');
                return;
            }
            const session = await getSession();
            const accessToken = session && session.accessToken;
            if (!accessToken) {
                alert('No access token. Are you logged in?');
                return;
            }
            const conversation = await apiFetch(`/backend-api/conversation/${chatId}`, accessToken);
            const markdown = conversationToMarkdown(conversation);
            const fileName = `ChatGPT-CLEAN-${sanitizeFileName(conversation.title)}-${dateStamp()}.md`;
            downloadTextFile(fileName, markdown);
            setButtonState('OK');
        }
        catch (err) {
            console.error('[Clean Exporter]', err);
            alert('Export failed: ' + err.message);
            setButtonState('ERR');
        }
        finally {
            busy = false;
            setTimeout(() => setButtonState('MD'), 3000);
        }
    }

    // ------------------------------------------------------------------ UI

    let buttonEl = null;

    function setButtonState(label) {
        if (buttonEl) buttonEl.textContent = label;
    }

    function injectButton() {
        if (document.getElementById('pmt-clean-md-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'pmt-clean-md-btn';
        btn.textContent = 'MD';
        btn.title = 'Export Clean Markdown (no images)';
        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '90px',
            right: '12px',
            zIndex: 99999,
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: '1px solid #555',
            background: '#1f6feb',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,.4)',
        });
        btn.addEventListener('click', exportCleanMarkdown);
        document.body.appendChild(btn);
        buttonEl = btn;
    }

    // Keep the button alive across SPA navigation.
    const observer = new MutationObserver(() => injectButton());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    injectButton();

    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('Export Clean Markdown', exportCleanMarkdown);
    }
})();
