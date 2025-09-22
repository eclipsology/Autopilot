(async () => {
  async function initializeAutopilot(command) {
    let API_KEY = '';
    if (command && command.startsWith('ap:')) {
      API_KEY = command.split('ap:')[1].trim();
    }
    if (!API_KEY) {
      console.log('Autopilot requires an API key. Run in console: ap:<your-api-key>');
      return;
    }

    // Fetch the script from GitHub
    try {
      const response = await fetch('https://raw.githubusercontent.com/eclipsology/Autopilot/refs/heads/main/script.js');
      if (!response.ok) throw new Error(`Failed to fetch Autopilot script: ${response.status}`);
      const scriptText = await response.text();
      // Execute the script in the current context with API_KEY
      const scriptFn = new Function('API_KEY', scriptText);
      scriptFn(API_KEY);
    } catch (error) {
      console.error(`Autopilot initialization error: ${error.message}`);
    }
  }

  // Check for global command or prompt for it
  if (window.autopilotCommand) {
    initializeAutopilot(window.autopilotCommand);
  } else {
    console.log('Autopilot: Run in console with ap:<your-api-key>');
  }
})();

const MODEL = "x-ai/grok-4-fast:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const BTN_ID = "autopilot-btn";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const mk = (tag, attrs = {}, kids = []) => {
  const n = document.createElement(tag);
  if (attrs.style) Object.assign(n.style, attrs.style);
  for (const [k, v] of Object.entries(attrs)) if (k !== "style") n[k] = v;
  kids.forEach(k => n.appendChild(k));
  return n;
};
function getSiteStructure() {
  let html = document.documentElement.outerHTML;
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/\s+/g, ' ').trim();
  let structure = `<h1>Page Title: ${document.title}</h1>`;
  structure += `<h2>URL: ${window.location.href}</h2>`;
  structure += `<h2>Full Page Source (cleaned):</h2>${html}`;
  return structure;
}
function applyTheme() {
  if ($("#ap-theme-vars")) return;
  const root = mk("style", { id: "ap-theme-vars" });
  document.head.appendChild(root);
  function setVars() {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const text = prefersDark ? "#ffffff" : "#1a1a1a";
    const accent = "#007aff";
    const glass = prefersDark ? "rgba(30, 30, 30, 0.85)" : "rgba(255, 255, 255, 0.92)";
    const border = prefersDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)";
    const shadow = prefersDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.15)";
    const subtle = prefersDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
    const card = prefersDark ? "#2c2c2e" : "#ffffff";
    const logBg = prefersDark ? "#1c1c1e" : "#f5f5f7";
    const logText = prefersDark ? "#d1d1d6" : "#2c2c2e";
    const logAccent = prefersDark ? "#40c4ff" : "#007aff";
    root.textContent = `
      :root {
        --ap-text: ${text};
        --ap-accent: ${accent};
        --ap-glass: ${glass};
        --ap-border: ${border};
        --ap-shadow: ${shadow};
        --ap-subtle: ${subtle};
        --ap-card: ${card};
        --ap-log-bg: ${logBg};
        --ap-log-text: ${logText};
        --ap-log-accent: ${logAccent};
        --ap-radius: 12px;
        --ap-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        --ap-easing: cubic-bezier(0.4, 0, 0.2, 1);
      }
    `;
  }
  setVars();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", setVars);
}
function injectStyles() {
  if ($("#ap-styles")) return;
  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .ap-btn {
      position: fixed; right: 28px; bottom: 28px; z-index: 2147483647;
      display: flex; align-items: center; gap: 10px;
      padding: 12px 24px; border-radius: var(--ap-radius); border: none;
      background: var(--ap-accent);
      color: #ffffff; font: 600 15px/1 var(--ap-font);
      box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
      cursor: pointer; user-select: none;
      transition: all 0.3s var(--ap-easing);
      backdrop-filter: blur(8px);
    }
    .ap-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 32px rgba(0, 122, 255, 0.4);
    }
    .ap-btn:active { transform: scale(1); }
    .ap-btn.ap-disabled {
      opacity: 0.6; cursor: not-allowed;
      background: var(--ap-subtle);
      box-shadow: none;
    }
    .ap-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      animation: ap-glow 1.5s ease-in-out infinite;
    }
    @keyframes ap-glow {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
    }
    .ap-panel {
      position: fixed; z-index: 2147483646;
      right: 28px; bottom: 88px;
      width: min(520px, calc(100vw - 56px));
      max-height: min(80vh, 600px);
      border-radius: var(--ap-radius);
      background: var(--ap-glass);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--ap-border);
      box-shadow: 0 16px 40px var(--ap-shadow);
      overflow: hidden;
      opacity: 0; transform: translateY(20px) scale(0.98);
      transition: all 0.4s var(--ap-easing);
      display: flex; flex-direction: column;
    }
    .ap-panel.ap-show {
      opacity: 1; transform: translateY(0) scale(1);
    }
    .ap-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px;
      background: linear-gradient(135deg, var(--ap-subtle) 20%, transparent);
      border-bottom: 1px solid var(--ap-border);
    }
    .ap-title {
      display: flex; align-items: center; gap: 10px;
      color: var(--ap-text); font: 700 18px/1 var(--ap-font);
      letter-spacing: -0.02em;
    }
    .ap-kbd {
      display: flex; align-items: center; gap: 4px;
      color: var(--ap-text); opacity: 0.75;
      font: 500 12px/1 var(--ap-font);
      background: var(--ap-subtle);
      border: 1px solid var(--ap-border);
      padding: 5px 10px; border-radius: 6px;
    }
    .ap-body {
      padding: 20px;
      display: flex; flex-direction: column; gap: 16px;
      background: var(--ap-glass);
      flex: 1;
      overflow-y: auto;
    }
    .ap-phase {
      color: var(--ap-text); font: 600 15px/1.2 var(--ap-font);
      display: flex; align-items: center; gap: 8px;
      letter-spacing: -0.01em;
      position: relative;
    }
    .ap-phase::before {
      content: '';
      display: inline-block; width: 16px; height: 16px;
      border: 2px solid var(--ap-subtle);
      border-top-color: var(--ap-accent);
      border-radius: 50%;
      animation: ap-spin 1s linear infinite;
      opacity: 0;
      transition: opacity 0.2s var(--ap-easing);
    }
    .ap-phase.ap-loading::before {
      opacity: 1;
    }
    .ap-scroll {
      flex: 1; max-height: 200px; overflow-y: auto;
      border-radius: 10px;
      background: var(--ap-log-bg);
      padding: 14px;
      font: 400 13px/1.5 SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      color: var(--ap-log-text);
      border: 1px solid var(--ap-border);
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
      scrollbar-width: thin;
      scrollbar-color: var(--ap-accent) var(--ap-subtle);
    }
    .ap-scroll::-webkit-scrollbar {
      width: 5px;
    }
    .ap-scroll::-webkit-scrollbar-track {
      background: var(--ap-subtle);
      border-radius: 2.5px;
    }
    .ap-scroll::-webkit-scrollbar-thumb {
      background: var(--ap-accent);
      border-radius: 2.5px;
    }
    .ap-line {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 0; border-bottom: 1px solid var(--ap-subtle);
      opacity: 0; transform: translateX(-10px);
      animation: ap-slide-in 0.2s var(--ap-easing) forwards;
    }
    .ap-line:last-child { border-bottom: none; }
    @keyframes ap-slide-in {
      to { opacity: 1; transform: translateX(0); }
    }
    .ap-line-timestamp {
      color: var(--ap-log-accent); font-size: 12px; opacity: 0.7;
      min-width: 60px; font-variant-numeric: tabular-nums;
    }
    .ap-line-type {
      color: var(--ap-log-accent); font-weight: 600; font-size: 11px;
      padding: 2px 8px; border-radius: 4px;
      background: rgba(0, 122, 255, 0.12);
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .ap-line-content {
      flex: 1; color: var(--ap-log-text);
      font-weight: 400; word-break: break-word;
      line-height: 1.4;
    }
    .ap-actions {
      display: flex; justify-content: flex-end; gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--ap-border);
      background: var(--ap-subtle);
      flex-shrink: 0;
    }
    .ap-ghost {
      padding: 8px 16px; border-radius: 8px; border: 1px solid var(--ap-accent);
      background: transparent; color: var(--ap-accent);
      font: 600 14px/1 var(--ap-font); cursor: pointer;
      transition: all 0.3s var(--ap-easing);
    }
    .ap-ghost:hover {
      background: var(--ap-accent);
      color: #ffffff;
      transform: translateY(-1px);
    }
    .ap-toast {
      position: fixed; left: 50%; bottom: 28px; z-index: 2147483647;
      transform: translateX(-50%);
      padding: 12px 20px; border-radius: 10px;
      background: var(--ap-glass);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--ap-border);
      color: var(--ap-text); font: 600 14px/1 var(--ap-font);
      box-shadow: 0 12px 24px var(--ap-shadow);
      opacity: 0; transform: translateX(-50%) translateY(20px);
      transition: all 0.4s var(--ap-easing);
    }
    .ap-toast.ap-show {
      opacity: 1; transform: translateX(-50%) translateY(0);
    }
    .ap-typing-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      z-index: 10001; pointer-events: none;
      background: var(--ap-glass);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px var(--ap-shadow);
      opacity: 0; transform: scale(0.98);
      transition: opacity 0.2s var(--ap-easing), transform 0.2s var(--ap-easing);
    }
    .ap-typing-overlay.ap-active {
      opacity: 1; transform: scale(1);
    }
    .ap-spinner {
      width: 18px; height: 18px; border: 2px solid var(--ap-subtle);
      border-top-color: var(--ap-accent); border-radius: 50%;
      animation: ap-spin 0.8s ease-in-out infinite;
    }
    @keyframes ap-spin {
      to { transform: rotate(360deg); }
    }
    .ap-input-container {
      position: relative; display: inline-block;
    }
    .ap-textarea {
      width: 100%; height: 100px; border-radius: var(--ap-radius);
      padding: 12px; font: 400 14px/1.5 var(--ap-font);
      border: 1px solid var(--ap-border); background: var(--ap-card);
      color: var(--ap-text); box-shadow: inset 0 1px 3px var(--ap-shadow);
      transition: border-color 0.3s var(--ap-easing);
    }
    .ap-textarea:focus {
      border-color: var(--ap-accent); outline: none;
      box-shadow: inset 0 1px 3px var(--ap-shadow), 0 0 0 3px rgba(0, 122, 255, 0.2);
    }
  `.trim();
  document.head.appendChild(mk("style", { id: "ap-styles", textContent: css }));
}
async function clickElement(selector) {
  const el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  el.focus();
  el.click();
  logLine("action", `Clicked: ${selector}`);
}
async function typeInto(el, text, opts = {}) {
  const delay = typeof opts.delay === "number" ? opts.delay : 16;
  const pause = ms => new Promise(r => setTimeout(r, ms));
  if (!el) return;
  el.focus();
  const start = 0;
  const end = (el.value ?? "").length;
  if (end > 0) {
    if (typeof el.setSelectionRange === "function") el.setSelectionRange(start, end);
    if (typeof el.setRangeText === "function") {
      el.setRangeText("", start, end, "start");
    } else {
      el.value = "";
    }
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward", data: "" }));
    await pause(50);
  }
  showTypingOverlay(el);
  const str = String(text ?? "");
  for (const ch of str) {
    const selStart = el.selectionStart ?? (el.value ?? "").length;
    const selEnd = el.selectionEnd ?? selStart;
    if (typeof el.setRangeText === "function") {
      el.setRangeText(ch, selStart, selEnd, "end");
    } else {
      el.value = (el.value ?? "") + ch;
    }
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: ch }));
    await pause(delay);
  }
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.blur();
  await pause(100);
  hideTypingOverlay();
  logLine("action", `Typed into ${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}: ${str.slice(0, 50)}${str.length > 50 ? "..." : ""}`);
}
async function typeIntoSelector(selector, text) {
  const el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  await typeInto(el, text);
}
async function selectOption(selector, value) {
  const el = $(selector);
  if (!el || el.tagName.toLowerCase() !== 'select') throw new Error(`Invalid select element: ${selector}`);
  const option = $(`option[value="${value}"]`, el) || Array.from(el.options).find(opt => opt.text === value);
  if (!option) throw new Error(`Option with value or text "${value}" not found in ${selector}`);
  el.focus();
  option.selected = true;
  option.click();
  el.dispatchEvent(new Event('change', { bubbles: true }));
  logLine("action", `Selected option "${value}" in ${selector} by clicking`);
}
async function checkElement(selector) {
  let el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  if (['checkbox', 'radio'].includes(el.type)) {
    if (!el.checked) {
      el.focus();
      el.click();
      logLine("action", `Checked by clicking: ${selector}`);
    }
    return;
  }
  let gfCheckbox = $(`${selector} [role="checkbox"], ${selector}[role="checkbox"]`) || 
                   $(`${selector} [role="radio"], ${selector}[role="radio"]`) || 
                   $(`${selector} .freebirdFormviewerComponentsQuestionCheckboxChoice, ${selector}.freebirdFormviewerComponentsQuestionCheckboxChoice`);
  if (gfCheckbox) {
    if (!gfCheckbox.classList.contains('checked') && gfCheckbox.getAttribute('aria-checked') !== 'true') {
      gfCheckbox.focus();
      gfCheckbox.click();
      logLine("action", `Checked Google Forms checkbox by clicking: ${selector}`);
    }
  } else {
    throw new Error(`No checkbox/radio element found for: ${selector}`);
  }
}
async function uncheckElement(selector) {
  let el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  if (el.type === 'checkbox') {
    if (el.checked) {
      el.focus();
      el.click();
      logLine("action", `Unchecked by clicking: ${selector}`);
    }
    return;
  }
  let gfCheckbox = $(`${selector} [role="checkbox"], ${selector}[role="checkbox"]`) || 
                   $(`${selector} .freebirdFormviewerComponentsQuestionCheckboxChoice, ${selector}.freebirdFormviewerComponentsQuestionCheckboxChoice`);
  if (gfCheckbox) {
    if (gfCheckbox.classList.contains('checked') || gfCheckbox.getAttribute('aria-checked') === 'true') {
      gfCheckbox.focus();
      gfCheckbox.click();
      logLine("action", `Unchecked Google Forms checkbox by clicking: ${selector}`);
    }
  } else {
    throw new Error(`No checkbox element found for: ${selector}`);
  }
}
function getElementAttribute(selector, attribute) {
  const el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  const value = el.getAttribute(attribute) || '';
  logLine("action", `Attribute ${attribute} of ${selector}: ${value}`);
  return value;
}
async function setElementAttribute(selector, attribute, value) {
  const el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  el.setAttribute(attribute, value);
  logLine("action", `Set ${attribute} of ${selector} to: ${value}`);
}
async function editElement(selector, newTag, attributes, content) {
  const el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  const tag = newTag || el.tagName.toLowerCase();
  const newEl = document.createElement(tag);
  if (attributes && typeof attributes === 'object') {
    Object.entries(attributes).forEach(([key, value]) => {
      newEl.setAttribute(key, value);
    });
  }
  if (content !== undefined) {
    newEl.innerHTML = content;
  } else {
    newEl.innerHTML = el.innerHTML;
  }
  const computedStyle = getComputedStyle(el);
  newEl.style.cssText = computedStyle.cssText;
  el.parentNode.replaceChild(newEl, el);
  logLine("action", `Edited ${selector} to tag ${tag}${attributes ? ` with attributes ${JSON.stringify(attributes)}` : ''}${content !== undefined ? ` and content "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"` : ''}`);
}
async function hoverElement(selector) {
  const el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  logLine("action", `Hovered: ${selector}`);
}
async function dragAndDrop(sourceSelector, targetSelector) {
  const source = $(sourceSelector);
  const target = $(targetSelector);
  if (!source) throw new Error(`Source element not found: ${sourceSelector}`);
  if (!target) throw new Error(`Target element not found: ${targetSelector}`);
  source.dispatchEvent(new DragEvent('dragstart', { bubbles: true }));
  target.dispatchEvent(new DragEvent('dragover', { bubbles: true }));
  target.dispatchEvent(new DragEvent('drop', { bubbles: true }));
  logLine("action", `Dragged ${sourceSelector} to ${targetSelector}`);
}
async function clearInput(selector) {
  const el = $(selector);
  if (!el || !['input', 'textarea'].includes(el.tagName.toLowerCase())) throw new Error(`Invalid input/textarea: ${selector}`);
  el.focus();
  el.value = '';
  el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: "deleteContentBackward" }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  logLine("action", `Cleared input: ${selector}`);
}
async function setStyle(selector, styles) {
  const el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  if (styles && typeof styles === 'object') {
    Object.entries(styles).forEach(([key, value]) => {
      el.style[key] = value;
    });
  }
  logLine("action", `Set styles on ${selector}: ${JSON.stringify(styles)}`);
}
async function injectCustomCSS(css) {
  let styleEl = $("#ap-custom-styles");
  if (styleEl) styleEl.remove();
  styleEl = mk("style", { id: "ap-custom-styles", textContent: css });
  document.head.appendChild(styleEl);
  logLine("action", `Injected custom CSS: ${css.slice(0, 50)}${css.length > 50 ? "..." : ""}`);
}
async function simulateSwipe(selector, direction) {
  const el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  const directions = { left: [-100, 0], right: [100, 0], up: [0, -100], down: [0, 100] };
  const [dx, dy] = directions[direction] || [0, 0];
  if (!directions[direction]) throw new Error(`Invalid direction: ${direction}`);
  el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
  el.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, changedTouches: [{ clientX: dx, clientY: dy }] }));
  el.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
  logLine("action", `Swiped ${direction} on ${selector}`);
}
async function multiAgentLoop(task, subAgents) {
  if (!task || !Array.isArray(subAgents) || subAgents.length === 0) throw new Error('multiAgentLoop requires task and subAgents array');
  const results = [];
  for (const agent of subAgents) {
    if (!agent.prompt) throw new Error(`Sub-agent requires prompt: ${JSON.stringify(agent)}`);
    const subActions = await sendToAI(agent.prompt);
    results.push({ role: agent.role || 'agent', actions: subActions });
    await executeActions(subActions);
  }
  logLine("action", `Multi-agent task "${task}" completed with ${results.length} sub-agents`);
  return results;
}
async function stealthClick(selector, randomness = 0.5) {
  const el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  const delay = 100 + Math.random() * randomness * 200;
  const offsetX = Math.random() * randomness * 10;
  const offsetY = Math.random() * randomness * 10;
  await new Promise(resolve => setTimeout(resolve, delay));
  el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: offsetX, clientY: offsetY }));
  el.focus();
  el.click();
  logLine("action", `Stealth clicked: ${selector} with randomness ${randomness}`);
}
async function waitForElement(selector, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if ($(selector)) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Timeout waiting for: ${selector}`);
}
async function waitForNavigation(timeout = 10000) {
  const originalUrl = window.location.href;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (window.location.href !== originalUrl) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Timeout waiting for navigation');
}
async function scrollToElement(selector) {
  const el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  el.scrollIntoView({ behavior: 'smooth' });
  logLine("action", `Scrolled to: ${selector}`);
}
async function submitForm(selector) {
  const form = $(selector);
  if (!form) throw new Error(`Form not found: ${selector}`);
  const submitBtn = $('button[type="submit"], input[type="submit"]', form);
  if (!submitBtn) throw new Error(`Submit button not found in form: ${selector}`);
  submitBtn.focus();
  submitBtn.click();
  logLine("action", `Submitted form by clicking button in ${selector}`);
}
function getElementValue(selector) {
  const el = $(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  const value = el.value || el.innerText;
  logLine("action", `Value of ${selector}: ${value}`);
  return value;
}
function elementExists(selector) {
  const exists = !!$(selector);
  logLine("action", `Element ${selector} exists: ${exists}`);
  return exists;
}
async function executeActions(actions) {
  if (!Array.isArray(actions)) {
    throw new Error('Invalid actions: Must be an array');
  }
  for (const action of actions) {
    try {
      switch (action.action) {
        case 'clickElement':
          if (!action.selector) throw new Error('clickElement requires selector');
          await clickElement(action.selector);
          break;
        case 'typeInto':
          if (!action.selector || !action.value) throw new Error('typeInto requires selector and value');
          await typeIntoSelector(action.selector, action.value);
          break;
        case 'selectOption':
          if (!action.selector || !action.value) throw new Error('selectOption requires selector and value');
          await selectOption(action.selector, action.value);
          break;
        case 'checkElement':
          if (!action.selector) throw new Error('checkElement requires selector');
          await checkElement(action.selector);
          break;
        case 'uncheckElement':
          if (!action.selector) throw new Error('uncheckElement requires selector');
          await uncheckElement(action.selector);
          break;
        case 'getElementAttribute':
          if (!action.selector || !action.attribute) throw new Error('getElementAttribute requires selector and attribute');
          await getElementAttribute(action.selector, action.attribute);
          break;
        case 'setElementAttribute':
          if (!action.selector || !action.attribute || !action.value) throw new Error('setElementAttribute requires selector, attribute, and value');
          await setElementAttribute(action.selector, action.attribute, action.value);
          break;
        case 'editElement':
          if (!action.selector) throw new Error('editElement requires selector');
          await editElement(action.selector, action.newTag, action.attributes, action.content);
          break;
        case 'hoverElement':
          if (!action.selector) throw new Error('hoverElement requires selector');
          await hoverElement(action.selector);
          break;
        case 'dragAndDrop':
          if (!action.sourceSelector || !action.targetSelector) throw new Error('dragAndDrop requires sourceSelector and targetSelector');
          await dragAndDrop(action.sourceSelector, action.targetSelector);
          break;
        case 'clearInput':
          if (!action.selector) throw new Error('clearInput requires selector');
          await clearInput(action.selector);
          break;
        case 'setStyle':
          if (!action.selector || !action.styles) throw new Error('setStyle requires selector and styles');
          await setStyle(action.selector, action.styles);
          break;
        case 'injectCustomCSS':
          if (!action.css) throw new Error('injectCustomCSS requires css');
          await injectCustomCSS(action.css);
          break;
        case 'simulateSwipe':
          if (!action.selector || !action.direction) throw new Error('simulateSwipe requires selector and direction');
          await simulateSwipe(action.selector, action.direction);
          break;
        case 'multiAgentLoop':
          if (!action.task || !action.subAgents) throw new Error('multiAgentLoop requires task and subAgents');
          await multiAgentLoop(action.task, action.subAgents);
          break;
        case 'stealthClick':
          if (!action.selector) throw new Error('stealthClick requires selector');
          await stealthClick(action.selector, action.randomness || 0.5);
          break;
        case 'waitForElement':
          if (!action.selector) throw new Error('waitForElement requires selector');
          await waitForElement(action.selector, action.timeout || 10000);
          break;
        case 'waitForNavigation':
          await waitForNavigation(action.timeout || 10000);
          break;
        case 'scrollToElement':
          if (!action.selector) throw new Error('scrollToElement requires selector');
          await scrollToElement(action.selector);
          break;
        case 'submitForm':
          if (!action.selector) throw new Error('submitForm requires selector');
          await submitForm(action.selector);
          break;
        case 'getElementValue':
          if (!action.selector) throw new Error('getElementValue requires selector');
          await getElementValue(action.selector);
          break;
        case 'elementExists':
          if (!action.selector) throw new Error('elementExists requires selector');
          await elementExists(action.selector);
          break;
        default:
          throw new Error(`Unknown action: ${action.action}`);
      }
    } catch (error) {
      logLine("error", `Action ${JSON.stringify(action)}: ${error.message}`);
    }
  }
  logLine("status", "Task completed");
  setPhase("Completed");
  toast("Task completed");
}
async function sendToAI(userInstructions) {
  const siteStructure = getSiteStructure();
  const prompt = `
You are an agentic AI assistant that automates browser tasks using Autopilot.
The full page source (cleaned of comments and excessive whitespace) and context are provided below.
Site Structure:
${siteStructure}

Available Actions (use these in your output):
- clickElement(selector): Focuses and clicks an element. Selector is CSS like '#id', '.class'.
- typeInto(selector, value): Focuses input, clears it, types the value with realistic typing simulation.
- selectOption(selector, value): Clicks an option in a <select> by value or text.
- checkElement(selector): Clicks to check a checkbox or radio button (use [role="checkbox"] or .freebirdFormviewerComponentsQuestionCheckboxChoice for Google Forms).
- uncheckElement(selector): Clicks to uncheck a checkbox (use [role="checkbox"] or .freebirdFormviewerComponentsQuestionCheckboxChoice for Google Forms).
- getElementAttribute(selector, attribute): Gets an element's attribute (e.g., 'href').
- setElementAttribute(selector, attribute, value): Sets an element's attribute.
- editElement(selector, newTag, attributes, content): Replaces an element with a new tag (optional), sets attributes (optional object), and updates content (optional text/HTML).
- hoverElement(selector): Simulates hovering over an element.
- dragAndDrop(sourceSelector, targetSelector): Drags source element to target element.
- clearInput(selector): Clears an input/textarea by clicking and deleting content.
- setStyle(selector, styles): Applies CSS styles to an element (styles is an object of key-value pairs).
- injectCustomCSS(css): Injects a custom CSS string into the page head.
- simulateSwipe(selector, direction): Simulates a swipe gesture (left, right, up, down) on an element.
- multiAgentLoop(task, subAgents): Runs multiple sub-agent tasks (ONLY if explicitly requested, subAgents is array of {role, prompt}).
- stealthClick(selector, randomness=0.5): Clicks an element with random mouse movement and delay (ONLY if explicitly requested).
- waitForElement(selector, timeout=10000): Waits for an element to appear.
- waitForNavigation(timeout=10000): Waits for a page navigation.
- scrollToElement(selector): Scrolls to an element.
- submitForm(selector): Submits a form by clicking its submit button (ONLY if explicitly requested).
- getElementValue(selector): Gets the value or text of an element.
- elementExists(selector): Checks if an element exists.

User Instructions: ${userInstructions}

Task: Generate a JSON array of actions to accomplish the user's instructions.
- Output ONLY a JSON array of objects, nothing else (no markdown, no explanations).
- Each object must have an "action" property (one of the above actions) and required properties (e.g., "selector", "value" for typeInto).
- Be agentic: Sequence actions for multi-step tasks, include waits for page loads or navigation if needed.
- Simulate human interaction: Prefer clickElement, submitForm, checkElement, uncheckElement, selectOption, or stealthClick (if requested) for interactions over setting properties directly.
- Be precise with selectors based on the page source. For Google Forms, use [role="checkbox"] or .freebirdFormviewerComponentsQuestionCheckboxChoice for checkbox interactions.
- For multi-step tasks, account for page reloads or dynamic changes.
- RULE: Never include a submitForm action unless the user explicitly requests form submission (e.g., "submit the form").
- RULE: If only form submission is requested, include ONLY submitForm, not typeInto or other actions unless explicitly asked.
- RULE: Only generate actions explicitly requested in the user instructions. Do not add unrequested actions or assumptions.
- RULE: For form submission, always use submitForm which clicks the submit button for realism.
- RULE: Use click-based actions (clickElement, checkElement, uncheckElement, selectOption, submitForm, stealthClick) for most interactions unless direct property changes are explicitly requested.
- RULE: Only use multiAgentLoop or stealthClick if explicitly requested in the instructions.
- RULE: For clearing inputs, use clearInput which clicks and deletes content for realism.
- If unclear, include an action like {"action": "throw", "message": "Unclear instruction"}.
- Keep output minimal and precise for replicable results.

Example Output:
[
  {"action": "typeInto", "selector": "#q1", "value": "Python"},
  {"action": "selectOption", "selector": "select[name='q2']", "value": "daily"},
  {"action": "checkElement", "selector": "[role='checkbox'][data-value='Option 1']"},
  {"action": "uncheckElement", "selector": "[role='checkbox'][data-value='Option 2']"},
  {"action": "editElement", "selector": "button[type='submit']", "newTag": "a", "attributes": {"href": "https://apple.com"}, "content": "Go to Apple"},
  {"action": "submitForm", "selector": "form"},
  {"action": "dragAndDrop", "sourceSelector": "#draggable", "targetSelector": "#dropzone"},
  {"action": "clearInput", "selector": "#search"},
  {"action": "setStyle", "selector": "#button", "styles": {"backgroundColor": "blue"}},
  {"action": "injectCustomCSS", "css": "button { background-color: red; }"},
  {"action": "simulateSwipe", "selector": "#carousel", "direction": "right"},
  {"action": "stealthClick", "selector": "#submit", "randomness": 0.5}
]
`;
  try {
    setPhase("Querying AI");
    logLine("api", "Initiating Autopilot API request");
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      let errorMessage = `Error (code: ${response.status})`;
      if (response.status === 429) {
        errorMessage = `Rate limited (code: 429)`;
      } else {
        const errorBody = await response.text().catch(() => "");
        errorMessage += `: ${errorBody.substring(0, 50)}${errorBody.length > 50 ? "..." : ""}`;
      }
      toast(errorMessage);
      logLine("error", errorMessage);
      throw new Error(errorMessage);
    }
    const data = await response.json();
    if (!data.choices || !data.choices[0]?.message?.content) {
      const errorMessage = 'Invalid API response: No choices or content found';
      toast(errorMessage);
      logLine("error", errorMessage);
      throw new Error(errorMessage);
    }
    logLine("api", `Received ${data.choices[0].message.content.length} chars`);
    const actions = JSON.parse(data.choices[0].message.content);
    logLine("parse", `Parsed ${actions.length} actions`);
    return actions;
  } catch (error) {
    const errorMessage = error.message || "An error occurred";
    toast(errorMessage);
    logLine("error", errorMessage);
    throw error;
  }
}
function openPanel() {
  if ($("#ap-panel")) return;
  applyTheme();
  injectStyles();
  makeButton();
  const panel = makePanel();
  panel.classList.add("ap-show");
  setPhase("Ready");
  logLine("status", "Autopilot panel opened, waiting for instructions");
}
function makeButton() {
  if ($("#" + BTN_ID)) return;
  const btn = mk("button", { id: BTN_ID, className: "ap-btn", type: "button" }, [
    mk("span", { className: "ap-dot" }),
    mk("span", { textContent: "Autopilot" })
  ]);
  btn.addEventListener("click", openPanel);
  document.body.appendChild(btn);
}
function lockBtn() {
  const b = $("#" + BTN_ID);
  if (b) {
    b.className = "ap-btn ap-disabled";
    b.disabled = true;
  }
}
function unlockBtn() {
  const b = $("#" + BTN_ID);
  if (b) {
    b.className = "ap-btn";
    b.disabled = false;
  }
}
function makePanel() {
  let old = $("#ap-panel");
  if (old) old.remove();
  const panel = mk("section", { id: "ap-panel", className: "ap-panel" });
  const head = mk("div", { className: "ap-head" });
  const titleWrap = mk("div", { className: "ap-title" }, [
    mk("span", { className: "ap-dot" }),
    mk("span", { textContent: "Autopilot" })
  ]);
  const kbd = mk("span", { className: "ap-kbd", textContent: "⌃ ⇧ F" });
  head.append(titleWrap, kbd);
  const body = mk("div", { className: "ap-body" });
  const phase = mk("div", { id: "ap-phase", className: "ap-phase", textContent: "Ready" });
  const input = mk("textarea", {
    id: "ap-input",
    className: "ap-textarea",
    placeholder: "Type your instructions..."
  });
  input.addEventListener("keydown", (e) => {
    if (e.metaKey && e.key === "Enter") {
      e.preventDefault();
      run(input.value);
    }
  });
  const log = mk("div", { id: "ap-log", className: "ap-scroll" });
  const actions = mk("div", { className: "ap-actions" });
  const cancelBtn = mk("button", { className: "ap-ghost", textContent: "Cancel" });
  const sendBtn = mk("button", { className: "ap-ghost", textContent: "Send (⌘+Enter)" });
  cancelBtn.addEventListener("click", () => {
    try { hidePanel(); } catch {}
    try { unlockBtn(); } catch {}
    try { toast("Operation canceled"); } catch {}
    try { hideTypingOverlay(); } catch {}
  });
  sendBtn.addEventListener("click", () => run(input.value));
  actions.append(cancelBtn, sendBtn);
  body.append(phase, input, log);
  panel.append(head, body, actions);
  document.body.appendChild(panel);
  return panel;
}
function hidePanel() {
  const panel = $("#ap-panel");
  if (panel) {
    panel.classList.remove("ap-show");
    setTimeout(() => panel.remove(), 400);
  }
}
function formatTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
let logIndex = 0;
function logLine(type, content) {
  const log = $("#ap-log");
  if (!log) return;
  const div = mk("div", { className: "ap-line" });
  const timestamp = mk("span", { className: "ap-line-timestamp", textContent: formatTimestamp() });
  const typeEl = mk("span", { className: "ap-line-type", textContent: type.toUpperCase() });
  const contentEl = mk("span", { className: "ap-line-content", textContent: content });
  div.append(timestamp, typeEl, contentEl);
  div.style.animationDelay = `${logIndex * 0.01}s`;
  log.appendChild(div);
  logIndex++;
  log.scrollTop = log.scrollHeight;
}
function setPhase(text) {
  const phase = $("#ap-phase");
  if (phase) {
    phase.textContent = text;
    phase.classList.toggle("ap-loading", text !== "Ready" && text !== "Completed");
  }
  logLine("status", text);
}
function toast(msg) {
  const t = mk("div", { className: "ap-toast", textContent: msg });
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("ap-show"));
  setTimeout(() => { t.classList.remove("ap-show"); setTimeout(() => t.remove(), 400); }, 2800);
}
function showTypingOverlay(el) {
  hideTypingOverlay();
  if (!el || !el.parentElement) return;
  const parent = el.parentElement;
  const computedStyle = getComputedStyle(el);
  const container = mk("div", { className: "ap-input-container" });
  parent.insertBefore(container, el);
  container.appendChild(el);
  Object.assign(container.style, {
    display: computedStyle.display === 'block' ? 'block' : 'inline-block',
    position: 'relative',
    margin: '0',
    padding: '0'
  });
  const overlay = mk("div", { id: "ap-typing-overlay", className: "ap-typing-overlay" });
  Object.assign(overlay.style, {
    width: computedStyle.width,
    height: computedStyle.height,
    borderRadius: computedStyle.borderRadius,
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    position: 'absolute'
  });
  const spinner = mk("div", { className: "ap-spinner" });
  overlay.appendChild(spinner);
  container.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("ap-active"));
}
function hideTypingOverlay() {
  const overlay = $("#ap-typing-overlay");
  if (overlay) {
    overlay.classList.remove("ap-active");
    setTimeout(() => {
      const container = overlay.parentElement;
      if (container && container.className === "ap-input-container") {
        const input = container.querySelector('textarea, input');
        if (input) container.parentElement.insertBefore(input, container);
        container.remove();
      }
      overlay.remove();
    }, 200);
  }
}
async function run(userInstructions) {
  try {
    lockBtn();
    setPhase("Scanning page");
    logLine("detect", "Analyzing DOM structure");
    const instructions = String(userInstructions || '').trim();
    if (!instructions) {
      logLine("error", "No instructions provided");
      toast("Please enter instructions");
      unlockBtn();
      return;
    }
    setPhase("Preparing prompt");
    logLine("prompt", `Processing instructions: ${instructions.substring(0, 50)}${instructions.length > 50 ? "..." : ""}`);
    const actions = await sendToAI(instructions);
    setPhase("Executing actions");
    await executeActions(actions);
    setTimeout(() => { unlockBtn(); hidePanel(); }, 1500);
  } catch (error) {
    const errorMessage = error.message || "An error occurred";
    toast(errorMessage);
    logLine("error", errorMessage);
    unlockBtn();
    setTimeout(() => hidePanel(), 2000);
  }
}
function bindHotkey() {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f") {
      e.preventDefault();
      openPanel();
    }
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    injectStyles();
    makeButton();
    bindHotkey();
  });
} else {
  applyTheme();
  injectStyles();
  makeButton();
  bindHotkey();
}
console.log('Autopilot initialized. Click the button or press Ctrl+Shift+F to start.');
