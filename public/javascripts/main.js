const DPI = 96;
const PAGE_WIDTH_IN = 8.5;
const PAGE_HEIGHT_IN = 11;

// Default Document Margins (Inches)
let margins = {
  top: 1.0,
  bottom: 1.0,
  left: 1.0,
  right: 1.0
};

let currentZoom = 1.0;
let pageCount = 1;

// DOM References
const workspace = document.getElementById('workspace');
const viewport = document.getElementById('document-viewport');
const canvasH = document.getElementById('canvas-h');
const canvasV = document.getElementById('canvas-v');

const handleLeft = document.getElementById('handle-margin-left');
const handleRight = document.getElementById('handle-margin-right');
const handleTop = document.getElementById('handle-margin-top');
const handleBottom = document.getElementById('handle-margin-bottom');

const guideV = document.getElementById('guide-v');
const guideH = document.getElementById('guide-h');
const imageFileInput = document.getElementById('image-file-input');

// Register custom fonts with Quill 
// 1. Import the style-based Font attributor
const Font = Quill.import('attributors/style/font');

// 2. Define the exact whitelisted values (matching the HTML option values)
Font.whitelist = [
  'khmer-os',
  'noto-sans-khmer',
  'khmer-ui',
  'sans-serif',
  'calibri',
  'inter',
  'lora',
  'roboto-mono',
  'open-sans'
];

// 3. Register the Font attributor with Quill
Quill.register(Font, true);

// Initialize Master Quill Instance
const quill = new Quill('#editor', {
  modules: {
    toolbar: '#toolbar-container'
  },
  theme: 'snow'
});

// Custom Quill Image Handler
quill.getModule('toolbar').addHandler('image', () => {
  triggerImageUpload();
});

function triggerImageUpload() {
  imageFileInput.click();
}

imageFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', event.target.result);
      quill.setSelection(range.index + 1);
    };
    reader.readAsDataURL(file);
  }
  imageFileInput.value = '';
});

// Menu Dropdown Logic
const fileMenuBtn = document.getElementById('file-menu-btn');
const fileMenuDropdown = document.getElementById('file-menu-dropdown');

const keyboardMenuBtn = document.getElementById('keyboard-menu-btn');
const keyboardMenuDropdown = document.getElementById('keyboard-menu-dropdown');

const insertMenuBtn = document.getElementById('insert-menu-btn');
const insertMenuDropdown = document.getElementById('insert-menu-dropdown');

fileMenuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  insertMenuDropdown.style.display = 'none';
  fileMenuDropdown.style.display = fileMenuDropdown.style.display === 'block' ? 'none' : 'block';
});


keyboardMenuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileMenuDropdown.style.display = 'none';
  keyboardMenuDropdown.style.display = keyboardMenuDropdown.style.display === 'block' ? 'none' : 'block';
});

insertMenuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileMenuDropdown.style.display = 'none';
  insertMenuDropdown.style.display = insertMenuDropdown.style.display === 'block' ? 'none' : 'block';
});

window.addEventListener('click', () => {
  fileMenuDropdown.style.display = 'none';
  insertMenuDropdown.style.display = 'none';
  keyboardMenuDropdown.style.display = 'none';
});

// Save/Export Handlers
function getDocumentFilename(extension) {
  const title = document.getElementById('doc-title').value.trim() || 'Document';
  return `${title}.${extension}`;
}

/* Pre-processor to convert Quill class-based styling into standard inline CSS */
function preprocessHtmlForExport() {
  const rawHtml = quill.root.innerHTML;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = rawHtml;

  // 1. Convert Quill alignment classes to inline text-align styles
  const alignedElements = tempDiv.querySelectorAll('.ql-align-center, .ql-align-right, .ql-align-justify');
  alignedElements.forEach(el => {
    if (el.classList.contains('ql-align-center')) {
      el.style.textAlign = 'center';
    } else if (el.classList.contains('ql-align-right')) {
      el.style.textAlign = 'right';
    } else if (el.classList.contains('ql-align-justify')) {
      el.style.textAlign = 'justify';
    }
  });

  // 2. Convert Quill list formats if necessary
  const listItems = tempDiv.querySelectorAll('li');
  listItems.forEach(li => {
    if (li.classList.contains('ql-align-center')) li.style.textAlign = 'center';
    if (li.classList.contains('ql-align-right')) li.style.textAlign = 'right';
  });

  // 3. Ensure images render properly with standard styles
  const images = tempDiv.querySelectorAll('img');
  images.forEach(img => {
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
  });

  return tempDiv.innerHTML;
}

