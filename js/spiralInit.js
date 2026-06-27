/* Spiral viewer &#8212; split from spiral_viewer.html */

// loadEnv, listeners, boot

// ============================================================
// localStorage 永続化
// ============================================================
var STORAGE_KEY_ENV_A = 'spiral_viewer_envA_v1';
var STORAGE_KEY_ENV_B = 'spiral_viewer_envB_v1';
var STORAGE_KEY_MODE  = 'spiral_viewer_mode_v1';

/**
 * 環境データを localStorage に保存する。
 * _files はバイナリ/大容量になるため除外し、メタ情報と解析済みデータのみ保存。
 */
function saveEnvToStorage(which, data) {
  try {
    var key = which === 'A' ? STORAGE_KEY_ENV_A : STORAGE_KEY_ENV_B;
    var toSave = {};
    for (var k in data) {
      if (k === '_files') continue;
      toSave[k] = data[k];
    }
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch (e) {
    console.warn('[saveEnvToStorage] 保存失敗 (容量超過の可能性):', e);
  }
}

/**
 * localStorage から両環境データを復元する。
 * ページロード時に呼ぶ。
 */
function restoreEnvFromStorage() {
  try {
    var savedA = localStorage.getItem(STORAGE_KEY_ENV_A);
    if (savedA) {
      envA = JSON.parse(savedA);
      var btnA = document.getElementById('loadBtnA');
      btnA.classList.add('loaded');
      document.getElementById('loadLabelA').textContent = envA._folderName || (envA.app && (envA.app.title || envA.app.name)) || '読み込み済';
    }
  } catch (e) { console.warn('[restoreEnvFromStorage] 環境A 復元失敗:', e); }

  try {
    var savedB = localStorage.getItem(STORAGE_KEY_ENV_B);
    if (savedB) {
      envB = JSON.parse(savedB);
      var btnB = document.getElementById('loadBtnB');
      btnB.classList.add('loaded');
      document.getElementById('loadLabelB').textContent = envB._folderName || (envB.app && (envB.app.title || envB.app.name)) || '読み込み済';
    }
  } catch (e) { console.warn('[restoreEnvFromStorage] 環境B 復元失敗:', e); }

  try {
    var savedMode = localStorage.getItem(STORAGE_KEY_MODE);
    if (savedMode) {
      currentMode = savedMode;
      updateModeUi(currentMode);
    }
  } catch (e) {}

  if (envA || envB) {
    invalidateDiffCache();
    updateHeaderCompareInfo();
    updateCompareOrderOptionsVisibility();
    renderSidebar();
    renderContent();
  }
}

/**
 * 指定環境をメモリと localStorage から消去し、UIを更新する。
 */
function clearEnvStorage(which) {
  var key = which === 'A' ? STORAGE_KEY_ENV_A : STORAGE_KEY_ENV_B;
  localStorage.removeItem(key);
  if (which === 'A') {
    envA = null;
    var btnA = document.getElementById('loadBtnA');
    btnA.classList.remove('loaded');
    document.getElementById('loadLabelA').textContent = 'フォルダを選択';
    document.getElementById('inputA').value = '';
  } else {
    envB = null;
    var btnB = document.getElementById('loadBtnB');
    btnB.classList.remove('loaded');
    document.getElementById('loadLabelB').textContent = 'フォルダを選択（比較時のみ）';
    document.getElementById('inputB').value = '';
  }
  invalidateDiffCache();
  updateHeaderCompareInfo();
  updateCompareOrderOptionsVisibility();
  renderSidebar();
  renderContent();
}

async function loadEnv(which, files) {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.remove('hidden');
  try {
    const data = await SpiralParser.parseDirectory(files);
    if (which === 'A') {
      envA = data;
      const btn = document.getElementById('loadBtnA');
      btn.classList.add('loaded');
      document.getElementById('loadLabelA').textContent = data._folderName || data.app?.title || data.app?.name || '読み込み済';
      updateHeaderCompareInfo();
    } else {
      envB = data;
      const btn = document.getElementById('loadBtnB');
      btn.classList.add('loaded');
      document.getElementById('loadLabelB').textContent = data._folderName || data.app?.title || data.app?.name || '読み込み済';
      // 比較モードへの自動切り替えは行わない（ユーザーが「差分比較」を押した時のみ）
    }
    saveEnvToStorage(which, data); // localStorage に永続化
    invalidateDiffCache(); // 環境データが変わったので差分キャッシュを破棄
    updateHeaderCompareInfo();
    updateCompareOrderOptionsVisibility();
    renderSidebar();
    renderContent();
  } catch (e) {
    alert('読み込みエラー: ' + e.message);
  } finally {
    overlay.classList.add('hidden');
  }
}

document.getElementById('inputA').addEventListener('change', (e) => { if (e.target.files.length) loadEnv('A', e.target.files); });
document.getElementById('inputB').addEventListener('change', (e) => { if (e.target.files.length) loadEnv('B', e.target.files); });

document.getElementById('content').addEventListener('click', (e) => {
  const header = e.target.closest('.card-header');
  if (header && header.nextElementSibling && header.nextElementSibling.classList.contains('card-body')) {
    header.closest('.card').classList.toggle('collapsed');
  }
});

updateComparisonTypeUi();
updateCompareOrderOptionsVisibility();
renderSidebar();
restoreEnvFromStorage(); // ページリロード時にlocalStorageから環境データを復元

/**
* 差分テーブルの行クリック → 左右パネルの該当フィールド行にスクロール＆フラッシュ
*/
function diffRowJumpToPanel(tr, event) {
if (event) event.stopPropagation();
if (!tr) return;
var targetKey = tr.getAttribute('data-target-key');
if (!targetKey) return;

// targetKey 例: "form-field:fieldId" / "db-field:titleKey"
// "form-field:" or "db-field:" のプレフィックスで判定し、残りをkeyとする
var kind, key, attrName;
if (targetKey.indexOf('form-field:') === 0) {
  kind = 'form-field';
  key = targetKey.slice('form-field:'.length);
  attrName = 'data-form-field-key';
} else if (targetKey.indexOf('db-field:') === 0) {
  kind = 'db-field';
  key = targetKey.slice('db-field:'.length);
  attrName = 'data-db-field-key';
} else {
  return;
}
var _allRows = document.querySelectorAll('tr[' + attrName + ']');
var targets = Array.prototype.filter.call(_allRows, function(r) { return r.getAttribute(attrName) === key; });
if (!targets.length) return;

// 展開されていない場合は展開
targets.forEach(function(row) {
  if (row.classList.contains('db-field-expandable') && !row.classList.contains('is-expanded')) {
    if (kind === 'db-field') {
      toggleDbFieldRowSynced(row);
    } else {
      toggleDbFieldRow(row);
    }
  }
});

// 最初のターゲットにスクロール
var firstTarget = targets[0];
firstTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });

