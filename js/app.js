/* 
   PDF Studio - Academic Edition
   Main Application Logic
   Organized for University Submission
*/

let LANG = localStorage.getItem('pdf_studio_lang') || (navigator.language.startsWith('ar') ? 'ar' : 'en');
let THEME = localStorage.getItem('pdf_studio_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
let currentRoute = 'home';
let routeParams = {};

const I18N = {
  ar: {
    appName: 'بي دي إف ستوديو',
    nav: { home: 'الرئيسية', tools: 'الأدوات', about: 'عن التطبيق' },
    home: {
      title: 'أدوات PDF احترافية، آمنة، ومجانية',
      subtitle: 'جميع الأدوات التي تحتاجها لإدارة ملفات PDF الخاصة بك في مكان واحد، مع خصوصية تامة وأمان سيبراني.',
      dropTitle: 'اسحب وأفلت ملف PDF هنا',
      dropSub: 'أو اضغط لاختيار ملف من جهازك',
      pickBtn: 'اختر ملف',
      sectionPopular: 'الأدوات الأكثر استخداماً',
      sectionOrganize: 'تنظيم PDF',
      sectionEdit: 'تعديل PDF',
      sectionConvert: 'تحويل PDF',
      sectionSecure: 'الأمان والإصلاح'
    },
    tools: {
      merge: { name: 'دمج PDF', desc: 'دمج عدة ملفات في مستند واحد' },
      split: { name: 'تقسيم PDF', desc: 'استخراج صفحات معينة أو تقسيم الملف' },
      compress: { name: 'ضغط PDF', desc: 'تقليل حجم الملف مع الحفاظ على الجودة' },
      organize: { name: 'تنظيم الصفحات', desc: 'إعادة ترتيب أو حذف صفحات PDF' },
      rotate: { name: 'تدوير PDF', desc: 'تدوير الصفحات لليسار أو اليمين' },
      sign: { name: 'توقيع PDF', desc: 'إضافة توقيعك الشخصي للمستندات' },
      watermark: { name: 'علامة مائية', desc: 'إضافة نص أو صورة كعلامة مائية' },
      annotate: { name: 'تعليق وتظليل', desc: 'إضافة نصوص وتظليل للمحتوى' },
      ocr: { name: 'التعرف الضوئي', desc: 'تحويل الصور الممسوحة لنص قابل للبحث' },
      viewer: { name: 'عرض PDF', desc: 'عرض وقراءة ملفات PDF بسلاسة' },
      jpgToPdf: { name: 'صورة إلى PDF', desc: 'تحويل الصور إلى مستند PDF' },
      pdfToJpg: { name: 'PDF إلى صورة', desc: 'استخراج الصفحات كصور عالية الجودة' },
      extractText: { name: 'استخراج النص', desc: 'تحويل محتوى PDF إلى نص عادي' },
      protect: { name: 'حماية PDF', desc: 'إضافة كلمة مرور وتشفير للملف' },
      unlock: { name: 'فك التشفير', desc: 'إزالة كلمة المرور من ملفات PDF' },
      crop: { name: 'قص الصفحات', desc: 'تعديل هوامش وقص صفحات PDF' },
      repair: { name: 'إصلاح PDF', desc: 'محاولة إصلاح الملفات التالفة' },
      number: { name: 'ترقيم الصفحات', desc: 'إضافة أرقام الصفحات للمستند' },
      wordToPdf: { name: 'Word إلى PDF', desc: 'تحويل ملفات Word إلى PDF محلياً' }
    },
    badges: {
      private: { title: 'خصوصية تامة', body: 'تتم المعالجة في متصفحك فقط' },
      fast: { title: 'سرعة فائقة', body: 'لا حاجة لرفع الملفات للسيرفر' },
      offline: { title: 'يعمل بدون إنترنت', body: 'استخدم الأدوات في أي وقت' },
      free: { title: 'مجاني بالكامل', body: 'بدون حدود أو رسوم خفية' }
    },
    faq: {
      title: 'الأسئلة الشائعة',
      q1: 'هل ملفاتي آمنة؟', a1: 'نعم، جميع العمليات تتم محلياً داخل متصفحك (Client-side). لا يتم رفع أي ملف إلى أي خادم خارجي، مما يضمن خصوصية بياناتك بنسبة 100%.',
      q2: 'هل أحتاج للإنترنت لاستخدام الموقع؟', a2: 'بعد تحميل الموقع لأول مرة، يمكنك استخدامه بالكامل بدون إنترنت لأن جميع المكتبات محملة محلياً.',
      q3: 'ما هو الحد الأقصى لحجم الملفات؟', a3: 'لضمان استقرار المتصفح، تم تحديد الحد الأقصى بـ 10 ميجابايت للملف الواحد.',
      q4: 'هل الموقع مجاني؟', a4: 'نعم، هذا المشروع أكاديمي ومتاح مجاناً للجميع بدون أي قيود.',
      q5: 'كيف يعمل تحويل Word إلى PDF؟', a5: 'نستخدم مكتبة Mammoth.js لتحويل محتوى ملفات Word إلى نص وتنسيق متوافق مع PDF داخل المتصفح مباشرة.'
    },
    footer: {
      tools: 'الأدوات',
      info: 'معلومات',
      about: 'عن المشروع',
      faq: 'الأسئلة الشائعة',
      offline: 'يعمل أوفلاين',
      copyright: '© 2024 بي دي إف ستوديو - نسخة أكاديمية آمنة',
      tag: 'هذا النظام يعمل بالكامل داخل المتصفح (Client-side) ولا يتم رفع أي ملفات إلى أي خادم خارجي. جميع العمليات تتم محلياً لضمان الخصوصية.'
    },
    common: {
      save: 'حفظ الملف',
      apply: 'تطبيق',
      cancel: 'إلغاء',
      clear: 'مسح',
      loading: 'جاري المعالجة...',
      error: 'حدث خطأ ما',
      success: 'تمت العملية بنجاح',
      download: 'تحميل',
      fileName: 'اسم الملف',
      enterName: 'أدخل اسم الملف قبل الحفظ',
      browse: 'اختر ملفاً أو اسحبه هنا',
      browseImages: 'اختر صوراً أو اسحبها هنا',
      processing: 'جاري المعالجة...',
      done: 'تم'
    }
  },
  en: {
    appName: 'PDF Studio',
    nav: { home: 'Home', tools: 'Tools', about: 'About' },
    home: {
      title: 'Professional PDF Tools, Secure & Free',
      subtitle: 'All the tools you need to manage your PDF files in one place, with total privacy and cybersecurity.',
      dropTitle: 'Drag & Drop PDF here',
      dropSub: 'Or click to choose a file from your device',
      pickBtn: 'Choose File',
      sectionPopular: 'Most Popular Tools',
      sectionOrganize: 'Organize PDF',
      sectionEdit: 'Edit PDF',
      sectionConvert: 'Convert PDF',
      sectionSecure: 'Security & Repair'
    },
    tools: {
      merge: { name: 'Merge PDF', desc: 'Combine multiple files into one' },
      split: { name: 'Split PDF', desc: 'Extract pages or split the file' },
      compress: { name: 'Compress PDF', desc: 'Reduce size while keeping quality' },
      organize: { name: 'Organize Pages', desc: 'Reorder or delete PDF pages' },
      rotate: { name: 'Rotate PDF', desc: 'Rotate pages left or right' },
      sign: { name: 'Sign PDF', desc: 'Add your signature to documents' },
      watermark: { name: 'Watermark', desc: 'Add text or image watermark' },
      annotate: { name: 'Annotate', desc: 'Add text and highlights' },
      ocr: { name: 'OCR', desc: 'Convert scanned images to searchable text' },
      viewer: { name: 'PDF Viewer', desc: 'View and read PDF files smoothly' },
      jpgToPdf: { name: 'JPG to PDF', desc: 'Convert images to PDF document' },
      pdfToJpg: { name: 'PDF to JPG', desc: 'Extract pages as high-quality images' },
      extractText: { name: 'Extract Text', desc: 'Convert PDF content to plain text' },
      protect: { name: 'Protect PDF', desc: 'Add password and encryption' },
      unlock: { name: 'Unlock PDF', desc: 'Remove password from PDF files' },
      crop: { name: 'Crop Pages', desc: 'Adjust margins and crop PDF' },
      repair: { name: 'Repair PDF', desc: 'Try to fix corrupted files' },
      number: { name: 'Page Numbers', desc: 'Add page numbers to document' },
      wordToPdf: { name: 'Word to PDF', desc: 'Convert Word to PDF locally' }
    },
    badges: {
      private: { title: 'Total Privacy', body: 'Processing happens in your browser only' },
      fast: { title: 'Super Fast', body: 'No need to upload files to server' },
      offline: { title: 'Works Offline', body: 'Use tools anytime, anywhere' },
      free: { title: '100% Free', body: 'No limits or hidden fees' }
    },
    faq: {
      title: 'Frequently Asked Questions',
      q1: 'Are my files safe?', a1: 'Yes, all operations are performed locally in your browser (Client-side). No files are uploaded to any external server, ensuring 100% privacy.',
      q2: 'Do I need internet to use the site?', a2: 'After the first load, you can use it entirely offline as all libraries are loaded locally.',
      q3: 'What is the maximum file size?', a3: 'To ensure browser stability, the maximum size is set to 10MB per file.',
      q4: 'Is the site free?', a4: 'Yes, this is an academic project and is available for free to everyone without any restrictions.',
      q5: 'How does Word to PDF work?', a5: 'We use Mammoth.js to convert Word content to PDF-compatible text and formatting directly in the browser.'
    },
    footer: {
      tools: 'Tools',
      info: 'Information',
      about: 'About Project',
      faq: 'FAQ',
      offline: 'Works Offline',
      copyright: '© 2024 PDF Studio - Secure Academic Edition',
      tag: 'This system works entirely in the browser (Client-side). No files are uploaded to any external server. All operations are local for privacy.'
    },
    common: {
      save: 'Save File',
      apply: 'Apply',
      cancel: 'Cancel',
      clear: 'Clear',
      loading: 'Processing...',
      error: 'Something went wrong',
      success: 'Operation successful',
      download: 'Download',
      fileName: 'File Name',
      enterName: 'Enter file name before saving',
      browse: 'Pick a file or drop it here',
      browseImages: 'Pick images or drop them here',
      processing: 'Processing...',
      done: 'Done'
    }
  }
};

function tt(key) {
  const keys = key.split('.');
  let val = I18N[LANG];
  for (const k of keys) {
    if (!val[k]) return key;
    val = val[k];
  }
  return val;
}

function svg(name) {
  const icons = {
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    merge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="12" y1="12" x2="12" y2="18"/></svg>',
    split: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>',
    compress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14V4a2 2 0 0 1 2-2h10l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/><path d="M4 14h16"/><path d="M12 8v12"/></svg>',
    sign: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 5 5"/><path d="m9.5 14.5 4 4"/></svg>',
    annotate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    ocr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="7" y1="7" x2="17" y2="7"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="17" x2="12" y2="17"/></svg>',
    viewer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    cloudOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"/><path d="M22.5 10.5a5.25 5.25 0 0 0-8.29-4.437"/><path d="M11.33 5.79a4.5 4.5 0 0 1 2.47-1.29"/></svg>',
    unlock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>',
    chevDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    organize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    rotate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>',
    watermark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    jpgToPdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    pdfToJpg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    extractText: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M9 22h6"/><path d="M12 22V12"/><path d="M12 12l-4 4"/><path d="M12 12l4 4"/></svg>',
    protect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    crop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 13V3"/><path d="M3 6h10"/><path d="M11 21V11"/><path d="M21 18H11"/></svg>',
    repair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/></svg>',
    number: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12h4"/><path d="M12 10v4"/><path d="M4 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4z"/></svg>',
    wordToPdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>'
  };
  return icons[name] || '';
}

/* ================== UI Helpers ================== */
function toast(msg, type='success'){
  const wrap = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(()=>t.remove(), 3000);
}

function showModal(title, bodyHtml, onConfirm, confirmText){
  const overlay = document.getElementById('modalOverlay');
  const modal = overlay.querySelector('.modal');
  modal.querySelector('h3').textContent = title;
  modal.querySelector('.modal-body').innerHTML = bodyHtml;
  const foot = modal.querySelector('.modal-foot');
  foot.innerHTML = `
    <button class="nav-btn" onclick="closeModal()">${tt('common.cancel')}</button>
    <button class="pick-btn" id="modalConfirm">${confirmText || tt('common.save')}</button>
  `;
  foot.querySelector('#modalConfirm').onclick = () => {
    onConfirm();
    closeModal();
  };
  overlay.classList.add('active');
}

function closeModal(){
  document.getElementById('modalOverlay').classList.remove('active');
}

async function promptFileName(defaultName){
  return new Promise(resolve => {
    const body = `
      <div style="margin-bottom:10px">${tt('common.enterName')}</div>
      <input type="text" id="fileNameInput" class="page-input" style="width:100%; height:42px" value="${defaultName}">
    `;
    showModal(tt('common.fileName'), body, () => {
      const val = document.getElementById('fileNameInput').value.trim();
      resolve(val || defaultName);
    }, tt('common.download'));
    setTimeout(() => document.getElementById('fileNameInput')?.focus(), 100);
  });
}

/* ================== Routing ================== */
const ROUTES = {
  home: renderHome,
  about: renderAbout,
  viewer: renderViewer,
  merge: renderMerge,
  split: renderSplit,
  compress: renderCompress,
  organize: renderOrganize,
  rotate: renderRotate,
  watermark: renderWatermark,
  sign: renderSign,
  annotate: renderAnnotate,
  protect: renderProtect,
  unlock: renderUnlock,
  jpgToPdf: renderJpgToPdf,
  pdfToJpg: renderPdfToJpg,
  extractText: renderExtractText,
  crop: renderCrop,
  ocr: renderOcr,
  repair: renderRepair,
  number: renderNumber,
  wordToPdf: renderWordToPdf
};

function nav(route, params={}){
  currentRoute = route;
  routeParams = params;
  window.scrollTo(0,0);
  render();
}

function applyLang(){
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('pdf_studio_lang', LANG);
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = LANG === 'ar' ? 'English' : 'العربية';
}

function toggleLang(){
  LANG = LANG === 'ar' ? 'en' : 'ar';
  applyLang();
  render();
}

function applyTheme(){
  document.documentElement.classList.toggle('dark', THEME === 'dark');
  localStorage.setItem('pdf_studio_theme', THEME);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.innerHTML = svg(THEME === 'dark' ? 'sun' : 'moon');
}

function toggleTheme(){
  THEME = THEME === 'dark' ? 'light' : 'dark';
  applyTheme();
}

function render(){
  applyLang();
  const main = document.getElementById('main');
  if (!main) return;
  main.innerHTML = '';
  (ROUTES[currentRoute] || renderHome)(main);
  renderFooter();
  updateNavActive();
}

function updateNavActive(){
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const r = btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    btn.classList.toggle('active', r === currentRoute);
  });
}