function exportToDocx() {
  const cleanHtmlContent = preprocessHtmlForExport();

  const documentTemplate = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${document.getElementById('doc-title').value}</title>
<style>
body {
  font-family: Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #1e293b;
}
h1 { font-size: 24pt; font-weight: bold; margin-bottom: 12pt; }
h2 { font-size: 18pt; font-weight: bold; margin-bottom: 10pt; }
h3 { font-size: 14pt; font-weight: bold; margin-bottom: 8pt; }
p { margin-bottom: 8pt; }
ul, ol { margin-top: 0; margin-bottom: 8pt; padding-left: 24pt; }
blockquote { border-left: 3px solid #cbd5e1; padding-left: 10pt; color: #475569; font-style: italic; }
img { max-width: 100%; height: auto; }
</style>
</head>
<body>
${cleanHtmlContent}
</body>
</html>`;

  if (window.htmlDocx && typeof window.htmlDocx.asBlob === 'function') {
    const converted = window.htmlDocx.asBlob(documentTemplate);
    const url = URL.createObjectURL(converted);
    const a = document.createElement('a');
    a.href = url;
    a.download = getDocumentFilename('docx');
    a.click();
    URL.revokeObjectURL(url);
  } else {
    alert('DOCX exporter library is still loading. Please wait a moment and try again.');
  }
}

async function buildExportHtml({ forPrint = false } = {}) {
  const bodyHtml = preprocessHtmlForExport();
  const title = document.getElementById('doc-title')?.value || 'Document';
  const fontUrl = new URL('fonts/KhmerOS.ttf', location.href).href;

  // 1. Fetch local font and convert to Base64
  let fontSrc = `url('${fontUrl}') format('truetype')`;
  try {
    const response = await fetch(fontUrl);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Font = btoa(binary);
      fontSrc = `url('data:font/ttf;charset=utf-8;base64,${base64Font}') format('truetype')`;
    }
  } catch (error) {
    console.warn('Could not load font as Base64, falling back to URL reference:', error);
  }

  const printCss = forPrint ? `
    @page { size: Letter; margin: ${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in; }
    html, body { margin: 0; padding: 0; }` : '';

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @font-face {
      font-family: 'Khmer OS';
      src: ${fontSrc};
      font-weight: normal;
      font-style: normal;
    }

    /* Include Khmer UI and Leelawadee UI so Windows 11 falls back seamlessly */
    body {
      font-family: 'Khmer OS', 'Noto Sans Khmer', 'Khmer UI', 'Leelawadee UI', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
    }

    /* Map both lowercase and full font name inline style attributes with Windows 11 fallbacks */
    span[style*="khmer-os"], [style*="khmer-os"],
    span[style*="Khmer OS"], [style*="Khmer OS"] {
      font-family: 'Khmer OS', 'Khmer UI', 'Leelawadee UI', sans-serif !important;
    }

    img { max-width: 100%; height: auto; }
    ${printCss}    
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

// Print the generated HTML via a hidden iframe
async function printDocument() {
  const html = await buildExportHtml({ forPrint: true });
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) iframe.remove();
  };
  win.onafterprint = cleanup;

  // 1. Wait for images to decode
  const images = [...doc.images].map(img => img.decode().catch(() => {}));
  
  // 2. Wait for fonts and add a small 250ms paint delay for the print driver to render Base64
  await Promise.all([doc.fonts.ready, ...images]);
  await new Promise(resolve => setTimeout(resolve, 250));

  win.focus();
  win.print();
  setTimeout(cleanup, 60000); // Fallback cleanup
}

// ODT export now just reuses the same builder.
async function exportToOdt() {
  const html = await buildExportHtml({ forPrint: false });
  const blob = new Blob([html], { type: 'application/vnd.oasis.opendocument.text' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = getDocumentFilename('odt');
  a.click();
  URL.revokeObjectURL(url);
}

function renderRulers() {
  const firstPage = document.querySelector('.page-sheet');
  if (!firstPage) return;

  const pageRect = firstPage.getBoundingClientRect();
  const workspaceRect = workspace.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // --- 1. HORIZONTAL RULER ---
  const hWidth = workspace.scrollWidth;
  const hHeight = 26;

  canvasH.width = hWidth * dpr;
  canvasH.height = hHeight * dpr;
  canvasH.style.width = `${hWidth}px`;
  canvasH.style.height = `${hHeight}px`;

  const ctxH = canvasH.getContext('2d');
  ctxH.scale(dpr, dpr);
  ctxH.clearRect(0, 0, hWidth, hHeight);

  const pageLeftPos = pageRect.left - workspaceRect.left + workspace.scrollLeft - 26;
  const pageWidthPx = PAGE_WIDTH_IN * DPI * currentZoom;
  const marginLeftPx = margins.left * DPI * currentZoom;
  const marginRightPx = margins.right * DPI * currentZoom;

  ctxH.fillStyle = '#e2e8f0';
  ctxH.fillRect(pageLeftPos, 0, marginLeftPx, hHeight);
  ctxH.fillRect(pageLeftPos + pageWidthPx - marginRightPx, 0, marginRightPx, hHeight);

  ctxH.fillStyle = '#475569';
  ctxH.strokeStyle = '#94a3b8';
  ctxH.font = '10px Inter, sans-serif';
  ctxH.textAlign = 'center';

  for (let inch = 0; inch <= PAGE_WIDTH_IN; inch++) {
    const x = pageLeftPos + (inch * DPI * currentZoom);

    for (let i = 0; i < 8; i++) {
      const subX = x + (i * (DPI / 8) * currentZoom);
      if (subX > pageLeftPos + pageWidthPx + 1) break;

      let tickH = 5;
      if (i === 4) tickH = 10;
      else if (i % 2 === 0) tickH = 7;

      ctxH.beginPath();
      ctxH.moveTo(subX, hHeight - tickH);
      ctxH.lineTo(subX, hHeight);
      ctxH.stroke();
    }

    if (inch > 0 && inch < PAGE_WIDTH_IN) {
      ctxH.fillText(inch.toString(), x, 12);
    }
  }

  // --- 2. VERTICAL RULER ---
  const vWidth = 26;
  const vHeight = workspace.scrollHeight;

  canvasV.width = vWidth * dpr;
  canvasV.height = vHeight * dpr;
  canvasV.style.width = `${vWidth}px`;
  canvasV.style.height = `${vHeight}px`;

  const ctxV = canvasV.getContext('2d');
  ctxV.scale(dpr, dpr);
  ctxV.clearRect(0, 0, vWidth, vHeight);

  const pageTopPos = pageRect.top - workspaceRect.top + workspace.scrollTop - 26;
  const pageHeightPx = PAGE_HEIGHT_IN * DPI * currentZoom;
  const marginTopPx = margins.top * DPI * currentZoom;
  const marginBottomPx = margins.bottom * DPI * currentZoom;

  ctxV.fillStyle = '#e2e8f0';
  ctxV.fillRect(0, pageTopPos, vWidth, marginTopPx);
  ctxV.fillRect(0, pageTopPos + pageHeightPx - marginBottomPx, vWidth, marginBottomPx);

  ctxV.fillStyle = '#475569';
  ctxV.strokeStyle = '#94a3b8';

  for (let inch = 0; inch <= PAGE_HEIGHT_IN; inch++) {
    const y = pageTopPos + (inch * DPI * currentZoom);

    for (let i = 0; i < 8; i++) {
      const subY = y + (i * (DPI / 8) * currentZoom);
      if (subY > pageTopPos + pageHeightPx + 1) break;

      let tickW = 5;
      if (i === 4) tickW = 10;
      else if (i % 2 === 0) tickW = 7;

      ctxV.beginPath();
      ctxV.moveTo(vWidth - tickW, subY);
      ctxV.lineTo(vWidth, subY);
      ctxV.stroke();
    }

    if (inch > 0 && inch < PAGE_HEIGHT_IN) {
      ctxV.save();
      ctxV.translate(12, y);
      ctxV.rotate(-Math.PI / 2);
      ctxV.fillText(inch.toString(), 0, 3);
      ctxV.restore();
    }
  }

  updateHandlePositions(pageLeftPos, pageTopPos, pageWidthPx, pageHeightPx);
}

function updateHandlePositions(pageLeftPos, pageTopPos, pageWidthPx, pageHeightPx) {
  const marginLeftPx = margins.left * DPI * currentZoom;
  const marginRightPx = margins.right * DPI * currentZoom;
  const marginTopPx = margins.top * DPI * currentZoom;
  const marginBottomPx = margins.bottom * DPI * currentZoom;

  handleLeft.style.left = `${pageLeftPos + marginLeftPx}px`;
  handleRight.style.left = `${pageLeftPos + pageWidthPx - marginRightPx}px`;
  handleTop.style.top = `${pageTopPos + marginTopPx}px`;
  handleBottom.style.top = `${pageTopPos + pageHeightPx - marginBottomPx}px`;
}

function setupDragHandles() {
  let activeHandle = null;

  function onPointerDown(e, handle) {
    activeHandle = handle;
    e.preventDefault();

    if (handle === 'left' || handle === 'right') guideV.style.display = 'block';
    if (handle === 'top' || handle === 'bottom') guideH.style.display = 'block';

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  function onPointerMove(e) {
    if (!activeHandle) return;

    const firstPage = document.querySelector('.page-sheet');
    const pageRect = firstPage.getBoundingClientRect();

    if (activeHandle === 'left') {
      let newLeft = (e.clientX - pageRect.left) / (DPI * currentZoom);
      newLeft = Math.max(0.4, Math.min(newLeft, PAGE_WIDTH_IN - margins.right - 0.5));
      margins.left = Math.round(newLeft * 20) / 20;
      guideV.style.left = `${e.clientX}px`;
    } 
    else if (activeHandle === 'right') {
      let newRight = (pageRect.right - e.clientX) / (DPI * currentZoom);
      newRight = Math.max(0.4, Math.min(newRight, PAGE_WIDTH_IN - margins.left - 0.5));
      margins.right = Math.round(newRight * 20) / 20;
      guideV.style.left = `${e.clientX}px`;
    } 
    else if (activeHandle === 'top') {
      let newTop = (e.clientY - pageRect.top) / (DPI * currentZoom);
      newTop = Math.max(0.4, Math.min(newTop, PAGE_HEIGHT_IN - margins.bottom - 0.5));
      margins.top = Math.round(newTop * 20) / 20;
      guideH.style.top = `${e.clientY}px`;
    } 
    else if (activeHandle === 'bottom') {
      let newBottom = (pageRect.bottom - e.clientY) / (DPI * currentZoom);
      newBottom = Math.max(0.4, Math.min(newBottom, PAGE_HEIGHT_IN - margins.top - 0.5));
      margins.bottom = Math.round(newBottom * 20) / 20;
      guideH.style.top = `${e.clientY}px`;
    }

    applyMarginsCSS();
    renderRulers();
    checkPagination();
  }

  function onPointerUp() {
    activeHandle = null;
    guideV.style.display = 'none';
    guideH.style.display = 'none';
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  handleLeft.addEventListener('pointerdown', (e) => onPointerDown(e, 'left'));
  handleRight.addEventListener('pointerdown', (e) => onPointerDown(e, 'right'));
  handleTop.addEventListener('pointerdown', (e) => onPointerDown(e, 'top'));
  handleBottom.addEventListener('pointerdown', (e) => onPointerDown(e, 'bottom'));
}

function applyMarginsCSS() {
  document.documentElement.style.setProperty('--margin-top-in', margins.top);
  document.documentElement.style.setProperty('--margin-bottom-in', margins.bottom);
  document.documentElement.style.setProperty('--margin-left-in', margins.left);
  document.documentElement.style.setProperty('--margin-right-in', margins.right);
}

function checkPagination() {
  const editorEl = document.getElementById('editor');
  if (!editorEl) return;

  const pageContent = document.querySelector('.page-content');
  const maxAvailableHeight = pageContent.clientHeight;

  const editorHeight = editorEl.scrollHeight;

  if (editorHeight > maxAvailableHeight) {
    if (viewport.children.length === 1) {
      createNewPageSheet(2);
    }
  } else if (viewport.children.length > 1 && editorHeight < maxAvailableHeight - 50) {
    const lastPage = viewport.lastElementChild;
    if (lastPage && viewport.children.length > 1) {
      viewport.removeChild(lastPage);
      updatePageCountDisplay();
    }
  }
}

function createNewPageSheet(index) {
  const pageSheet = document.createElement('div');
  pageSheet.className = 'page-sheet';
  pageSheet.setAttribute('data-page-index', index);

  pageSheet.innerHTML = `
    <div class="page-header">
      <span>Document Header</span>
      <span class="doc-subtitle-header">Word Processor</span>
    </div>
    <div class="page-content">
      <div class="p-4 text-slate-400 italic text-sm text-center border border-dashed border-slate-200 rounded my-auto">
        [ Continuous Multi-page Content Flow ]
      </div>
    </div>
    <div class="page-footer">
      <span>Page <span class="page-num">${index}</span> of <span class="total-pages">${index}</span></span>
      <span>Confidential</span>
    </div>
  `;

  viewport.appendChild(pageSheet);
  updatePageCountDisplay();
}

function updatePageCountDisplay() {
  pageCount = viewport.children.length;
  document.querySelectorAll('.total-pages').forEach(el => el.textContent = pageCount);
  document.getElementById('total-pages-display').textContent = pageCount;
}

function updateStats() {
  const text = quill.getText();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.replace(/\n/g, '').length;

  document.getElementById('word-count-display').textContent = words;
  document.getElementById('char-count-display').textContent = chars;
}

// Zoom Handling
document.getElementById('zoom-in-btn').addEventListener('click', () => {
  if (currentZoom < 1.6) {
    currentZoom = Math.round((currentZoom + 0.1) * 10) / 10;
    applyZoom();
  }
});

document.getElementById('zoom-out-btn').addEventListener('click', () => {
  if (currentZoom > 0.6) {
    currentZoom = Math.round((currentZoom - 0.1) * 10) / 10;
    applyZoom();
  }
});

function applyZoom() {
  viewport.style.transform = `scale(${currentZoom})`;
  document.getElementById('zoom-label').textContent = `${Math.round(currentZoom * 100)}%`;
  renderRulers();
}

// Event Listeners
quill.on('text-change', () => {
  checkPagination();
  updateStats();
  triggerAutoSave();
});

workspace.addEventListener('scroll', () => {
  canvasH.style.transform = `translateX(-${workspace.scrollLeft}px)`;
  canvasV.style.transform = `translateY(-${workspace.scrollTop}px)`;
  renderRulers();
});

window.addEventListener('resize', renderRulers);

let saveTimeout;
function triggerAutoSave() {
  const statusEl = document.getElementById('save-status');
  statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...';
  statusEl.className = 'text-amber-600 font-medium';

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    statusEl.innerHTML = '<i class="fa-solid fa-cloud-check mr-1"></i> Saved to browser';
    statusEl.className = 'text-emerald-600 font-medium';
  }, 1000);
}

window.onload = function () {
  applyMarginsCSS();
  renderRulers();
  setupDragHandles();
  updateStats();

  const osk = KhmerOSK.init(quill);
  window.toggleOSK = osk.toggle;   // your menu and ? button use onclick="toggleOSK()"
};
  