// フラッシュアニメーション（mainRow + detailRow 両方）
setTimeout(function() {
  targets.forEach(function(row) {
    row.classList.remove('diff-flash-target', 'diff-flash-target-detail');
    void row.offsetWidth; // reflow でアニメをリセット
    if (row.classList.contains('db-field-detail-row')) {
      row.classList.add('diff-flash-target-detail');
    } else {
      row.classList.add('diff-flash-target');
    }
    setTimeout(function() {
      row.classList.remove('diff-flash-target', 'diff-flash-target-detail');
    }, 1500);
  });
}, 300);
}

/**
* 「差分のみ表示」チェックボックス切り替え
*/
function toggleDiffOnlyFilter(checkbox, tableId) {
var tbl = document.getElementById(tableId);
if (!tbl) return;
if (checkbox.checked) {
  tbl.classList.add('diff-filter-active');
} else {
  tbl.classList.remove('diff-filter-active');
}
}

/**
* フォームフィールドビューのモード切替（フィールド順 / 差分フォーカス＋対応線）
*/
function switchFormDiffView(mode) {
var normalView = document.getElementById('formDiffNormalView');
var focusView = document.getElementById('formDiffFocusView');
var btnNormal = document.getElementById('formViewBtnNormal');
var btnFocus = document.getElementById('formViewBtnFocus');
if (!normalView || !focusView || !btnNormal || !btnFocus) return;
if (mode === 'focus') {
  normalView.style.display = 'none';
  focusView.style.display = '';
  btnNormal.classList.remove('active');
  btnFocus.classList.add('active');
  requestAnimationFrame(function() {
    requestAnimationFrame(drawFormDiffFocusLines);
  });
} else {
  focusView.style.display = 'none';
  normalView.style.display = '';
  btnNormal.classList.add('active');
  btnFocus.classList.remove('active');
}
}

/**
* DBフィールドビューのモード切替（フィールド順 / 差分フォーカス＋対応線）
*/
function switchDbDiffView(mode) {
var normalView = document.getElementById('dbDiffNormalView');
var focusView = document.getElementById('dbDiffFocusView');
var btnNormal = document.getElementById('dbViewBtnNormal');
var btnFocus = document.getElementById('dbViewBtnFocus');
if (!normalView || !focusView || !btnNormal || !btnFocus) return;

if (mode === 'focus') {
  normalView.style.display = 'none';
  focusView.style.display = '';
  btnNormal.classList.remove('active');
  btnFocus.classList.add('active');
  // 表示後にSVG線を描画
  requestAnimationFrame(function() {
    requestAnimationFrame(drawDbDiffFocusLines);
  });
} else {
  focusView.style.display = 'none';
  normalView.style.display = '';
  btnNormal.classList.add('active');
  btnFocus.classList.remove('active');
}
}

