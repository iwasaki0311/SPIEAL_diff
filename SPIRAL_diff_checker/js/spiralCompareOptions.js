/* Spiral viewer &#8212; split from spiral_viewer.html */

// Compare UI options

function getDeepDiffOptions(category) {
  const baseIgnore = ['_path', '_filename', '_dirName', '_mailType', '_seq_order', '_replace_field_id', '_field_id'];
  if (category === 'custompage') {
    baseIgnore.push('_source', '_myAreaName');
  }
  return {
    ignoreKeys: new Set(baseIgnore),
    orderMode: compareOrderMode,
    /** DB 定義は fieldList 内のフィールド設定のみ比較（DBメタ情報は比較しない） */
    dbFieldSettingsOnly: category === 'db',
    /** フォームは flow_conf.fields のフィールド設定比較を優先（フォーム全体メタは比較しない） */
    formFieldSettingsOnly: category === 'form',
    /** DB fieldList の対応付けは SPIRAL の「フィールド差し替えキーワード」＝ title のみ */
    fieldListKeyMode: category === 'db' ? 'replaceKeyword' : 'stable',
  };
}

function setCompareOrderMode(mode) {
  if (mode !== 'ignore' && mode !== 'strict') return;
  if (compareOrderMode === mode) return;
  compareOrderMode = mode;
  try { localStorage.setItem('spiral_compare_order_mode', mode); } catch (_) {}
  invalidateDiffCache(); // 比較順序が変わるので差分キャッシュを破棄
  const wrap = document.getElementById('compareOrderOptions');
  if (wrap) {
    wrap.querySelectorAll('input[name="compareOrderMode"]').forEach(inp => { inp.checked = inp.value === mode; });
  }
  renderSidebar();
  renderContent();
}

function refreshCompareUxOptionsUi() {
  const wrap = document.getElementById('compareUxOptions');
  if (!wrap) return;
  wrap.querySelectorAll('[data-mode]').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-mode') === compareDisplayMode));
  wrap.querySelectorAll('[data-filter]').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-filter') === compareDiffFilter));
}

function updateCompareOrderOptionsVisibility() {
  const wrap = document.getElementById('compareOrderOptions');
  if (!wrap) return;
  const shouldShow = currentMode === 'compare' && comparisonType !== 'single-env';
  if (shouldShow) {
    wrap.classList.remove('hidden');
    wrap.querySelectorAll('input[name="compareOrderMode"]').forEach(inp => { inp.checked = inp.value === compareOrderMode; });
  } else {
    wrap.classList.add('hidden');
  }
  const ux = document.getElementById('compareUxOptions');
  if (ux) {
    if (shouldShow) {
      ux.classList.remove('hidden');
      refreshCompareUxOptionsUi();
    } else {
      ux.classList.add('hidden');
    }
  }
}

function setComparisonType(type) {
  if (type !== 'two-env' && type !== 'single-env') return;
  if (comparisonType === type) return;
  comparisonType = type;
  manualPairSelA = null;
  manualPairSelB = null;
  manualPairCategory = null;
  try { localStorage.setItem('spiral_comparison_type', type); } catch (_) {}
  updateComparisonTypeUi();
  renderSidebar();
  renderContent();
}

function updateComparisonTypeUi() {
  const isSingle = comparisonType === 'single-env';
  const btnTwo = document.getElementById('compTypeTwoEnv');
  const btnSingle = document.getElementById('compTypeSingleEnv');
  const loadAreaB = document.getElementById('loadAreaB');
  const modeToggle = document.getElementById('modeToggle');
  const compareUx = document.getElementById('compareUxOptions');
  if (btnTwo) btnTwo.classList.toggle('active', !isSingle);
  if (btnSingle) btnSingle.classList.toggle('active', isSingle);
  if (loadAreaB) loadAreaB.style.display = isSingle ? 'none' : '';
  if (modeToggle) modeToggle.style.display = isSingle ? 'none' : '';
  if (compareUx) compareUx.classList.toggle('hidden', isSingle);
  updateHeaderCompareInfo();
}
