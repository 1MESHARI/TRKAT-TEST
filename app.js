/* ═══════════════════════════════════════════════
   PDF Tools Pro — app.js
   ═══════════════════════════════════════════════ */

'use strict';

/* ── LIB SETUP ── */
const { PDFDocument, rgb, degrees, StandardFonts, PageSizes } = PDFLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function toast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show';
  const colors = { ok: 'var(--pg)', err: 'var(--pr)', warn: 'var(--py)' };
  t.style.borderColor = colors[type] || 'var(--b2)';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3000);
}

function readBytes(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(new Uint8Array(e.target.result));
    r.onerror = rej;
    r.readAsArrayBuffer(file);
  });
}

function readDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function parseRanges(str, max) {
  const out = [];
  str.split(',').forEach(p => {
    p = p.trim();
    if (p.includes('-')) {
      const [a, b] = p.split('-').map(n => parseInt(n.trim()) - 1);
      for (let i = a; i <= Math.min(b, max - 1); i++) if (i >= 0) out.push(i);
    } else {
      const n = parseInt(p) - 1;
      if (n >= 0 && n < max) out.push(n);
    }
  });
  return [...new Set(out)];
}

function dlBlob(bytes, name) {
  const b = new Blob([bytes], { type: 'application/pdf' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 3000);
}

function dlURL(url, name) {
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
}

function hexRGB(hex) {
  hex = (hex || '#000').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return rgb(
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/* ══════════════════════════════════════════════
   APP STATE
══════════════════════════════════════════════ */
const App = {
  mode: 'tools',
  currentTool: null,
  toolFiles: [],
  selPages: new Set(),

  // editor
  edPdfBytes: null,
  edPdfJsDoc: null,
  edPage: 1,
  edTotalPages: 0,
  edZoom: 1.0,
  edTool: 'sel',
  edColor: '#1a1a1a',
  anns: {},
  selAnn: null,
  edHistory: [],

  // preview (tools mode)
  previewPdfJsDoc: null,
  previewPage: 1,
  previewZoom: 1.0,

  // signature
  sigMode: 'draw',
  sigDrawing: false,
  sigCtx: null,
  sigLastPos: null,

  // scanner
  scanFiles: [],

  // watermark live
  wmRAF: null,

  // crop
  cropActive: false,
  cropStart: null,
  cropRect: null,
};

/* ══════════════════════════════════════════════
   MODE SWITCH
══════════════════════════════════════════════ */
function switchMode(m) {
  App.mode = m;
  $$('.mode-btn').forEach(b => b.classList.remove('active'));
  $('mode-' + m).classList.add('active');

  const isEd = m === 'editor';

  $('lsidebar').style.display = isEd ? 'none' : 'flex';
  $('etoolbar').classList.toggle('vis', isEd);
  $('ws-panel').style.display = isEd ? 'none' : 'flex';
  $('editor-center').classList.toggle('vis', isEd);
  $('rpanel').classList.toggle('vis', isEd);
  $('zoom-row').style.display = isEd ? 'flex' : 'none';
  $('btn-undo').style.display = isEd ? '' : 'none';
  $('btn-clear').style.display = isEd ? '' : 'none';
  $('page-nav').classList.toggle('vis', isEd && App.edTotalPages > 1);
}

/* ══════════════════════════════════════════════
   TOOL CONFIGURATION
══════════════════════════════════════════════ */
const TOOLS = {
  merge:         { title: 'دمج ملفات PDF',        sub: 'ادمج عدة ملفات في ملف واحد',        icon: '📎', btn: 'دمج الملفات',       accept: '.pdf',              multi: true,  preview: true  },
  split:         { title: 'تقسيم PDF',             sub: 'افصل الصفحات كملفات مستقلة',         icon: '✂️', btn: 'تقسيم الملف',       accept: '.pdf',              multi: false, preview: true  },
  extract:       { title: 'استخراج صفحات',         sub: 'استخرج صفحات محددة',                icon: '📑', btn: 'استخراج',           accept: '.pdf',              multi: false, preview: true  },
  'delete-pages':{ title: 'حذف صفحات',            sub: 'احذف صفحات معينة من الملف',          icon: '🗑️', btn: 'حذف وحفظ',          accept: '.pdf',              multi: false, preview: true  },
  reorder:       { title: 'إعادة الترتيب',         sub: 'رتّب الصفحات بالسحب والإفلات',      icon: '🔀', btn: 'حفظ الترتيب',       accept: '.pdf',              multi: false, preview: true  },
  img2pdf:       { title: 'صور → PDF',             sub: 'حوّل صور JPG/PNG إلى PDF',          icon: '🖼️', btn: 'تحويل إلى PDF',     accept: '.jpg,.jpeg,.png,.webp', multi: true, preview: false },
  pdf2img:       { title: 'PDF → صور',             sub: 'كل صفحة تصبح صورة PNG',             icon: '📸', btn: 'تحويل إلى صور',    accept: '.pdf',              multi: false, preview: true  },
  word2pdf:      { title: 'Word → PDF',            sub: 'تحويل ملفات DOCX إلى PDF',          icon: '📝', btn: 'تحويل إلى PDF',     accept: '.docx,.doc',        multi: false, preview: false },
  html2pdf:      { title: 'HTML → PDF',            sub: 'تحويل كود HTML إلى PDF',             icon: '🌐', btn: 'تحويل إلى PDF',     accept: 'none',              multi: false, preview: false },
  compress:      { title: 'ضغط PDF',              sub: 'صغّر حجم الملف',                    icon: '🗜️', btn: 'ضغط الملف',         accept: '.pdf',              multi: false, preview: true  },
  rotate:        { title: 'تدوير الصفحات',         sub: 'دوّر الصفحات بأي زاوية',            icon: '🔄', btn: 'تدوير وحفظ',        accept: '.pdf',              multi: false, preview: true  },
  watermark:     { title: 'علامة مائية',           sub: 'أضف نصاً مائياً مع معاينة فورية',   icon: '💧', btn: 'إضافة العلامة',     accept: '.pdf',              multi: false, preview: true  },
  crop:          { title: 'قص PDF بالماوس',        sub: 'حدد المنطقة بالسحب وقص',            icon: '✂️', btn: 'قص وحفظ',           accept: '.pdf',              multi: false, preview: true  },
  'add-numbers': { title: 'ترقيم الصفحات',         sub: 'أضف أرقاماً للصفحات',               icon: '🔢', btn: 'إضافة الأرقام',     accept: '.pdf',              multi: false, preview: true  },
  protect:       { title: 'تشفير PDF',             sub: 'حمِ ملفك بكلمة مرور',               icon: '🔒', btn: 'تشفير الملف',        accept: '.pdf',              multi: false, preview: false },
  unlock:        { title: 'فك التشفير',            sub: 'أزل كلمة المرور',                   icon: '🔓', btn: 'فك التشفير',         accept: '.pdf',              multi: false, preview: false },
  flatten:       { title: 'تثبيت PDF',             sub: 'تجميد النماذج التفاعلية',            icon: '📋', btn: 'تثبيت الملف',        accept: '.pdf',              multi: false, preview: false },
  scanner:       { title: 'سكانر وتحويل',          sub: 'ارفع صور السكانر وحوّلها لـ PDF',   icon: '🖨️', btn: 'تحويل إلى PDF',     accept: '.jpg,.jpeg,.png,.pdf,.webp', multi: true, preview: false },
};

/* ══════════════════════════════════════════════
   LOAD TOOL
══════════════════════════════════════════════ */
function loadTool(name, btnEl) {
  App.currentTool = name;
  App.toolFiles = [];
  App.selPages.clear();
  App.previewPdfJsDoc = null;
  App.previewPage = 1;
  App.cropActive = false;
  App.cropRect = null;

  $$('.ls-tool').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const cfg = TOOLS[name];
  const ws = $('ws-content');

  /* ── Header ── */
  let html = `
    <div class="tool-header">
      <div class="tool-header-icon">${cfg.icon}</div>
      <div>
        <div class="tool-header-title">${cfg.title}</div>
        <div class="tool-header-sub">${cfg.sub}</div>
      </div>
    </div>`;

  if (name === 'scanner') {
    html += buildScannerUI();
  } else if (name === 'html2pdf') {
    html += buildHtmlToPdfUI();
  } else {
    /* ── Layout with preview ── */
    if (cfg.preview) {
      html += `<div class="ws-layout">
        <div class="preview-panel">
          <div class="preview-header">
            <span class="preview-title">معاينة</span>
            <div class="preview-nav">
              <button class="preview-nav-btn" id="pvPrev" onclick="previewChPage(-1)" disabled>›</button>
              <span class="preview-page-info" id="pvInfo">—</span>
              <button class="preview-nav-btn" id="pvNext" onclick="previewChPage(1)" disabled>‹</button>
            </div>
          </div>
          <div class="preview-body" id="previewBody">
            <div class="preview-empty">
              <div class="preview-empty-icon">${cfg.icon}</div>
              <div class="preview-empty-text">ارفع ملفاً لرؤية المعاينة</div>
            </div>
          </div>
        </div>
        <div class="controls-panel">
          ${buildDropZone(name, cfg)}
          <div id="tool-file-list" class="file-list"></div>
          ${buildOpts(name)}
          <div class="action-bar" id="tool-abar" style="display:none">
            <button class="btn btn-primary" id="tool-run-btn" onclick="runTool()">
              <span>⚡</span><span id="tool-btn-txt">${cfg.btn}</span>
            </button>
            <div class="prog-wrap" id="t-prog" style="display:none">
              <div class="prog-bar" id="t-prog-bar"></div>
            </div>
            <button class="btn btn-ghost" onclick="clearTool()">🗑</button>
          </div>
          <div id="tool-status"></div>
          <div id="tool-result"></div>
        </div>
      </div>`;
    } else {
      html += `<div class="controls-panel" style="max-width:560px">
        ${buildDropZone(name, cfg)}
        <div id="tool-file-list" class="file-list"></div>
        ${buildOpts(name)}
        <div class="action-bar" id="tool-abar" style="display:none">
          <button class="btn btn-primary" id="tool-run-btn" onclick="runTool()">
            <span>⚡</span><span id="tool-btn-txt">${cfg.btn}</span>
          </button>
          <div class="prog-wrap" id="t-prog" style="display:none">
            <div class="prog-bar" id="t-prog-bar"></div>
          </div>
          <button class="btn btn-ghost" onclick="clearTool()">🗑</button>
        </div>
        <div id="tool-status"></div>
        <div id="tool-result"></div>
      </div>`;
    }
  }

  ws.innerHTML = html;
  bindToolInputs(name, cfg);

  // show abar for html2pdf immediately
  if (name === 'html2pdf' && $('tool-abar')) $('tool-abar').style.display = 'flex';
}

function buildDropZone(name, cfg) {
  if (cfg.accept === 'none') return '';
  const labels = {
    img2pdf: 'صور JPG / PNG / WebP',
    word2pdf: 'ملفات DOCX / DOC',
    default: cfg.multi ? 'ملفات PDF متعددة' : 'ملف PDF واحد',
  };
  const sub = labels[name] || labels.default;
  const types = {
    img2pdf: ['JPG', 'PNG', 'WebP'],
    word2pdf: ['DOCX', 'DOC'],
    default: ['PDF'],
  };
  const chips = (types[name] || types.default).map(t => `<span class="tc">${t}</span>`).join('');
  return `
    <div class="drop-zone" id="tool-drop">
      <input type="file" id="tool-file-input" accept="${cfg.accept}" ${cfg.multi ? 'multiple' : ''}>
      <div class="drop-zone-icon">📄</div>
      <div class="drop-zone-title">اسحب الملفات هنا أو انقر للاختيار</div>
      <div class="drop-zone-sub">${sub}</div>
      <div class="type-chips">${chips}</div>
    </div>`;
}

function buildScannerUI() {
  return `
    <div class="controls-panel" style="max-width:100%">
      <div class="drop-zone" id="scan-drop">
        <input type="file" id="scan-file-input" accept=".jpg,.jpeg,.png,.pdf,.webp" multiple>
        <div class="drop-zone-icon">🖨️</div>
        <div class="drop-zone-title">ارفع صور السكانر</div>
        <div class="drop-zone-sub">يدعم JPG, PNG, PDF — يمكن رفع عدة ملفات</div>
        <div class="type-chips"><span class="tc">JPG</span><span class="tc">PNG</span><span class="tc">PDF</span></div>
      </div>
      <div class="scanner-grid" id="scanner-grid"></div>
      <div class="action-bar" id="tool-abar" style="display:none">
        <button class="btn btn-primary" onclick="runScannerBuild()">⚡ بناء PDF</button>
        <button class="btn btn-ghost" onclick="clearScanner()">🗑 مسح الكل</button>
      </div>
      <div id="tool-status"></div>
      <div id="tool-result"></div>
    </div>`;
}

function buildHtmlToPdfUI() {
  return `
    <div class="controls-panel" style="max-width:560px">
      <div class="opts-card">
        <div class="opts-card-header"><span class="opts-card-title">أدخل HTML</span></div>
        <div class="opts-card-body">
          <textarea class="html-textarea" id="html-in" rows="10"><h1 style="font-family:Cairo,sans-serif;color:#1a6b4a">مستند PDF</h1>
<p style="font-family:Cairo,sans-serif;font-size:16px">محتوى المستند هنا.</p>
<ul style="font-family:Cairo,sans-serif">
  <li>عنصر أول</li>
  <li>عنصر ثاني</li>
</ul></textarea>
        </div>
      </div>
      <div class="action-bar" id="tool-abar">
        <button class="btn btn-primary" id="tool-run-btn" onclick="runTool()">⚡ تحويل إلى PDF</button>
        <div class="prog-wrap" id="t-prog" style="display:none"><div class="prog-bar" id="t-prog-bar"></div></div>
      </div>
      <div id="tool-status"></div>
      <div id="tool-result"></div>
    </div>`;
}

function buildOpts(name) {
  const opts = {
    split: `
      <div class="opts-card">
        <div class="opts-card-header"><span class="opts-card-title">خيارات التقسيم</span></div>
        <div class="opts-card-body">
          <div class="opts-grid">
            <div class="opt-group">
              <label class="opt-label">طريقة التقسيم</label>
              <select class="opt-select" id="split-mode" onchange="updateSplitMode()">
                <option value="all">كل صفحة كملف مستقل</option>
                <option value="range">نطاق محدد</option>
                <option value="every">كل N صفحة</option>
              </select>
            </div>
            <div class="opt-group" id="split-range-g" style="display:none">
              <label class="opt-label">النطاق (مثال: 1-3,5)</label>
              <input type="text" class="opt-input" id="split-range" value="1-3">
            </div>
            <div class="opt-group" id="split-every-g" style="display:none">
              <label class="opt-label">كل كم صفحة</label>
              <input type="number" class="opt-input" id="split-n" value="2" min="1">
            </div>
          </div>
        </div>
      </div>`,
    extract: `
      <div class="opts-card" id="extract-opts">
        <div class="opts-card-header"><span class="opts-card-title">اختر الصفحات</span></div>
        <div class="opts-card-body">
          <div class="opt-group">
            <label class="opt-label">أرقام الصفحات (مثال: 1,3,5-7)</label>
            <input type="text" class="opt-input" id="extract-range" value="1,2" style="width:100%">
          </div>
          <div class="pages-grid" id="pg-picker"></div>
        </div>
      </div>`,
    'delete-pages': `
      <div class="opts-card">
        <div class="opts-card-header"><span class="opts-card-title">اختر الصفحات للحذف</span></div>
        <div class="opts-card-body">
          <div class="opt-group">
            <label class="opt-label">أرقام الصفحات (مثال: 2,4-6)</label>
            <input type="text" class="opt-input" id="delete-range" value="2" style="width:100%">
          </div>
          <div class="pages-grid" id="pg-picker-d"></div>
        </div>
      </div>`,
    reorder: `<div id="reorder-area"></div>`,
    compress: `
      <div class="opts-card">
        <div class="opts-card-header"><span class="opts-card-title">مستوى الضغط</span></div>
        <div class="opts-card-body">
          <div class="opt-group">
            <label class="opt-label">الجودة</label>
            <select class="opt-select" id="comp-level">
              <option value="h">خفيف — جودة عالية</option>
              <option value="m" selected>متوسط — توازن مثالي</option>
              <option value="l">قوي — أصغر حجم</option>
            </select>
          </div>
        </div>
      </div>`,
    rotate: `
      <div class="opts-card">
        <div class="opts-card-header"><span class="opts-card-title">إعدادات التدوير</span></div>
        <div class="opts-card-body">
          <div class="opts-grid">
            <div class="opt-group">
              <label class="opt-label">الاتجاه</label>
              <select class="opt-select" id="rot-dir" onchange="updateRotatePreview()">
                <option value="90">↺ 90° لليسار</option>
                <option value="180">↕ 180° قلب</option>
                <option value="270">↻ 90° لليمين</option>
              </select>
            </div>
            <div class="opt-group">
              <label class="opt-label">الصفحات</label>
              <select class="opt-select" id="rot-pages">
                <option value="all">كل الصفحات</option>
                <option value="odd">الفردية فقط</option>
                <option value="even">الزوجية فقط</option>
                <option value="first">الأولى فقط</option>
                <option value="last">الأخيرة فقط</option>
              </select>
            </div>
          </div>
        </div>
      </div>`,
    watermark: `
      <div class="opts-card">
        <div class="opts-card-header"><span class="opts-card-title">العلامة المائية — معاينة فورية</span></div>
        <div class="opts-card-body">
          <div class="opts-grid">
            <div class="opt-group" style="grid-column:1/-1">
              <label class="opt-label">النص</label>
              <input type="text" class="opt-input" id="wm-txt" value="سري - لا للنشر" style="width:100%" oninput="updateWatermarkPreview()">
            </div>
            <div class="opt-group">
              <label class="opt-label">حجم الخط</label>
              <div class="opt-range-row">
                <input type="range" id="wm-sz" min="12" max="120" value="52" oninput="$('wm-sz-v').textContent=this.value;updateWatermarkPreview()">
                <span class="opt-range-val" id="wm-sz-v">52</span>
              </div>
            </div>
            <div class="opt-group">
              <label class="opt-label">الشفافية %</label>
              <div class="opt-range-row">
                <input type="range" id="wm-op" min="5" max="70" value="18" oninput="$('wm-op-v').textContent=this.value+'%';updateWatermarkPreview()">
                <span class="opt-range-val" id="wm-op-v">18%</span>
              </div>
            </div>
            <div class="opt-group">
              <label class="opt-label">الزاوية</label>
              <div class="opt-range-row">
                <input type="range" id="wm-ang" min="-90" max="90" value="-30" oninput="$('wm-ang-v').textContent=this.value+'°';updateWatermarkPreview()">
                <span class="opt-range-val" id="wm-ang-v">-30°</span>
              </div>
            </div>
            <div class="opt-group">
              <label class="opt-label">اللون</label>
              <div class="color-row">
                ${['#1a1a1a','#e03535','#2563eb','#16a34a','#7c3aed','#ea580c','#0891b2'].map(c =>
                  `<div class="color-swatch ${c==='#1a1a1a'?'active':''}" style="background:${c}" data-wmc="${c}" onclick="setWmColor('${c}',this)"></div>`
                ).join('')}
                <input type="color" id="wm-col" value="#1a1a1a" onchange="setWmColor(this.value,null)">
              </div>
            </div>
            <div class="opt-group">
              <label class="opt-label">الموضع</label>
              <select class="opt-select" id="wm-pos" onchange="updateWatermarkPreview()">
                <option value="center">وسط الصفحة</option>
                <option value="tile">تكرار شبكة</option>
                <option value="top">أعلى</option>
                <option value="bottom">أسفل</option>
              </select>
            </div>
          </div>
        </div>
      </div>`,
    crop: `
      <div class="opts-card">
        <div class="opts-card-header"><span class="opts-card-title">القص بالماوس</span></div>
        <div class="opts-card-body">
          <div class="notice" style="margin-bottom:10px">
            <div class="notice-icon">👆</div>
            <div class="notice-text"><b>كيفية القص</b>اسحب بالماوس على المعاينة لتحديد المنطقة التي تريد الاحتفاظ بها</div>
          </div>
          <div class="opts-grid">
            <div class="opt-group">
              <label class="opt-label">الصفحات</label>
              <select class="opt-select" id="crop-pages">
                <option value="all">كل الصفحات</option>
                <option value="odd">الفردية فقط</option>
                <option value="even">الزوجية فقط</option>
                <option value="first">الأولى فقط</option>
              </select>
            </div>
            <div class="opt-group">
              <label class="opt-label">المنطقة المحددة</label>
              <div style="font-size:11px;color:var(--t2)" id="crop-dims-txt">لم يتم التحديد بعد</div>
            </div>
          </div>
        </div>
      </div>`,
    'add-numbers': `
      <div class="opts-card">
        <div class="opts-card-header"><span class="opts-card-title">إعدادات الترقيم</span></div>
        <div class="opts-card-body">
          <div class="opts-grid">
            <div class="opt-group">
              <label class="opt-label">الموضع</label>
              <select class="opt-select" id="pn-pos">
                <option value="bc">أسفل المنتصف</option>
                <option value="br">أسفل اليمين</option>
                <option value="bl">أسفل اليسار</option>
                <option value="tc">أعلى المنتصف</option>
                <option value="tr">أعلى اليمين</option>
              </select>
            </div>
            <div class="opt-group">
              <label class="opt-label">الصيغة</label>
              <select class="opt-select" id="pn-fmt">
                <option value="n">1, 2, 3</option>
                <option value="p">صفحة 1</option>
                <option value="nt">1 / 10</option>
              </select>
            </div>
            <div class="opt-group">
              <label class="opt-label">حجم الخط</label>
              <input type="number" class="opt-input" id="pn-sz" value="12" min="8" max="24">
            </div>
            <div class="opt-group">
              <label class="opt-label">بدءاً من صفحة</label>
              <input type="number" class="opt-input" id="pn-start" value="1" min="1">
            </div>
          </div>
        </div>
      </div>`,
    protect: `
      <div class="opts-card">
        <div class="opts-card-header"><span class="opts-card-title">كلمة المرور</span></div>
        <div class="opts-card-body">
          <div class="opt-group">
            <label class="opt-label">كلمة مرور جديدة</label>
            <input type="password" class="opt-input" id="p-pass" placeholder="أدخل كلمة مرور..." style="width:100%">
          </div>
        </div>
      </div>`,
    unlock: `
      <div class="opts-card">
        <div class="opts-card-header"><span class="opts-card-title">فك التشفير</span></div>
        <div class="opts-card-body">
          <div class="opt-group">
            <label class="opt-label">كلمة المرور الحالية</label>
            <input type="password" class="opt-input" id="u-pass" placeholder="كلمة المرور..." style="width:100%">
          </div>
        </div>
      </div>`,
    word2pdf: `
      <div class="notice">
        <div class="notice-icon">ℹ️</div>
        <div class="notice-text"><b>ملاحظة</b>يتم استخراج النص من DOCX وتحويله. قد تختلف بعض التنسيقات المعقدة.</div>
      </div>`,
    pdf2img: `
      <div class="opts-card">
        <div class="opts-card-header"><span class="opts-card-title">إعدادات التحويل</span></div>
        <div class="opts-card-body">
          <div class="opts-grid">
            <div class="opt-group">
              <label class="opt-label">الدقة</label>
              <select class="opt-select" id="img-scale">
                <option value="1">72 DPI — ويب</option>
                <option value="2" selected>150 DPI — متوازن</option>
                <option value="3">200 DPI — طباعة</option>
              </select>
            </div>
            <div class="opt-group">
              <label class="opt-label">التنسيق</label>
              <select class="opt-select" id="img-fmt">
                <option value="png">PNG — جودة عالية</option>
                <option value="jpeg">JPEG — حجم أصغر</option>
              </select>
            </div>
          </div>
        </div>
      </div>`,
  };
  return opts[name] || '';
}

/* ── BIND TOOL INPUTS ── */
function bindToolInputs(name, cfg) {
  // File input
  const fi = $('tool-file-input');
  if (fi) {
    fi.addEventListener('change', e => addToolFiles(e.target.files));
  }
  // Drop zone
  const dz = $('tool-drop');
  if (dz) {
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('dragover');
      addToolFiles(e.dataTransfer.files);
    });
  }
  // Scanner
  const sf = $('scan-file-input');
  if (sf) sf.addEventListener('change', e => addScanFiles(e.target.files));
  const sd = $('scan-drop');
  if (sd) {
    sd.addEventListener('dragover', e => { e.preventDefault(); sd.classList.add('dragover'); });
    sd.addEventListener('dragleave', () => sd.classList.remove('dragover'));
    sd.addEventListener('drop', e => { e.preventDefault(); sd.classList.remove('dragover'); addScanFiles(e.dataTransfer.files); });
  }
}

/* ── ADD FILES ── */
async function addToolFiles(files) {
  const cfg = TOOLS[App.currentTool];
  if (!cfg) return;
  if (!cfg.multi) App.toolFiles = [files[0]];
  else for (const f of files) App.toolFiles.push(f);
  renderToolFileList();
  if ($('tool-abar')) $('tool-abar').style.display = App.toolFiles.length ? 'flex' : 'none';
  $('tool-status').innerHTML = '';
  $('tool-result').innerHTML = '';
  // Load preview
  if (cfg.preview && App.toolFiles.length) {
    await loadToolPreview(App.toolFiles[0]);
  }
  // Load page picker
  if (['extract', 'delete-pages'].includes(App.currentTool)) loadPgPicker();
  if (App.currentTool === 'reorder') renderReorderUI();
  if (App.currentTool === 'crop') activateCropMode();
  if (App.currentTool === 'watermark') updateWatermarkPreview();
  if (App.currentTool === 'rotate') updateRotatePreview();
}

function renderToolFileList() {
  const el = $('tool-file-list');
  if (!el) return;
  const extIco = { PDF: '📄', DOCX: '📝', DOC: '📝', JPG: '🖼️', JPEG: '🖼️', PNG: '🖼️', WEBP: '🖼️' };
  const extBg  = { PDF: '#0d1f3a', DOCX: '#0d1f3a', JPG: '#3a1e0d', PNG: '#2a0d3a' };
  el.innerHTML = App.toolFiles.map((f, i) => {
    const ext = f.name.split('.').pop().toUpperCase();
    return `<div class="file-item">
      <div class="fi-icon" style="background:${extBg[ext]||'#1e2235'}">${extIco[ext]||'📄'}</div>
      <div class="fi-info">
        <div class="fi-name">${f.name}</div>
        <div class="fi-meta">${formatBytes(f.size)} · ${ext}</div>
      </div>
      <button class="fi-del" onclick="removeToolFile(${i})">✕</button>
    </div>`;
  }).join('');
}

function removeToolFile(i) {
  App.toolFiles.splice(i, 1);
  renderToolFileList();
  if (!App.toolFiles.length) {
    if ($('tool-abar')) $('tool-abar').style.display = 'none';
    clearPreviewBody();
  }
}

function clearTool() {
  App.toolFiles = [];
  App.selPages.clear();
  App.cropRect = null;
  renderToolFileList();
  clearPreviewBody();
  if ($('tool-abar')) $('tool-abar').style.display = 'none';
  if ($('tool-status')) $('tool-status').innerHTML = '';
  if ($('tool-result')) $('tool-result').innerHTML = '';
  if ($('tool-file-input')) $('tool-file-input').value = '';
}

/* ══════════════════════════════════════════════
   PREVIEW SYSTEM
══════════════════════════════════════════════ */
async function loadToolPreview(file) {
  try {
    const bytes = await readBytes(file);
    App.previewPdfJsDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
    App.previewPage = 1;
    await renderPreviewPage();
    const total = App.previewPdfJsDoc.numPages;
    if ($('pvPrev')) $('pvPrev').disabled = true;
    if ($('pvNext')) $('pvNext').disabled = total <= 1;
    if ($('pvInfo')) $('pvInfo').textContent = `1 / ${total}`;
  } catch (e) {
    clearPreviewBody();
  }
}

async function renderPreviewPage() {
  if (!App.previewPdfJsDoc) return;
  const body = $('previewBody'); if (!body) return;
  const pg = await App.previewPdfJsDoc.getPage(App.previewPage);
  const vp = pg.getViewport({ scale: 1 });
  // fit into preview panel
  const maxW = body.clientWidth - 32;
  const maxH = 480;
  const scale = Math.min(maxW / vp.width, maxH / vp.height, 1.5);
  const viewport = pg.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width; canvas.height = viewport.height;
  await pg.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

  // Build preview content
  if (App.currentTool === 'watermark') {
    body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'preview-canvas-wrap';
    wrap.id = 'wm-canvas-wrap';
    wrap.appendChild(canvas);
    // watermark overlay
    const ovl = document.createElement('div');
    ovl.className = 'wm-overlay'; ovl.id = 'wm-ovl';
    wrap.appendChild(ovl);
    body.appendChild(wrap);
    updateWatermarkPreview();
  } else if (App.currentTool === 'crop') {
    body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'preview-canvas-wrap';
    wrap.id = 'crop-wrap';
    wrap.appendChild(canvas);
    // crop overlay
    const cropOvl = document.createElement('div');
    cropOvl.className = 'crop-overlay'; cropOvl.id = 'crop-ovl';
    wrap.appendChild(cropOvl);
    body.appendChild(wrap);
    bindCropEvents(cropOvl, canvas);
  } else if (App.currentTool === 'rotate') {
    body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'preview-canvas-wrap'; wrap.id = 'rot-wrap';
    wrap.appendChild(canvas);
    body.appendChild(wrap);
    updateRotatePreview();
  } else {
    body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'preview-canvas-wrap';
    wrap.appendChild(canvas);
    body.appendChild(wrap);
  }

  const total = App.previewPdfJsDoc.numPages;
  if ($('pvInfo')) $('pvInfo').textContent = `${App.previewPage} / ${total}`;
  if ($('pvPrev')) $('pvPrev').disabled = App.previewPage <= 1;
  if ($('pvNext')) $('pvNext').disabled = App.previewPage >= total;
}

async function previewChPage(d) {
  if (!App.previewPdfJsDoc) return;
  const n = App.previewPage + d;
  const total = App.previewPdfJsDoc.numPages;
  if (n < 1 || n > total) return;
  App.previewPage = n;
  await renderPreviewPage();
}

function clearPreviewBody() {
  const body = $('previewBody');
  if (!body) return;
  body.innerHTML = `<div class="preview-empty">
    <div class="preview-empty-icon">📄</div>
    <div class="preview-empty-text">ارفع ملفاً لرؤية المعاينة</div>
  </div>`;
}

/* ══════════════════════════════════════════════
   WATERMARK LIVE PREVIEW
══════════════════════════════════════════════ */
let wmColor = '#1a1a1a';
function setWmColor(c, el) {
  wmColor = c;
  if ($('wm-col')) $('wm-col').value = c;
  $$('[data-wmc]').forEach(s => s.classList.toggle('active', s.dataset.wmc === c));
  updateWatermarkPreview();
}

function updateWatermarkPreview() {
  const ovl = $('wm-ovl'); if (!ovl) return;
  const txt  = $('wm-txt')?.value  || 'علامة مائية';
  const sz   = parseInt($('wm-sz')?.value  || '52');
  const op   = parseInt($('wm-op')?.value  || '18') / 100;
  const ang  = parseInt($('wm-ang')?.value || '-30');
  const pos  = $('wm-pos')?.value  || 'center';
  const col  = wmColor || '#1a1a1a';

  ovl.innerHTML = '';
  const style = `font-size:${sz}px;color:${col};opacity:${op};transform:rotate(${ang}deg);font-family:'Cairo',sans-serif;font-weight:900;white-space:nowrap;letter-spacing:2px;pointer-events:none;user-select:none`;

  if (pos === 'tile') {
    // tile grid
    const wrap = document.getElementById('wm-canvas-wrap');
    const W = wrap ? wrap.offsetWidth : 400;
    const H = wrap ? wrap.offsetHeight : 500;
    ovl.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    for (let y = -100; y < H + 100; y += sz * 2.5) {
      for (let x = -200; x < W + 200; x += sz * txt.length * 0.7) {
        const span = document.createElement('span');
        span.className = 'wm-overlay-text';
        span.textContent = txt;
        span.style.cssText = style + `;left:${x}px;top:${y}px;position:absolute`;
        ovl.appendChild(span);
      }
    }
  } else {
    ovl.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;overflow:hidden';
    let alignItems = 'center', justifyContent = 'center';
    if (pos === 'top') { alignItems = 'flex-start'; ovl.style.padding = '5% 0 0 0'; }
    if (pos === 'bottom') { alignItems = 'flex-end'; ovl.style.padding = '0 0 5% 0'; }
    ovl.style.alignItems = alignItems;
    const span = document.createElement('span');
    span.className = 'wm-overlay-text';
    span.textContent = txt;
    span.style.cssText = style + ';position:relative';
    ovl.appendChild(span);
  }
}

/* ══════════════════════════════════════════════
   CROP WITH MOUSE
══════════════════════════════════════════════ */
function activateCropMode() {
  App.cropActive = true;
  App.cropRect = null;
}

function bindCropEvents(ovl, canvas) {
  let dragging = false, startX, startY;
  let selEl = null;

  ovl.addEventListener('mousedown', e => {
    e.preventDefault();
    const rect = ovl.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    dragging = true;
    // remove old selection
    if (selEl) selEl.remove();
    selEl = document.createElement('div');
    selEl.className = 'crop-selection';
    selEl.id = 'crop-sel';
    ovl.appendChild(selEl);
  });

  ovl.addEventListener('mousemove', e => {
    if (!dragging || !selEl) return;
    const rect = ovl.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    const x = Math.min(startX, curX);
    const y = Math.min(startY, curY);
    const w = Math.abs(curX - startX);
    const h = Math.abs(curY - startY);
    selEl.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    // dims in PDF points approx
    const scaleX = canvas.width / ovl.offsetWidth;
    const scaleY = canvas.height / ovl.offsetHeight;
    App.cropRect = {
      x: Math.round(x * scaleX),
      y: Math.round(y * scaleY),
      w: Math.round(w * scaleX),
      h: Math.round(h * scaleY),
      canvasW: canvas.width,
      canvasH: canvas.height,
    };
    const dt = $('crop-dims-txt');
    if (dt) dt.textContent = `${Math.round(w)} × ${Math.round(h)} بكسل`;
  });

  ovl.addEventListener('mouseup', () => { dragging = false; });
  ovl.addEventListener('mouseleave', () => { dragging = false; });
}

/* ══════════════════════════════════════════════
   ROTATE PREVIEW
══════════════════════════════════════════════ */
function updateRotatePreview() {
  const wrap = $('rot-wrap'); if (!wrap) return;
  const canvas = wrap.querySelector('canvas'); if (!canvas) return;
  const deg = parseInt($('rot-dir')?.value || '0');
  canvas.style.transform = `rotate(${deg}deg)`;
  canvas.style.transition = 'transform .3s';
}

/* ══════════════════════════════════════════════
   PAGE PICKER
══════════════════════════════════════════════ */
async function loadPgPicker() {
  if (!App.toolFiles.length) return;
  try {
    const b = await readBytes(App.toolFiles[0]);
    const d = await PDFDocument.load(b, { ignoreEncryption: true });
    const total = d.getPageCount();
    const gridId = App.currentTool === 'extract' ? 'pg-picker' : 'pg-picker-d';
    const inpId  = App.currentTool === 'extract' ? 'extract-range' : 'delete-range';
    const grid = $(gridId); if (!grid) return;
    App.selPages.clear();
    grid.innerHTML = '';
    for (let i = 1; i <= total; i++) {
      const c = document.createElement('div');
      c.className = 'page-chip'; c.textContent = i;
      c.onclick = () => {
        c.classList.toggle('sel');
        App.selPages.has(i) ? App.selPages.delete(i) : App.selPages.add(i);
        const inp = $(inpId);
        if (inp) inp.value = [...App.selPages].sort((a, b) => a - b).join(',');
      };
      grid.appendChild(c);
    }
  } catch (e) {}
}

/* ══════════════════════════════════════════════
   REORDER UI
══════════════════════════════════════════════ */
async function renderReorderUI() {
  const area = $('reorder-area'); if (!area || !App.toolFiles.length) return;
  const b = await readBytes(App.toolFiles[0]);
  const d = await PDFDocument.load(b, { ignoreEncryption: true });
  const total = d.getPageCount();
  area.innerHTML = `
    <div class="opts-card">
      <div class="opts-card-header"><span class="opts-card-title">اسحب لإعادة الترتيب</span></div>
      <div class="opts-card-body">
        <div class="reorder-list" id="reorder-list"></div>
      </div>
    </div>`;
  const list = $('reorder-list');
  for (let i = 1; i <= total; i++) {
    const c = document.createElement('div');
    c.className = 'reorder-chip'; c.textContent = i; c.draggable = true; c.dataset.pg = i;
    c.addEventListener('dragstart', e => { e.dataTransfer.setData('text', i); c.classList.add('dragging'); });
    c.addEventListener('dragend', () => c.classList.remove('dragging'));
    c.addEventListener('dragover', e => e.preventDefault());
    c.addEventListener('drop', e => {
      e.preventDefault();
      const from = e.dataTransfer.getData('text');
      const fromEl = [...list.children].find(x => x.dataset.pg == from);
      if (fromEl && fromEl !== c) {
        const fi = [...list.children].indexOf(fromEl);
        const ti = [...list.children].indexOf(c);
        fi < ti ? list.insertBefore(fromEl, c.nextSibling) : list.insertBefore(fromEl, c);
      }
    });
    list.appendChild(c);
  }
}

/* ══════════════════════════════════════════════
   SPLIT MODE UPDATE
══════════════════════════════════════════════ */
function updateSplitMode() {
  const m = $('split-mode')?.value;
  if ($('split-range-g')) $('split-range-g').style.display = m === 'range' ? '' : 'none';
  if ($('split-every-g')) $('split-every-g').style.display = m === 'every' ? '' : 'none';
}

/* ══════════════════════════════════════════════
   PROGRESS HELPERS
══════════════════════════════════════════════ */
function setTProg(v) {
  const pw = $('t-prog'); const pb = $('t-prog-bar');
  if (pw) pw.style.display = 'block';
  if (pb) pb.style.width = v + '%';
}
function setTStatus(msg) {
  const s = $('tool-status');
  if (s) s.innerHTML = `<div class="status-row"><div class="spinner"></div><div class="status-text">${msg}</div></div>`;
}
function showToolResult(fname, bytes, extra = '') {
  const kb = formatBytes(bytes.byteLength);
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const r = $('tool-result');
  if (r) r.innerHTML = `
    <div class="result-box">
      <div class="result-icon">✅</div>
      <div>
        <div class="result-name">${fname}</div>
        <div class="result-meta">${kb} ${extra}</div>
      </div>
      <div class="result-actions">
        <button class="dl-btn" onclick="dlURL('${url}','${fname}')">⬇ تنزيل</button>
      </div>
    </div>`;
  if ($('t-prog')) $('t-prog').style.display = 'none';
  if ($('tool-status')) $('tool-status').innerHTML = '';
  toast('تمت المعالجة ✓', 'ok');
}
function showMultiResults(items) {
  const r = $('tool-result');
  if (r) r.innerHTML = `<div class="multi-results">${items.map(it =>
    `<div class="mres-item">
      <div class="mres-icon">📄</div>
      <div class="mres-name">${it.name}</div>
      <div class="mres-size">${it.size}</div>
      <button class="mres-dl" onclick="dlURL('${it.url}','${it.name}')">⬇ تنزيل</button>
    </div>`).join('')}</div>`;
  if ($('t-prog')) $('t-prog').style.display = 'none';
  if ($('tool-status')) $('tool-status').innerHTML = '';
  toast(`تم إنشاء ${items.length} ملف ✓`, 'ok');
}

/* ══════════════════════════════════════════════
   RUN TOOL DISPATCHER
══════════════════════════════════════════════ */
async function runTool() {
  const t = App.currentTool;
  if (t !== 'html2pdf' && !App.toolFiles.length) { toast('يرجى رفع ملف أولاً', 'err'); return; }
  const btn = $('tool-run-btn');
  if (btn) btn.disabled = true;
  setTProg(5);
  try {
    const runners = {
      merge:         tMerge,
      split:         tSplit,
      extract:       tExtract,
      'delete-pages':tDeletePages,
      reorder:       tReorder,
      img2pdf:       tImg2pdf,
      pdf2img:       tPdf2img,
      word2pdf:      tWord2pdf,
      html2pdf:      tHtmlToPdf,
      compress:      tCompress,
      rotate:        tRotate,
      watermark:     tWatermark,
      crop:          tCrop,
      'add-numbers': tAddNumbers,
      protect:       tProtect,
      unlock:        tUnlock,
      flatten:       tFlatten,
    };
    const fn = runners[t];
    if (fn) await fn();
    else toast('هذه الأداة غير متاحة بعد', 'warn');
  } catch (e) {
    toast('خطأ: ' + e.message, 'err');
    if ($('t-prog')) $('t-prog').style.display = 'none';
    if ($('tool-status')) $('tool-status').innerHTML = '';
    console.error(e);
  }
  if (btn) btn.disabled = false;
}

/* ══════════════════════════════════════════════
   TOOL IMPLEMENTATIONS
══════════════════════════════════════════════ */

async function tMerge() {
  setTStatus('جارٍ دمج الملفات...');
  const merged = await PDFDocument.create();
  for (let i = 0; i < App.toolFiles.length; i++) {
    setTProg(10 + (i / App.toolFiles.length) * 80);
    setTStatus(`معالجة: ${App.toolFiles[i].name}`);
    const b = await readBytes(App.toolFiles[i]);
    const d = await PDFDocument.load(b);
    const pgs = await merged.copyPages(d, d.getPageIndices());
    pgs.forEach(p => merged.addPage(p));
  }
  setTProg(95);
  const out = await merged.save();
  showToolResult('merged.pdf', out, `· ${merged.getPageCount()} صفحة`);
}

async function tSplit() {
  setTStatus('جارٍ تقسيم الملف...');
  const b = await readBytes(App.toolFiles[0]);
  const d = await PDFDocument.load(b);
  const total = d.getPageCount();
  const mode = $('split-mode')?.value || 'all';
  const items = [];

  if (mode === 'all') {
    for (let i = 0; i < total; i++) {
      setTProg(10 + (i / total) * 80);
      const nd = await PDFDocument.create();
      const [pg] = await nd.copyPages(d, [i]);
      nd.addPage(pg);
      const out = await nd.save();
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      items.push({ name: `page-${i+1}.pdf`, url, size: formatBytes(out.byteLength) });
    }
  } else if (mode === 'range') {
    const idx = parseRanges($('split-range')?.value || '1', total);
    const nd = await PDFDocument.create();
    const pgs = await nd.copyPages(d, idx);
    pgs.forEach(p => nd.addPage(p));
    const out = await nd.save();
    const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
    items.push({ name: 'split-range.pdf', url, size: formatBytes(out.byteLength) });
  } else {
    const n = parseInt($('split-n')?.value) || 2;
    let chunk = 0;
    for (let i = 0; i < total; i += n) {
      const nd = await PDFDocument.create();
      const idx = [];
      for (let j = i; j < Math.min(i + n, total); j++) idx.push(j);
      const pgs = await nd.copyPages(d, idx);
      pgs.forEach(p => nd.addPage(p));
      const out = await nd.save();
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      items.push({ name: `split-${++chunk}.pdf`, url, size: formatBytes(out.byteLength) });
      setTProg(10 + (i / total) * 80);
    }
  }
  showMultiResults(items);
}

async function tExtract() {
  setTStatus('جارٍ استخراج الصفحات...');
  const b = await readBytes(App.toolFiles[0]);
  const d = await PDFDocument.load(b);
  const idx = parseRanges($('extract-range')?.value || '1', d.getPageCount());
  setTProg(50);
  const nd = await PDFDocument.create();
  const pgs = await nd.copyPages(d, idx);
  pgs.forEach(p => nd.addPage(p));
  const out = await nd.save();
  showToolResult('extracted.pdf', out, `· ${nd.getPageCount()} صفحة`);
}

async function tDeletePages() {
  setTStatus('جارٍ حذف الصفحات...');
  const b = await readBytes(App.toolFiles[0]);
  const d = await PDFDocument.load(b);
  const total = d.getPageCount();
  const toDel = new Set(parseRanges($('delete-range')?.value || '2', total));
  const keep = [];
  for (let i = 0; i < total; i++) if (!toDel.has(i)) keep.push(i);
  setTProg(50);
  const nd = await PDFDocument.create();
  const pgs = await nd.copyPages(d, keep);
  pgs.forEach(p => nd.addPage(p));
  const out = await nd.save();
  showToolResult('deleted-pages.pdf', out, `· ${nd.getPageCount()} صفحة متبقية`);
}

async function tReorder() {
  setTStatus('جارٍ إعادة الترتيب...');
  const b = await readBytes(App.toolFiles[0]);
  const d = await PDFDocument.load(b);
  const chips = $$('#reorder-list [data-pg]');
  const newOrder = [...chips].map(c => parseInt(c.dataset.pg) - 1);
  setTProg(50);
  const nd = await PDFDocument.create();
  const pgs = await nd.copyPages(d, newOrder);
  pgs.forEach(p => nd.addPage(p));
  const out = await nd.save();
  showToolResult('reordered.pdf', out);
}

async function tImg2pdf() {
  setTStatus('جارٍ تحويل الصور...');
  const pd = await PDFDocument.create();
  for (let i = 0; i < App.toolFiles.length; i++) {
    setTProg(10 + (i / App.toolFiles.length) * 80);
    const du = await readDataURL(App.toolFiles[i]);
    const b64 = du.split(',')[1];
    const imgBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    let img;
    if (App.toolFiles[i].type === 'image/png') img = await pd.embedPng(imgBytes);
    else img = await pd.embedJpg(imgBytes);
    const pg = pd.addPage([img.width, img.height]);
    pg.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  setTProg(95);
  const out = await pd.save();
  showToolResult('images.pdf', out, `· ${pd.getPageCount()} صفحة`);
}

async function tPdf2img() {
  setTStatus('جارٍ تحويل PDF إلى صور...');
  const scale = parseFloat($('img-scale')?.value || '2');
  const fmt   = $('img-fmt')?.value || 'png';
  const b = await readBytes(App.toolFiles[0]);
  const doc = await pdfjsLib.getDocument({ data: b }).promise;
  const total = doc.numPages;
  const items = [];
  for (let i = 1; i <= total; i++) {
    setTProg(10 + (i / total) * 80);
    setTStatus(`تحويل صفحة ${i} من ${total}`);
    const pg = await doc.getPage(i);
    const vp = pg.getViewport({ scale });
    const c = document.createElement('canvas');
    c.width = vp.width; c.height = vp.height;
    await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    const url = c.toDataURL(fmt === 'jpeg' ? 'image/jpeg' : 'image/png', 0.92);
    items.push({ url, name: `page-${i}.${fmt}`, size: formatBytes(Math.round(url.length * 0.75)) });
  }
  const r = $('tool-result');
  if (r) r.innerHTML = `<div class="multi-results">${items.map(it =>
    `<div class="mres-item">
      <img src="${it.url}" style="width:100%;border-radius:4px;border:1px solid var(--b1);aspect-ratio:3/4;object-fit:cover">
      <div class="mres-name">${it.name}</div>
      <a href="${it.url}" download="${it.name}" class="mres-dl" style="display:block;text-align:center">⬇ تنزيل</a>
    </div>`).join('')}</div>`;
  if ($('t-prog')) $('t-prog').style.display = 'none';
  if ($('tool-status')) $('tool-status').innerHTML = '';
  toast(`تم تحويل ${items.length} صفحة ✓`, 'ok');
}

async function tWord2pdf() {
  setTStatus('جارٍ قراءة ملف Word...');
  setTProg(20);
  const b = await readBytes(App.toolFiles[0]);
  let html;
  try {
    const res = await mammoth.convertToHtml({ arrayBuffer: b.buffer });
    html = res.value;
  } catch (e) { throw new Error('تعذّر قراءة الملف — تأكد أنه DOCX صحيح'); }
  setTProg(50);
  const pd = await PDFDocument.create();
  const font = await pd.embedFont(StandardFonts.Helvetica);
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const lines = []; let line = '';
  plain.split(' ').forEach(w => {
    const t = line ? line + ' ' + w : w;
    if (font.widthOfTextAtSize(t, 11) > 500) { lines.push(line); line = w; }
    else line = t;
  });
  if (line) lines.push(line);
  let pg = pd.addPage(PageSizes.A4);
  let y = pg.getSize().height - 50;
  for (const ln of lines) {
    if (y < 50) { pg = pd.addPage(PageSizes.A4); y = pg.getSize().height - 50; }
    try { pg.drawText(ln, { x: 45, y, size: 11, font, color: rgb(.1, .1, .1), maxWidth: 500 }); } catch (e) {}
    y -= 18;
  }
  setTProg(90);
  const out = await pd.save();
  showToolResult('converted.pdf', out);
}

async function tHtmlToPdf() {
  setTStatus('جارٍ التحويل...');
  const html = $('html-in')?.value || '';
  setTProg(30);
  const pd = await PDFDocument.create();
  const font = await pd.embedFont(StandardFonts.Helvetica);
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
  const lines = []; let line = '';
  plain.split(' ').forEach(w => {
    const t = line ? line + ' ' + w : w;
    if (font.widthOfTextAtSize(t, 12) > 500) { lines.push(line); line = w; }
    else line = t;
  });
  if (line) lines.push(line);
  const pg = pd.addPage(PageSizes.A4);
  let y = pg.getSize().height - 50;
  for (const ln of lines) {
    if (y < 50) break;
    try { pg.drawText(ln, { x: 45, y, size: 12, font, color: rgb(.05, .05, .05) }); } catch (e) {}
    y -= 20;
  }
  const out = await pd.save();
  showToolResult('from-html.pdf', out);
}

async function tCompress() {
  setTStatus('جارٍ ضغط الملف...');
  setTProg(30);
  const b = await readBytes(App.toolFiles[0]);
  const d = await PDFDocument.load(b);
  setTProg(70);
  const out = await d.save({ useObjectStreams: true, addDefaultPage: false });
  const saved = Math.max(0, ((b.byteLength - out.byteLength) / b.byteLength * 100)).toFixed(0);
  showToolResult('compressed.pdf', out, `· وفّر ${saved}%`);
}

async function tRotate() {
  setTStatus('جارٍ التدوير...');
  const b = await readBytes(App.toolFiles[0]);
  const d = await PDFDocument.load(b);
  const deg  = parseInt($('rot-dir')?.value   || '90');
  const mode = $('rot-pages')?.value || 'all';
  const total = d.getPageCount();
  setTProg(40);
  d.getPages().forEach((pg, i) => {
    const n = i + 1;
    const ok = mode === 'all' || (mode === 'odd' && n % 2 !== 0) || (mode === 'even' && n % 2 === 0) || (mode === 'first' && n === 1) || (mode === 'last' && n === total);
    if (ok) pg.setRotation(degrees(deg));
  });
  const out = await d.save();
  showToolResult('rotated.pdf', out);
}

async function tWatermark() {
  setTStatus('جارٍ إضافة العلامة المائية...');
  const b = await readBytes(App.toolFiles[0]);
  const d = await PDFDocument.load(b);
  const font = await d.embedFont(StandardFonts.HelveticaBold);
  const txt = $('wm-txt')?.value  || 'علامة مائية';
  const sz  = parseInt($('wm-sz')?.value  || '52');
  const op  = parseInt($('wm-op')?.value  || '18') / 100;
  const ang = parseInt($('wm-ang')?.value || '-30');
  const col = hexRGB(wmColor || '#1a1a1a');
  const pos = $('wm-pos')?.value  || 'center';
  setTProg(40);
  d.getPages().forEach(pg => {
    const { width, height } = pg.getSize();
    let tw = 0;
    try { tw = font.widthOfTextAtSize(txt, sz); } catch (e) { tw = sz * txt.length * 0.6; }
    if (pos === 'tile') {
      for (let x = 0; x < width; x += tw + 80)
        for (let y = 0; y < height; y += sz * 2.5 + 20)
          try { pg.drawText(txt, { x, y, size: sz, font, color: col, opacity: op, rotate: degrees(ang) }); } catch (e) {}
    } else {
      const x = pos.includes('center') || pos === 'top' || pos === 'bottom' ? (width - tw) / 2 : pos.includes('right') ? width - tw - 30 : 30;
      const y = pos === 'top' ? height - sz - 20 : pos === 'bottom' ? 20 : (height - sz) / 2;
      try { pg.drawText(txt, { x, y, size: sz, font, color: col, opacity: op, rotate: degrees(ang) }); } catch (e) {}
    }
  });
  setTProg(90);
  const out = await d.save();
  showToolResult('watermarked.pdf', out);
}

async function tCrop() {
  if (!App.cropRect) { toast('يرجى تحديد منطقة القص أولاً', 'warn'); return; }
  setTStatus('جارٍ القص...');
  const b = await readBytes(App.toolFiles[0]);
  const d = await PDFDocument.load(b);
  const cr = App.cropRect;
  const mode = $('crop-pages')?.value || 'all';
  const total = d.getPageCount();
  setTProg(40);
  d.getPages().forEach((pg, i) => {
    const n = i + 1;
    const ok = mode === 'all' || (mode === 'odd' && n % 2 !== 0) || (mode === 'even' && n % 2 === 0) || (mode === 'first' && n === 1);
    if (!ok) return;
    const { width: pW, height: pH } = pg.getSize();
    const sx = pW / cr.canvasW, sy = pH / cr.canvasH;
    const x = cr.x * sx, y = pH - (cr.y + cr.h) * sy;
    const w = cr.w * sx, h = cr.h * sy;
    pg.setCropBox(x, y, w, h);
    pg.setMediaBox(x, y, w, h);
  });
  setTProg(90);
  const out = await d.save();
  showToolResult('cropped.pdf', out);
}

async function tAddNumbers() {
  setTStatus('جارٍ إضافة أرقام الصفحات...');
  const b = await readBytes(App.toolFiles[0]);
  const d = await PDFDocument.load(b);
  const font = await d.embedFont(StandardFonts.Helvetica);
  const pos   = $('pn-pos')?.value   || 'bc';
  const fmt   = $('pn-fmt')?.value   || 'n';
  const sz    = parseInt($('pn-sz')?.value    || '12');
  const start = parseInt($('pn-start')?.value || '1') - 1;
  const pgs   = d.getPages();
  const total = pgs.length;
  setTProg(40);
  pgs.forEach((pg, i) => {
    if (i < start) return;
    const n = i + 1;
    const label = fmt === 'n' ? String(n) : fmt === 'p' ? `صفحة ${n}` : `${n} / ${total}`;
    const { width, height } = pg.getSize();
    const tw = sz * label.length * 0.6;
    const x = pos.includes('c') ? (width - tw) / 2 : pos.includes('r') ? width - tw - 20 : 20;
    const y = pos.includes('t') ? height - sz - 15 : 15;
    try { pg.drawText(label, { x, y, size: sz, font, color: rgb(.3, .3, .3), opacity: .85 }); } catch (e) {}
  });
  setTProg(90);
  const out = await d.save();
  showToolResult('numbered.pdf', out);
}

async function tProtect() {
  const pass = $('p-pass')?.value;
  if (!pass) { toast('يرجى إدخال كلمة مرور', 'err'); return; }
  setTStatus('جارٍ التشفير...');
  setTProg(40);
  const b = await readBytes(App.toolFiles[0]);
  const d = await PDFDocument.load(b);
  setTProg(75);
  const out = await d.save();
  showToolResult('protected.pdf', out);
  const r = $('tool-result');
  if (r) r.innerHTML += `<div class="notice" style="margin-top:8px"><div class="notice-icon">💡</div><div class="notice-text">للتشفير الكامل بكلمة مرور استخدم Adobe Acrobat أو qpdf.</div></div>`;
}

async function tUnlock() {
  setTStatus('جارٍ فك التشفير...');
  setTProg(30);
  const b = await readBytes(App.toolFiles[0]);
  try {
    const d = await PDFDocument.load(b, { ignoreEncryption: true });
    setTProg(70);
    const out = await d.save();
    showToolResult('unlocked.pdf', out);
  } catch (e) { throw new Error('تعذّر فك التشفير'); }
}

async function tFlatten() {
  setTStatus('جارٍ التثبيت...');
  setTProg(30);
  const b = await readBytes(App.toolFiles[0]);
  const d = await PDFDocument.load(b);
  try { d.getForm().flatten(); } catch (e) {}
  setTProg(80);
  const out = await d.save();
  showToolResult('flattened.pdf', out);
}

/* ══════════════════════════════════════════════
   SCANNER WORKFLOW
══════════════════════════════════════════════ */
function addScanFiles(files) {
  for (const f of files) App.scanFiles.push(f);
  renderScannerGrid();
  if ($('tool-abar')) $('tool-abar').style.display = App.scanFiles.length ? 'flex' : 'none';
}

function renderScannerGrid() {
  const grid = $('scanner-grid'); if (!grid) return;
  grid.innerHTML = App.scanFiles.map((f, i) => {
    const isImg = f.type.startsWith('image/');
    return `<div class="scan-item" id="scan-${i}">
      ${isImg
        ? `<img class="scan-item-img" src="${URL.createObjectURL(f)}" alt="صفحة ${i+1}">`
        : `<div class="scan-item-img placeholder" style="display:flex;align-items:center;justify-content:center;background:var(--s3)">📄</div>`
      }
      <div class="scan-edit-overlay">
        <button class="scan-edit-btn" onclick="rotateScanItem(${i})" title="تدوير">🔄</button>
        <button class="scan-edit-btn" onclick="removeScanItem(${i})" title="حذف">🗑️</button>
      </div>
      <div class="scan-order">${i + 1}</div>
      <div class="scan-item-footer">
        <span class="scan-item-name">${f.name}</span>
        <button class="scan-item-del" onclick="removeScanItem(${i})">✕</button>
      </div>
    </div>`;
  }).join('');
  // make sortable by drag
  bindScanDrag();
}

function removeScanItem(i) {
  App.scanFiles.splice(i, 1);
  renderScannerGrid();
  if (!App.scanFiles.length && $('tool-abar')) $('tool-abar').style.display = 'none';
}

function rotateScanItem(i) {
  // store rotation per item
  if (!App._scanRotations) App._scanRotations = {};
  App._scanRotations[i] = ((App._scanRotations[i] || 0) + 90) % 360;
  const img = document.querySelector(`#scan-${i} .scan-item-img`);
  if (img) img.style.transform = `rotate(${App._scanRotations[i]}deg)`;
}

function bindScanDrag() {
  const grid = $('scanner-grid'); if (!grid) return;
  let dragIdx = null;
  $$('.scan-item').forEach((item, i) => {
    item.draggable = true;
    item.addEventListener('dragstart', () => { dragIdx = i; item.style.opacity = '.4'; });
    item.addEventListener('dragend',   () => { item.style.opacity = '1'; dragIdx = null; });
    item.addEventListener('dragover',  e  => e.preventDefault());
    item.addEventListener('drop', e => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === i) return;
      const moved = App.scanFiles.splice(dragIdx, 1)[0];
      App.scanFiles.splice(i, 0, moved);
      renderScannerGrid();
    });
  });
}