/**
* 同一環境内比較：比較元（A）または比較先（B）にアイテムを選択する
*/
function selectManualPairItem(side, category, idx) {
  var paneA = document.querySelector('.mp-pane-a .mp-pane-list');
  var paneB = document.querySelector('.mp-pane-b .mp-pane-list');
  var scrollA = paneA ? paneA.scrollTop : 0;
  var scrollB = paneB ? paneB.scrollTop : 0;

  if (manualPairCategory !== category) {
    manualPairSelA = null;
    manualPairSelB = null;
    manualPairCategory = category;
  }
  if (side === 'A') {
    manualPairSelA = (manualPairSelA === idx) ? null : idx;
    if (manualPairSelB === idx) manualPairSelB = null;
  } else {
    manualPairSelB = (manualPairSelB === idx) ? null : idx;
    if (manualPairSelA === idx) manualPairSelA = null;
  }
  renderContent();

  var newPaneA = document.querySelector('.mp-pane-a .mp-pane-list');
  var newPaneB = document.querySelector('.mp-pane-b .mp-pane-list');
  if (newPaneA) newPaneA.scrollTop = scrollA;
  if (newPaneB) newPaneB.scrollTop = scrollB;
}

/**
* 同一環境内比較：選択済みのペアで差分比較を実行する
*/
function executeManualPairCompare(category) {
  if (manualPairSelA === null || manualPairSelB === null) return;
  if (manualPairSelA === manualPairSelB) return;
  currentView = { category: category, item: 'mp_' + manualPairSelA + '_' + manualPairSelB };
  renderSidebar();
  renderContent();
}

// ============================================================
// 行開閉（統一）
// ============================================================

/**
 * フォーカスビューのフィールド行クリックで A・B 両側を同期展開/折りたたみ。
 * hostId: フォーカスビューのホスト要素 ID
 * redrawFn: 展開後に SVG 線を再描画するコールバック
 */
function toggleDiffFocusFieldRow(tr, hostId, redrawFn) {
  if (!tr) return;
  var key = tr.getAttribute('data-focus-key');
  var host = document.getElementById(hostId);
  if (host && key) {
    var willExpand = !tr.classList.contains('is-expanded');
    var _allFocusRows = host.querySelectorAll('tr.db-field-expandable[data-focus-key]');
    var rows = Array.prototype.filter.call(_allFocusRows, function(r) { return r.getAttribute('data-focus-key') === key; });
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var detail = row.nextElementSibling;
      if (!detail || !detail.classList.contains('focus-field-detail-row')) continue;
      detail.style.display = willExpand ? '' : 'none';
      row.classList.toggle('is-expanded', willExpand);
    }
  } else {
    var detail2 = tr.nextElementSibling;
    if (!detail2 || !detail2.classList.contains('focus-field-detail-row')) return;
    var open = detail2.style.display !== 'none';
    detail2.style.display = open ? 'none' : '';
    tr.classList.toggle('is-expanded', !open);
  }
  requestAnimationFrame(function() { requestAnimationFrame(redrawFn); });
}

// 後方互換ラッパー
function toggleFocusFieldRow(tr)     { toggleDiffFocusFieldRow(tr, 'dbDiffFocusHost',   drawDbDiffFocusLines);   }
function toggleFormFocusFieldRow(tr) { toggleDiffFocusFieldRow(tr, 'formDiffFocusHost', drawFormDiffFocusLines); }

/**
 * 通常比較ビューで data 属性キーを持つ行を A・B 両側で同期展開/折りたたみ。
 * attrName:  data-db-field-key / data-form-field-key 等
 * rowSelector: querySelectorAll で対象行を探すセレクタ
 */
function toggleSyncedFieldRow(tr, attrName, rowSelector) {
  if (!tr) return;
  var key = tr.getAttribute(attrName);
  if (!key) { toggleDbFieldRow(tr); return; }
  var split = tr.closest('.compare-detail-split');
  var root = split || document.getElementById('content');
  if (!root) { toggleDbFieldRow(tr); return; }
  var willExpand = !tr.classList.contains('is-expanded');
  var rows = root.querySelectorAll(rowSelector);
  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    if (row.getAttribute(attrName) !== key) continue;
    var detail = row.nextElementSibling;
    if (!detail || !detail.classList.contains('db-field-detail-row')) continue;
    detail.style.display = willExpand ? '' : 'none';
    row.classList.toggle('is-expanded', willExpand);
  }
}

/**
* フォーム通常比較ビューのフィールド行クリックでA・B両側を同期展開/折りたたみ
*/
function toggleFormFieldRowSynced(tr) {
  toggleSyncedFieldRow(tr, 'data-form-field-key', 'tr.db-field-expandable[data-form-field-key]');
}