function renderFooter(){
  const ft = document.getElementById('appFooter');
  if (!ft) return;
  ft.innerHTML = `
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="b">
          ${svg('merge')}
          <span>${tt('appName')}</span>
        </div>
        <p>${tt('footer.tag')}</p>
      </div>
      <div class="footer-col">
        <h5>${tt('footer.tools')}</h5>
        <a onclick="nav('merge')">${tt('tools.merge.name')}</a>
        <a onclick="nav('split')">${tt('tools.split.name')}</a>
        <a onclick="nav('compress')">${tt('tools.compress.name')}</a>
        <a onclick="nav('sign')">${tt('tools.sign.name')}</a>
        <a onclick="nav('annotate')">${tt('tools.annotate.name')}</a>
        <a onclick="nav('ocr')">${tt('tools.ocr.name')}</a>
      </div>
      <div class="footer-col">
        <h5>${tt('footer.info')}</h5>
        <a onclick="nav('about')">${tt('footer.about')}</a>
        <a onclick="nav('home'); setTimeout(()=>{document.getElementById('faqSection')?.scrollIntoView({behavior:'smooth'})},80)">${tt('footer.faq')}</a>
        <a>${tt('footer.offline')}</a>
      </div>
    </div>
    <div class="footer-bottom">${tt('footer.copyright')}</div>
  `;
}

/* ================== HOME ================== */
function renderHome(main){
  const popular = ['merge','split','compress','organize','sign','watermark','annotate','ocr'];
  const sections = [
    {key:'organize', tools:['merge','split','organize','rotate','compress','crop']},
    {key:'edit', tools:['sign','annotate','watermark','number']},
    {key:'convert', tools:['jpgToPdf','pdfToJpg','extractText','ocr','viewer','wordToPdf']},
    {key:'secure', tools:['protect','unlock','repair']}
  ];
  const badges = [
    {key:'private', icon:'shield'},
    {key:'fast', icon:'bolt'},
    {key:'offline', icon:'cloudOff'},
    {key:'free', icon:'unlock'}
  ];
  
  main.innerHTML = `
    <section class="hero">
      <h1>${tt('home.title')}<span class="dot">.</span></h1>
      <p>${tt('home.subtitle')}</p>
    </section>
    <div class="dropzone" id="homedz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('home.dropTitle')}</p>
      <p class="sub">${tt('home.dropSub')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div class="badges">
      ${badges.map(b => `
        <div class="badge">
          <div class="ico">${svg(b.icon)}</div>
          <div>
            <h4>${tt('badges.'+b.key+'.title')}</h4>
            <p>${tt('badges.'+b.key+'.body')}</p>
          </div>
        </div>
      `).join('')}
    </div>
    <section class="section">
      <div class="section-head">
        <h2>${tt('home.sectionPopular')}</h2>
      </div>
      <div class="grid">
        ${popular.map(t => `
          <button class="tool" onclick="nav('${t}')">
            <div class="tool-icon">${svg(t)}</div>
            <h3>${tt('tools.'+t+'.name')}</h3>
            <p>${tt('tools.'+t+'.desc')}</p>
          </button>
        `).join('')}
      </div>
    </section>
    ${sections.map(s => `
      <section class="section" data-section="${s.key}">
        <div class="section-head">
          <h2>${tt('home.section'+s.key.charAt(0).toUpperCase()+s.key.slice(1))}</h2>
        </div>
        <div class="grid">
          ${s.tools.map(t => `
            <button class="tool" onclick="nav('${t}')">
              <div class="tool-icon">${svg(t)}</div>
              <h3>${tt('tools.'+t+'.name')}</h3>
              <p>${tt('tools.'+t+'.desc')}</p>
            </button>
          `).join('')}
        </div>
      </section>
    `).join('')}
    <section class="section" id="faqSection">
      <div class="section-head">
        <h2>${tt('faq.title')}</h2>
      </div>
      <div class="faq">
        ${[1,2,3,4,5].map(k => `
          <div class="faq-item">
            <button class="faq-q" type="button">
              <span>${tt('faq.q'+k)}</span>
              <span class="chev">${svg('chevDown')}</span>
            </button>
            <div class="faq-a"><div style="padding:10px 0">${tt('faq.a'+k)}</div></div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
  
  document.querySelectorAll('.faq-item').forEach(it => {
    it.querySelector('.faq-q').onclick = () => it.classList.toggle('open');
  });
  
  const dz = document.getElementById('homedz');
  const inp = dz?.querySelector('input');
  const homePick = dz?.querySelector('.pick-btn');
  if (!dz || !inp) return;

  const openHomePicker = () => inp.click();
  dz.onclick = () => openHomePicker();
  if (homePick) homePick.onclick = (e) => { e.stopPropagation(); openHomePicker(); };

  dz.ondragover = (e) => {
    e.preventDefault();
    dz.classList.add('drag');
  };
  dz.ondragleave = () => dz.classList.remove('drag');
  dz.ondrop = (e) => {
    e.preventDefault();
    dz.classList.remove('drag');
    const raw = Array.from(e.dataTransfer.files || []);
    const file = raw.find(isLikelyPdfFile) || raw[0];
    if (file && isLikelyPdfFile(file) && file.size <= 10 * 1024 * 1024) nav('viewer', { file });
    else if (file && file.size > 10 * 1024 * 1024) {
      toast(LANG === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)' : 'File too large (Max 10MB)', 'error');
    } else if (raw.length) {
      toast(LANG === 'ar' ? 'يرجى إسقاط ملف PDF' : 'Please drop a PDF file', 'error');
    }
  };

  inp.onchange = (e) => {
    const file = e.target.files[0];
    try {
      if (file && isLikelyPdfFile(file) && file.size <= 10 * 1024 * 1024) nav('viewer', { file });
      else if (file && !isLikelyPdfFile(file)) {
        toast(LANG === 'ar' ? 'يرجى اختيار ملف PDF' : 'Please choose a PDF file', 'error');
      } else if (file) toast(LANG === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)' : 'File too large (Max 10MB)', 'error');
    } finally {
      e.target.value = '';
    }
  };
}