function clearScanner() {
  App.scanFiles = [];
  App._scanRotations = {};
  renderScannerGrid();
  if ($('tool-abar')) $('tool-abar').style.display = 'none';
  if ($('tool-result')) $('tool-result').innerHTML = '';
}

async function runScannerBuild() {
  if (!App.scanFiles.length) { toast('يرجى رفع ملفات أولاً', 'err'); return; }
  setTStatus('جارٍ بناء PDF من السكانر...');
  const pd = await PDFDocument.create();
  for (let i = 0; i < App.scanFiles.length; i++) {
    setTProg(10 + (i / App.scanFiles.length) * 85);
    setTStatus(`إضافة صفحة ${i + 1} من ${App.scanFiles.length}`);
    const f = App.scanFiles[i];
    try {
      if (f.type === 'application/pdf') {
        const b = await readBytes(f);
        const src = await PDFDocument.load(b);
        const pgs = await pd.copyPages(src, src.getPageIndices());
        pgs.forEach(p => pd.addPage(p));
      } else {
        const du = await readDataURL(f);
        const b64 = du.split(',')[1];
        const imgB = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        let img;
        if (f.type === 'image/png') img = await pd.embedPng(imgB);
        else img = await pd.embedJpg(imgB);
        // A4 dimensions
        const pg = pd.addPage(PageSizes.A4);
        const { width: pW, height: pH } = pg.getSize();
        const scale = Math.min(pW / img.width, pH / img.height, 1);
        const w = img.width * scale, h = img.height * scale;
        const x = (pW - w) / 2, y = (pH - h) / 2;
        pg.drawImage(img, { x, y, width: w, height: h });
      }
    } catch (e) { console.warn(`Skip file ${f.name}:`, e); }
  }
  setTProg(95);
  const out = await pd.save();
  showToolResult('scanned-document.pdf', out, `· ${pd.getPageCount()} صفحة`);
}

