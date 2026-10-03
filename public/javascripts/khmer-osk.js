/**
 * Khmer on-screen keyboard (OSK) + physical keyboard mapping for a Quill editor.
 *
 * Mouse clicks and physical key events share one state and one lookup, so the
 * OSK always mirrors what the real keyboard is doing.
 *
 * Usage:
 *   const osk = KhmerOSK.init(quill);
 *   osk.toggle();
 *
 * Expected DOM: #osk-panel, #osk-header, #keyboard-grid, #osk-check
 */
const KhmerOSK = (() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  // Shift layer on consonants = subscript form (NBSP is only for display).
  const sub = (c) => '\u00A0\u17D2' + c;
  const key = (ref, base, ctrl, shift, alt) => ({ ref, base, ctrl, shift, alt });
  const special = (name, width, color) => ({ special: name, width, color });

  const LAYOUT = [
    [
      key('`', '\u1781\u17D2\u1789\u17BB\u17C6', '\u17F9', '\u17AF', '\u17A5'),
      key('1', '\u17E1', '\u19E1', '!', '\u17BE'),
      key('2', '\u17E2', '\u19E2', '@', '\u17BF'),
      key('3', '\u17E3', '\u19E3', '#', '\u17C0'),
      key('4', '\u17E4', '\u19E4', '$', '\u17C1'),
      key('5', '\u17E5', '\u19E5', '%', '\u17C2'),
      key('6', '\u17E6', '\u19E6', '^', '\u17C3'),
      key('7', '\u17E7', '\u19E7', '&', '\u17C4'),
      key('8', '\u17E8', '\u19E8', '*', '\u17C5'),
      key('9', '\u17E9', '\u19E9', '(', '\u17C1\u17C7'),
      key('0', '\u17E0', '\u19E0', ')', '\u17C4\u17C7'),
      key('-', '-', '\u19F1', '\u17B3', '\u17BB\u17C7'),
      key('=', '=', '\u19F2', '+', '\u17B7\u17C7'),
      special('Back', 50),
    ],
    [
      special('Tab', 50),
      key('Q', '\u1786', '\u19F3', sub('\u1786'), '\u17B6\u17C6'),
      key('W', '\u1788', '\u19F4', sub('\u1788'), '\u17B7'),
      key('E', '\u1792', '\u19F5', sub('\u1792'), '\u17B8'),
      key('R', '\u179A', '\u19F6', sub('\u179A'), '\u17B9'),
      key('T', '\u178F', '\u19F7', sub('\u178F'), '\u17BA'),
      key('Y', '\u1799', '\u19F8', sub('\u1799'), '\u17BB'),
      key('U', '\u1791', '\u19F9', sub('\u1791'), '\u17BC'),
      key('I', '\u17A2', '\u19FA', sub('\u17A2'), '\u17BD'),
      key('O', '\u178C', '\u19FB', sub('\u178C'), '\u17C6'),
      key('P', '\u1795', '\u19FC', sub('\u1795'), '\u17BB\u17C6'),
      key('[', '\u17A1', '\u19FD', '\u17D6', '\u17C7'),
      key(']', '\u178D', '\u19FE', sub('\u178D'), '\u17A6'),
      key('\\', '\u17D6', '\u19F0', '\u17DC', '\u19EA'),
    ],
    [
      special('Khmer', 72),
      key('A', '\u1797', '\u17B0', sub('\u1797'), '\u17B6'),
      key('S', '\u179F', '\u179D', sub('\u179F'), '\u17CD'),
      key('D', '\u178A', '\u179E', sub('\u178A'), '\u17D0'),
      key('F', '\u1790', '\u17F0', sub('\u1790'), '\u17CC'),
      key('G', '\u1784', '\u17F1', sub('\u1784'), '\u17CA'),
      key('H', '\u17A0', '\u17F2', sub('\u17A0'), '\u17CF'),
      key('J', '\u1789', '\u17F3', sub('\u1789'), '\u17CE'),
      key('K', '\u1780', '\u17F4', sub('\u1780'), '\u17DD'),
      key('L', '\u179B', '\u17F7', sub('\u179B'), '\u17D3'),
      key(';', '\u1782', '\u17F5', sub('\u1782'), '\u17CB'),
      key("'", '\u1783', '\u19FF', sub('\u1783'), '\u17C9'),
      special('Enter', 72),
    ],
    [
      special('Shift', 98, '#dc2626'),
      key('Z', '\u178B', '\u17C8', sub('\u178B'), '\u17D7'),
      key('X', '\u1781', '\u17A8', sub('\u1781'), '\u17D5'),
      key('C', '\u1785', '\u17A9', sub('\u1785'), '\u17AB'),
      key('V', '\u179C', '\u17AA', sub('\u179C'), '\u17AC'),
      key('B', '\u1794', '\u17A7', sub('\u1794'), '\u17AD'),
      key('N', '\u1793', '\u17B2', sub('\u1793'), '\u17AE'),
      key('M', '\u1798', '\u17F6', sub('\u1798'), '\u17B1'),
      key(',', '\u178E', '\u17F8', sub('\u178E'), '\u17D4'),
      key('.', '\u1787', '\u17D9', sub('\u1787'), '\u17DA'),
      key('/', '\u1796', '\u17DB', sub('\u1796'), '?'),
      special('Shift', 98, '#dc2626'),
    ],
    [
      special('Ctrl', 60, '#2563eb'),
      special('Alt', 60, '#16a34a'),
      special('Space', 430),
      special('Alt', 60, '#16a34a'),
      special('Ctrl', 60, '#2563eb'),
    ],
  ];

  // ---------------------------------------------------------------------------
  // Key code tables
  // ---------------------------------------------------------------------------

  const PUNCTUATION_CODES = {
    '`': 'Backquote', '-': 'Minus', '=': 'Equal', '[': 'BracketLeft',
    ']': 'BracketRight', '\\': 'Backslash', ';': 'Semicolon', "'": 'Quote',
    ',': 'Comma', '.': 'Period', '/': 'Slash',
  };

  const ACTION_CODES = { Back: 'Backspace', Tab: 'Tab', Enter: 'Enter', Space: 'Space' };

  const MODIFIERS = {
    Shift: { name: 'shift', codes: ['ShiftLeft', 'ShiftRight'] },
    Ctrl:  { name: 'ctrl',  codes: ['ControlLeft', 'ControlRight'] },
    Alt:   { name: 'alt',   codes: ['AltLeft', 'AltRight'] },
  };

  // Ctrl+<key> that must keep their browser/editor meaning when typed physically.
  const CTRL_PASSTHROUGH = new Set(['KeyA', 'KeyC', 'KeyV', 'KeyX', 'KeyZ', 'KeyY']);

  // English layer (used when Khmer mode is off): US layout.
  const DIGIT_SHIFT = ')!@#$%^&*(';
  const SYMBOL_SHIFT = {
    '`': '~', '-': '_', '=': '+', '[': '{', ']': '}', '\\': '|',
    ';': ':', "'": '"', ',': '<', '.': '>', '/': '?',
  };

  const englishChar = (ref, shifted) =>
    /^[A-Z]$/.test(ref) ? (shifted ? ref : ref.toLowerCase()) :
    /^[0-9]$/.test(ref) ? (shifted ? DIGIT_SHIFT[ref] : ref) :
    (shifted ? SYMBOL_SHIFT[ref] : ref);

  const refToCode = (ref) =>
    /^[A-Z]$/.test(ref) ? `Key${ref}` :
    /^[0-9]$/.test(ref) ? `Digit${ref}` :
    PUNCTUATION_CODES[ref];

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init(quill) {
    const panel  = document.getElementById('osk-panel');
    const header = document.getElementById('osk-header');
    const grid   = document.getElementById('keyboard-grid');
    const check  = document.getElementById('osk-check');

    // State: on-screen latches + physically held modifiers feed one layer.
    const sticky   = { shift: false, ctrl: false, alt: false };
    let physical   = { shift: false, ctrl: false, alt: false };
    const pressed  = new Set();
    let khmerMode  = true;

    const charKeys = {};   // event.code -> key definition (typing keys only)
    const elements = {};   // event.code -> DOM element (for highlighting)
    let langLabel = null;

    // ---- Layer / character lookup -------------------------------------------

    const isOn = (mod) => sticky[mod] || physical[mod];

    const currentLayer = () =>
      isOn('shift') ? 'shift' :
      isOn('ctrl')  ? 'ctrl'  :
      isOn('alt')   ? 'alt'   : 'base';

    // Khmer mode: 4-layer Khmer table. English mode: US layout (only Shift matters).
    const charFor = (k) => khmerMode
      ? (k[currentLayer()] ?? k.base).replace('\u00A0', '')
      : englishChar(k.ref, isOn('shift'));

    // ---- Editor helpers -----------------------------------------------------

    function insertAtCursor(text) {
      const range = quill.getSelection(true);
      if (range.length) quill.deleteText(range.index, range.length);
      quill.insertText(range.index, text, 'user');
      quill.setSelection(range.index + text.length, 0, 'user');
    }

    function backspace() {
      const range = quill.getSelection(true);
      if (range.length) quill.deleteText(range.index, range.length);
      else if (range.index > 0) quill.deleteText(range.index - 1, 1);
    }

    // ---- State -> DOM -------------------------------------------------------

    function refresh() {
      for (const [code, el] of Object.entries(elements)) {
        el.classList.toggle('is-pressed', pressed.has(code));
        if (el.dataset.mod) el.classList.toggle('active-modifier', isOn(el.dataset.mod));
      }
      if (langLabel) langLabel.textContent = khmerMode ? 'Khmer' : 'English';
      grid.classList.toggle('english', !khmerMode);
    }

    function clearSticky() {
      if (!(sticky.shift || sticky.ctrl || sticky.alt)) return;
      sticky.shift = sticky.ctrl = sticky.alt = false;
      refresh();
    }

    // ---- Build the keyboard once --------------------------------------------

    function addLabel(parent, className, text) {
      const span = document.createElement('span');
      span.className = className;
      span.textContent = text;
      parent.appendChild(span);
      return span;
    }

    function buildSpecialKey(k, modifierCounts) {
      const el = document.createElement('div');
      const isLang = k.special === 'Khmer';
      el.className = isLang ? 'key-language' : 'key';
      el.style.width = `${k.width}px`;

      const label = addLabel(el, 'key-modify', k.special === 'Space' ? '' : k.special);
      if (k.color) label.style.color = k.color;

      if (isLang) {
        label.style.color = '#fff';
        langLabel = label;
        el.onclick = () => { khmerMode = !khmerMode; refresh(); };
        return el;
      }

      const mod = MODIFIERS[k.special];
      if (mod) {
        const index = modifierCounts[k.special] = (modifierCounts[k.special] ?? -1) + 1;
        const code = mod.codes[index];
        el.dataset.mod = mod.name;
        elements[code] = el;
        el.onclick = () => { sticky[mod.name] = !sticky[mod.name]; refresh(); };
        return el;
      }

      const code = ACTION_CODES[k.special];
      elements[code] = el;
      el.onclick = () => {
        if (k.special === 'Back') backspace();
        else insertAtCursor({ Tab: '\t', Enter: '\n', Space: ' ' }[k.special]);
      };
      return el;
    }

    function buildTypingKey(k) {
      const el = document.createElement('div');
      el.className = 'key';
      addLabel(el, 'key-cap-ref', k.ref);
      addLabel(el, 'label base-state', k.base);
      addLabel(el, 'label ctrl-state', k.ctrl);
      addLabel(el, 'label shift-state', k.shift);
      addLabel(el, 'label alt-state', k.alt);

      const code = refToCode(k.ref);
      charKeys[code] = k;
      elements[code] = el;
      el.onclick = () => { insertAtCursor(charFor(k)); clearSticky(); };
      return el;
    }

    function build() {
      const modifierCounts = {};
      for (const row of LAYOUT) {
        const rowEl = document.createElement('div');
        rowEl.className = 'row';
        for (const k of row) {
          rowEl.appendChild(k.special ? buildSpecialKey(k, modifierCounts) : buildTypingKey(k));
        }
        grid.appendChild(rowEl);
      }
      refresh();
    }

    // ---- Physical keyboard --------------------------------------------------

    function syncPhysicalModifiers(e) {
      const altGr = e.getModifierState?.('AltGraph');   // Windows reports AltGr as Ctrl+Alt
      physical = { shift: e.shiftKey, alt: e.altKey || altGr, ctrl: e.ctrlKey && !altGr };
    }

    function shouldIntercept(e, k) {
      if (!khmerMode || !quill.hasFocus() || !k || e.metaKey) return false;
      return !(e.ctrlKey && !e.altKey && CTRL_PASSTHROUGH.has(e.code));
    }

    window.addEventListener('keydown', (e) => {
      syncPhysicalModifiers(e);
      pressed.add(e.code);

      if (e.key === 'Escape' && quill.hasFocus()) {
        e.preventDefault();
        khmerMode = !khmerMode;
      } else if (e.code.startsWith('Alt') && quill.hasFocus()) {
        e.preventDefault();                       // keep the browser menu from stealing focus
      } else {
        const k = charKeys[e.code];               // modifiers/space/enter/tab/backspace are not in here
        if (shouldIntercept(e, k)) {
          e.preventDefault();
          insertAtCursor(charFor(k));
          clearSticky();                          // an on-screen latch also applies to the next physical key
        }
      }
      refresh();
    });

    window.addEventListener('keyup', (e) => {
      syncPhysicalModifiers(e);
      pressed.delete(e.code);
      refresh();
    });

    window.addEventListener('blur', () => {       // avoid "stuck" keys after alt-tab
      pressed.clear();
      physical = { shift: false, ctrl: false, alt: false };
      refresh();
    });

    // ---- Panel: keep editor focus, drag, toggle -----------------------------

    panel.addEventListener('mousedown', (e) => {
      if (!e.target.closest('#osk-header')) e.preventDefault();   // clicking keys must not blur Quill
    });

    header.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#osk-close')) return;
      const rect = panel.getBoundingClientRect();
      const dx = e.clientX - rect.left;
      const dy = e.clientY - rect.top;

      // Drop the centering transform without making the panel jump.
      panel.style.transform = 'none';
      panel.style.left = `${rect.left}px`;
      panel.style.top = `${rect.top}px`;

      header.setPointerCapture(e.pointerId);
      const move = (ev) => {
        panel.style.left = `${ev.clientX - dx}px`;
        panel.style.top = `${ev.clientY - dy}px`;
      };
      const up = () => {
        header.removeEventListener('pointermove', move);
        header.removeEventListener('pointerup', up);
      };
      header.addEventListener('pointermove', move);
      header.addEventListener('pointerup', up);
    });

    function toggle() {
      const show = panel.style.display !== 'flex';
      panel.style.display = show ? 'flex' : 'none';
      if (check) check.style.visibility = show ? 'visible' : 'hidden';
    }

    build();
    if (check) check.style.visibility = 'hidden';   // panel starts closed

    return { toggle };
  }

  return { init };
})();