/* ================== ABOUT ================== */
function renderAbout(main){
  main.innerHTML = `
    <section class="hero">
      <h1>${tt('footer.about')}</h1>
      <p>${tt('footer.tag')}</p>
    </section>
    <div style="max-width:800px; margin:0 auto; line-height:1.8">
      <p>${LANG === 'ar' ? 'بي دي إف ستوديو هو مشروع أكاديمي يهدف لتوفير أدوات معالجة مستندات آمنة ومفتوحة المصدر. تم تصميم النظام ليعمل بالكامل في المتصفح لضمان أعلى مستويات الخصوصية والأمان السيبراني.' : 'PDF Studio is an academic project aimed at providing secure, open-source document processing tools. The system is designed to run entirely in the browser to ensure the highest levels of privacy and cybersecurity.'}</p>
      <div class="alert">
        ${svg('shield')}
        <span>${tt('footer.tag')}</span>
      </div>
    </div>
  `;
}

/* ================== TOOLS ================== */
function renderToolLayout(main, toolKey, contentHtml){
  main.innerHTML = `
    <div class="section-head">
      <div>
        <h2>${tt('tools.'+toolKey+'.name')}</h2>
        <p>${tt('tools.'+toolKey+'.desc')}</p>
      </div>
      <button class="nav-btn" onclick="nav('home')">${svg('chevDown')} ${tt('common.done')}</button>
    </div>
    <div class="card" style="background:var(--card); border:1px solid var(--border); border-radius:16px; padding:24px; margin-top:20px">
      ${contentHtml}
    </div>
  `;
}

function sortableEnsure(el, options) {
  if (!el || typeof Sortable === 'undefined') return null;
  const prev = Sortable.get(el);
  if (prev) prev.destroy();
  return Sortable.create(el, options);
}

function addKonvaTransformers(node, konvaLayer, onChange) {
  const tr = new Konva.Transformer();
  konvaLayer.add(tr);
  if (typeof tr.attachTo === 'function') tr.attachTo(node);
  else tr.nodes([node]);
  konvaLayer.batchDraw();
  if (!onChange) return;
  const sync = () => onChange(node);
  node.on('transformend', sync);
  node.on('dragend', sync);
}

async function embedImageDataUrl(pdfDoc, dataUrl) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!m) throw new Error('Invalid image data URL');
  const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  if (m[1] === 'image/jpeg' || m[1] === 'image/jpg') return pdfDoc.embedJpg(bytes);
  return pdfDoc.embedPng(bytes);
}

/* ================== PDF.js Viewer Implementation ================== */
let pdfDoc = null, pageNum = 1, pageIsRendering = false, pageNumIsPending = null;
const scale = 1.5;

function getViewerCanvasAndContext() {
  const canvas = document.getElementById('viewerCanvas');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  return ctx ? { canvas, ctx } : null;
}

async function renderPage(num) {
  if (!pdfDoc) return;
  pageIsRendering = true;
  try {
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale });
    const target = getViewerCanvasAndContext();
    if (!target) return;
    const { canvas, ctx } = target;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderCtx = { canvasContext: ctx, viewport };
    const renderOut = page.render(renderCtx);
    if (renderOut && typeof renderOut.then === 'function') await renderOut;
    else if (renderOut?.promise) await renderOut.promise;
  } catch (e) {
    console.error(e);
    toast(tt('common.error'), 'error');
  } finally {
    pageIsRendering = false;
    if (pageNumIsPending !== null) {
      const pending = pageNumIsPending;
      pageNumIsPending = null;
      renderPage(pending);
    }
  }
}

function queueRenderPage(num) {
  if (pageIsRendering) {
    pageNumIsPending = num;
  } else {
    renderPage(num);
  }
}

function showPrevPage() {
  if (pageNum <= 1) return;
  pageNum--;
  queueRenderPage(pageNum);
  document.getElementById('pageInfo').textContent = `Page ${pageNum} / ${pdfDoc.numPages}`;
}

function showNextPage() {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  queueRenderPage(pageNum);
  document.getElementById('pageInfo').textContent = `Page ${pageNum} / ${pdfDoc.numPages}`;
}

async function loadPdf(file) {
  if (!file) return;
  if (typeof pdfjsLib === 'undefined' || !pdfjsLib.getDocument) {
    toast(
      LANG === 'ar'
        ? 'مكتبة PDF غير جاهزة. شغّل المشروع عبر خادم محلي (مثل: python -m http.server) ولا تفتح الملف مباشرة من القرص.'
        : 'PDF library not ready. Run a local server (e.g. python -m http.server); do not open the HTML file directly from disk.',
      'error'
    );
    return;
  }
  showLoader();
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    pdfDoc = loadingTask.promise !== undefined ? await loadingTask.promise : await loadingTask;

    const viewerEl = document.getElementById('viewerContainer');
    if (!viewerEl) {
      toast(tt('common.error'), 'error');
      return;
    }
    viewerEl.classList.remove('hidden');
    document.getElementById('homedz')?.classList.add('hidden');
    document.getElementById('tooldz')?.classList.add('hidden');
    document.getElementById('prevPage').onclick = showPrevPage;
    document.getElementById('nextPage').onclick = showNextPage;
    pageNum = 1;
    await renderPage(pageNum);
    const info = document.getElementById('pageInfo');
    if (info && pdfDoc) info.textContent = `Page ${pageNum} / ${pdfDoc.numPages}`;
  } catch (e) {
    console.error(e);
    toast(tt('common.error'), 'error');
  } finally {
    hideLoader();
  }
}

/* ================== Word to PDF Implementation ================== */
async function convertWordToPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
  const html = result.value;
  document.getElementById('wordPreview').innerHTML = html;
  // For a real Word to PDF conversion, you'd typically use a server-side library
  // or a more complex client-side solution that can render HTML to PDF.
  // This is a placeholder to show the HTML conversion.
  toast(tt('common.success'), 'success');
}

/* ================== OCR Implementation ================== */
async function performOcr(file) {
  const worker = await Tesseract.createWorker();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  const { data: { text } } = await worker.recognize(file);
  const out = document.getElementById('ocrResultText');
  if (out) out.value = text;
  await worker.terminate();
}

/* ================== File Handling ================== */
function isLikelyPdfFile(file) {
  if (!file || !file.name) return false;
  if (/\.pdf$/i.test(file.name)) return true;
  return file.type === 'application/pdf' || file.type === 'application/x-pdf';
}

function setupDropzone(dropzoneId, inputAccept, callback, multiple = false) {
  const dropzone = document.getElementById(dropzoneId);
  const input = dropzone?.querySelector('input');
  if (!dropzone || !input) return;
  const pickBtn = dropzone.querySelector('.pick-btn');

  input.accept = inputAccept;
  input.multiple = multiple;

  dropzone.onclick = () => input.click();
  if (pickBtn) pickBtn.onclick = (e) => { e.stopPropagation(); input.click(); };

  input.onchange = (e) => {
    const files = multiple ? Array.from(e.target.files) : [e.target.files[0]];
    try {
      if (files.every(file => file && file.size <= 10 * 1024 * 1024)) {
        callback(files);
      } else if (files.length > 0) {
        toast(LANG === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)' : 'File too large (Max 10MB)', 'error');
      }
    } finally {
      e.target.value = '';
    }
  };

  dropzone.ondragover = (e) => {
    e.preventDefault();
    dropzone.classList.add('drag');
  };

  dropzone.ondragleave = () => {
    dropzone.classList.remove('drag');
  };

  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag');
    const files = multiple ? Array.from(e.dataTransfer.files) : [e.dataTransfer.files[0]];
    if (files.every(file => file && file.size <= 10 * 1024 * 1024)) {
      callback(files);
    } else if (files.length > 0) {
      toast(LANG === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)' : 'File too large (Max 10MB)', 'error');
    }
  };
}