/* ══════════════════════════════════════════════
   EDITOR MODE
══════════════════════════════════════════════ */

// File input
$('ed-file-input').addEventListener('change', e => { if (e.target.files[0]) edLoadPDF(e.target.files[0]); });
const edDrop = $('editor-drop');
$('editor-center').addEventListener('dragover', e => { e.preventDefault(); edDrop.classList.add('dragover'); });
$('editor-center').addEventListener('dragleave', () => edDrop.classList.remove('dragover'));
$('editor-center').addEventListener('drop', e => {
  e.preventDefault(); edDrop.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f?.name.toLowerCase().endsWith('.pdf')) edLoadPDF(f);
  else toast('يرجى إسقاط ملف PDF', 'err');
});

// Color palette
$('ed-cpal').addEventListener('click', e => {
  const sw = e.target.closest('[data-c]'); if (!sw) return;
  $$('#ed-cpal .cp-swatch').forEach(s => s.classList.remove('active'));
  sw.classList.add('active');
  App.edColor = sw.dataset.c;
  updSel();
});
function setEdCustomColor(v) {
  App.edColor = v;
  $$('#ed-cpal .cp-swatch').forEach(s => s.classList.remove('active'));
  updSel();
}

async function edLoadPDF(file) {
  const fr = new FileReader();
  fr.onload = async e => {
    try {
      App.edPdfBytes = new Uint8Array(e.target.result);
      App.edPdfJsDoc = await pdfjsLib.getDocument({ data: App.edPdfBytes }).promise;
      App.edTotalPages = App.edPdfJsDoc.numPages;
      App.edPage = 1;
      App.anns = {};
      for (let i = 1; i <= App.edTotalPages; i++) App.anns[i] = [];
      $('file-badge').textContent = file.name;
      $('save-name').value = file.name.replace(/\.pdf$/i, '') + '-edited';
      edDrop.classList.add('hidden');
      $('pdf-view').classList.add('vis');
      $('page-nav').classList.toggle('vis', App.edTotalPages > 1);
      await edRender();
      toast('تم فتح الملف ✓', 'ok');
    } catch (err) { toast('خطأ: ' + err.message, 'err'); }
  };
  fr.readAsArrayBuffer(file);
}

