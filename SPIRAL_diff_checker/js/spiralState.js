/* Spiral viewer &#8212; split from spiral_viewer.html */

// App state

let envA = null, envB = null;
let currentMode = 'view';
let currentView = { category: 'overview', item: null };
let sidebarCollapsed = false;
/** 配列比較: ignore=同一IDで対応（順序変更は差分化しない）、strict=インデックスで比較 */
let compareOrderMode = localStorage.getItem('spiral_compare_order_mode') === 'strict' ? 'strict' : 'ignore';
let compareDisplayMode = localStorage.getItem('spiral_compare_display_mode') === 'detail' ? 'detail' : 'compact';
let compareDiffFilter = localStorage.getItem('spiral_compare_diff_filter') || 'all';
/** 比較タイプ: 'two-env'=２環境比較（デフォルト）, 'single-env'=同一環境内比較 */
let comparisonType = localStorage.getItem('spiral_comparison_type') === 'single-env' ? 'single-env' : 'two-env';
/** 同一環境内比較：選択中の比較元インデックス（envA内） */
let manualPairSelA = null;
/** 同一環境内比較：選択中の比較先インデックス（envA内） */
let manualPairSelB = null;
/** 同一環境内比較：選択が有効なカテゴリキー */
let manualPairCategory = null;

/**
 * 差分比較の対象フィルター
 * key: カテゴリキー (例: 'db', 'form' ...)
 * value: 選択中の matchKey の Set。undefined の場合は「全選択」扱い
 * 例: { db: new Set(['顧客DB', '注文DB']), form: undefined }
 */
let diffItemFilter = {};

/**
 * diffItemFilter が空（フィルター未設定）かどうかを返す
 */
function isDiffFilterActive() {
  return Object.keys(diffItemFilter).length > 0;
}

/**
 * 指定カテゴリが全選択状態（フィルター対象外）か
 */
function isCategoryAllSelected(category) {
  return !(category in diffItemFilter);
}

/**
 * 指定カテゴリ・matchKeyがフィルター選択中か
 */
function isDiffItemSelected(category, matchKey) {
  if (isCategoryAllSelected(category)) return true;
  var s = diffItemFilter[category];
  return s ? s.has(matchKey) : false;
}

/**
 * チェックボックスのトグル
 */
function toggleDiffItemFilter(category, matchKey) {
  if (isCategoryAllSelected(category)) {
    // 全選択 → このカテゴリのfilterを作り、対象以外を入れる
    // (チェックを外す = このmatchKeyだけ除外)
    var allItems = getItems(envA, category) || [];
    var newSet = new Set();
    for (var i = 0; i < allItems.length; i++) {
      var mk = getMatchKey(category, allItems[i]);
      if (mk !== matchKey) newSet.add(mk);
    }
    diffItemFilter[category] = newSet;
  } else {
    var set = diffItemFilter[category];
    if (set.has(matchKey)) {
      set.delete(matchKey);
    } else {
      set.add(matchKey);
    }
    // 全項目選択状態になったらフィルター解除
    var total = (getItems(envA, category) || []).length;
    if (set.size >= total) {
      delete diffItemFilter[category];
    }
  }
}

/**
 * カテゴリの全選択/全解除を切り替える
 */
function toggleCategoryAllFilter(category) {
  if (isCategoryAllSelected(category)) {
    // 全解除
    diffItemFilter[category] = new Set();
  } else {
    // 全選択
    delete diffItemFilter[category];
  }
}

/**
 * 全カテゴリのフィルターをリセット（全選択に戻す）
 */
function resetDiffFilter() {
  diffItemFilter = {};
}