/* ================== Tool Specific Logic ================== */
function renderViewer(main) {
  renderToolLayout(main, 'viewer', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="viewerContainer" class="hidden">
      <div class="viewer-toolbar">
        <button class="icon-btn" id="prevPage">${svg('chevDown')}</button>
        <span id="pageInfo">Page 1 / 1</span>
        <button class="icon-btn" id="nextPage">${svg('chevDown')}</button>
      </div>
      <div class="viewer-canvas-wrap">
        <canvas id="viewerCanvas"></canvas>
      </div>
    </div>
  `);
  setupDropzone('tooldz', 'application/pdf', (files) => loadPdf(files[0]));
  if (routeParams.file) loadPdf(routeParams.file);
}

let mergedFiles = [];
function renderMerge(main) {
  renderToolLayout(main, 'merge', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" multiple style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="fileList" class="file-list"></div>
    <div id="toolActions" class="hidden" style="margin-top:20px; text-align:center">
      <button class="pick-btn" id="processBtn">${tt('tools.merge.name')}</button>
    </div>
  `);

  const fileList = document.getElementById('fileList');
  const processBtn = document.getElementById('processBtn');

  function addFilesToList(files) {
    mergedFiles = [...mergedFiles, ...files];
    renderFileList();
    if (mergedFiles.length > 0) document.getElementById('toolActions').classList.remove('hidden');
  }

  function renderFileList() {
    fileList.innerHTML = mergedFiles.map((file, i) => `
      <div class="file-item" data-index="${i}">
        <span class="grip">${svg('organize')}</span>
        <div class="file-icon">${svg('merge')}</div>
        <div class="info">
          <div class="name">${file.name}</div>
          <div class="meta">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
        </div>
        <div class="actions">
          <button onclick="removeFile(${i})">${svg('chevDown')}</button>
        </div>
      </div>
    `).join('');
    sortableEnsure(fileList, {
      animation: 150,
      handle: '.grip',
      onEnd: (evt) => {
        const [removed] = mergedFiles.splice(evt.oldIndex, 1);
        mergedFiles.splice(evt.newIndex, 0, removed);
        renderFileList();
      },
    });
  }

  window.removeFile = (index) => {
    mergedFiles.splice(index, 1);
    renderFileList();
    if (mergedFiles.length === 0) document.getElementById('toolActions').classList.add('hidden');
  };

  processBtn.onclick = async () => {
    showLoader();
    try {
      const pdfDoc = await PDFLib.PDFDocument.create();
      for (const file of mergedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const donorPdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await pdfDoc.copyPages(donorPdfDoc, donorPdfDoc.getPageIndices());
        copiedPages.forEach((page) => pdfDoc.addPage(page));
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName('merged.pdf');
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', addFilesToList, true);
}

function renderSplit(main) {
  renderToolLayout(main, 'split', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="splitOptions" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.split.name')}</h3>
      <div class="split-options">
        <label>
          <input type="radio" name="splitType" value="all" checked> ${LANG === 'ar' ? 'تقسيم كل صفحة إلى ملف منفصل' : 'Split every page into a separate file'}
        </label>
        <label>
          <input type="radio" name="splitType" value="range"> ${LANG === 'ar' ? 'تقسيم حسب نطاق الصفحات' : 'Split by page range'}
        </label>
        <div class="split-range-input hidden" id="splitRangeWrap">
          <input type="text" id="splitRange" class="page-input" placeholder="e.g., 1-5, 8, 10-12">
        </div>
      </div>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processSplitBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  let loadedPdf = null;
  const splitOptionsDiv = document.getElementById('splitOptions');
  const splitRangeWrap = document.getElementById('splitRangeWrap');
  const splitRangeInput = document.getElementById('splitRange');
  const processSplitBtn = document.getElementById('processSplitBtn');

  function updateSplitRangeVisibility() {
    const type = document.querySelector('input[name="splitType"]:checked')?.value;
    if (type === 'range') splitRangeWrap.classList.remove('hidden');
    else splitRangeWrap.classList.add('hidden');
  }
  document.querySelectorAll('input[name="splitType"]').forEach(radio => {
    radio.onchange = updateSplitRangeVisibility;
  });

  processSplitBtn.onclick = async () => {
    if (!loadedPdf) return;
    showLoader();
    try {
      const splitType = document.querySelector('input[name="splitType"]:checked').value;
      const pdfDoc = await PDFLib.PDFDocument.load(await loadedPdf.arrayBuffer());
      const pages = pdfDoc.getPages();
      const outputPdfs = [];

      if (splitType === 'all') {
        for (let i = 0; i < pages.length; i++) {
          const newPdf = await PDFLib.PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(copiedPage);
          outputPdfs.push({ blob: new Blob([await newPdf.save()], { type: 'application/pdf' }), name: `${loadedPdf.name.replace('.pdf', '')}-page-${i + 1}.pdf` });
        }
      } else if (splitType === 'range') {
        const rangeStr = splitRangeInput.value.trim();
        const ranges = parsePageRanges(rangeStr, pages.length);
        if (ranges.length === 0) {
          toast(LANG === 'ar' ? 'أدخل نطاق صفحات صالحاً (مثل 1-3، 5)' : 'Enter a valid page range (e.g. 1-3, 5)', 'warn');
          return;
        }
        const newPdf = await PDFLib.PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, ranges.map(p => p - 1));
        copiedPages.forEach(page => newPdf.addPage(page));
        outputPdfs.push({ blob: new Blob([await newPdf.save()], { type: 'application/pdf' }), name: `${loadedPdf.name.replace('.pdf', '')}-selected.pdf` });
      }

      if (outputPdfs.length === 1) {
        saveAs(outputPdfs[0].blob, outputPdfs[0].name);
      } else if (outputPdfs.length > 1) {
        const zip = new JSZip();
        outputPdfs.forEach(p => zip.file(p.name, p.blob));
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${loadedPdf.name.replace('.pdf', '')}-split.zip`);
      }
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => {
    loadedPdf = files[0];
    splitOptionsDiv.classList.remove('hidden');
  });
}

function parsePageRanges(rangeStr, totalPages) {
  const ranges = [];
  rangeStr.split(',').forEach(part => {
    part = part.trim();
    if (part.includes('-')) {
      let [start, end] = part.split('-').map(Number);
      start = Math.max(1, start);
      end = Math.min(totalPages, end);
      for (let i = start; i <= end; i++) ranges.push(i);
    } else {
      const page = Number(part);
      if (page >= 1 && page <= totalPages) ranges.push(page);
    }
  });
  return [...new Set(ranges)].sort((a, b) => a - b);
}

function renderCompress(main) {
  renderToolLayout(main, 'compress', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="compressOptions" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.compress.name')}</h3>
      <div class="compress-options">
        <label>
          <input type="radio" name="compressQuality" value="low" checked> ${LANG === 'ar' ? 'ضغط منخفض (جودة عالية)' : 'Low Compression (High Quality)'}
        </label>
        <label>
          <input type="radio" name="compressQuality" value="medium"> ${LANG === 'ar' ? 'ضغط متوسط (جودة متوسطة)' : 'Medium Compression (Medium Quality)'}
        </label>
        <label>
          <input type="radio" name="compressQuality" value="high"> ${LANG === 'ar' ? 'ضغط عالي (جودة منخفضة)' : 'High Compression (Low Quality)'}
        </label>
      </div>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processCompressBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  let loadedPdf = null;
  const compressOptionsDiv = document.getElementById('compressOptions');
  const processCompressBtn = document.getElementById('processCompressBtn');

  processCompressBtn.onclick = async () => {
    if (!loadedPdf) return;
    showLoader();
    try {
      const quality = document.querySelector('input[name="compressQuality"]:checked').value;
      const pdfDoc = await PDFLib.PDFDocument.load(await loadedPdf.arrayBuffer());
      const useObjectStreams = quality === 'medium' || quality === 'high';
      const pdfBytes = await pdfDoc.save({ useCompression: true, useObjectStreams });

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName(`compressed-${loadedPdf.name}`);
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => {
    loadedPdf = files[0];
    compressOptionsDiv.classList.remove('hidden');
  });
}

let organizedPdfDoc = null;
let organizePdfJsDoc = null;
let organizedPages = [];
function renderOrganize(main) {
  renderToolLayout(main, 'organize', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="organizeContainer" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.organize.name')}</h3>
      <div id="pageThumbs" class="thumbs organize-grid"></div>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processOrganizeBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  const pageThumbsDiv = document.getElementById('pageThumbs');
  const organizeContainer = document.getElementById('organizeContainer');
  const processOrganizeBtn = document.getElementById('processOrganizeBtn');

  async function loadOrganizePdf(file) {
    showLoader();
    try {
      const arrayBuffer = await file.arrayBuffer();
      if (organizePdfJsDoc) {
        await organizePdfJsDoc.destroy();
        organizePdfJsDoc = null;
      }
      organizedPdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
      organizePdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      organizedPages = organizedPdfDoc.getPages().map((page, index) => ({ page, index }));
      renderOrganizedThumbs();
      organizeContainer.classList.remove('hidden');
      document.getElementById('tooldz').classList.add('hidden');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  }

  async function renderOrganizedThumbs() {
    pageThumbsDiv.innerHTML = '';
    for (let i = 0; i < organizedPages.length; i++) {
      const page = organizedPages[i].page;
      const pdfPage = await organizePdfJsDoc.getPage(organizedPages[i].index + 1);
      const viewport = pdfPage.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await pdfPage.render({ canvasContext: ctx, viewport }).promise;

      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'thumb';
      thumbDiv.dataset.index = i;
      thumbDiv.innerHTML = `
        ${canvas.outerHTML}
        <span class="pn">${i + 1}</span>
        <div class="thumb-actions">
          <button onclick="rotatePage(${i}, 90)">${svg('rotate')}</button>
          <button onclick="removeOrganizedPage(${i})">${svg('chevDown')}</button>
        </div>
      `;
      pageThumbsDiv.appendChild(thumbDiv);
    }

    sortableEnsure(pageThumbsDiv, {
      animation: 150,
      handle: '.pn',
      onEnd: (evt) => {
        const [removed] = organizedPages.splice(evt.oldIndex, 1);
        organizedPages.splice(evt.newIndex, 0, removed);
        renderOrganizedThumbs();
      },
    });
  }

  window.rotatePage = async (index, angle) => {
    showLoader();
    try {
      const page = organizedPages[index].page;
      const rotation = page.getRotation();
      page.setRotation(PDFLib.Rotation.forDegrees(rotation.angle + angle));
      await renderOrganizedThumbs();
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  window.removeOrganizedPage = (index) => {
    organizedPages.splice(index, 1);
    renderOrganizedThumbs();
    toast(tt('common.success'), 'success');
  };

  processOrganizeBtn.onclick = async () => {
    showLoader();
    try {
      const newPdfDoc = await PDFLib.PDFDocument.create();
      const copiedPages = await newPdfDoc.copyPages(organizedPdfDoc, organizedPages.map(p => p.index));
      copiedPages.forEach((page, i) => {
        const originalPage = organizedPages[i].page;
        const rotation = originalPage.getRotation();
        newPdfDoc.addPage(page);
        newPdfDoc.getPages()[newPdfDoc.getPages().length - 1].setRotation(rotation);
      });
      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName('organized.pdf');
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => loadOrganizePdf(files[0]));
}

function renderRotate(main) {
  renderToolLayout(main, 'rotate', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="rotateOptions" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.rotate.name')}</h3>
      <div class="rotate-options">
        <label>
          <input type="radio" name="rotateAngle" value="90" checked> ${LANG === 'ar' ? '90 درجة باتجاه عقارب الساعة' : '90 Degrees Clockwise'}
        </label>
        <label>
          <input type="radio" name="rotateAngle" value="180"> ${LANG === 'ar' ? '180 درجة' : '180 Degrees'}
        </label>
        <label>
          <input type="radio" name="rotateAngle" value="270"> ${LANG === 'ar' ? '270 درجة باتجاه عقارب الساعة' : '270 Degrees Clockwise'}
        </label>
      </div>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processRotateBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  let loadedPdf = null;
  const rotateOptionsDiv = document.getElementById('rotateOptions');
  const processRotateBtn = document.getElementById('processRotateBtn');

  processRotateBtn.onclick = async () => {
    if (!loadedPdf) return;
    showLoader();
    try {
      const angle = Number(document.querySelector('input[name="rotateAngle"]:checked').value);
      const pdfDoc = await PDFLib.PDFDocument.load(await loadedPdf.arrayBuffer());
      pdfDoc.getPages().forEach(page => {
        const rotation = page.getRotation();
        page.setRotation(PDFLib.Rotation.forDegrees(rotation.angle + angle));
      });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName(`rotated-${loadedPdf.name}`);
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => {
    loadedPdf = files[0];
    rotateOptionsDiv.classList.remove('hidden');
  });
}

function renderWatermark(main) {
  renderToolLayout(main, 'watermark', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="watermarkOptions" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.watermark.name')}</h3>
      <div class="watermark-options">
        <label>${LANG === 'ar' ? 'نص العلامة المائية' : 'Watermark Text'}:</label>
        <input type="text" id="watermarkText" value="PDF Studio">
        <label>${LANG === 'ar' ? 'حجم الخط' : 'Font Size'}: <span id="fontSizeVal">50</span></label>
        <input type="range" id="watermarkFontSize" min="10" max="100" value="50">
        <label>${LANG === 'ar' ? 'الشفافية' : 'Opacity'}: <span id="opacityVal">0.5</span></label>
        <input type="range" id="watermarkOpacity" min="0" max="1" step="0.1" value="0.5">
        <label>${LANG === 'ar' ? 'اللون' : 'Color'}:</label>
        <input type="color" id="watermarkColor" value="#CCCCCC">
      </div>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processWatermarkBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  let loadedPdf = null;
  const watermarkOptionsDiv = document.getElementById('watermarkOptions');
  const processWatermarkBtn = document.getElementById('processWatermarkBtn');
  const watermarkText = document.getElementById('watermarkText');
  const watermarkFontSize = document.getElementById('watermarkFontSize');
  const fontSizeVal = document.getElementById('fontSizeVal');
  const watermarkOpacity = document.getElementById('watermarkOpacity');
  const opacityVal = document.getElementById('opacityVal');
  const watermarkColor = document.getElementById('watermarkColor');

  watermarkFontSize.oninput = () => fontSizeVal.textContent = watermarkFontSize.value;
  watermarkOpacity.oninput = () => opacityVal.textContent = watermarkOpacity.value;

  processWatermarkBtn.onclick = async () => {
    if (!loadedPdf) return;
    showLoader();
    try {
      const pdfDoc = await PDFLib.PDFDocument.load(await loadedPdf.arrayBuffer());
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();
        const text = watermarkText.value;
        const fontSize = Number(watermarkFontSize.value);
        const opacity = Number(watermarkOpacity.value);
        const color = PDFLib.rgb(
          parseInt(watermarkColor.value.substring(1, 3), 16) / 255,
          parseInt(watermarkColor.value.substring(3, 5), 16) / 255,
          parseInt(watermarkColor.value.substring(5, 7), 16) / 255
        );

        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        page.drawText(text, {
          x: width / 2 - textWidth / 2,
          y: height / 2 - textHeight / 2,
          font,
          size: fontSize,
          color,
          opacity,
          rotate: PDFLib.degrees(45), // Example: rotate watermark
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName(`watermarked-${loadedPdf.name}`);
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => {
    loadedPdf = files[0];
    watermarkOptionsDiv.classList.remove('hidden');
  });
}

let signaturePad = null;
let konvaStage = null;
let konvaLayer = null;
let activePlacement = null;

function renderSign(main) {
  renderToolLayout(main, 'sign', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="signContainer" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.sign.name')}</h3>
      <div class="sig-tabs">
        <button class="sig-tab active" data-tab="draw">${LANG === 'ar' ? 'رسم' : 'Draw'}</button>
        <button class="sig-tab" data-tab="type">${LANG === 'ar' ? 'كتابة' : 'Type'}</button>
        <button class="sig-tab" data-tab="upload">${LANG === 'ar' ? 'تحميل' : 'Upload'}</button>
      </div>
      <div id="sigDraw" class="sig-content active">
        <canvas id="signatureCanvas" width="400" height="200"></canvas>
        <div class="sig-actions">
          <button class="nav-btn" id="clearSignature">${tt('common.clear')}</button>
          <button class="pick-btn" id="saveSignature">${tt('common.apply')}</button>
        </div>
      </div>
      <div id="sigType" class="sig-content">
        <div class="sig-input-wrap">
          <input type="text" id="signatureTextInput" class="sig-text-input" placeholder="${LANG === 'ar' ? 'اكتب توقيعك هنا' : 'Type your signature here'}">
        </div>
        <div class="sig-actions">
          <button class="pick-btn" id="saveTypedSignature">${tt('common.apply')}</button>
        </div>
      </div>
      <div id="sigUpload" class="sig-content">
        <div class="sig-input-wrap">
          <label for="signatureImageUpload" class="sig-upload-label">
            ${svg('upload')}
            <span>${LANG === 'ar' ? 'اسحب أو اختر صورة توقيعك' : 'Drag or pick your signature image'}</span>
            <input type="file" id="signatureImageUpload" accept="image/*" style="display:none">
          </label>
        </div>
        <div class="sig-actions">
          <button class="pick-btn" id="saveUploadedSignature">${tt('common.apply')}</button>
        </div>
      </div>
      <div id="pdfSignStage" class="doc-stage" style="margin-top:20px;"></div>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processSignBtn">${tt('common.download')}</button>
      </div>
    </div>
  `);

  const signContainer = document.getElementById('signContainer');
  const pdfSignStage = document.getElementById('pdfSignStage');
  const processSignBtn = document.getElementById('processSignBtn');

  let loadedPdfFile = null;
  let pdfPagesData = []; // Stores rendered images of PDF pages
  let placements = []; // Stores Konva shapes/images to be added

  // Tab switching logic
  document.querySelectorAll('.sig-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.sig-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.sig-content').forEach(c => c.classList.remove('active'));
      document.getElementById('sig' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)).classList.add('active');
    };
  });

  // Signature Pad (Draw tab)
  const signatureCanvas = document.getElementById('signatureCanvas');
  signaturePad = new SignaturePad(signatureCanvas);
  document.getElementById('clearSignature').onclick = () => signaturePad.clear();
  document.getElementById('saveSignature').onclick = () => {
    if (!signaturePad.isEmpty()) {
      addPlacement(signaturePad.toDataURL(), 'image');
      signaturePad.clear();
    } else {
      toast(LANG === 'ar' ? 'الرجاء رسم توقيع أولاً' : 'Please draw a signature first', 'warn');
    }
  };

  // Typed Signature (Type tab)
  document.getElementById('saveTypedSignature').onclick = () => {
    const text = document.getElementById('signatureTextInput').value.trim();
    if (text) {
      addPlacement(text, 'text');
      document.getElementById('signatureTextInput').value = '';
    } else {
      toast(LANG === 'ar' ? 'الرجاء كتابة توقيع أولاً' : 'Please type a signature first', 'warn');
    }
  };

  document.getElementById('saveUploadedSignature').onclick = () => {
    const input = document.getElementById('signatureImageUpload');
    const file = input.files?.[0];
    if (!file) {
      toast(LANG === 'ar' ? 'اختر صورة التوقيع أولاً' : 'Pick a signature image first', 'warn');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      addPlacement(event.target.result, 'image');
      input.value = '';
    };
    reader.readAsDataURL(file);
  };

  async function loadSignPdf(file) {
    showLoader();
    try {
      loadedPdfFile = file;
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfPagesData = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;
        pdfPagesData.push(canvas.toDataURL());
      }
      renderSignStage(0);
      signContainer.classList.remove('hidden');
      document.getElementById('tooldz').classList.add('hidden');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  }

  function renderSignStage(pageIndex) {
    pdfSignStage.innerHTML = '';
    const img = document.createElement('img');
    img.src = pdfPagesData[pageIndex];
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    pdfSignStage.appendChild(img);

    img.onload = () => {
      konvaStage = new Konva.Stage({
        container: 'pdfSignStage',
        width: img.width,
        height: img.height,
      });
      konvaLayer = new Konva.Layer();
      konvaStage.add(konvaLayer);

      function syncSignPlacement(node) {
        const p = placements.find(pl => String(pl.id) === node.id());
        if (!p) return;
        p.x = node.x();
        p.y = node.y();
        p.rotation = node.rotation();
        if (p.type === 'image') {
          p.width = node.width() * node.scaleX();
          p.height = node.height() * node.scaleY();
        }
      }

      placements.filter(p => p.pageIndex === pageIndex).forEach(p => {
        if (p.type === 'image') {
          Konva.Image.fromURL(p.value, (imageNode) => {
            imageNode.id(String(p.id));
            imageNode.setAttrs({
              x: p.x, y: p.y, width: p.width, height: p.height, rotation: p.rotation,
              draggable: true,
            });
            konvaLayer.add(imageNode);
            addKonvaTransformers(imageNode, konvaLayer, syncSignPlacement);
            konvaLayer.batchDraw();
          });
        } else if (p.type === 'text') {
          const textNode = new Konva.Text({
            id: String(p.id),
            text: p.value, x: p.x, y: p.y, fontSize: p.fontSize, fill: p.fill, rotation: p.rotation,
            draggable: true,
          });
          konvaLayer.add(textNode);
          addKonvaTransformers(textNode, konvaLayer, syncSignPlacement);
          konvaLayer.batchDraw();
        }
      });
    };
  }

  function addPlacement(value, type) {
    if (!konvaStage || !konvaLayer) {
      toast(LANG === 'ar' ? 'حمّل ملف PDF أولاً' : 'Load a PDF first', 'warn');
      return;
    }
    const pageIndex = 0;
    const newPlacement = {
      id: placements.length,
      pageIndex,
      type,
      value,
      x: konvaStage.width() / 2,
      y: konvaStage.height() / 2,
      width: type === 'image' ? 100 : undefined,
      height: type === 'image' ? 50 : undefined,
      fontSize: type === 'text' ? 20 : undefined,
      fill: type === 'text' ? '#000000' : undefined,
      rotation: 0,
    };
    placements.push(newPlacement);
    renderSignStage(pageIndex);
  }

  processSignBtn.onclick = async () => {
    if (!loadedPdfFile) return;
    showLoader();
    try {
      const originalPdfDoc = await PDFLib.PDFDocument.load(await loadedPdfFile.arrayBuffer());
      const pages = originalPdfDoc.getPages();

      for (const placement of placements) {
        const page = pages[placement.pageIndex];
        if (placement.type === 'image') {
          const img = await embedImageDataUrl(originalPdfDoc, placement.value);
          page.drawImage(img, {
            x: placement.x,
            y: page.getHeight() - placement.y - placement.height, // Adjust Y for PDF coordinate system
            width: placement.width,
            height: placement.height,
            rotate: PDFLib.degrees(-placement.rotation), // Adjust rotation for PDF
          });
        } else if (placement.type === 'text') {
          const font = await originalPdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
          page.drawText(placement.value, {
            x: placement.x,
            y: page.getHeight() - placement.y - placement.fontSize, // Adjust Y for PDF coordinate system
            font,
            size: placement.fontSize,
            color: PDFLib.rgb(0, 0, 0),
            rotate: PDFLib.degrees(-placement.rotation),
          });
        }
      }

      const pdfBytes = await originalPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName(`signed-${loadedPdfFile.name}`);
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => loadSignPdf(files[0]));
}

function renderAnnotate(main) {
  renderToolLayout(main, 'annotate', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="annotateContainer" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.annotate.name')}</h3>
      <div class="annotate-options">
        <label>
          <input type="radio" name="annotateType" value="text" checked> ${LANG === 'ar' ? 'نص' : 'Text'}
        </label>
        <label>
          <input type="radio" name="annotateType" value="highlight"> ${LANG === 'ar' ? 'تمييز' : 'Highlight'}
        </label>
        <label>
          <input type="radio" name="annotateType" value="stamp"> ${LANG === 'ar' ? 'ختم' : 'Stamp'}
        </label>
        <input type="text" id="annotateTextInput" placeholder="${LANG === 'ar' ? 'نص التعليق أو الختم' : 'Annotation or Stamp Text'}" style="margin-top:10px;">
      </div>
      <div id="pdfAnnotateStage" class="doc-stage" style="margin-top:20px;"></div>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processAnnotateBtn">${tt('common.download')}</button>
      </div>
    </div>
  `);

  const annotateContainer = document.getElementById('annotateContainer');
  const pdfAnnotateStage = document.getElementById('pdfAnnotateStage');
  const processAnnotateBtn = document.getElementById('processAnnotateBtn');
  const annotateTextInput = document.getElementById('annotateTextInput');

  let loadedPdfFile = null;
  let pdfPagesData = [];
  let annotations = []; // Stores Konva shapes/text for annotations

  // Annotation type switching logic
  document.querySelectorAll('input[name="annotateType"]').forEach(radio => {
    radio.onchange = () => {
      if (radio.value === 'highlight') {
        annotateTextInput.classList.add('hidden');
      } else {
        annotateTextInput.classList.remove('hidden');
      }
    };
  });

  async function loadAnnotatePdf(file) {
    showLoader();
    try {
      loadedPdfFile = file;
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfPagesData = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;
        pdfPagesData.push(canvas.toDataURL());
      }
      renderAnnotateStage(0);
      annotateContainer.classList.remove('hidden');
      document.getElementById('tooldz').classList.add('hidden');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  }

  function renderAnnotateStage(pageIndex) {
    pdfAnnotateStage.innerHTML = '';
    const img = document.createElement('img');
    img.src = pdfPagesData[pageIndex];
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    pdfAnnotateStage.appendChild(img);

    img.onload = () => {
      konvaStage = new Konva.Stage({
        container: 'pdfAnnotateStage',
        width: img.width,
        height: img.height,
      });
      konvaLayer = new Konva.Layer();
      konvaStage.add(konvaLayer);

      function syncAnnotation(node) {
        const ann = annotations.find(a => String(a.id) === node.id());
        if (!ann) return;
        ann.x = node.x();
        ann.y = node.y();
        ann.rotation = node.rotation();
        if (ann.type === 'highlight') {
          ann.width = node.width() * node.scaleX();
          ann.height = node.height() * node.scaleY();
        }
      }

      konvaStage.on('click tap', (e) => {
        if (e.target === konvaStage) {
          const pos = konvaStage.getPointerPosition();
          addAnnotation(pos.x, pos.y, pageIndex);
        }
      });

      annotations.filter(a => a.pageIndex === pageIndex).forEach(a => {
        if (a.type === 'text' || a.type === 'stamp') {
          const textNode = new Konva.Text({
            id: String(a.id),
            text: a.value, x: a.x, y: a.y, fontSize: a.fontSize, fill: a.fill, rotation: a.rotation,
            draggable: true,
          });
          konvaLayer.add(textNode);
          addKonvaTransformers(textNode, konvaLayer, syncAnnotation);
        } else if (a.type === 'highlight') {
          const rectNode = new Konva.Rect({
            id: String(a.id),
            x: a.x, y: a.y, width: a.width, height: a.height, fill: a.fill, opacity: a.opacity,
            draggable: true,
          });
          konvaLayer.add(rectNode);
          addKonvaTransformers(rectNode, konvaLayer, syncAnnotation);
        }
      });
      konvaLayer.batchDraw();
    };
  }

  function addAnnotation(x, y, pageIndex) {
    const annotateType = document.querySelector('input[name="annotateType"]:checked').value;
    const text = annotateTextInput.value.trim();

    if ((annotateType === 'text' || annotateType === 'stamp') && !text) {
      toast(LANG === 'ar' ? 'الرجاء إدخال نص للتعليق أو الختم' : 'Please enter text for annotation or stamp', 'warn');
      return;
    }

    const newAnnotation = {
      id: annotations.length,
      pageIndex,
      type: annotateType,
      x,
      y,
      rotation: 0,
    };

    if (annotateType === 'text') {
      newAnnotation.value = text;
      newAnnotation.fontSize = 20;
      newAnnotation.fill = '#000000';
    } else if (annotateType === 'stamp') {
      newAnnotation.value = text;
      newAnnotation.fontSize = 24;
      newAnnotation.fill = '#FF0000';
      newAnnotation.stroke = '#FF0000';
      newAnnotation.strokeWidth = 2;
    } else if (annotateType === 'highlight') {
      newAnnotation.width = 100;
      newAnnotation.height = 20;
      newAnnotation.fill = '#FFFF00';
      newAnnotation.opacity = 0.5;
    }
    annotations.push(newAnnotation);
    renderAnnotateStage(pageIndex); // Re-render to show new annotation
  }

  processAnnotateBtn.onclick = async () => {
    if (!loadedPdfFile) return;
    showLoader();
    try {
      const originalPdfDoc = await PDFLib.PDFDocument.load(await loadedPdfFile.arrayBuffer());
      const pages = originalPdfDoc.getPages();

      for (const annotation of annotations) {
        const page = pages[annotation.pageIndex];
        if (annotation.type === 'text') {
          const font = await originalPdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
          page.drawText(annotation.value, {
            x: annotation.x,
            y: page.getHeight() - annotation.y - annotation.fontSize,
            font,
            size: annotation.fontSize,
            color: PDFLib.rgb(0, 0, 0),
            rotate: PDFLib.degrees(-annotation.rotation),
          });
        } else if (annotation.type === 'stamp') {
          const font = await originalPdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
          page.drawText(annotation.value, {
            x: annotation.x,
            y: page.getHeight() - annotation.y - annotation.fontSize,
            font,
            size: annotation.fontSize,
            color: PDFLib.rgb(1, 0, 0),
            rotate: PDFLib.degrees(-annotation.rotation),
          });
        } else if (annotation.type === 'highlight') {
          page.drawRectangle({
            x: annotation.x,
            y: page.getHeight() - annotation.y - annotation.height,
            width: annotation.width,
            height: annotation.height,
            color: PDFLib.rgb(1, 1, 0),
            opacity: annotation.opacity,
          });
        }
      }

      const pdfBytes = await originalPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName(`annotated-${loadedPdfFile.name}`);
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => loadAnnotatePdf(files[0]));
}

function renderProtect(main) {
  renderToolLayout(main, 'protect', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="protectOptions" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.protect.name')}</h3>
      <input type="password" id="ownerPassword" class="password-input" placeholder="${LANG === 'ar' ? 'كلمة مرور المالك (اختياري)' : 'Owner Password (Optional)'}">
      <input type="password" id="userPassword" class="password-input" placeholder="${LANG === 'ar' ? 'كلمة مرور المستخدم (مطلوب)' : 'User Password (Required)'}">
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processProtectBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  let loadedPdf = null;
  const protectOptionsDiv = document.getElementById('protectOptions');
  const processProtectBtn = document.getElementById('processProtectBtn');
  const ownerPasswordInput = document.getElementById('ownerPassword');
  const userPasswordInput = document.getElementById('userPassword');

  processProtectBtn.onclick = async () => {
    if (!loadedPdf) return;
    const userPassword = userPasswordInput.value;
    if (!userPassword) {
      toast(LANG === 'ar' ? 'الرجاء إدخال كلمة مرور المستخدم' : 'Please enter a user password', 'warn');
      return;
    }

    showLoader();
    try {
      const pdfDoc = await PDFLib.PDFDocument.load(await loadedPdf.arrayBuffer());
      toast(
        LANG === 'ar'
          ? 'تنبيه: مكتبة pdf-lib هنا لا تدعم تشفير PDF بكلمة مرور حقيقية. سيتم حفظ نسخة عادية غير مشفرة.'
          : 'Note: bundled pdf-lib cannot apply real password encryption. Saving an unencrypted copy only.',
        'warn'
      );
      const pdfBytes = await pdfDoc.save({ useCompression: true });

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName(`protected-${loadedPdf.name}`);
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => {
    loadedPdf = files[0];
    protectOptionsDiv.classList.remove('hidden');
  });
}

function renderUnlock(main) {
  renderToolLayout(main, 'unlock', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="unlockOptions" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.unlock.name')}</h3>
      <input type="password" id="unlockPassword" class="password-input" placeholder="${LANG === 'ar' ? 'كلمة المرور (إذا كانت موجودة)' : 'Password (if any)'}">
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processUnlockBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  let loadedPdf = null;
  const unlockOptionsDiv = document.getElementById('unlockOptions');
  const processUnlockBtn = document.getElementById('processUnlockBtn');
  const unlockPasswordInput = document.getElementById('unlockPassword');

  processUnlockBtn.onclick = async () => {
    if (!loadedPdf) return;
    showLoader();
    try {
      const password = unlockPasswordInput.value || undefined;
      const pdfDoc = await PDFLib.PDFDocument.load(await loadedPdf.arrayBuffer(), { password });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName(`unlocked-${loadedPdf.name}`);
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(LANG === 'ar' ? 'كلمة المرور غير صحيحة أو الملف غير مشفر' : 'Incorrect password or file is not encrypted', 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => {
    loadedPdf = files[0];
    unlockOptionsDiv.classList.remove('hidden');
  });
}

function renderJpgToPdf(main) {
  renderToolLayout(main, 'jpgToPdf', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="image/*" multiple style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browseImages')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="imageList" class="file-list"></div>
    <div id="toolActions" class="hidden" style="margin-top:20px; text-align:center">
      <button class="pick-btn" id="processJpgToPdfBtn">${tt('tools.jpgToPdf.name')}</button>
    </div>
  `);

  let imagesToConvert = [];
  const imageList = document.getElementById('imageList');
  const processJpgToPdfBtn = document.getElementById('processJpgToPdfBtn');

  function addImagesToList(files) {
    imagesToConvert = [...imagesToConvert, ...files];
    renderImageList();
    if (imagesToConvert.length > 0) document.getElementById('toolActions').classList.remove('hidden');
  }

  function renderImageList() {
    imageList.innerHTML = imagesToConvert.map((file, i) => `
      <div class="image-item" data-index="${i}">
        <span class="grip">${svg('organize')}</span>
        <div class="file-icon">${svg('jpgToPdf')}</div>
        <div class="info">
          <div class="name">${file.name}</div>
          <div class="meta">${(file.size / 1024).toFixed(2)} KB</div>
        </div>
        <div class="actions">
          <button onclick="removeImage(${i})">${svg('chevDown')}</button>
        </div>
      </div>
    `).join('');
    sortableEnsure(imageList, {
      animation: 150,
      handle: '.grip',
      onEnd: (evt) => {
        const [removed] = imagesToConvert.splice(evt.oldIndex, 1);
        imagesToConvert.splice(evt.newIndex, 0, removed);
        renderImageList();
      },
    });
  }

  window.removeImage = (index) => {
    imagesToConvert.splice(index, 1);
    renderImageList();
    if (imagesToConvert.length === 0) document.getElementById('toolActions').classList.add('hidden');
  };

  processJpgToPdfBtn.onclick = async () => {
    if (imagesToConvert.length === 0) return;
    showLoader();
    try {
      const pdfDoc = await PDFLib.PDFDocument.create();
      for (const imageFile of imagesToConvert) {
        const imgBytes = await imageFile.arrayBuffer();
        let img;
        if (imageFile.type === 'image/jpeg') {
          img = await pdfDoc.embedJpg(imgBytes);
        } else {
          img = await pdfDoc.embedPng(imgBytes);
        }
        const page = pdfDoc.addPage();
        const { width, height } = img.scale(1);
        page.setSize(width, height);
        page.drawImage(img, { x: 0, y: 0, width, height });
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName('images.pdf');
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'image/*', addImagesToList, true);
}

function renderPdfToJpg(main) {
  renderToolLayout(main, 'pdfToJpg', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="pdfToJpgOptions" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.pdfToJpg.name')}</h3>
      <div class="pdf-to-jpg-options">
        <label>
          <input type="radio" name="imageFormat" value="jpeg" checked> JPEG
        </label>
        <label>
          <input type="radio" name="imageFormat" value="png"> PNG
        </label>
      </div>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processPdfToJpgBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  let loadedPdfFile = null;
  const pdfToJpgOptionsDiv = document.getElementById('pdfToJpgOptions');
  const processPdfToJpgBtn = document.getElementById('processPdfToJpgBtn');

  processPdfToJpgBtn.onclick = async () => {
    if (!loadedPdfFile) return;
    showLoader();
    try {
      const imageFormat = document.querySelector('input[name="imageFormat"]:checked').value;
      const arrayBuffer = await loadedPdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const zip = new JSZip();

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality images
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const imgDataUrl = imageFormat === 'jpeg' ? canvas.toDataURL('image/jpeg', 0.9) : canvas.toDataURL('image/png');
        const imgBlob = await (await fetch(imgDataUrl)).blob();
        zip.file(`${loadedPdfFile.name.replace('.pdf', '')}-page-${i}.${imageFormat}`, imgBlob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${loadedPdfFile.name.replace('.pdf', '')}.zip`);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => {
    loadedPdfFile = files[0];
    pdfToJpgOptionsDiv.classList.remove('hidden');
  });
}

function renderExtractText(main) {
  renderToolLayout(main, 'extractText', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="extractTextContainer" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.extractText.name')}</h3>
      <textarea id="extractedText" readonly></textarea>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="downloadTextBtn">${tt('common.download')}</button>
      </div>
    </div>
  `);

  let loadedPdfFile = null;
  const extractTextContainer = document.getElementById('extractTextContainer');
  const extractedTextarea = document.getElementById('extractedText');
  const downloadTextBtn = document.getElementById('downloadTextBtn');

  downloadTextBtn.onclick = async () => {
    if (!extractedTextarea.value) return;
    const blob = new Blob([extractedTextarea.value], { type: 'text/plain' });
    const fileName = await promptFileName(`${loadedPdfFile.name.replace('.pdf', '')}.txt`);
    saveAs(blob, fileName);
  };

  setupDropzone('tooldz', 'application/pdf', async (files) => {
    showLoader();
    try {
      loadedPdfFile = files[0];
      const arrayBuffer = await loadedPdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
      }
      extractedTextarea.value = fullText;
      extractTextContainer.classList.remove('hidden');
      document.getElementById('tooldz').classList.add('hidden');
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  });
}

function renderCrop(main) {
  renderToolLayout(main, 'crop', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="cropContainer" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.crop.name')}</h3>
      <div id="pdfCropStage" class="doc-stage" style="margin-top:20px;"></div>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processCropBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  const cropContainer = document.getElementById('cropContainer');
  const pdfCropStage = document.getElementById('pdfCropStage');
  const processCropBtn = document.getElementById('processCropBtn');

  let loadedPdfFile = null;
  let pdfPagesData = []; // Stores rendered images of PDF pages
  let cropRects = []; // Stores Konva rectangles for cropping

  async function loadCropPdf(file) {
    showLoader();
    try {
      loadedPdfFile = file;
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfPagesData = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;
        pdfPagesData.push(canvas.toDataURL());
      }
      renderCropStage(0);
      cropContainer.classList.remove('hidden');
      document.getElementById('tooldz').classList.add('hidden');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  }

  function renderCropStage(pageIndex) {
    pdfCropStage.innerHTML = '';
    const img = document.createElement('img');
    img.src = pdfPagesData[pageIndex];
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    pdfCropStage.appendChild(img);

    img.onload = () => {
      konvaStage = new Konva.Stage({
        container: 'pdfCropStage',
        width: img.width,
        height: img.height,
      });
      konvaLayer = new Konva.Layer();
      konvaStage.add(konvaLayer);

      // Add a default crop rectangle if none exists for this page
      if (!cropRects[pageIndex]) {
        cropRects[pageIndex] = new Konva.Rect({
          x: 0, y: 0, width: konvaStage.width(), height: konvaStage.height(),
          fill: 'rgba(0,0,0,0.3)',
          stroke: 'blue',
          strokeWidth: 2,
          draggable: true,
          resizable: true,
        });
        konvaLayer.add(cropRects[pageIndex]);
        addKonvaTransformers(cropRects[pageIndex], konvaLayer, null);
      } else {
        konvaLayer.add(cropRects[pageIndex]);
        addKonvaTransformers(cropRects[pageIndex], konvaLayer, null);
      }
      konvaLayer.batchDraw();
    };
  }

  processCropBtn.onclick = async () => {
    if (!loadedPdfFile) return;
    showLoader();
    try {
      const originalPdfDoc = await PDFLib.PDFDocument.load(await loadedPdfFile.arrayBuffer());
      const pages = originalPdfDoc.getPages();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const cropRect = cropRects[i];
        if (cropRect) {
          // PDF-LIB crop box values are: [left, bottom, right, top]
          // Konva rect gives x, y, width, height (top-left corner)
          const x = cropRect.x();
          const y = cropRect.y();
          const width = cropRect.width() * cropRect.scaleX();
          const height = cropRect.height() * cropRect.scaleY();

          const left = x;
          const bottom = page.getHeight() - y - height;
          const right = x + width;
          const top = page.getHeight() - y;
          page.setMediaBox(left, bottom, right, top);
          page.setCropBox(left, bottom, right, top);
        }
      }

      const pdfBytes = await originalPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName(`cropped-${loadedPdfFile.name}`);
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => loadCropPdf(files[0]));
}

function renderOcr(main) {
  renderToolLayout(main, 'ocr', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="image/*,application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="ocrContainer" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.ocr.name')}</h3>
      <img id="ocrImagePreview" class="hidden" alt="OCR Image Preview">
      <textarea id="ocrResultText" readonly placeholder="${LANG === 'ar' ? 'النص المستخرج سيظهر هنا' : 'Extracted text will appear here'}"></textarea>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processOcrBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  const ocrContainer = document.getElementById('ocrContainer');
  const ocrImagePreview = document.getElementById('ocrImagePreview');
  const ocrResultText = document.getElementById('ocrResultText');
  const processOcrBtn = document.getElementById('processOcrBtn');

  let loadedFile = null;

  processOcrBtn.onclick = async () => {
    if (!loadedFile) return;
    showLoader();
    try {
      if (loadedFile.type === 'application/pdf') {
        const arrayBuffer = await loadedFile.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdfDoc.getPage(1); // OCR only first page for simplicity
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;
        ocrImagePreview.src = canvas.toDataURL();
        ocrImagePreview.classList.remove('hidden');
        await performOcr(canvas.toDataURL());
      } else if (loadedFile.type.startsWith('image/')) {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(loadedFile);
        });
        ocrImagePreview.src = dataUrl;
        ocrImagePreview.classList.remove('hidden');
        await performOcr(dataUrl);
      }
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'image/*,application/pdf', (files) => {
    loadedFile = files[0];
    ocrContainer.classList.remove('hidden');
    document.getElementById('tooldz').classList.add('hidden');
    ocrResultText.value = '';
    ocrImagePreview.classList.add('hidden');
  });
}

function renderRepair(main) {
  renderToolLayout(main, 'repair', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="repairContainer" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.repair.name')}</h3>
      <p>${LANG === 'ar' ? 'هذه الأداة تحاول إصلاح ملفات PDF التالفة عن طريق إعادة بناء هيكلها. قد لا تنجح مع جميع الملفات.' : 'This tool attempts to repair corrupted PDF files by rebuilding their structure. It may not work for all files.'}</p>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processRepairBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  let loadedPdf = null;
  const repairContainer = document.getElementById('repairContainer');
  const processRepairBtn = document.getElementById('processRepairBtn');

  processRepairBtn.onclick = async () => {
    if (!loadedPdf) return;
    showLoader();
    try {
      const arrayBuffer = await loadedPdf.arrayBuffer();
      // Attempt to load and then save the PDF. PDF-LIB often corrects minor issues on load/save.
      const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName(`repaired-${loadedPdf.name}`);
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(LANG === 'ar' ? 'فشل الإصلاح. قد يكون الملف تالفًا بشدة.' : 'Repair failed. File might be severely corrupted.', 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => {
    loadedPdf = files[0];
    repairContainer.classList.remove('hidden');
  });
}

function renderNumber(main) {
  renderToolLayout(main, 'number', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept="application/pdf" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="numberOptions" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.number.name')}</h3>
      <div class="number-options">
        <label>${LANG === 'ar' ? 'نمط الترقيم' : 'Numbering Style'}:</label>
        <input type="text" id="numberPattern" value="Page {p} of {n}">
        <label>${LANG === 'ar' ? 'حجم الخط' : 'Font Size'}: <span id="numberFontSizeVal">12</span></label>
        <input type="range" id="numberFontSize" min="8" max="30" value="12">
        <label>${LANG === 'ar' ? 'الموضع' : 'Position'}:</label>
        <select id="numberPosition">
          <option value="bottom-center">${LANG === 'ar' ? 'أسفل الوسط' : 'Bottom Center'}</option>
          <option value="bottom-right">${LANG === 'ar' ? 'أسفل اليمين' : 'Bottom Right'}</option>
          <option value="bottom-left">${LANG === 'ar' ? 'أسفل اليسار' : 'Bottom Left'}</option>
          <option value="top-center">${LANG === 'ar' ? 'أعلى الوسط' : 'Top Center'}</option>
          <option value="top-right">${LANG === 'ar' ? 'أعلى اليمين' : 'Top Right'}</option>
          <option value="top-left">${LANG === 'ar' ? 'أعلى اليسار' : 'Top Left'}</option>
        </select>
      </div>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processNumberBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  let loadedPdf = null;
  const numberOptionsDiv = document.getElementById('numberOptions');
  const processNumberBtn = document.getElementById('processNumberBtn');
  const numberPatternInput = document.getElementById('numberPattern');
  const numberFontSizeInput = document.getElementById('numberFontSize');
  const numberFontSizeVal = document.getElementById('numberFontSizeVal');
  const numberPositionSelect = document.getElementById('numberPosition');

  numberFontSizeInput.oninput = () => numberFontSizeVal.textContent = numberFontSizeInput.value;

  processNumberBtn.onclick = async () => {
    if (!loadedPdf) return;
    showLoader();
    try {
      const pdfDoc = await PDFLib.PDFDocument.load(await loadedPdf.arrayBuffer());
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      for (let i = 0; i < totalPages; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const pageNumberText = numberPatternInput.value
          .replace('{p}', i + 1)
          .replace('{n}', totalPages);
        const fontSize = Number(numberFontSizeInput.value);
        const position = numberPositionSelect.value;

        const textWidth = font.widthOfTextAtSize(pageNumberText, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        let x, y;
        const margin = 20;

        switch (position) {
          case 'bottom-center':
            x = width / 2 - textWidth / 2;
            y = margin;
            break;
          case 'bottom-right':
            x = width - textWidth - margin;
            y = margin;
            break;
          case 'bottom-left':
            x = margin;
            y = margin;
            break;
          case 'top-center':
            x = width / 2 - textWidth / 2;
            y = height - textHeight - margin;
            break;
          case 'top-right':
            x = width - textWidth - margin;
            y = height - textHeight - margin;
            break;
          case 'top-left':
            x = margin;
            y = height - textHeight - margin;
            break;
        }

        page.drawText(pageNumberText, {
          x,
          y,
          font,
          size: fontSize,
          color: PDFLib.rgb(0, 0, 0),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName(`numbered-${loadedPdf.name}`);
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', 'application/pdf', (files) => {
    loadedPdf = files[0];
    numberOptionsDiv.classList.remove('hidden');
  });
}

function renderWordToPdf(main) {
  renderToolLayout(main, 'wordToPdf', `
    <div class="dropzone" id="tooldz">
      <input type="file" accept=".doc,.docx" style="display:none"/>
      <div class="dropzone-icon">${svg('upload')}</div>
      <p class="lead">${tt('common.browse')}</p>
      <button type="button" class="pick-btn">${tt('home.pickBtn')}</button>
    </div>
    <div id="wordToPdfContainer" class="card hidden" style="margin-top:20px; padding:24px;">
      <h3>${tt('tools.wordToPdf.name')}</h3>
      <div id="wordPreview" style="border:1px solid var(--border); padding:15px; min-height:300px; background:#fff; overflow-y:auto;"></div>
      <div class="tool-actions">
        <button class="cancel-btn" onclick="nav('home')">${tt('common.cancel')}</button>
        <button class="process-btn" id="processWordToPdfBtn">${tt('common.apply')}</button>
      </div>
    </div>
  `);

  let loadedWordFile = null;
  const wordToPdfContainer = document.getElementById('wordToPdfContainer');
  const wordPreview = document.getElementById('wordPreview');
  const processWordToPdfBtn = document.getElementById('processWordToPdfBtn');

  processWordToPdfBtn.onclick = async () => {
    if (!loadedWordFile) return;
    showLoader();
    try {
      const arrayBuffer = await loadedWordFile.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

      // To convert HTML to PDF client-side, you would typically use a library like html2pdf.js
      // or generate a PDF from canvas elements. For this academic project, we'll simulate
      // the conversion by showing the HTML and allowing download of a basic PDF.
      // A full HTML to PDF conversion is complex and beyond the scope of simple client-side JS.

      // Basic text extraction to PDF pages (not full HTML layout).
      const pdfDoc = await PDFLib.PDFDocument.create();
      let page = pdfDoc.addPage();
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      page.drawText('Converted from Word (HTML preview below):', { x: 50, y: 750, font, size: 12 });
      
      const textLines = html.replace(/<[^>]*>/g, '').split(/\r?\n/).filter(line => line.trim() !== '');
      let yPos = 730;
      const lineHeight = 15;
      const marginBottom = 50;
      for (const line of textLines) {
        if (yPos < marginBottom + lineHeight) {
          page = pdfDoc.addPage();
          yPos = 750;
        }
        const safe = line.length > 120 ? line.slice(0, 117) + '...' : line;
        page.drawText(safe, { x: 50, y: yPos, font, size: 10 });
        yPos -= lineHeight;
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = await promptFileName(`${loadedWordFile.name.replace(/\.(doc|docx)$/, '')}.pdf`);
      saveAs(blob, fileName);
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  };

  setupDropzone('tooldz', '.doc,.docx', async (files) => {
    showLoader();
    try {
      loadedWordFile = files[0];
      const arrayBuffer = await loadedWordFile.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      wordPreview.innerHTML = html;
      wordToPdfContainer.classList.remove('hidden');
      document.getElementById('tooldz').classList.add('hidden');
      toast(tt('common.success'), 'success');
    } catch (error) {
      console.error(error);
      toast(tt('common.error'), 'error');
    } finally {
      hideLoader();
    }
  });
}

/* ================== Loader Functions ================== */
function showLoader() {
  document.getElementById('loaderOverlay').classList.add('active');
}

function hideLoader() {
  document.getElementById('loaderOverlay').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  applyLang();
  render();
});