async function edRender() {
  if (!App.edPdfJsDoc) return;
  const pg = await App.edPdfJsDoc.getPage(App.edPage);
  const vp = pg.getViewport({ scale: App.edZoom });
  const canvas = $('pageCanvas');
  canvas.width = vp.width; canvas.height = vp.height;
  await pg.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  const ovl = $('ovl');
  ovl.style.width = vp.width + 'px'; ovl.style.height = vp.height + 'px';
  $('pg-info').textContent = `صفحة ${App.edPage} من ${App.edTotalPages}`;
  $('pg-prev').disabled = App.edPage <= 1;
  $('pg-next').disabled = App.edPage >= App.edTotalPages;
  $('zoom-val').textContent = Math.round(App.edZoom * 100) + '%';
  edUpdateOvl();
  edBindOvl();
}

function chEdPage(d) {
  const n = App.edPage + d;
  if (n < 1 || n > App.edTotalPages) return;
  App.edPage = n; App.selAnn = null; edRender();
}

function chEdZoom(d) {
  App.edZoom = Math.max(.3, Math.min(3, App.edZoom + d / 100));
  edRender();
}

/* ── EDITOR TOOLS ── */
function setEdTool(t) {
  App.edTool = t;
  $$('.etool').forEach(el => el.classList.remove('active'));
  const el = $('et-' + t); if (el) el.classList.add('active');
  const ovl = $('ovl');
  ovl.className = 'ovl ' + t;
  if (t === 'sel') App.selAnn = null;
  edUpdateOvl();
}

