<!DOCTYPE html>
<!--
Final Version 2.8.2:
- This version is stable and includes all features and fixes.
- No new changes were needed in this file. Version number updated for consistency.
-->
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>    مستورد   الشرائح   التفاعلي  </title>
<!-- SortableJS Library for Drag and Drop -->
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
<style>
:root {
    --primary-start: #667eea;
    --primary-end: #764ba2;
    --title-bg: #0B5FA5;
    --bg-gradient: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    --card-bg: rgba(255, 255, 255, 0.95);
    --border-color: #e5e7eb;
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --status-success-bg: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    --status-success-text: #065f46;
    --status-error-bg: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    --status-error-text: #991b1b;
    --shadow-light: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-medium: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --imported-red: #ef4444;
    --not-in-sheet-bg: #fff1f2;
    --not-in-sheet-border: #ffb6c1;
    --checkpoint-active-bg: #f59e0b;
    --checkpoint-active-border: #d97706;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body, html { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: var(--bg-gradient); color: var(--text-primary); height: 100%; overflow: hidden; }
body.preview-mode header, body.preview-mode .form-container { display: none; }
body.preview-mode .container, body.preview-mode footer { padding: 15px; }
.container { display: flex; flex-direction: column; height: 100vh; padding: 20px; gap: 20px; transition: padding 0.3s ease; }
header { text-align: center; padding: 15px; background: var(--card-bg); border-radius: 16px; box-shadow: var(--shadow-light); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); flex-shrink: 0; }
h1 { font-size: 24px; margin-bottom: 5px; }
.subtitle { font-size: 14px; }
main { flex: 1; display: flex; flex-direction: column; gap: 16px; overflow: hidden; }
.form-container { background: var(--card-bg); border-radius: 16px; padding: 24px; box-shadow: var(--shadow-light); flex-shrink: 0; }
.preview-header { display: none; justify-content: flex-start; margin-bottom: 10px; flex-shrink: 0; }
body.preview-mode .preview-header { display: flex; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.input-group label { display: block; margin-bottom: 8px; font-weight: 600; }
input[type="text"] { width: 100%; padding: 12px 16px; border: 2px solid var(--border-color); border-radius: 12px; font-size: 14px; direction: ltr; transition: all 0.3s ease; }
input[type="text"]:focus { outline: none; border-color: var(--primary-start); box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
.btn { padding: 12px 24px; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn-primary { background: linear-gradient(135deg, var(--primary-start), var(--primary-end)); color: white; box-shadow: var(--shadow-light); }
.btn-primary:hover { box-shadow: var(--shadow-medium); }
.btn-secondary { background: var(--card-bg); border: 2px solid var(--border-color); color: var(--text-primary); }
.btn-secondary:hover { border-color: var(--primary-start); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.status-message { padding: 16px 20px; border-radius: 12px; margin-bottom: 16px; text-align: center; font-weight: 600; }
.status-success { background: var(--status-success-bg); color: var(--status-success-text); }
.status-error { background: var(--status-error-bg); color: var(--status-error-text); }
.loading-overlay { text-align: center; padding: 60px 20px; }
.spinner { width: 50px; height: 50px; margin: 0 auto 20px; position: relative; }
.spinner::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 4px solid rgba(102, 126, 234, 0.2); border-top-color: var(--primary-start); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.slides-preview { flex: 1; overflow-y: auto; background: var(--card-bg); border-radius: 16px; padding: 16px; box-shadow: var(--shadow-light); }
.slide-item { display: flex; flex-direction: column; gap: 16px; padding: 20px; margin-bottom: 16px; border: 2px solid transparent; border-radius: 16px; background: white; box-shadow: var(--shadow-light); transition: all 0.3s ease; position: relative; }
.slide-item:hover { transform: translateY(-2px); box-shadow: var(--shadow-medium); }
.slide-item.selected { border-color: var(--primary-start); background: rgba(102, 126, 234, 0.05); }
.slide-item.imported-question { border-color: var(--imported-red); opacity: 0.7; }
.slide-item.not-in-sheet { background-color: var(--not-in-sheet-bg); border-color: var(--not-in-sheet-border); }
.not-in-sheet-icon { position: absolute; top: 10px; left: 10px; font-size: 24px; z-index: 10; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3)); }
.slide-header { display: flex; align-items: center; gap: 12px; }
.slide-title { flex: 1; background: var(--title-bg); color: white; font-size: 16px; font-weight: 700; padding: 12px 16px; border-radius: 12px; text-align: right; }
.slide-checkbox { width: 20px; height: 20px; cursor: pointer; accent-color: var(--primary-start); flex-shrink: 0; }
.slide-image-container { position: relative; width: 100%; padding-top: 56.25%; background: #f0f2f5; border-radius: 12px; overflow: hidden; }
.slide-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; }
.question-content { padding: 16px; background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; margin-top: 8px; }
.question-body { font-size: 16px; font-weight: 600; margin-bottom: 16px; line-height: 1.6; text-align: right; white-space: pre-wrap; }
.answer-options { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; counter-reset: option-counter; }
.answer-options li { display: flex; align-items: center; gap: 12px; background-color: #fff; padding: 12px; border-radius: 8px; border: 1px solid #dee2e6; font-size: 15px; }
.answer-options li::before { counter-increment: option-counter; content: counter(option-counter, upper-alpha); font-weight: 700; background-color: #e9ecef; color: var(--text-primary); border: 1px solid #ced4da; min-width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; flex-shrink: 0; }
.slide-details { font-size: 12px; color: var(--text-secondary); text-align: right; padding: 12px; background: rgba(0,0,0,0.02); border-radius: 8px; border: 1px solid rgba(0,0,0,0.05); }
footer { background: var(--card-bg); border-radius: 16px; padding: 20px; backdrop-filter: blur(10px); box-shadow: var(--shadow-light); flex-shrink: 0; }
.controls { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.control-group { display: flex; gap: 12px; }
.placement-select { background-color: #e0e7ff; color: #1e293b; border: 2px solid var(--primary-start); font-weight: bold; box-shadow: 0 2px 8px rgba(102,126,234,0.08); transition: border 0.2s, box-shadow 0.2s; }
.btn-toggle-section-id, .btn-checkpoint { padding: 4px 8px; font-size: 12px; background-color: #e5e7eb; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; margin-right: 8px; flex-shrink: 0; }
.btn-toggle-section-id.active { background-color: var(--primary-start); color: white; border-color: var(--primary-start); }
.btn-checkpoint.active { background-color: var(--checkpoint-active-bg); border-color: var(--checkpoint-active-border); color: white; font-weight: bold; }
.drag-handle { font-size: 24px; color: #cbd5e1; cursor: grab; padding: 0 10px; align-self: stretch; display: flex; align-items: center; }
.drag-handle:active { cursor: grabbing; }
.move-to-input { width: 50px; padding: 4px 6px; font-size: 12px; text-align: center; border: 1px solid var(--border-color); border-radius: 6px; margin-left: 8px; -moz-appearance: textfield; }
.move-to-input::-webkit-outer-spin-button, .move-to-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
/* Modal Styles */
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
.modal-content { background: white; padding: 24px; border-radius: 16px; box-shadow: var(--shadow-medium); width: 90%; max-width: 600px; direction: rtl; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-title { font-size: 20px; font-weight: 700; color: var(--title-bg); }
.modal-close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #9ca3af; }
.modal-body { max-height: 60vh; overflow-y: auto; padding-left: 10px; }
.html-source-item { display: flex; gap: 10px; margin-bottom: 10px; }
.html-source-item input { flex-grow: 1; direction: ltr; }
.btn-icon { padding: 8px; min-width: 40px; background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
/* Dragging View Styles */
 .slides-preview.dragging-mode { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; align-content: flex-start; padding: 12px; }
 .slides-preview.dragging-mode .slide-item { width: 100%; height: 160px; padding: 8px; gap: 8px; justify-content: center; align-items: center; border: 2px solid var(--border-color); background: white; overflow: hidden; margin-bottom: 0; border-radius: 12px; box-shadow: var(--shadow-light); transition: all 0.2s ease; position: relative; }
 .slides-preview.dragging-mode .slide-item.selected { border-color: var(--primary-start); background: rgba(102, 126, 234, 0.08); }
 .slides-preview .icon-view { display: none; }
 .slides-preview.dragging-mode .normal-view { display: none; }
 .slides-preview.dragging-mode .icon-view { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; text-align: center; }
 .slide-icon-preview { width: 80px; height: 60px; border-radius: 8px; background-color: #f0f2f5; background-size: cover; background-position: center; background-repeat: no-repeat; border: 1px solid #dee2e6; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 18px; font-weight: bold; margin-bottom: 8px; flex-shrink: 0; }
 .slide-title-preview { font-size: 11px; font-weight: 600; color: var(--text-primary); text-align: center; width: 100%; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3; }
 .sortable-ghost { opacity: 1 !important; background: rgba(102, 126, 234, 0.1) !important; border: 2px dashed var(--primary-start) !important; border-radius: 12px !important; box-shadow: none !important; }
 .sortable-ghost > * { visibility: hidden; }
 .sortable-chosen { cursor: grabbing !important; opacity: 0.8 !important; transform: scale(0.95) rotate(3deg) !important; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2) !important; z-index: 1000 !important; }
 .slide-index-badge {
    position: absolute;
    top: 6px;
    left: 6px;
    background: #0B5FA5;
    color: #fff;
    font-size: 15px;
    font-weight: bold;
    padding: 2px 10px;
    border-radius: 12px;
    opacity: 0;
    pointer-events: none;
    z-index: 20;
    transition: opacity 0.2s;
}
.slide-item:hover .slide-index-badge {
    opacity: 1;
}
/* CSS للبنك */
.bank-badge {
    color: #fff;
    background: #ef4444;
    border-radius: 8px;
    font-size: 12px;
    font-weight: bold;
    padding: 2px 8px;
    margin-right: 6px;
    margin-left: 6px;
    vertical-align: middle;
}
/* أضف CSS لشارة unlinked البرتقالية */
.unlinked-badge {
    color: #fff;
    background: #f59e0b;
    border-radius: 8px;
    font-size: 12px;
    font-weight: bold;
    padding: 2px 8px;
    margin-right: 6px;
    margin-left: 6px;
    vertical-align: middle;
    border: 1px solid #d97706;
    box-shadow: 0 1px 2px rgba(0,0,0,0.07);
    cursor: pointer;
}
.linked-badge {
    color: #fff;
    background: #22c55e;
    border-radius: 8px;
    font-size: 12px;
    font-weight: bold;
    padding: 2px 8px;
    margin-right: 6px;
    margin-left: 6px;
    vertical-align: middle;
    border: 1px solid #16a34a;
    box-shadow: 0 1px 2px rgba(0,0,0,0.07);
}
</style>
</head>
<body>
<div class="container">
<header>
    <h1>   📊  مستورد   الشرائح   التفاعلي  (v2.8.2) </h1>
    <p class="subtitle">    استيراد   الشرائح   من   عدة   مصادر  HTML  إلى  Google Slides </p>
</header>
<main>
    <div class="form-container">
        <div class="form-grid">
            <div class="input-group">
                <label for="manageHtmlSourcesBtn">   📚  مصادر   ملفات  HTML </label>
                <button id="manageHtmlSourcesBtn" class="btn btn-secondary">    إدارة   المصادر  (<span id="sourceCount">0</span>) </button>
            </div>
            <div class="input-group">
                <label for="folderId">   📁  معرف   مجلد   الصور  </label>
                <input type="text" id="folderId" placeholder="ID_  المجلد  _  الذي  _  يحتوي  _  الصور  ">
            </div>
        </div>
        <button id="previewBtn" class="btn btn-primary" style="width: 100%;" disabled>   🔍  معاينة   الشرائح  </button>
    </div>
    <div class="preview-header">
        <button id="backToFormBtn" class="btn btn-secondary">   ✏️  الرجوع   وتعديل   المدخلات  </button>
        <button id="filterBtn" class="btn btn-secondary" style="margin-right:12px;">🔎 تصفية</button>
    </div>
    <div id="statusContainer"></div>
    <div id="loading" class="loading-overlay" style="display: none;">
        <div class="spinner"></div>
        <div class="loading-text">    جارٍ تحميل   الشرائح  ...</div>
    </div>
    <div id="slidesPreview" class="slides-preview" style="display: none;"></div>
</main>
<footer>
    <div class="controls">
        <div class="control-group">
            <button id="selectAllBtn" class="btn btn-secondary">   ✅  تحديد   الكل  </button>
            <button id="deselectAllBtn" class="btn btn-secondary">   ❌  إلغاء   التحديد  </button>
            <button id="resetImportedBtn" class="btn btn-secondary" style="color:#ef4444;border-color:#ef4444;">   🔄  إعادة   تعيين   المستورد  </button>
        </div>
        <button id="quickStatsBtn" class="btn btn-secondary" style="background:#e0e7ff;color:#7c3aed;font-weight:bold;border:2px solid #a5b4fc;">  📊  إحصائيات   سريعة </button>
        <button id="updateFromSheetBtn" class="btn btn-secondary" style="background:#e0e7ff;color:#0B5FA5;font-weight:bold;border:2px solid #0B5FA5;">   🔗  تحديث   من  Google Sheet </button>
        <button id="importBtn" class="btn btn-primary" disabled>   📥  استيراد   المحدد  </button>
    </div>
</footer>








<!-- HTML Sources Modal -->
<div id="htmlSourcesModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 class="modal-title">    إدارة   مصادر  HTML </h2>
            <button class="modal-close-btn" data-modal-id="htmlSourcesModal"> ✖ </button>
        </div>
        <div class="modal-body" id="htmlSourcesContainer"></div>
        <div class="modal-footer" style="margin-top: 20px; display: flex; gap: 10px; justify-content: space-between;">
            <button id="addHtmlSourceBtn" class="btn btn-secondary">  ➕  إضافة   مصدر </button>
            <button id="saveHtmlSourcesBtn" class="btn btn-primary">    حفظ  </button>
        </div>
    </div>
</div>
 <!-- Google Sheet URL Modal -->
<div id="sheetModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
        <h2 class="modal-title">    تحديث   من  Google Sheet</h2>
        <button class="modal-close-btn" data-modal-id="sheetModal"> ✖ </button>
    </div>
    <div class="modal-body">
        <p style="margin-bottom: 12px;">    أدخل   رابط   ملف  Google Sheet  الذي   يحتوي   على   الأعمدة  : <b>question_id, section_no, question_type, question_placement</b></p>
        <input type="text" id="sheetUrlInput" placeholder="https://docs.google.com/spreadsheets/d/FILE_ID/edit" style="width:100%; margin-bottom: 18px;">
        <div id="sheetStatusMsg" style="margin-top:10px;font-size:14px;color:#ef4444;"></div>
    </div>
    <div class="modal-footer" style="margin-top: 20px; text-align: left;">
        <button id="applySheetBtn" class="btn btn-primary" style="width:100%;">    تحديث   من   الشيت  </button>
    </div>
  </div>
</div>








<!-- Quick Stats Modal -->
 <div id="quickStatsModal" class="modal">
   <div class="modal-content">
     <div class="modal-header">
         <h2 class="modal-title">  📊  إحصائيات   سريعة </h2>
         <button class="modal-close-btn" data-modal-id="quickStatsModal"> ✖ </button>
     </div>
     <div class="modal-body" id="quickStatsContent"></div>
   </div>
 </div>








 <!-- Confirm Import Modal -->
 <div id="confirmImportModal" class="modal">
   <div class="modal-content">
     <div class="modal-header">
         <h2 class="modal-title"> تأكيد   الاستيراد </h2>
         <button class="modal-close-btn" data-modal-id="confirmImportModal"> ✖ </button>
     </div>
     <div class="modal-body" id="confirmImportContent" style="margin-bottom:18px;"></div>
     <div class="modal-footer" style="display:flex;gap:12px;justify-content:flex-end;">
       <button id="confirmImportBtn" class="btn btn-primary"> تأكيد   الاستيراد </button>
       <button id="cancelImportBtn" class="btn btn-secondary"> إلغاء </button>
     </div>
   </div>
 </div>








 <!-- Filter Modal -->
 <div id="filterModal" class="modal" style="display:none;z-index:10000;">
   <div class="modal-content" style="min-width:320px;max-width:90vw;">
     <div class="modal-header">
       <h2 class="modal-title">تصفية الشرائح</h2>
       <button class="modal-close-btn" id="closeFilterModal">✖</button>
     </div>
     <div class="modal-body" style="padding:16px;display:flex;flex-direction:column;gap:12px;">
       <label><input type="radio" name="filterType" value="all" checked> عرض الكل</label>
       <label><input type="radio" name="filterType" value="questions"> فقط الأسئلة</label>
       <label><input type="radio" name="filterType" value="explain"> فقط الشرح</label>
       <label><input type="radio" name="filterType" value="checkpoint"> فقط Checkpoint</label>
       <div style="margin-top:8px;">
         <b>حسب النوع (placement):</b>
         <div id="placementFilters" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;"></div>
       </div>
     </div>
     <div class="modal-footer" style="display:flex;gap:12px;justify-content:flex-end;">
       <button id="applyFilterBtn" class="btn btn-primary">تطبيق</button>
     </div>
   </div>
 </div>








</div>








<script>
// Global state variables
let allSlidesData = [];
let htmlSourceUrls = [];
let isLoading = false;
let sortableInstance = null;
 // UI elements cache
const ui = {
    body: document.body,
    folderId: document.getElementById('folderId'),
    previewBtn: document.getElementById('previewBtn'),
    importBtn: document.getElementById('importBtn'),
    selectAllBtn: document.getElementById('selectAllBtn'),
    deselectAllBtn: document.getElementById('deselectAllBtn'),
    resetImportedBtn: document.getElementById('resetImportedBtn'),
    updateFromSheetBtn: document.getElementById('updateFromSheetBtn'),
    loading: document.getElementById('loading'),
    statusContainer: document.getElementById('statusContainer'),
    slidesPreview: document.getElementById('slidesPreview'),
    backToFormBtn: document.getElementById('backToFormBtn'),
    sourceCount: document.getElementById('sourceCount'),
    // Modals
    htmlSourcesModal: document.getElementById('htmlSourcesModal'),
    htmlSourcesContainer: document.getElementById('htmlSourcesContainer'),
    manageHtmlSourcesBtn: document.getElementById('manageHtmlSourcesBtn'),
    addHtmlSourceBtn: document.getElementById('addHtmlSourceBtn'),
    saveHtmlSourcesBtn: document.getElementById('saveHtmlSourcesBtn'),
    sheetModal: document.getElementById('sheetModal'),
    sheetUrlInput: document.getElementById('sheetUrlInput'),
    applySheetBtn: document.getElementById('applySheetBtn'),
    sheetStatusMsg: document.getElementById('sheetStatusMsg'),
    quickStatsBtn: document.getElementById('quickStatsBtn'),
    quickStatsModal: document.getElementById('quickStatsModal'),
    quickStatsContent: document.getElementById('quickStatsContent'),
    confirmImportModal: document.getElementById('confirmImportModal'),
    confirmImportContent: document.getElementById('confirmImportContent'),
    confirmImportBtn: document.getElementById('confirmImportBtn'),
    cancelImportBtn: document.getElementById('cancelImportBtn'),
    filterBtn: document.getElementById('filterBtn'),
    filterModal: document.getElementById('filterModal'),
    closeFilterModal: document.getElementById('closeFilterModal'),
    applyFilterBtn: document.getElementById('applyFilterBtn'),
};








document.addEventListener('DOMContentLoaded', function() {
    // رسالة توضيحية إذا لم تكن البيئة Google Apps Script
    if (typeof google === 'undefined' || !google.script || !google.script.run) {
        showMessage('⚠️ يجب تشغيل هذه الصفحة من خلال Google Apps Script فقط. بعض الميزات لن تعمل في المتصفح مباشرة.', 'error');
        // تعطيل الأزرار التي تعتمد على السيرفر
        ui.previewBtn.disabled = true;
        ui.importBtn.disabled = true;
        ui.updateFromSheetBtn.disabled = true;
        ui.resetImportedBtn.disabled = true;
    }
    initialize();
});








function initialize() {
    setupEventListeners();
    loadSavedData();
    setupPlacementFilters();
}








function setupPlacementFilters() {
  const placements = (window.CONFIG && CONFIG.PLACEMENTS) || ['live','example','ai','homework','interactive_example'];
  const container = document.getElementById('placementFilters');
  if (!container) return;
  container.innerHTML = placements.map(p => `<label><input type="checkbox" name="placementFilter" value="${p}"> ${p}</option>`).join('');
}








function setupEventListeners() {
    ui.previewBtn.addEventListener('click', handlePreview);
    ui.importBtn.addEventListener('click', handleImport);
    ui.selectAllBtn.addEventListener('click', () => selectAll(true));
    ui.deselectAllBtn.addEventListener('click', () => selectAll(false));
    ui.resetImportedBtn.addEventListener('click', resetImportedSlides);
    ui.backToFormBtn.addEventListener('click', exitPreviewMode);
    ui.folderId.addEventListener('input', validateInputs);
     // Modal Listeners
    ui.manageHtmlSourcesBtn.addEventListener('click', openHtmlSourcesModal);
    ui.addHtmlSourceBtn.addEventListener('click', () => addHtmlSourceInput());
    ui.saveHtmlSourcesBtn.addEventListener('click', saveHtmlSources);
    ui.updateFromSheetBtn.addEventListener('click', () => ui.sheetModal.style.display = 'flex');
    ui.applySheetBtn.addEventListener('click', applySheetData);
    ui.quickStatsBtn.addEventListener('click', showQuickStatsModal);
    ui.confirmImportBtn.addEventListener('click', doImportSlides);
    ui.cancelImportBtn.addEventListener('click', () => ui.confirmImportModal.style.display = 'none');








    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById(btn.dataset.modalId).style.display = 'none';
        });
    });








    const filterBtn = document.getElementById('filterBtn');
    const filterModal = document.getElementById('filterModal');
    const closeFilterModal = document.getElementById('closeFilterModal');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    filterBtn && filterBtn.addEventListener('click', () => { filterModal.style.display = 'flex'; });
    closeFilterModal && closeFilterModal.addEventListener('click', () => { filterModal.style.display = 'none'; });
    applyFilterBtn && applyFilterBtn.addEventListener('click', applyFilter);








    addPreviewEventListeners();
}
 function openHtmlSourcesModal() {
    ui.htmlSourcesContainer.innerHTML = '';
    if (htmlSourceUrls.length === 0) {
        addHtmlSourceInput();
    } else {
        htmlSourceUrls.forEach(url => addHtmlSourceInput(url));
    }
    ui.htmlSourcesModal.style.display = 'flex';
}








function addHtmlSourceInput(url = '') {
    const id = `source-${Date.now()}-${Math.random()}`;
    const item = document.createElement('div');
    item.className = 'html-source-item';
    item.id = id;
    item.innerHTML = `
        <input type="text" class="html-source-url" value="${url}" placeholder="https://drive.google.com/file/d/FILE_ID/view">
        <button class="btn btn-icon" onclick="document.getElementById('${id}').remove()">-</button>
    `;
    ui.htmlSourcesContainer.appendChild(item);
}








// عند الضغط على زر حفظ المصادر فقط يتم الحفظ (لا يوجد حفظ تلقائي عند تغيير معرف المجلد)
function saveHtmlSources() {
    htmlSourceUrls = Array.from(document.querySelectorAll('.html-source-url'))
                       .map(input => input.value.trim())
                       .filter(url => url);
 ui.htmlSourcesModal.style.display = 'none';
 ui.sourceCount.textContent = htmlSourceUrls.length;
 validateInputs();
 // حفظ فقط عند الضغط على زر حفظ
 if (typeof google !== 'undefined' && google.script && google.script.run) {
     google.script.run.saveUserData(htmlSourceUrls, ui.folderId.value.trim());
 }
 if (htmlSourceUrls.length > 0) {
     showMessage(`${htmlSourceUrls.length}    مصدر   تم   حفظه .`, 'success');
 }
}








function loadSavedData() {
    if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(data => {
                if (data.htmlFileUrls) {
                    htmlSourceUrls = data.htmlFileUrls;
                    ui.sourceCount.textContent = htmlSourceUrls.length;
                }
                if (data.imageFolderId) ui.folderId.value = data.imageFolderId;
                validateInputs();
            })
            .withFailureHandler(err => console.error('Could not load saved data:', err))
            .getSavedUserData();
    } else {
         console.error("google.script.run is not available. This script must be run within a Google Apps Script environment.");
    }
}








function validateInputs() {
    const isValid = htmlSourceUrls.length > 0 && ui.folderId.value.trim();
    ui.previewBtn.disabled = !isValid || isLoading;
    // تحسين: تعطيل زر الاستيراد إذا لم تكن في وضع المعاينة
    ui.importBtn.disabled = isLoading || allSlidesData.filter(s => s.selected).length === 0 || !ui.body.classList.contains('preview-mode');
}








function handlePreview() {
    if (htmlSourceUrls.length === 0) {
        showMessage('  يرجى   إضافة   مصدر  HTML  واحد   على   الأقل .', 'error');
        return;
    }
    setLoadingState(true, '  جارٍ تحميل   ودمج   الشرائح   من   جميع   المصادر ...');
    if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(onPreviewSuccess)
            .withFailureHandler(onApiError)
            .getSlidesForPreview(htmlSourceUrls, ui.folderId.value.trim());
    } else {
        onApiError({message: "Google Apps Script environment not found."});
    }
}








function onPreviewSuccess(result) {
    setLoadingState(false);
    if (result && result.error) {
        showMessage(result.error, 'error');
        exitPreviewMode();
        return;
    }
    if (!result || result.length === 0) {
        showMessage('لم يتم العثور على شرائح جديدة. قد تكون جميعها مستوردة بالفعل. استخدم "إعادة تعيين المستورد" لعرضها مرة أخرى.', 'success');
        exitPreviewMode();
        return;
    }
     allSlidesData = result.map(slide => ({
         ...slide,
         isCheckpoint: false,
         selected: false,
         notInSheet: false
     }));
     renderSlides(allSlidesData);
     enterPreviewMode();
     showMessage(`  تم   تحميل  ${result.length}    شريحة .  حدد   ما   تريد   ثم   اضغط   استيراد .`, 'success');
}








function handleImport() {
    const selectedSlides = allSlidesData.filter(slide => slide.selected);
    if (selectedSlides.length === 0) {
        showMessage('  يرجى   تحديد   شريحة   واحدة   على   الأقل   للاستيراد .', 'error');
        return;
    }
    showConfirmImportModal(selectedSlides);
}








 function showConfirmImportModal(selectedSlides) {
     let typeCounts = selectedSlides.reduce((acc, slide) => {
         const typeKey = slide.placement || slide.type || '  غير   محدد ';
         acc[typeKey] = (acc[typeKey] || 0) + 1;
         return acc;
     }, {});
     let html = `<ul style="list-style:none;padding:0;margin:0 0 12px 0;line-height:2;">
           <li>🔢 <b> عدد   الشرائح   المحددة :</b> ${selectedSlides.length}</li>
           <li><b> تفصيل   الأنواع :</b></li>
          ${Object.entries(typeCounts).map(([type, count]) =>
             `<li style="margin-bottom:2px;">• <span style="color:#7c3aed;font-weight:bold;">${type}</span>: <span style="color:#1e293b;">${count}</span></li>`
          ).join('')}
     </ul>`;
     ui.confirmImportContent.innerHTML = html;
     ui.confirmImportModal.style.display = 'flex';
 }








function doImportSlides() {
     ui.confirmImportModal.style.display = 'none';
     const selectedSlides = allSlidesData.filter(slide => slide.selected);
     if (selectedSlides.length === 0) return;








     setLoadingState(true, `  جارٍ استيراد  ${selectedSlides.length}    شريحة ...`);
     ui.importBtn.disabled = true;








     if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(onImportSuccess)
            .withFailureHandler(onApiError)
            .importSelectedSlides(selectedSlides, ui.folderId.value.trim());
     } else {
        onApiError({message: "Google Apps Script environment not found."});
     }
}








function onImportSuccess(response) {
    setLoadingState(false);
    if (response && response.error) {
         showMessage(response.error, 'error');
         return;
    }
    const importedIds = response;
    showMessage(`✅  تم   استيراد  ${importedIds.length}    شريحة   بنجاح !`, 'success');
 
    allSlidesData = allSlidesData.filter(slide => {
        const id = slide.questionId || slide.slideId;
        return !importedIds.includes(id);
    });








    if (allSlidesData.length > 0) {
        renderSlides(allSlidesData);
    } else {
        showMessage('تم استيراد جميع الشرائح المحددة بنجاح.', 'success');
        exitPreviewMode();
    }
    updateImportButtonState();
}
 function applySheetData() {
    const url = ui.sheetUrlInput.value.trim();
    if (!url) {
        ui.sheetStatusMsg.textContent = '  يرجى   إدخال   رابط   الشيت .';
        return;
    }
    ui.sheetStatusMsg.textContent = '  جاري   جلب   البيانات   من   الشيت ...';
    if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(sheetRows => {
                if (sheetRows && sheetRows.error) {
                    ui.sheetStatusMsg.textContent = `  فشل : ${sheetRows.error}`;
                    return;
                }
                ui.sheetModal.style.display = 'none';
                ui.sheetStatusMsg.textContent = '';
                updatePreviewFromSheet(sheetRows);
            })
            .withFailureHandler(e => {
                ui.sheetStatusMsg.textContent = `  فشل   في   جلب   بيانات   الشيت : ${e.message || e}`;
            })
            .getSheetRows(url);
    } else {
         ui.sheetStatusMsg.textContent = "Google Apps Script environment not found.";
    }
}








 function updatePreviewFromSheet(sheetRows) {
     if (!Array.isArray(sheetRows)) {
         showMessage('  فشل   في   جلب   بيانات   الشيت   أو   تنسيق   غير   صحيح .', 'error');
         return;
     }
     const sheetQuestionMap = new Map(sheetRows.map((row, index) => [row.question_id, { ...row, sheetOrder: index }]));
     const sections = [];
     const questionsBySection = {};
     const questionsNotInSheet = [];
     allSlidesData.forEach(slide => {
         if (!slide.isQuestion) {
             sections.push(slide);
         } else {
             if (sheetQuestionMap.has(slide.questionId)) {
                 const sheetData = sheetQuestionMap.get(slide.questionId);
                 slide.placement = sheetData.question_placement || slide.placement;
                 slide.questionType = sheetData.question_type || slide.questionType;
                 slide.section_no = sheetData.section_no;
                 slide.sheetOrder = sheetData.sheetOrder;
                 slide.notInSheet = false;
                 const sectionNo = slide.section_no || 'unassigned';
                 if (!questionsBySection[sectionNo]) {
                     questionsBySection[sectionNo] = [];
                 }
                 questionsBySection[sectionNo].push(slide);
             } else {
                 slide.notInSheet = true;
                 questionsNotInSheet.push(slide);
             }
         }
     });
     for (const sectionNo in questionsBySection) {
         questionsBySection[sectionNo].sort((a, b) => a.sheetOrder - b.sheetOrder);
     }
     const finalSlides = [];
     sections.forEach(sectionSlide => {
         finalSlides.push(sectionSlide);
         if (sectionSlide.sectionId && questionsBySection[sectionSlide.sectionId]) {
             finalSlides.push(...questionsBySection[sectionSlide.sectionId]);
             delete questionsBySection[sectionSlide.sectionId];
         }
     });
     for (const sectionNo in questionsBySection) {
         finalSlides.push(...questionsBySection[sectionNo]);
     }
     finalSlides.push(...questionsNotInSheet);
     allSlidesData = finalSlides;
     renderSlides(allSlidesData);
     const questionsInSheetCount = sheetRows.length - questionsNotInSheet.length;
     showMessage(`  تم   التحديث . ${questionsInSheetCount}    سؤال   مطابق   للشيت، و  ${questionsNotInSheet.length}    سؤال   غير   مطابق  ( مميز   بعلامة  ❌).`, 'success');
 }








function renderSlides(slides) {
    const scrollPosition = ui.slidesPreview.scrollTop;
    ui.slidesPreview.innerHTML = slides.map((slide, index) => {
        const isNotInSheet = slide.isQuestion && slide.notInSheet;
        const isBank = slide.html && slide.html.includes('data-questionid');
        const itemClasses = ['slide-item', slide.selected ? 'selected' : ''].filter(Boolean).join(' ');
        const imageHtml = slide.imageUrl ? `<div class="slide-image-container"><img src="${slide.imageUrl}" class="slide-image" alt="  صورة   الشريحة " loading="lazy"></div>` : '';
        const questionHtml = slide.isQuestion ? `
            <div class="question-content">
                <p class="question-body">${slide.questionBody || '  نص   السؤال   غير   متوفر ' }</p>
                ${(slide.answerOptions && slide.answerOptions.length > 0) ? `
                <ul class="answer-options">
                    ${slide.answerOptions.map(option => `<li>${option}</li>`).join('')}
                </ul>` : ''}
            </div>` : '';
        const placementHtml = slide.isQuestion ? `
            <select class="placement-select" data-action="change-placement">
                ${CONFIG.PLACEMENTS.map(p => `<option value="${p}" ${slide.placement === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>` : '';
        const details = [
            slide.isQuestion ? `  معرف   السؤال : ${slide.questionId || 'N/A'}` : `  معرف   الشريحة : ${slide.slideId || 'N/A'}`,
            slide.sectionTitle ? `  عنوان   القسم : ${slide.sectionTitle}` : null,
            isBank ? `<span class='bank-badge'>بنك</span>` : null,
            slide.isCheckpoint ? `<button class='checkpoint-badge' data-action='toggle-checkpoint'>Checkpoint</button>` : null
        ].filter(Boolean).join(' • ');

        // شارة الترقيم
        const indexBadge = `<div class="slide-index-badge">${index + 1}</div>`;

        // زر unlinked/linked
        let unlinkedBtn = '';
        if (slide.isQuestion && slide.isUnlinked) {
            unlinkedBtn = `<button class="unlinked-badge" data-action="toggle-unlinked">unlinked</button>`;
        } else if (slide.isQuestion && slide.isLinked) {
            unlinkedBtn = `<span class="linked-badge">linked</span>`;
        }

        return `
            <div class="${itemClasses}" id="item-${index}" data-index="${index}">
                ${indexBadge}
                ${isNotInSheet ? '<div class="not-in-sheet-icon">❌</div>' : ''}
                <div class="normal-view">
                    <div class="slide-header">
                        <div class="drag-handle">⠿</div>
                        <input type="checkbox" class="slide-checkbox" id="slide-${index}" data-action="select" ${slide.selected ? 'checked' : ''}>
                        <input type="number" class="move-to-input" data-action="move-to-position" placeholder="#" min="1" max="${slides.length}">
                        ${!slide.isQuestion && slide.sectionId ? `<button class="btn-toggle-section-id ${slide.showSectionId ? 'active' : ''}" data-action="toggle-id">${slide.showSectionId ? '  إخفاء  ID' : '  إظهار  ID'}</button>` : ''}
                        ${slide.isQuestion ? `<button class="btn-checkpoint ${slide.isCheckpoint ? 'active' : ''}" data-action="set-checkpoint">Checkpoint</button>` : ''}
                        ${placementHtml}
                        ${unlinkedBtn}
                        <div class="slide-title" id="title-${index}">${slide.title}${isBank ? " <span class='bank-badge'>بنك</span>" : ''}</div>
                    </div>
                    ${imageHtml}
                    ${questionHtml}
                    <div class="slide-details">${details}</div>
                </div>
                <div class="icon-view">
                     <div class="drag-handle">⠿</div>
                     <div class="slide-icon-preview" ${slide.imageUrl ? `style="background-image: url('${slide.imageUrl}')"` : ''}>${slide.imageUrl ? '' : (index + 1)}</div>
                     <div class="slide-title-preview">${slide.originalTitle}</div>
                </div>
            </div>`;
    }).join('');
    ui.slidesPreview.scrollTop = scrollPosition;
    initializeSortable();
    updateImportButtonState();
}
 // --- Helper Functions ---
function onApiError(error) {
    setLoadingState(false);
    const msg = (error && error.message) ? error.message : (typeof error === 'string' ? error : 'حدث خطأ غير متوقع');
    showMessage(`  خطأ   غير   متوقع : ${msg}`, 'error');
    exitPreviewMode();
}








function setLoadingState(loading, message = '  جارٍ التحميل ...') {
    isLoading = loading;
    ui.loading.style.display = loading ? 'block' : 'none';
    if (loading) ui.loading.querySelector('.loading-text').textContent = message;
    if (ui.body.classList.contains('preview-mode')) {
        ui.slidesPreview.style.display = loading ? 'none' : 'block';
    }
    ui.previewBtn.disabled = loading || !ui.folderId.value.trim() || htmlSourceUrls.length === 0;
    ui.importBtn.disabled = loading || allSlidesData.filter(s => s.selected).length === 0;
    ui.selectAllBtn.disabled = loading;
    ui.deselectAllBtn.disabled = loading;
    ui.resetImportedBtn.disabled = loading;
    ui.updateFromSheetBtn.disabled = loading;
}








function showMessage(message, type = 'success') {
    const messageElement = document.createElement('div');
    messageElement.className = `status-message status-${type}`;
    messageElement.textContent = message;
    ui.statusContainer.innerHTML = '';
    ui.statusContainer.appendChild(messageElement);
    setTimeout(() => {
        if (ui.statusContainer.contains(messageElement)) {
            ui.statusContainer.removeChild(messageElement);
        }
    }, 7000);
}
 function enterPreviewMode() {
    ui.body.classList.add('preview-mode');
    ui.slidesPreview.style.display = 'block';
    ui.loading.style.display = 'none';
}








function exitPreviewMode() {
    ui.body.classList.remove('preview-mode');
    ui.slidesPreview.style.display = 'none';
    ui.statusContainer.innerHTML = '';
    allSlidesData = [];
}








function selectAll(state) {
    allSlidesData.forEach((slide, index) => {
        slide.selected = state;
        updateSlideVisuals(index);
    });
}








function updateImportButtonState() {
    const checkedCount = allSlidesData.filter(s => s.selected).length;
    ui.importBtn.disabled = checkedCount === 0 || isLoading;
    ui.importBtn.innerHTML = checkedCount > 0 ? `📥  استيراد  ${checkedCount}    شريحة ` : '📥  استيراد   المحدد ';
}








function initializeSortable() {
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    sortableInstance = new Sortable(ui.slidesPreview, {
        handle: '.drag-handle',
        animation: 200,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onStart: () => ui.slidesPreview.classList.add('dragging-mode'),
        onEnd: (evt) => {
            ui.slidesPreview.classList.remove('dragging-mode');
            moveSlide(evt.oldIndex, evt.newIndex, false);
        }
    });
}








function addPreviewEventListeners() {
    ui.slidesPreview.addEventListener('change', e => {
        const slideItem = e.target.closest('.slide-item');
        if (!slideItem) return;
        const index = parseInt(slideItem.dataset.index, 10);
        if (isNaN(index)) return;
        if (e.target.dataset.action === 'select') {
            allSlidesData[index].selected = e.target.checked;
            updateSlideVisuals(index);
        } else if (e.target.dataset.action === 'change-placement') {
            allSlidesData[index].placement = e.target.value;
            const newTitle = `${CONFIG.FINAL_SLIDE_TITLES[e.target.value] || 'سؤال'}: ${allSlidesData[index].originalTitle}`;
            allSlidesData[index].title = newTitle;
            document.getElementById(`title-${index}`).textContent = newTitle;
        }
    });
     ui.slidesPreview.addEventListener('click', e => {
        const slideItem = e.target.closest('.slide-item');
        if (!slideItem) return;
        const index = parseInt(slideItem.dataset.index, 10);
        if (isNaN(index)) return;
        if (e.target.dataset.action === 'toggle-id') {
            allSlidesData[index].showSectionId = !allSlidesData[index].showSectionId;
            renderSlides(allSlidesData);
        } else if (e.target.dataset.action === 'set-checkpoint') {
            const isCurrentlyCheckpoint = allSlidesData[index].isCheckpoint;
            allSlidesData.forEach(slide => slide.isCheckpoint = false);
            allSlidesData[index].isCheckpoint = !isCurrentlyCheckpoint;
            renderSlides(allSlidesData);
        } else if (e.target.dataset.action === 'toggle-unlinked') {
            // عكس الحالة
            if (allSlidesData[index].isUnlinked) {
                allSlidesData[index].isUnlinked = false;
                allSlidesData[index].isLinked = true;
            } else {
                allSlidesData[index].isUnlinked = true;
                allSlidesData[index].isLinked = false;
            }
            renderSlides(allSlidesData);
        }
    });








    ui.slidesPreview.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.dataset.action === 'move-to-position') {
            e.preventDefault();
            const slideItem = e.target.closest('.slide-item');
            if (!slideItem) return;
            const index = parseInt(slideItem.dataset.index, 10);
            const newPosition = parseInt(e.target.value, 10);
            moveSlideToPosition(index, newPosition);
        }
    });
}
  function moveSlideToPosition(currentIndex, newPosition) {
     if (isNaN(newPosition) || newPosition < 1 || newPosition > allSlidesData.length) {
         showMessage(`  الرقم   غير   صالح .  يرجى   إدخال   رقم   بين  1  و  ${allSlidesData.length}`, 'error');
         const input = document.querySelector(`#item-${currentIndex} .move-to-input`);
         if(input) input.value = '';
         return;
     }
     const newIndex = newPosition - 1;
     if (newIndex !== currentIndex) {
         moveSlide(currentIndex, newIndex, true);
     }
 }








 function moveSlide(oldIndex, newIndex, shouldScroll = false) {
    if (oldIndex < 0 || oldIndex >= allSlidesData.length || newIndex < 0 || newIndex >= allSlidesData.length) {
        return;
    }
    const [movedItem] = allSlidesData.splice(oldIndex, 1);
    allSlidesData.splice(newIndex, 0, movedItem);

    // نقل العنصر في DOM مباشرة
    const slidesPreview = ui.slidesPreview;
    const oldElem = document.getElementById(`item-${oldIndex}`);
    const newElem = document.getElementById(`item-${newIndex}`);
    if (oldElem && newElem && oldElem !== newElem) {
        if (newIndex > oldIndex) {
            newElem.after(oldElem);
        } else {
            newElem.before(oldElem);
        }
        updateSlidesIndexing();
    } else {
        // fallback: إعادة رسم الكل إذا حدث خطأ
        renderSlides(allSlidesData);
    }

    if (shouldScroll) {
        const newItemElement = document.getElementById(`item-${newIndex}`);
        if (newItemElement) {
            newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function updateSlidesIndexing() {
    // تحديث أرقام الشرائح وخصائص العناصر بعد النقل
    const items = ui.slidesPreview.querySelectorAll('.slide-item');
    items.forEach((item, idx) => {
        item.dataset.index = idx;
        item.id = `item-${idx}`;
        const badge = item.querySelector('.slide-index-badge');
        if (badge) badge.textContent = idx + 1;
        const checkbox = item.querySelector('.slide-checkbox');
        if (checkbox) checkbox.id = `slide-${idx}`;
        // تحديث التحديد
        checkbox.checked = allSlidesData[idx].selected;
        item.classList.toggle('selected', allSlidesData[idx].selected);
    });
    updateImportButtonState();
}

function updateSlideVisuals(index) {
    const item = document.getElementById(`item-${index}`);
    const checkbox = document.getElementById(`slide-${index}`);
    if (!item || !checkbox) return;
    item.classList.toggle('selected', allSlidesData[index].selected);
    checkbox.checked = allSlidesData[index].selected;
    updateImportButtonState();
}








function resetImportedSlides() {
    if (confirm('  هل   أنت   متأكد   أنك   تريد   إعادة   تعيين   قائمة   الشرائح   المستوردة؟ سيؤدي   هذا   إلى   ظهور   جميع   الشرائح   مرة   أخرى   في   المعاينة .')) {
        setLoadingState(true, '  جارٍ إعادة   التعيين ...');
        if (typeof google !== 'undefined' && google.script && google.script.run) {
            google.script.run
                .withSuccessHandler(() => {
                    setLoadingState(false);
                    allSlidesData.forEach(s => s.isImported = false);
                    renderSlides(allSlidesData);
                    showMessage('  تمت   إعادة   تعيين   الشرائح   المستوردة   بنجاح .', 'success');
                })
                .withFailureHandler(err => {
                    setLoadingState(false);
                    onApiError(err);
                })
                .resetImportedSlidesServer();
        } else {
            onApiError({message: "Google Apps Script environment not found."});
        }
    }
}








 // --- Stats Modal Logic ---
 function showQuickStatsModal() {
     const stats = calculateQuickStats(allSlidesData);
     ui.quickStatsContent.innerHTML = renderQuickStatsHtml(stats);
     ui.quickStatsModal.style.display = 'flex';
 }








 function calculateQuickStats(slides) {
     let total = 0, totalQuestions = 0, totalExamples = 0, importedCount = 0, remainingCount = 0, bankCount = 0, checkpointCount = 0, explainSlides = 0;
     const placementCounts = {};
     slides.forEach(slide => {
         total++;
         if (!slide.isQuestion) explainSlides++;
         if (slide.isCheckpoint) checkpointCount++;
         if (slide.isQuestion) {
             totalQuestions++;
         }
         if (slide.placement === 'example') totalExamples++;
         if (slide.isImported) importedCount++;
         else remainingCount++;
         if (slide.html && slide.html.includes('data-questionid')) bankCount++;
         // حساب أنواع الـ placement
         if (slide.placement) {
             placementCounts[slide.placement] = (placementCounts[slide.placement] || 0) + 1;
         }
     });
     return { total, explainSlides, checkpointCount, totalQuestions, totalExamples, importedCount, remainingCount, bankCount, placementCounts };
 }








 function renderQuickStatsHtml(stats) {
     return `
     <ul style="list-style:none;padding:0;margin:0 0 12px 0;line-height:2;">
         <li>🔢 <b>إجمالي الشرائح:</b> ${stats.total}</li>
         <li>📖 <b>إجمالي شرائح الشرح:</b> ${stats.explainSlides}</li>
         <li style="color:#f59e0b;"><b>🟧 عدد شرائح التشيك بوينت:</b> ${stats.checkpointCount}</li>
         <li>❓ <b>إجمالي عدد الأسئلة:</b> ${stats.totalQuestions}</li>
         <li style="margin-top:6px;"><b>تفصيل الأنواع حسب placement:</b></li>
         ${Object.entries(stats.placementCounts).map(([placement, count]) =>
             `<li style='margin-bottom:2px;'>• <span style='color:#7c3aed;font-weight:bold;'>${placement}</span>: <span style='color:#1e293b;'>${count}</span></li>`
         ).join('')}
     </ul>
     <div style="margin-top:10px;"><b>تفاصيل الأنواع:</b>
         <ul style="list-style:none;padding:0;margin:0;">
             <li style="color:#ef4444;"><b>🏦 أسئلة بنك نجوي:</b> ${stats.bankCount}</li>
         </ul>
     </div>
 `;
 }
 // Make CONFIG available to client-side JS
const CONFIG = {
    PLACEMENTS: ['live', 'example', 'ai', 'homework', 'interactive_example'],
    FINAL_SLIDE_TITLES: {
        'live': '  سؤال  ',
        'ai': '  سؤال  ',
        'homework': '  سؤال  ',
        'example': '  مثال  ',
        'interactive_example': '  سؤال  '
    }
};








function applyFilter() {
 // نوع الفلتر الرئيسي
 const filterType = document.querySelector('input[name="filterType"]:checked')?.value || 'all';
 // أنواع placement المختارة
 const placementCheckboxes = document.querySelectorAll('input[name="placementFilter"]:checked');
 const selectedPlacements = Array.from(placementCheckboxes).map(cb => cb.value);








 let filteredSlides = allSlidesData;
 // تصفية حسب نوع الفلتر
 if (filterType === 'questions') {
     filteredSlides = filteredSlides.filter(slide => slide.isQuestion);
 } else if (filterType === 'explain') {
     filteredSlides = filteredSlides.filter(slide => !slide.isQuestion);
 } else if (filterType === 'checkpoint') {
     filteredSlides = filteredSlides.filter(slide => slide.isCheckpoint);
 }
 // تصفية حسب placement إذا تم اختيار أي منها
 if (selectedPlacements.length > 0) {
     filteredSlides = filteredSlides.filter(slide => selectedPlacements.includes(slide.placement));
 }
 renderSlides(filteredSlides);
 // إغلاق نافذة الفلترة
 ui.filterModal.style.display = 'none';
}
</script>
</body>
</html>