/* ── OVL EVENTS ── */
let _isDrawing = false, _drawPath = [], _hlStart = null, _shpStart = null;

function edBindOvl() {
  const ovl = $('ovl');
  ovl.onmousedown = edOnDown;
  ovl.onmousemove = edOnMove;
  ovl.onmouseup   = edOnUp;
  ovl.onclick     = edOnClick;
}

function edPos(e) {
  const r = $('ovl').getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function edOnClick(e) { if (App.edTool === 'text') edCreateText(edPos(e)); }

function edOnDown(e) {
  const p = edPos(e);
  if (App.edTool === 'draw' || App.edTool === 'erase') { _isDrawing = true; _drawPath = [p]; }
  else if (App.edTool === 'highlight') { _isDrawing = true; _hlStart = p; }
  else if (['rect','circle','line','arrow'].includes(App.edTool)) { _isDrawing = true; _shpStart = p; }
}

function edOnMove(e) {
  if (!_isDrawing) return;
  const p = edPos(e);
  if (App.edTool === 'draw' || App.edTool === 'erase') { _drawPath.push(p); edLiveDraw(); }
  else if (App.edTool === 'highlight' && _hlStart) edLiveHL(p);
  else if (['rect','circle','line','arrow'].includes(App.edTool) && _shpStart) edLiveShape(p);
}

function edOnUp(e) {
  if (!_isDrawing) return;
  const p = edPos(e); _isDrawing = false;
  $('ovl').querySelectorAll('.live').forEach(el => el.remove());
  if (App.edTool === 'draw' && _drawPath.length > 1) {
    edAddAnn({ type: 'draw', path: [..._drawPath], color: App.edColor, width: +gV('ed-sw'), opacity: +gV('ed-opc') / 100 });
  } else if (App.edTool === 'erase') {
    edEraseAt(_drawPath);
  } else if (App.edTool === 'highlight' && _hlStart) {
    const w = Math.abs(p.x - _hlStart.x), h = Math.abs(p.y - _hlStart.y);
    if (w > 8 || h > 8) edAddAnn({ type: 'hl', x: Math.min(p.x, _hlStart.x), y: Math.min(p.y, _hlStart.y), w, h, color: App.edColor, opacity: +gV('ed-opc') / 100 || .4 });
    _hlStart = null;
  } else if (['rect','circle','line','arrow'].includes(App.edTool) && _shpStart) {
    const w = p.x - _shpStart.x, h = p.y - _shpStart.y;
    if (Math.abs(w) > 5 || Math.abs(h) > 5) edAddAnn({ type: App.edTool, x: _shpStart.x, y: _shpStart.y, w, h, color: App.edColor, sw: +gV('ed-sw'), fill: $('ed-fill')?.checked, opacity: +gV('ed-opc') / 100 });
    _shpStart = null;
  }
  _drawPath = [];
}

function gV(id) { return document.getElementById(id)?.value || ''; }

/* ── LIVE DRAWING ── */
function mkSVG() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  s.classList.add('live'); return s;
}

function edLiveDraw() {
  $('ovl').querySelectorAll('.live').forEach(el => el.remove());
  if (_drawPath.length < 2) return;
  const svg = mkSVG();
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  let d = `M ${_drawPath[0].x} ${_drawPath[0].y}`;
  _drawPath.slice(1).forEach(p => d += ` L ${p.x} ${p.y}`);
  path.setAttribute('d', d); path.setAttribute('stroke', App.edColor);
  path.setAttribute('stroke-width', gV('ed-sw') || 2); path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path); $('ovl').appendChild(svg);
}

function edLiveHL(p) {
  $('ovl').querySelectorAll('.live').forEach(el => el.remove());
  const div = document.createElement('div'); div.className = 'live';
  div.style.cssText = `position:absolute;left:${Math.min(p.x,_hlStart.x)}px;top:${Math.min(p.y,_hlStart.y)}px;width:${Math.abs(p.x-_hlStart.x)}px;height:${Math.abs(p.y-_hlStart.y)}px;background:${App.edColor};opacity:${gV('ed-opc')/100||.4};pointer-events:none;border-radius:3px`;
  $('ovl').appendChild(div);
}

function edLiveShape(p) {
  $('ovl').querySelectorAll('.live').forEach(el => el.remove());
  const svg = mkSVG();
  if (App.edTool === 'rect') {
    const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('x', Math.min(p.x,_shpStart.x)); r.setAttribute('y', Math.min(p.y,_shpStart.y));
    r.setAttribute('width', Math.abs(p.x-_shpStart.x)); r.setAttribute('height', Math.abs(p.y-_shpStart.y));
    r.setAttribute('stroke', App.edColor); r.setAttribute('stroke-width', gV('ed-sw'));
    r.setAttribute('fill', $('ed-fill')?.checked ? App.edColor+'44' : 'none');
    svg.appendChild(r);
  } else if (App.edTool === 'circle') {
    const el2 = document.createElementNS('http://www.w3.org/2000/svg','ellipse');
    el2.setAttribute('cx', (_shpStart.x+p.x)/2); el2.setAttribute('cy', (_shpStart.y+p.y)/2);
    el2.setAttribute('rx', Math.abs(p.x-_shpStart.x)/2); el2.setAttribute('ry', Math.abs(p.y-_shpStart.y)/2);
    el2.setAttribute('stroke', App.edColor); el2.setAttribute('stroke-width', gV('ed-sw'));
    el2.setAttribute('fill', $('ed-fill')?.checked ? App.edColor+'44' : 'none');
    svg.appendChild(el2);
  } else {
    const l = document.createElementNS('http://www.w3.org/2000/svg','line');
    l.setAttribute('x1',_shpStart.x);l.setAttribute('y1',_shpStart.y);l.setAttribute('x2',p.x);l.setAttribute('y2',p.y);
    l.setAttribute('stroke',App.edColor);l.setAttribute('stroke-width',gV('ed-sw'));l.setAttribute('stroke-linecap','round');
    svg.appendChild(l);
  }
  $('ovl').appendChild(svg);
}

function edEraseAt(path) {
  if (!path.length) return;
  App.anns[App.edPage] = (App.anns[App.edPage]||[]).filter(ann => {
    if (ann.type !== 'draw') return true;
    for (const p of path) for (const sp of ann.path) if (Math.hypot(p.x-sp.x, p.y-sp.y) < 16) return false;
    return true;
  });
  edUpdateOvl(); updElemList();
}

function edAddAnn(ann) {
  ann.id = Date.now() + Math.random();
  App.anns[App.edPage].push(ann);
  App.edHistory.push({ page: App.edPage, id: ann.id });
  edUpdateOvl(); updElemList();
}

function edCreateText(pos) {
  const ann = {
    type: 'text', x: pos.x, y: pos.y, text: 'اكتب هنا',
    color: App.edColor, fs: +gV('ed-fsz')||18, ff: gV('ed-ff'),
    bold: $('ed-bold')?.classList.contains('active'),
    italic: $('ed-ital')?.classList.contains('active'),
    uline: $('ed-uline')?.classList.contains('active'),
    opacity: 1,
  };
  edAddAnn(ann);
  setTimeout(() => {
    const el = document.querySelector(`[data-id="${ann.id}"] .abody`);
    if (el) { el.focus(); const r = document.createRange(); r.selectNodeContents(el); window.getSelection().removeAllRanges(); window.getSelection().addRange(r); }
  }, 40);
}

/* ── RENDER OVERLAY ── */
function edUpdateOvl() {
  const ovl = $('ovl');
  ovl.querySelectorAll('.ann,.svgl').forEach(el => el.remove());
  const list = App.anns[App.edPage] || [];
  // SVG shapes
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('svgl');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  let hasSVG = false;
  list.forEach(ann => {
    if (ann.type === 'draw') {
      hasSVG = true;
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      let d = `M ${ann.path[0].x} ${ann.path[0].y}`;
      ann.path.slice(1).forEach(p => d += ` L ${p.x} ${p.y}`);
      path.setAttribute('d',d);path.setAttribute('stroke',ann.color||'#000');path.setAttribute('stroke-width',ann.width||2);path.setAttribute('fill','none');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');path.setAttribute('opacity',ann.opacity||1);
      svg.appendChild(path);
    } else if (ann.type === 'rect') {
      hasSVG = true;
      const x=ann.w<0?ann.x+ann.w:ann.x,y=ann.h<0?ann.y+ann.h:ann.y;
      const r=document.createElementNS('http://www.w3.org/2000/svg','rect');
      r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',Math.abs(ann.w));r.setAttribute('height',Math.abs(ann.h));r.setAttribute('stroke',ann.color);r.setAttribute('stroke-width',ann.sw||2);r.setAttribute('fill',ann.fill?ann.color+'44':'none');r.setAttribute('opacity',ann.opacity||1);
      svg.appendChild(r);
    } else if (ann.type === 'circle') {
      hasSVG = true;
      const cx=(ann.x+ann.w/2),cy=(ann.y+ann.h/2),rx=Math.abs(ann.w/2),ry=Math.abs(ann.h/2);
      const el2=document.createElementNS('http://www.w3.org/2000/svg','ellipse');
      el2.setAttribute('cx',cx);el2.setAttribute('cy',cy);el2.setAttribute('rx',rx);el2.setAttribute('ry',ry);el2.setAttribute('stroke',ann.color);el2.setAttribute('stroke-width',ann.sw||2);el2.setAttribute('fill',ann.fill?ann.color+'44':'none');el2.setAttribute('opacity',ann.opacity||1);
      svg.appendChild(el2);
    } else if (ann.type === 'line' || ann.type === 'arrow') {
      hasSVG = true;
      const mid = 'mk'+ann.id;
      if (ann.type === 'arrow') {
        const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
        const mk=document.createElementNS('http://www.w3.org/2000/svg','marker');
        mk.setAttribute('id',mid);mk.setAttribute('markerWidth','10');mk.setAttribute('markerHeight','7');mk.setAttribute('refX','9');mk.setAttribute('refY','3.5');mk.setAttribute('orient','auto');
        const poly=document.createElementNS('http://www.w3.org/2000/svg','polygon');
        poly.setAttribute('points','0 0, 10 3.5, 0 7');poly.setAttribute('fill',ann.color);
        mk.appendChild(poly);defs.appendChild(mk);svg.appendChild(defs);
      }
      const l=document.createElementNS('http://www.w3.org/2000/svg','line');
      l.setAttribute('x1',ann.x);l.setAttribute('y1',ann.y);l.setAttribute('x2',ann.x+ann.w);l.setAttribute('y2',ann.y+ann.h);l.setAttribute('stroke',ann.color);l.setAttribute('stroke-width',ann.sw||2);l.setAttribute('stroke-linecap','round');l.setAttribute('opacity',ann.opacity||1);
      if(ann.type==='arrow')l.setAttribute('marker-end',`url(#${mid})`);
      svg.appendChild(l);
    }
  });
  if (hasSVG) ovl.appendChild(svg);

  // DOM annotations
  list.forEach(ann => {
    if (['draw','rect','circle','line','arrow'].includes(ann.type)) return;
    const div = document.createElement('div');
    div.className = 'ann'; div.dataset.id = ann.id;
    if (App.selAnn?.id === ann.id) div.classList.add('sel');

    if (ann.type === 'text') {
      div.classList.add('ann-text');
      div.style.cssText = `left:${ann.x}px;top:${ann.y}px`;
      const body = document.createElement('div');
      body.className = 'abody'; body.contentEditable = 'true'; body.textContent = ann.text || '';
      body.style.cssText = `color:${ann.color};font-size:${ann.fs||18}px;font-family:${ann.ff||'Cairo,sans-serif'};font-weight:${ann.bold?'bold':'normal'};font-style:${ann.italic?'italic':'normal'};text-decoration:${ann.uline?'underline':'none'};opacity:${ann.opacity||1};min-width:60px;background:transparent`;
      body.oninput = () => { ann.text = body.innerText; updElemList(); };
      div.appendChild(body);
    } else if (ann.type === 'hl') {
      div.classList.add('ann-hl'); div.style.cssText = `left:${ann.x}px;top:${ann.y}px`;
      const body = document.createElement('div'); body.className = 'abody';
      body.style.cssText = `width:${ann.w}px;height:${ann.h}px;background:${ann.color};opacity:${ann.opacity||.4}`;
      div.appendChild(body);
    } else if (ann.type === 'sig') {
      div.classList.add('ann-sig'); div.style.cssText = `left:${ann.x||80}px;top:${ann.y||80}px`;
      const body = document.createElement('div'); body.className = 'abody';
      if (ann.stype === 'draw') {
        const c = document.createElement('canvas'); c.width = ann.sw2||200; c.height = ann.sh||80; c.style.cssText = 'display:block;border-radius:4px';
        const ctx = c.getContext('2d');
        if (ann.dataUrl) { const img = new Image(); img.onload = () => ctx.drawImage(img,0,0); img.src = ann.dataUrl; }
        body.appendChild(c);
      } else {
        body.style.cssText = `font-size:${ann.fs2||34}px;font-family:Georgia,serif;color:${ann.color||'#1a3060'};font-weight:700;white-space:nowrap;padding:4px 8px`;
        body.textContent = ann.stxt || '';
      }
      div.appendChild(body);
    }

    const del = document.createElement('button'); del.className = 'adel'; del.textContent = '✕';
    del.onclick = e => { e.stopPropagation(); edDelAnn(ann.id); };
    div.appendChild(del);

    edMakeDraggable(div, ann);
    div.addEventListener('mousedown', e => {
      if (App.edTool !== 'sel') return;
      e.stopPropagation();
      App.selAnn = ann; loadEdPanel(ann);
      $$('.ann').forEach(a => a.classList.remove('sel')); div.classList.add('sel');
      $$('.elem-item').forEach(el => el.classList.toggle('active', el.dataset.id == ann.id));
    });
    ovl.appendChild(div);
  });
}

function edMakeDraggable(el, ann) {
  let sx,sy,ox,oy;
  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('adel') || e.target.contentEditable === 'true') return;
    if (App.edTool !== 'sel') return;
    e.preventDefault();
    sx=e.clientX;sy=e.clientY;ox=ann.x||0;oy=ann.y||0;
    const mv = me => { ann.x=ox+(me.clientX-sx);ann.y=oy+(me.clientY-sy);el.style.left=ann.x+'px';el.style.top=ann.y+'px'; };
    const up = () => { document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up); };
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
  });
}

function edDelAnn(id) { App.anns[App.edPage]=App.anns[App.edPage].filter(a=>a.id!==id); App.selAnn=null; edUpdateOvl(); updElemList(); }

function loadEdPanel(ann) {
  if (!ann) return;
  if (ann.color) { App.edColor=ann.color; $$('#ed-cpal [data-c]').forEach(s=>s.classList.toggle('active',s.dataset.c===ann.color)); }
  if (ann.fs) { const el=$('ed-fsz');if(el){el.value=ann.fs;$('ed-fsz-v').textContent=ann.fs;} }
  if (ann.sw) { const el=$('ed-sw');if(el){el.value=ann.sw;$('ed-sw-v').textContent=ann.sw;} }
  if (ann.opacity!==undefined){const v=Math.round(ann.opacity*100);const el=$('ed-opc');if(el){el.value=v;$('ed-opc-v').textContent=v+'%';}}
  if (ann.bold!==undefined)$('ed-bold')?.classList.toggle('active',ann.bold);
  if (ann.italic!==undefined)$('ed-ital')?.classList.toggle('active',ann.italic);
  if (ann.uline!==undefined)$('ed-uline')?.classList.toggle('active',ann.uline);
}

function updSel() {
  if (!App.selAnn) return;
  const ann = App.anns[App.edPage]?.find(a => a.id === App.selAnn.id); if (!ann) return;
  ann.color = App.edColor; ann.sw = +gV('ed-sw'); ann.opacity = +gV('ed-opc')/100; ann.fill = $('ed-fill')?.checked;
  if (ann.type==='text'){ann.fs=+gV('ed-fsz');ann.ff=gV('ed-ff');ann.bold=$('ed-bold')?.classList.contains('active');ann.italic=$('ed-ital')?.classList.contains('active');ann.uline=$('ed-uline')?.classList.contains('active');}
  edUpdateOvl();
}

function updElemList() {
  const list = App.anns[App.edPage] || [];
  $('ed-ecount').textContent = list.length;
  const el = $('elements-list');
  if (!list.length) { el.innerHTML = '<div style="font-size:11px;color:var(--t3);text-align:center;padding:1rem;line-height:1.7">لا توجد عناصر بعد</div>'; return; }
  const icons = {text:'T',hl:'🖍',sig:'✍',draw:'✏',rect:'⬜',circle:'⭕',line:'╱',arrow:'→'};
  const names = {text:'نص',hl:'تضليل',sig:'توقيع',draw:'رسم حر',rect:'مستطيل',circle:'دائرة',line:'خط',arrow:'سهم'};
  el.innerHTML = list.map((a,i) => `
    <div class="elem-item ${App.selAnn?.id===a.id?'active':''}" data-id="${a.id}" onclick="selEdAnnById('${a.id}')">
      <div class="elem-icon">${icons[a.type]||'•'}</div>
      <div class="elem-info">
        <div class="elem-name">${a.type==='text'?(a.text||'نص').slice(0,15):names[a.type]||a.type} #${i+1}</div>
        <div class="elem-type">${names[a.type]||a.type}</div>
      </div>
      <button class="elem-del" onclick="event.stopPropagation();edDelAnn('${a.id}')">✕</button>
    </div>`).join('');
}

function selEdAnnById(id) {
  const a = (App.anns[App.edPage]||[]).find(a => String(a.id)===String(id)); if (!a) return;
  App.selAnn=a; loadEdPanel(a); edUpdateOvl(); updElemList();
}

function edUndo() { if (!App.edHistory.length){toast('لا شيء للتراجع');return;} const last=App.edHistory.pop(); App.anns[last.page]=(App.anns[last.page]||[]).filter(a=>a.id!==last.id); edUpdateOvl(); updElemList(); toast('تم التراجع ✓'); }
function edClearPage() { if(!App.anns[App.edPage]?.length){toast('الصفحة فارغة');return;} if(confirm('مسح كل عناصر هذه الصفحة؟')){App.anns[App.edPage]=[];App.selAnn=null;edUpdateOvl();updElemList();toast('تم المسح ✓');} }

/* ── SIGNATURE MODAL ── */
function openSigModal() {
  if (!App.edPdfJsDoc) { toast('افتح ملف PDF أولاً', 'err'); return; }
  $('sig-modal').classList.add('open');
  setTimeout(() => {
    const c = $('sigCanvas');
    c.width = c.offsetWidth || 440; c.height = 150;
    App.sigCtx = c.getContext('2d');
    App.sigCtx.strokeStyle = '#1a3060'; App.sigCtx.lineWidth = 2.5; App.sigCtx.lineCap = 'round'; App.sigCtx.lineJoin = 'round';
    const gP = (e,c) => { const r=c.getBoundingClientRect(); return{x:e.clientX-r.left,y:e.clientY-r.top}; };
    const gT = (e,c) => { const r=c.getBoundingClientRect(),t=e.touches[0]; return{x:t.clientX-r.left,y:t.clientY-r.top}; };
    c.onmousedown = e => { App.sigDrawing=true; App.sigLastPos=gP(e,c); };
    c.onmousemove = e => { if(!App.sigDrawing)return; const p=gP(e,c); App.sigCtx.beginPath();App.sigCtx.moveTo(App.sigLastPos.x,App.sigLastPos.y);App.sigCtx.lineTo(p.x,p.y);App.sigCtx.stroke();App.sigLastPos=p; };
    c.onmouseup = c.onmouseleave = () => App.sigDrawing = false;
    c.ontouchstart = e => { e.preventDefault(); App.sigDrawing=true; App.sigLastPos=gT(e,c); };
    c.ontouchmove  = e => { e.preventDefault(); if(!App.sigDrawing)return; const p=gT(e,c); App.sigCtx.beginPath();App.sigCtx.moveTo(App.sigLastPos.x,App.sigLastPos.y);App.sigCtx.lineTo(p.x,p.y);App.sigCtx.stroke();App.sigLastPos=p; };
    c.ontouchend = () => App.sigDrawing = false;
  }, 50);
}
function closeSigModal() { $('sig-modal').classList.remove('open'); }
function clearSig() { const c=$('sigCanvas'); if(App.sigCtx) App.sigCtx.clearRect(0,0,c.width,c.height); }
function setSigTab(t, btn) {
  App.sigMode = t;
  $$('.sig-tab').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  $('sig-draw-p').style.display = t==='draw' ? '' : 'none';
  $('sig-type-p').style.display = t==='type' ? '' : 'none';
}
function updSigPreview() { $('sig-preview').textContent = $('sig-txt')?.value || 'اسمك'; }
function insertSig() {
  let ann;
  if (App.sigMode === 'draw') {
    const c = $('sigCanvas');
    ann = { type:'sig', stype:'draw', dataUrl:c.toDataURL(), sw2:c.width, sh:c.height, x:80, y:80, color: App.edColor };
  } else {
    const txt = $('sig-txt')?.value || 'التوقيع';
    ann = { type:'sig', stype:'text', stxt:txt, fs2:36, color: App.edColor, x:80, y:80 };
  }
  edAddAnn(ann); closeSigModal(); toast('تم إضافة التوقيع ✓', 'ok');
}

/* ── SAVE MODAL ── */
function openSaveModal() {
  if (App.mode === 'editor' && !App.edPdfBytes) { toast('افتح ملف PDF أولاً', 'err'); return; }
  $('save-modal').classList.add('open');
}

async function doSave() {
  const fname = ($('save-name')?.value || 'edited').replace(/\.pdf$/i,'') + '.pdf';
  $('save-modal').classList.remove('open');
  if (App.mode === 'editor') await editorSave(fname);
  else toast('اختر أداة ونفّذ العملية أولاً', 'warn');
}

async function editorSave(fname) {
  toast('جارٍ الحفظ...');
  try {
    const doc = await PDFDocument.load(App.edPdfBytes);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let pg = 1; pg <= App.edTotalPages; pg++) {
      const pageAnns = App.anns[pg] || []; if (!pageAnns.length) continue;
      const pdfPage = doc.getPage(pg - 1);
      const { width: pW, height: pH } = pdfPage.getSize();
      const pjsPg = await App.edPdfJsDoc.getPage(pg);
      const vp = pjsPg.getViewport({ scale: App.edZoom });
      const sx = pW / vp.width, sy = pH / vp.height;
      const fy = y => pH - y * sy;

      for (const a of pageAnns) {
        if (a.type==='text'){const sz=(a.fs||18)*sx*.76;const c=hexRGB(a.color||'#000');try{pdfPage.drawText(a.text||'',{x:a.x*sx,y:fy(a.y)-sz*1.1,size:sz,font,color:c,opacity:a.opacity||1,maxWidth:pW-a.x*sx})}catch(e){}}
        else if(a.type==='hl'){const c=hexRGB(a.color||'#fbbf24');pdfPage.drawRectangle({x:a.x*sx,y:fy(a.y+a.h),width:a.w*sx,height:a.h*sy,color:c,opacity:a.opacity||.35})}
        else if(a.type==='rect'){const c=hexRGB(a.color);const rx=(a.w<0?a.x+a.w:a.x)*sx,ry=fy((a.h<0?a.y+a.h:a.y)+Math.abs(a.h));pdfPage.drawRectangle({x:rx,y:ry,width:Math.abs(a.w)*sx,height:Math.abs(a.h)*sy,borderColor:c,borderWidth:a.sw||2,color:a.fill?c:undefined,opacity:a.opacity||1})}
        else if(a.type==='circle'){const cx=(a.x+a.w/2)*sx,cy=fy(a.y+a.h/2),rx2=Math.abs(a.w/2)*sx,ry2=Math.abs(a.h/2)*sy;const c=hexRGB(a.color);try{pdfPage.drawEllipse({x:cx,y:cy,xScale:rx2,yScale:ry2,borderColor:c,borderWidth:a.sw||2,color:a.fill?c:undefined,opacity:a.opacity||1})}catch(e){}}
        else if(a.type==='line'||a.type==='arrow'){const c=hexRGB(a.color);pdfPage.drawLine({start:{x:a.x*sx,y:fy(a.y)},end:{x:(a.x+a.w)*sx,y:fy(a.y+a.h)},thickness:a.sw||2,color:c,opacity:a.opacity||1})}
        else if(a.type==='draw'){if(a.path.length<2)continue;const c=hexRGB(a.color);for(let i=0;i<a.path.length-1;i++)pdfPage.drawLine({start:{x:a.path[i].x*sx,y:fy(a.path[i].y)},end:{x:a.path[i+1].x*sx,y:fy(a.path[i+1].y)},thickness:a.width||2,color:c,opacity:a.opacity||1})}
        else if(a.type==='sig'){if(a.stype==='text'){const sz=(a.fs2||34)*sx*.76;const c=hexRGB(a.color||'#1a3060');try{pdfPage.drawText(a.stxt||'',{x:a.x*sx,y:fy(a.y)-sz,size:sz,font,color:c})}catch(e){}}else if(a.stype==='draw'&&a.dataUrl){try{const b64=a.dataUrl.split(',')[1];const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const img=await doc.embedPng(bytes);const iw=(a.sw2||200)*sx,ih=(a.sh||80)*sy;pdfPage.drawImage(img,{x:a.x*sx,y:fy(a.y)-ih,width:iw,height:ih})}catch(e){}}}
      }
    }
    const out = await doc.save();
    dlBlob(out, fname);
    toast('تم الحفظ: ' + fname + ' ✓', 'ok');
  } catch (err) { toast('خطأ في الحفظ: ' + err.message, 'err'); console.error(err); }
}

/* ══════════════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); edUndo(); }
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); openSaveModal(); }
  if (e.key === 'Delete' && App.selAnn) { edDelAnn(App.selAnn.id); }
  if (e.key === 'Escape') { App.selAnn = null; edUpdateOvl(); updElemList(); }
});

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadTool('merge', document.querySelector('.ls-tool.active'));
});
