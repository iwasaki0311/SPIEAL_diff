/* Spiral viewer &#8212; split from spiral_viewer.html */

// Deep diff and compare rendering helpers

function getMatchKey(category, item) {
  switch (category) {
    case 'db': return item.title || item.name;
    case 'select': return item.select_name || item.id || item._filename;
    case 'trigger': { const _dbName = (item._filename || '').replace(/_trigger_\d+\.json$/, ''); return (item.name || '') + '\t' + _dbName + '\t' + (item.event || ''); }
    case 'constraint': return item._filename;
    case 'form': return item.title || item._dirName;
    case 'myarea': return item.title || item._dirName;
    case 'table': return (item.page_title || item._dirName) + '\t' + (item.db || '');
    case 'mail': return (item._mailType || '') + '\t' + (item.envelope?.name || '') + '\t' + (item.list?.list_name || item._filename);
    case 'program': return item.title || item.name;
    case 'module': return item.name;
    case 'custompage': return item._title || item._filename;
    case 'myareapage': return (item._myAreaName || '') + '/' + (item._filename || '');
  }
  return JSON.stringify(item).substring(0, 100);
}

function resolveConstraintDbTitle(dbId, dbName) {
  var candidates = [];
  if (typeof envA !== 'undefined' && envA && envA.databases) candidates.push(envA.databases);
  if (typeof envB !== 'undefined' && envB && envB.databases) candidates.push(envB.databases);
  for (var ci = 0; ci < candidates.length; ci++) {
    var dbs = candidates[ci];
    for (var di = 0; di < dbs.length; di++) {
      var db = dbs[di];
      if ((dbId && String(db.id) === String(dbId)) || (dbName && db.name === dbName)) {
        return db.name || db.title || dbName || '';
      }
    }
  }
  return dbName || '';
}

function getItemLabel(category, item) {
  switch (category) {
    case 'db': return { name: item.title || '', sub: item.name || '', meta: valueLabel('type', item.type) || '' };
    case 'select': return { name: item.select_name || item._filename, sub: item._filename || '', meta: item.db || '' };
    case 'trigger': return { name: item.name || '', sub: `${valueLabel('event', item.event) || item.event || ''} / ${valueLabel('type', item.type) || ''}`, meta: item._filename };
    case 'constraint': return { name: resolveConstraintDbTitle(item.left_db_id, item.left_db) + ' → ' + resolveConstraintDbTitle(item.right_db_id, item.right_db), sub: item._filename || '', meta: '' };
    case 'form': return { name: item.title || item._dirName, sub: item.name || '', meta: item.db || '' };
    case 'myarea': return { name: item.title || item._dirName, sub: item.name || '', meta: `${(item.my_page_list || []).length}ページ` };
    case 'table': return { name: item.page_title || item._dirName, sub: item.page_name || item.title || '', meta: item.db || '' };
    case 'mail': return { name: item.envelope?.name || item._filename, sub: item.list?.list_name || '', meta: valueLabel('_mailType', item._mailType) || item._mailType || '' };
    case 'program': return { name: item.title || item.name || '', sub: item.comment || '', meta: item.scheduled ? '定期実行' : '' };
    case 'module': return { name: item.name || '', sub: item.kind || '', meta: '' };
    case 'custompage': return { name: item._title || item._filename || '', sub: item._myAreaName || '', meta: '' };
    case 'myareapage': return { name: item._filename || '', sub: item._myAreaName || '', meta: '' };
  }
  return { name: '不明', sub: '', meta: '' };
}

function getItems(env, category) {
  if (!env) return [];
  switch (category) {
    case 'db': return env.databases;
    case 'select': return env.selects;
    case 'trigger': return env.triggers;
    case 'constraint': return env.constraints;
    case 'form': return env.forms;
    case 'myarea': return env.myAreas;
    case 'table': return env.tables;
    case 'mail': return env.mails;
    case 'program': return env.programs;
    case 'module': return env.modules;
    case 'custompage': return env.customPages || [];
    case 'myareapage': return env.myAreaPages || [];
  }
  return [];
}

function getFlowFieldCompareKeys(orderMode) {
  const keys = new Set([
    // 基本設定
    'field', 'form_title', 'field_type',
    // 共通：必須・チェック・エラーメッセージ
    'valchk', 'not_null', 'unique', 'msg', 'cnf_err_msg',
    // 入力補助：例文・注意事項・プレースホルダー・接頭辞接尾辞
    'sample_use', 'sample', 'note_use', 'note',
    'placeholder_use', 'placeholder1',
    'suffix_use', 'prefix', 'suffix',
    // 入力文字・バイト数・許可文字
    'char_limit', 'byte_chk', 'min', 'max',
    'add_chk', 'add_char', 'hz_convert_chk', 'hz_convert_type',
    'starts_with_chk', 'starts_with',
    'permit', 'prohibit', 'field_chk_opt',
    // 入力設定（特殊入力）
    'param_type', 'support_input', 'hide_param_type', 'static_value', 'use_cf',
    // 選択肢系
    'select_type', 'checkbox_line',
    // 範囲指定（整数・通貨・日付・マルチセレクト）
    'begin', 'end',
    // 年齢制限（日付）
    'range_age_chk', 'begin_age', 'end_age', 'operator_age',
    // 本日との差（日付）
    'begin_today', 'end_today', 'operator_today',
    // メール：ドメイン制限（add は配列）
    'add',
    // ファイル：サイズ・拡張子エラー
    'file_size', 'file_size_unit',
    'img_limit_over', 'invalid_file_type'
  ]);
  // フォームフィールドは常に field ID（差替えキーワード）で対応付けするため
  // order の比較は行わない（orderMode に関わらず除外）
  return keys;
}

/** DB フィールド比較用のホワイトリスト（設定内容＋セレクト系ラベル値に関連するもののみ） */
function getDbFieldCompareKeys() {
  return new Set([
    'name', 'type', 'title', 'not_null_flg', 'unique_flg', 'index_flg', 'primary_key_flg',
    'is_encrypted', 'comment', 'label'
  ]);
}

/** DB fieldList の同一項目突き合わせ用キー（英語 title を最優先し、環境間でフィールド単位比較しやすくする） */
function getFieldListStableKey(o) {
  if (!o) return null;
  if (o.title != null && String(o.title).trim() !== '') return String(o.title);
  if (o.name != null && String(o.name).trim() !== '') return String(o.name);
  if (o.id != null) return 'id:' + String(o.id);
  return null;
}

/**
 * SPIRAL の「フィールド差替えキーワード」＝ fieldList[].title（内部英語キー）。
 * 環境間の対応付けはこれのみ（日本語 name や id では突き合わせない）。
 */
function getFieldListReplaceKeywordKey(o) {
  if (!o || o.title == null || String(o.title).trim() === '') return null;
  return String(o.title).trim();
}

function sortFieldListGroupKeys(keys, itemA, itemB, keyFn) {
  const keyResolver = keyFn || getFieldListStableKey;
  const keySet = new Set(keys);
  const orderMap = new Map();
  let ord = 0;
  function register(item) {
    if (!item?.fieldList) return;
    for (const f of item.fieldList) {
      const k = keyResolver(f);
      if (k != null && keySet.has(k) && !orderMap.has(k)) orderMap.set(k, ord++);
    }
  }
  register(itemA);
  register(itemB);
  return [...keys].sort((a, b) => (orderMap.get(a) ?? 99999) - (orderMap.get(b) ?? 99999));
}

/** 順序無視モードで、flow_conf.fields 以外の配列を ID マージするための設定 */
function getKeyedListMergeConfig(path, orderMode, options) {
  const isFieldList = path === 'fieldList' || path.endsWith('.fieldList');
  if (isFieldList && options && options.fieldListKeyMode === 'replaceKeyword') {
    return { keyFn: getFieldListReplaceKeywordKey };
  }
  // 単表は title（英語識別子）で対応付け（順序に依存しない）
  if (path === 'card' || path.endsWith('.card')) {
    return { keyFn: (o) => (o && o.title != null ? String(o.title) : null) };
  }
  // カスタムモジュールの children は orderMode に関わらず parent_path+name でマッチ
  if (path === 'children' || path.endsWith('.children')) {
    return { keyFn: (o) => (o && o.parent_path != null && o.name != null ? String(o.parent_path) + String(o.name) : null) };
  }
  // TRDBアクションリスト・フィールドマッピングは orderMode に関わらず名前でマッチ
  if (path === 'action_list' || path.endsWith('.action_list')) {
    return { keyFn: (o) => (o && o.actionName != null ? String(o.actionName) : null) };
  }
  if (path.endsWith('.field_mapping')) {
    return { keyFn: (o) => (o && o.left_field != null ? String(o.left_field) + '\x00' + String(o.right_field || '') : null) };
  }
  if (orderMode !== 'ignore') return null;
  if (path === 'flow_conf.fields' || path.endsWith('.flow_conf.fields')) return null;
  if (isFieldList) {
    return { keyFn: getFieldListStableKey };
  }
  if (path === 'cols' || path.endsWith('.cols')) {
    return { keyFn: (o) => (o && o.field != null ? String(o.field) : null) };
  }
  if (path.endsWith('field_conf_list')) {
    return { keyFn: (o) => (o && o.field != null ? String(o.field) : null) };
  }
  return null;
}

function deepDiff(a, b, options = {}) {
  const defaultIgn = new Set([
    '_path', '_filename', '_dirName', '_mailType',
    '_seq_order', '_replace_field_id', '_field_id',
  ]);
  const ignoreKeys = options.ignoreKeys ? new Set([...defaultIgn, ...options.ignoreKeys]) : defaultIgn;
  const orderMode = options.orderMode != null ? options.orderMode : compareOrderMode;
  const envSpecificKeys = new Set([
    'id', 'version', 'db_id', 'select_id', 'form_id', 'record_id', 'field_id', 'member_detect_field_id',
    'trigger_id',
    'page_id', 'page', 'my_area_id', 'table_id', 'tableId', 'area_db_id', 'userId', 'tfa_db_id',
    'update_entry', 'update_confirm', 'update_thanks', 'update_error', 'update_closed', 'update_notice',
    'custom_update',
    'message_name', 'content_name', 'replace_db_id', 'follow_id',
    'tgt_db_id'
  ]);

  const diffs = [];

  function shouldIgnoreKey(k, path) {
    if (ignoreKeys.has(k) || envSpecificKeys.has(k)) return true;
    // 運用メタ系（日付、タイムスタンプ）および内部ノイズ（_で始まるもの）を全カテゴリで除外
    if (/^_/.test(k)) return true;
    if (/^(created(_at|At)?|updated(_at|At)?|create_date|update_date|last_update|timestamp|last_modified)$/i.test(k)) return true;

    if (options.dbFieldSettingsOnly && path.includes('fieldList') && k === 'id') return true;
    return false;
  }

  /**
   * SPIRAL フォームフィールド値の正規化。
   * チェックボックス系は 't'/'f' を使うが、null/undefined/'' も同じ「未設定/無効」を意味するため
   * null に統一して比較する。配列・オブジェクトはそのまま返す。
   */
  function normFormVal(v) {
    if (v === null || v === undefined || v === '' || v === 'f') return null;
    if (typeof v === 'object') return v;
    return v;
  }

  function walkFlowConfFieldPair(fieldA, fieldB, pathPrefix) {
    const fieldCompareKeys = getFlowFieldCompareKeys(orderMode);
    const fieldType = String(fieldA?.field_type ?? fieldB?.field_type ?? '');
    const typeSpecificKeys = (typeof FORM_FIELD_KEYS_BY_TYPE !== 'undefined' && fieldType)
      ? (FORM_FIELD_KEYS_BY_TYPE[fieldType] || null) : null;
    let effectiveKeys;
    if (typeSpecificKeys) {
      const typeKeySet = new Set([...typeSpecificKeys, 'field', 'field_type']);
      effectiveKeys = new Set([...fieldCompareKeys].filter(k => typeKeySet.has(k)));
    } else {
      effectiveKeys = fieldCompareKeys;
    }
    // 有効化フラグが両フィールドで無効なとき、従属キーをスキップして古い残留数値等の誤検知を防ぐ
    // （normFormVal では 'f'/null は統一されるが、begin='20' のような残留数値には無効）
    const skipKeys = new Set();
    if (typeof FORM_FIELD_CONDITIONAL_GROUPS !== 'undefined') {
      for (const grp of FORM_FIELD_CONDITIONAL_GROUPS) {
        let skip = false;
        if (grp.enableKey === null) {
          const ckKeys = grp.checkKeys || grp.depKeys;
          skip = ckKeys.every(dk => normFormVal(fieldA?.[dk]) === null && normFormVal(fieldB?.[dk]) === null);
        } else {
          skip = normFormVal(fieldA?.[grp.enableKey]) === null && normFormVal(fieldB?.[grp.enableKey]) === null;
        }
        if (skip) grp.depKeys.forEach(dk => skipKeys.add(dk));
      }
    }
    const fieldKeys = new Set([...Object.keys(fieldA || {}), ...Object.keys(fieldB || {})]);
    for (const k of fieldKeys) {
      if (!effectiveKeys.has(k)) continue;
      if (skipKeys.has(k)) continue;
      // null/'f'/''/undefined は全て「未設定」として同一視する
      walk(normFormVal(fieldA?.[k]), normFormVal(fieldB?.[k]), pathPrefix + '.' + k);
    }
  }

  function walkDbFieldPair(fieldA, fieldB, pathPrefix) {
    const fieldCompareKeys = getDbFieldCompareKeys();
    const fieldKeys = new Set([...Object.keys(fieldA || {}), ...Object.keys(fieldB || {})]);
    for (const k of fieldKeys) {
      if (!fieldCompareKeys.has(k)) continue;
      const valA = fieldA?.[k];
      const valB = fieldB?.[k];
      if (k === 'label' && typeof valA === 'object' && typeof valB === 'object') {
        // Label内は idAry と keywordAry のみを比較対象とする
        walk(valA?.idAry, valB?.idAry, pathPrefix + '.label.idAry');
        walk(valA?.keywordAry, valB?.keywordAry, pathPrefix + '.label.keywordAry');
      } else {
        walk(valA, valB, pathPrefix + '.' + k);
      }
    }
  }

  function walk(objA, objB, path) {
    if (path === '' && options.dbFieldSettingsOnly) {
      walk(objA?.fieldList, objB?.fieldList, 'fieldList');
      const alA = objA?.action_list, alB = objB?.action_list;
      if (alA !== undefined || alB !== undefined) walk(alA, alB, 'action_list');
      return;
    }
    if (path === '' && options.formFieldSettingsOnly) {
      walk(objA?.flow_conf?.fields, objB?.flow_conf?.fields, 'flow_conf.fields');
      return;
    }
    if (objA === objB) return;
    if (objA === null || objA === undefined || objB === null || objB === undefined) {
      const isNullA = objA === null || objA === undefined;
      const isNullB = objB === null || objB === undefined;
      if (isNullA && isNullB) return;
      diffs.push({ path, a: objA, b: objB, type: isNullA ? 'added' : 'removed' });
      return;
    }
    if (typeof objA !== typeof objB) {
      diffs.push({ path, a: objA, b: objB, type: 'changed' });
      return;
    }
    if (typeof objA !== 'object') {
      if (String(objA) !== String(objB)) diffs.push({ path, a: objA, b: objB, type: 'changed' });
      return;
    }
    if (Array.isArray(objA) && Array.isArray(objB)) {
      const isFlowFields = path === 'flow_conf.fields' || path.endsWith('.flow_conf.fields');
      if (isFlowFields) {
        // フォームフィールドは常に field ID（差替えキーワード）で対応付け
        // orderMode に関わらず ignore 相当で動作させる
        const mapA = {};
        const mapB = {};
        for (const item of objA) {
          if (item && item.field != null) mapA[String(item.field)] = item;
        }
        for (const item of objB) {
          if (item && item.field != null) mapB[String(item.field)] = item;
        }
        const allFieldIds = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);
        for (const fieldId of allFieldIds) {
          const fA = mapA[fieldId];
          const fB = mapB[fieldId];
          if (!fA) {
            diffs.push({ path: path + `[field:${fieldId}]`, a: undefined, b: fB, type: 'added' });
          } else if (!fB) {
            diffs.push({ path: path + `[field:${fieldId}]`, a: fA, b: undefined, type: 'removed' });
          } else {
            walkFlowConfFieldPair(fA, fB, path + `[field:${fieldId}]`);
          }
        }
        return;
      }

      const keyedCfg = getKeyedListMergeConfig(path, orderMode, options);
      if (keyedCfg && keyedCfg.keyFn) {
        const isDbFieldList = path === 'fieldList' || path.endsWith('.fieldList');
        const mapA = {};
        const mapB = {};
        for (const item of objA) {
          const kk = keyedCfg.keyFn(item);
          if (kk != null) mapA[kk] = item;
        }
        for (const item of objB) {
          const kk = keyedCfg.keyFn(item);
          if (kk != null) mapB[kk] = item;
        }
        const allK = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);
        for (const kk of allK) {
          if (isDbFieldList) {
            walkDbFieldPair(mapA[kk], mapB[kk], path + `[field:${kk}]`);
          } else {
            walk(mapA[kk], mapB[kk], path + `[field:${kk}]`);
          }
        }
        return;
      }

      const maxLen = Math.max(objA.length, objB.length);
      const isDbFieldList = path === 'fieldList' || path.endsWith('.fieldList');
      for (let i = 0; i < maxLen; i++) {
        if (isDbFieldList) {
          walkDbFieldPair(objA[i], objB[i], path + `[${i}]`);
        } else {
          walk(objA[i], objB[i], path + `[${i}]`);
        }
      }
      return;
    }
    const allKeys = new Set([...Object.keys(objA || {}), ...Object.keys(objB || {})]);
    for (const k of allKeys) {
      if (shouldIgnoreKey(k, path)) continue;
      walk(objA?.[k], objB?.[k], path ? path + '.' + k : k);
    }
  }
  walk(a, b, '');
  return diffs;
}
function extractFlowFieldGroupKey(path, itemA, itemB) {
  if (!path.includes('flow_conf.fields')) return null;
  const m = path.match(/\[field:([^\]]+)\]/);
  if (m) return m[1];
  const im = path.match(/flow_conf\.fields\[(\d+)\]/);
  if (im) {
    const idx = +im[1];
    const f = itemA?.flow_conf?.fields?.[idx] ?? itemB?.flow_conf?.fields?.[idx];
    return f?.field != null ? String(f.field) : 'idx:' + idx;
  }
  return null;
}

function extractFieldListGroupKey(path, itemA, itemB) {
  if (!path.includes('fieldList')) return null;
  const m = path.match(/fieldList\[field:([^\]]+)\]/);
  if (m) return m[1];
  const im = path.match(/fieldList\[(\d+)\]/);
  if (im) {
    const idx = +im[1];
    const f = itemA?.fieldList?.[idx] ?? itemB?.fieldList?.[idx];
    return f ? (getFieldListStableKey(f) || ('idx:' + idx)) : 'idx:' + idx;
  }
  return null;
}

function extractColsGroupKey(path, itemA, itemB) {
  if (!path.includes('cols')) return null;
  const m = path.match(/cols\[field:([^\]]+)\]/);
  if (m) return m[1];
  const im = path.match(/cols\[(\d+)\]/);
  if (im) {
    const idx = +im[1];
    const c = itemA?.cols?.[idx] ?? itemB?.cols?.[idx];
    return c?.field != null ? String(c.field) : 'idx:' + idx;
  }
  return null;
}

function isTableColsDiffPath(p) {
  return /(^|\.)cols\[\d+\]/.test(p) || /(^|\.)cols\[field:/.test(p);
}

function extractActionGroupKey(path, itemA, itemB) {
  const mKey = path.match(/action_list\[field:([^\]]+)\]/);
  if (mKey) return mKey[1];
  const mNum = path.match(/action_list\[(\d+)\]/);
  if (mNum) {
    const idx = +mNum[1];
    const it = (itemA?.action_list?.[idx]) ?? (itemB?.action_list?.[idx]);
    return it?.actionName ? String(it.actionName) : 'idx:' + idx;
  }
  return null;
}

function partitionDiffsForRender(diffs, itemA, itemB, category) {
  const flowGroups = {};
  const listGroups = {};
  const colGroups = {};
  const formulaGroups = {};
  const myPageGroups = {};
  const passwordMngDiffs = [];
  const searchFormDiffs = [];
  const envelopeDiffs = [];
  const mailListDiffs = [];
  const childrenGroups = {};
  const actionGroups = {};
  const cardGroups = {};
  const selectWhereDiffs = [];
  const tableSecurityDiffs = [];
  const tableBasicDiffs = [];
  const otherDiffs = [];
  // テーブル: セキュリティ設定
  const TABLE_SECURITY_KEYS = new Set(['access','allow_ip_flg','allow_url_flg','allow_xss_flg','allow_click_jacking_flg','allow_http_flg','allow_security_content_flg','restrict_dynamic_keywords','restrict_record_value_keyword','mass_assignment_block','allow_post_only_flg']);
  // テーブル: 基本設定
  const TABLE_BASIC_KEYS = new Set(['data_row','sort','update_flg','delete_flg','limit_info','dl_mode','dl_file_fmt','setting_mode']);
  for (const d of diffs) {
    const p = d.path;
    if (p.includes('flow_conf.fields')) {
      const key = extractFlowFieldGroupKey(p, itemA, itemB);
      if (key) { (flowGroups[key] ||= []).push(d); continue; }
    }
    if (category === 'db' && p.includes('fieldList')) {
      const key = extractFieldListGroupKey(p, itemA, itemB);
      if (key) { (listGroups[key] ||= []).push(d); continue; }
    }
    if (category === 'trigger' && p.startsWith('calc_formula_list')) {
      const m = p.match(/calc_formula_list\[(\d+)\]/);
      const key = m ? m[1] : '0';
      (formulaGroups[key] ||= []).push(d); continue;
    }
    if (category === 'myarea' && p.startsWith('password_mng')) {
      passwordMngDiffs.push(d); continue;
    }
    if (category === 'myarea' && p.startsWith('my_page_list')) {
      const m = p.match(/my_page_list\[(\d+)\]/);
      const key = m ? m[1] : '0';
      (myPageGroups[key] ||= []).push(d); continue;
    }
    if (category === 'mail' && p.startsWith('envelope')) {
      envelopeDiffs.push(d); continue;
    }
    if (category === 'mail' && (p.startsWith('list.') || p === 'list')) {
      mailListDiffs.push(d); continue;
    }
    if (category === 'module' && p.startsWith('children')) {
      const mKey = p.match(/children\[field:([^\]]+)\]/);
      const mNum = p.match(/children\[(\d+)\]/);
      const key = mKey ? mKey[1] : (mNum ? mNum[1] : '0');
      (childrenGroups[key] ||= []).push(d); continue;
    }
    if (category === 'db' && p.startsWith('action_list')) {
      const key = extractActionGroupKey(p, itemA, itemB);
      if (key) { (actionGroups[key] ||= []).push(d); continue; }
    }
    if (category === 'table' && p.startsWith('card')) {
      const mKey = p.match(/card\[field:([^\]]+)\]/);
      const mNum = p.match(/card\[(\d+)\]/);
      const key = mKey ? mKey[1] : (mNum ? mNum[1] : '0');
      if (diffPathLeafPropertyKey(p) !== 'file') {
        (cardGroups[key] ||= []).push(d);
      }
      continue;
    }
    if (category === 'select' && p.startsWith('select_where')) {
      selectWhereDiffs.push(d); continue;
    }
    if (category === 'table' && TABLE_SECURITY_KEYS.has(p)) {
      tableSecurityDiffs.push(d); continue;
    }
    if (category === 'table' && TABLE_BASIC_KEYS.has(p)) {
      tableBasicDiffs.push(d); continue;
    }
    otherDiffs.push(d);
  }
  return {
    flowGroups,
    listGroups,
    colGroups,
    formulaGroups,
    myPageGroups,
    passwordMngDiffs,
    searchFormDiffs,
    envelopeDiffs,
    mailListDiffs,
    childrenGroups,
    actionGroups,
    cardGroups,
    selectWhereDiffs,
    tableSecurityDiffs,
    tableBasicDiffs,
    otherDiffs: category === 'db'
      ? otherDiffs.filter(d => d.path === 'fieldList')
      : (category === 'form' || category === 'table')
        ? []
        : otherDiffs,
  };
}

function diffPathLeafPropertyKey(path) {
  if (!path) return '';
  const last = path.split('.').pop();
  return last.replace(/\[field:[^\]]+\]|\[\d+\]/g, '');
}

/**
 * 差分JSONパスを画面用の説明に変換する。
 * @param {'full'|'leaf-only'} mode &#8212; leaf-only のとき末尾プロパティ名のみ（親ブロックで文脈を示す場合）
 */
function describeDiffPath(path, category, itemA, itemB, mode) {
  mode = mode || 'full';
  const leafKey = diffPathLeafPropertyKey(path);
  const leafJa = fieldLabel(leafKey);
  if (mode === 'leaf-only') {
    return { propertyJa: leafJa, propertyKey: leafKey, contextTrail: '', fullPath: path };
  }
  const segs = path.split('.');
  const ctx = [];
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i];
    const mField = seg.match(/^([^\[]+)\[field:([^\]]+)\]$/);
    const base = mField ? mField[1] : seg.replace(/\[field:[^\]]+\]$/, '').replace(/\[\d+\]$/, '');
    const fieldKey = mField ? mField[2] : null;
    if (base === 'fields' && fieldKey && path.includes('flow_conf.fields')) {
      const fA = resolveFlowFieldEntry(itemA, fieldKey);
      const fB = resolveFlowFieldEntry(itemB, fieldKey);
      const fn = fA?.form_title || fA?.field_name || fB?.form_title || fB?.field_name || fieldKey;
      ctx.push(`フォーム入力欄「${fn}」`);
    } else if (base === 'fieldList' && fieldKey && category === 'db') {
      const e = resolveFieldListEntry(itemA, fieldKey) || resolveFieldListEntry(itemB, fieldKey);
      ctx.push(`DBフィールド（差替えキーワード title「${fieldKey}」${e?.name ? '／表示名「' + e.name + '」' : ''}）`);
    } else if (base === 'cols' && fieldKey && category === 'table') {
      const c = resolveTableColEntry(itemA, fieldKey) || resolveTableColEntry(itemB, fieldKey);
      ctx.push(`一覧列「${c?.field || fieldKey}」`);
    } else if (base === 'calc_formula_list' && fieldKey) {
      ctx.push(`演算式（キー ${fieldKey}）`);
    } else {
      ctx.push(fieldLabel(base));
    }
  }
  return { propertyJa: leafJa, propertyKey: leafKey, contextTrail: ctx.filter(Boolean).join(' &#8250; '), fullPath: path };
}

/** 行単位のLCS差分を計算して { type, val } の配列を返す */
function computeLineDiff(linesA, linesB) {
  const m = linesA.length, n = linesB.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = linesA[i - 1] === linesB[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const ops = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      ops.unshift({ type: 'equal', val: linesA[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'insert', val: linesB[j - 1] });
      j--;
    } else {
      ops.unshift({ type: 'delete', val: linesA[i - 1] });
      i--;
    }
  }
  return ops;
}

/**
 * 複数行テキストを行単位でハイライト比較した HTML を返す。
 * 返り値 { a, b } を差分テーブルの環境A列・環境B列に挿入する。
 * 行数超過時は null を返してフォールバック。
 */
function renderScriptLineDiff(textA, textB) {
  const linesA = (textA || '').split('\n');
  const linesB = (textB || '').split('\n');
  if (linesA.length > 600 || linesB.length > 600) return null;

  const ops = computeLineDiff(linesA, linesB);
  const blockSt = 'font-family:monospace;font-size:11px;line-height:1.6;white-space:pre;overflow:auto;max-height:420px;background:#f8f8f8;border:1px solid #ddd;border-radius:4px;padding:4px 0';
  const lnSt = 'display:inline-block;min-width:3em;text-align:right;padding-right:8px;user-select:none;color:#bbb;border-right:1px solid #e0e0e0;margin-right:8px;font-size:10px';

  let hA = '<div style="' + blockSt + '">';
  let hB = '<div style="' + blockSt + '">';
  let numA = 1, numB = 1;

  for (const op of ops) {
    const line = esc(op.val);
    if (op.type === 'equal') {
      const row = '<span style="display:block"><span style="' + lnSt + '">' + numA + '</span>' + line + '</span>';
      hA += row;
      hB += '<span style="display:block"><span style="' + lnSt + '">' + numB + '</span>' + line + '</span>';
      numA++; numB++;
    } else if (op.type === 'delete') {
      hA += '<span style="display:block;background:#ffeef0;color:#b00020"><span style="' + lnSt + 'color:#e06c75">' + numA + '</span>' + line + '</span>';
      numA++;
    } else {
      hB += '<span style="display:block;background:#e6ffec;color:#005c1a"><span style="' + lnSt + 'color:#5cb85c">' + numB + '</span>' + line + '</span>';
      numB++;
    }
  }

  hA += '</div>';
  hB += '</div>';
  return { a: hA, b: hB };
}

/** 差分行を「項目説明 + 左値 + 右値」のブロックで連ねる */
function renderDiffCompareSection(diffs, diffFldMap, category, itemA, itemB, pathMode, filterOverride) {
  if (!diffs || !diffs.length) return '';
  const activeFilter = filterOverride || compareDiffFilter;
  const shown = diffs.filter(d => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'changed') return d.type === 'changed';
    if (activeFilter === 'only-a') return d.type === 'removed';
    if (activeFilter === 'only-b') return d.type === 'added';
    return true;
  });
  if (!shown.length) {
    return `<div class="diff-compare-wrap"><div style="padding:10px 12px;font-size:12px;color:var(--text-muted)">選択中の抽出ルールに一致する差分はありません。</div></div>`;
  }
  let html = '<div class="diff-compare-wrap">';
  html += '<table class="diff-compact-table"><thead><tr><th class="diff-col-status">状態</th><th class="diff-col-prop">比較項目</th><th class="diff-col-env">環境A</th><th class="diff-col-env">環境B</th></tr></thead><tbody>';
  for (const d of shown) {
    const cls = d.type === 'changed' ? 'changed' : d.type === 'added' ? 'only-b' : 'only-a';
    const statusLabel = d.type === 'changed' ? '差分あり' : d.type === 'added' ? 'Bのみ' : 'Aのみ';
    const desc = describeDiffPath(d.path, category, itemA, itemB, pathMode);
    const leafKey = desc.propertyKey;
    const isWholeFieldNode = /fieldList\[field:[^\]]+\]$/.test(d.path);
    const propName = (category === 'db' && isWholeFieldNode) ? 'フィールド定義（項目一式）' : desc.propertyJa;

    // 左右パネルへのスクロールターゲットを解決（フォーム: field:xxx、DB: field:xxx）
    var targetKey = '';
    var flowMatch = d.path.match(/flow_conf\.fields\[field:([^\]]+)\]/);
    var listMatch = d.path.match(/fieldList\[field:([^\]]+)\]/);
    if (flowMatch) targetKey = 'form-field:' + flowMatch[1];
    else if (listMatch) targetKey = 'db-field:' + listMatch[1];

    const renderDiffValue = (k, v) => {
      if (v === undefined) return '<span class="diff-empty">（項目なし）</span>';
      if (category === 'constraint' && typeof v === 'string') {
        if (k === 'left_db' || k === 'right_db') {
          const refId = k === 'left_db' ? ((itemA && itemA.left_db_id) || (itemB && itemB.left_db_id)) : ((itemA && itemA.right_db_id) || (itemB && itemB.right_db_id));
          return constraintDbHtml(refId, v);
        }
        if (k === 'left_field') return constraintFieldHtml((itemA && itemA.left_db_id) || (itemB && itemB.left_db_id), (itemA && itemA.left_db) || (itemB && itemB.left_db), v);
        if (k === 'right_field') return constraintFieldHtml((itemA && itemA.right_db_id) || (itemB && itemB.right_db_id), (itemA && itemA.right_db) || (itemB && itemB.right_db), v);
      }
      if (v !== null && typeof v === 'object') {
        const json = (() => { try { return JSON.stringify(v, null, 2); } catch (_) { return String(v); } })();
        const preview = Array.isArray(v) ? `[${v.length}件]` : `{${Object.keys(v).length}項目}`;
        return `<details><summary>${esc(preview)}</summary><div class="code-block" style="margin-top:6px;max-height:220px">${esc(json)}</div></details>`;
      }
      // DBフィールドの型(type)を MM_FIELD_TYPE_LABELS で変換させるためキーを読み替える
      let useKey = k;
      if (category === 'db' && k === 'type' && d.path.includes('fieldList')) {
        useKey = 'mm_fieldType';
      }
      return formatLabeledValue(useKey, v, diffFldMap);
    };
    // 複数行テキスト（スクリプト・本文等）は行ハイライト差分表示
    if (d.type === 'changed' && typeof d.a === 'string' && typeof d.b === 'string' &&
        (d.a.indexOf('\n') >= 0 || d.b.indexOf('\n') >= 0)) {
      const sdl = renderScriptLineDiff(d.a, d.b);
      if (sdl) {
        html += '<tr>';
        html += `<td><span class="diff-status-chip ${cls}">${statusLabel}</span></td>`;
        html += '<td>';
        html += `<span class="diff-prop-main">${esc(propName)}</span>`;
        if (compareDisplayMode === 'detail' && desc.contextTrail) html += `<span class="diff-prop-sub">${esc(desc.contextTrail)}</span>`;
        if (compareDisplayMode === 'detail') html += `<span class="diff-prop-tech">${esc(desc.fullPath)}</span>`;
        html += '</td>';
        html += `<td>${sdl.a}</td>`;
        html += `<td>${sdl.b}</td>`;
        html += '</tr>';
        continue;
      }
    }

    const targetAttr = targetKey ? ' data-target-key="' + escAttr(targetKey) + '" title="クリックで該当フィールドへジャンプ"' : '';
    html += '<tr' + targetAttr + ' onclick="diffRowJumpToPanel(this, event)">';
    html += `<td><span class="diff-status-chip ${cls}">${statusLabel}</span></td>`;
    html += '<td>';
    html += `<span class="diff-prop-main">${esc(propName)}</span>`;
    if (compareDisplayMode === 'detail' && desc.contextTrail) {
      html += `<span class="diff-prop-sub">${esc(desc.contextTrail)}</span>`;
    }
    if (compareDisplayMode === 'detail') {
      html += `<span class="diff-prop-tech">${esc(desc.fullPath)}</span>`;
    }
    html += '</td>';
    const cellA = renderDiffValue(leafKey, d.a);
    const cellB = renderDiffValue(leafKey, d.b);
    html += `<td>${cellA}</td>`;
    html += `<td>${cellB}</td>`;
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return html;
}

/**
 * DB差分フォーカスビューの対応線を描画する
 * 差分あり行: オレンジ線（常時）、一致行: グレー線（ホバー時）
 */
// ============================================================
// SVG 対応線描画（統一）
// interactive=false: DB用（差分線はホバー対象外、常時オレンジ太線）
// interactive=true:  フォーム用（差分線・一致線ともにホバーで強調）
// ============================================================

function drawDiffFocusLines(hostId, svgId, interactive) {
  var host = document.getElementById(hostId);
  var svg = document.getElementById(svgId);
  if (!host || !svg) return;
  svg.innerHTML = '';
  var hr = host.getBoundingClientRect();
  if (hr.width < 10 || hr.height < 10) return;

  var colA = host.querySelector('.db-diff-focus-col-a');
  var colB = host.querySelector('.db-diff-focus-col-b');
  if (!colA || !colB) return;

  var rowsA = colA.querySelectorAll('tbody tr[data-focus-key]');
  var rowsB = colB.querySelectorAll('tbody tr[data-focus-key]');

  var mapB = {};
  for (var i = 0; i < rowsB.length; i++) {
    var k = rowsB[i].getAttribute('data-focus-key');
    if (k) mapB[k] = rowsB[i];
  }

  for (var j = 0; j < rowsA.length; j++) {
    var trA = rowsA[j];
    var key = trA.getAttribute('data-focus-key');
    if (!key) continue;
    var trB = mapB[key];
    if (!trB) continue;

    var isDiff = trA.classList.contains('focus-row-diff');
    var ra = trA.getBoundingClientRect();
    var rb = trB.getBoundingClientRect();
    var x1 = ra.right - hr.left;
    var y1 = ra.top - hr.top + ra.height / 2;
    var x2 = rb.left - hr.left;
    var y2 = rb.top - hr.top + rb.height / 2;
    var mx = (x1 + x2) / 2;

    var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d',
      'M ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
      ' C ' + mx.toFixed(1) + ' ' + y1.toFixed(1) +
      ', ' + mx.toFixed(1) + ' ' + y2.toFixed(1) +
      ', ' + x2.toFixed(1) + ' ' + y2.toFixed(1));
    pathEl.setAttribute('fill', 'none');

    if (isDiff) {
      if (interactive) {
        pathEl.setAttribute('stroke', 'rgba(245,158,11,0.525)');
        pathEl.setAttribute('stroke-width', '1.5');
        pathEl.setAttribute('class', 'focus-line-diff');
        pathEl.setAttribute('data-focus-key', key);
      } else {
        pathEl.setAttribute('stroke', 'rgba(245,158,11,0.85)');
        pathEl.setAttribute('stroke-width', '2.5');
      }
    } else {
      pathEl.setAttribute('stroke', 'rgba(148,163,184,0.25)');
      pathEl.setAttribute('stroke-width', '1.5');
      pathEl.setAttribute('class', 'focus-line-same');
      pathEl.setAttribute('data-focus-key', key);
    }
    svg.appendChild(pathEl);
  }

  function onRowHover(e) {
    var tr = e.target ? e.target.closest('tr[data-focus-key]') : null;
    var hKey = tr ? tr.getAttribute('data-focus-key') : null;
    if (interactive) {
      var allLines = svg.querySelectorAll('.focus-line-diff, .focus-line-same');
      for (var li = 0; li < allLines.length; li++) {
        var p = allLines[li];
        var isDiffLine = p.classList.contains('focus-line-diff');
        if (hKey && p.getAttribute('data-focus-key') === hKey) {
          p.setAttribute('stroke', isDiffLine ? 'rgba(245,158,11,0.85)' : 'rgba(100,116,139,0.7)');
          p.setAttribute('stroke-width', isDiffLine ? '2.5' : '2');
        } else {
          p.setAttribute('stroke', isDiffLine ? 'rgba(245,158,11,0.525)' : 'rgba(148,163,184,0.25)');
          p.setAttribute('stroke-width', '1.5');
        }
      }
    } else {
      var lines = svg.querySelectorAll('.focus-line-same');
      for (var li2 = 0; li2 < lines.length; li2++) {
        var p2 = lines[li2];
        if (hKey && p2.getAttribute('data-focus-key') === hKey) {
          p2.setAttribute('stroke', 'rgba(100,116,139,0.7)');
          p2.setAttribute('stroke-width', '2');
        } else {
          p2.setAttribute('stroke', 'rgba(148,163,184,0.25)');
          p2.setAttribute('stroke-width', '1.5');
        }
      }
    }
  }
  host.removeEventListener('mouseover', host._focusHoverFn);
  host._focusHoverFn = onRowHover;
  host.addEventListener('mouseover', onRowHover);
}

/** スクロール・リサイズ時の再描画を登録する共通ユーティリティ */
function scheduleDiffFocusRedraw(hostId, drawFn) {
  if (!document.getElementById(hostId)) return;
  requestAnimationFrame(function() { requestAnimationFrame(drawFn); });
  window.addEventListener('resize', drawFn);
  var content = document.getElementById('content');
  if (content) content.addEventListener('scroll', drawFn, { passive: true });
}

// 後方互換ラッパー
function drawDbDiffFocusLines()    { drawDiffFocusLines('dbDiffFocusHost',   'dbDiffFocusSvg',   false); }
function drawFormDiffFocusLines()  { drawDiffFocusLines('formDiffFocusHost', 'formDiffFocusSvg', true);  }
function scheduleDbDiffFocusRedraw()   { scheduleDiffFocusRedraw('dbDiffFocusHost',   drawDbDiffFocusLines);   }
function scheduleFormDiffFocusRedraw() { scheduleDiffFocusRedraw('formDiffFocusHost', drawFormDiffFocusLines); }

function resolveFlowFieldEntry(item, fieldId) {
  if (!item?.flow_conf?.fields) return null;
  const fk = String(fieldId);
  if (fk.startsWith('idx:')) return item.flow_conf.fields[+fk.slice(4)];
  return item.flow_conf.fields.find(f => String(f.field) === fk);
}

function resolveFieldListEntry(item, listKey) {
  if (!item?.fieldList) return null;
  const lk = String(listKey);
  if (lk.startsWith('idx:')) return item.fieldList[+lk.slice(4)];
  const byTitle = item.fieldList.find(f => f.title != null && String(f.title).trim() === lk);
  if (byTitle) return byTitle;
  const byStable = item.fieldList.find(f => getFieldListStableKey(f) === lk);
  if (byStable) return byStable;
  if (lk.startsWith('id:')) {
    const idv = lk.slice(3);
    return item.fieldList.find(f => String(f.id) === idv);
  }
  return item.fieldList.find(f => String(f.title) === lk || String(f.name) === lk);
}

function resolveTableColEntry(item, colKey) {
  if (!item?.cols) return null;
  const ck = String(colKey);
  if (ck.startsWith('idx:')) return item.cols[+ck.slice(4)];
  return item.cols.find(c => String(c.field) === ck);
}

function renderOneFieldDiffGrid(fieldId, fieldDiffs, itemA, itemB, category) {
  const fldMap = resolveFieldLabelMapForDiffPair(itemA, itemB);
  const fieldA = resolveFlowFieldEntry(itemA, fieldId);
  const fieldB = resolveFlowFieldEntry(itemB, fieldId);
  const fieldName = fieldA?.form_title || fieldA?.field_name || fieldA?.title || fieldB?.form_title || fieldB?.field_name || fieldB?.title || fieldId;

  // フィールド全体が only-a / only-b かどうか判定
  // パスが flow_conf.fields[field:xxx] で終わる（プロパティなし）かつ a/b が undefined
  const wholeFieldDiff = fieldDiffs.find(d =>
    /flow_conf\.fields\[field:[^\]]+\]$/.test(d.path) && (d.a === undefined || d.b === undefined)
  );

  if (wholeFieldDiff) {
    // フィルタに関係なく必ず表示（only-a/only-b はフィールド単位の差分）
    const isOnlyA = wholeFieldDiff.type === 'removed' || wholeFieldDiff.b === undefined;
    const cls = isOnlyA ? 'only-a' : 'only-b';
    const label = isOnlyA ? '環境Aのみ' : '環境Bのみ';
    const fieldObj = isOnlyA ? wholeFieldDiff.a : wholeFieldDiff.b;
    const ftDisp = fieldObj ? esc(mmFieldTypeDisplay(fieldObj.field_type || '')) : '';
    let html = `<div style="border-bottom:2px solid var(--border);padding:12px 16px;background:#fafbfc">`;
    html += `<div class="diff-field-name-row"><span class="field-name-label">このグループの対象</span>　<strong>${esc(fieldName)}</strong> <span style="color:#999;font-size:11px;font-weight:400">（フィールドID: ${esc(String(fieldId))}）</span></div>`;
    html += '<div class="diff-compare-wrap">';
    html += '<table class="diff-compact-table"><thead><tr><th class="diff-col-status">状態</th><th class="diff-col-prop">比較項目</th><th class="diff-col-env">環境A</th><th class="diff-col-env">環境B</th></tr></thead><tbody>';
    html += `<tr><td><span class="diff-status-chip ${cls}">${label}</span></td>`;
    html += `<td><span class="diff-prop-main">フィールド定義</span></td>`;
    html += `<td>${isOnlyA ? (esc(fieldName) + (ftDisp ? ' <span style="color:#999;font-size:11px">(' + ftDisp + ')</span>' : '')) : '<span class="diff-empty">（この環境には存在しません）</span>'}</td>`;
    html += `<td>${!isOnlyA ? (esc(fieldName) + (ftDisp ? ' <span style="color:#999;font-size:11px">(' + ftDisp + ')</span>' : '')) : '<span class="diff-empty">（この環境には存在しません）</span>'}</td>`;
    html += '</tr></tbody></table></div></div>';
    return html;
  }

  // 通常のプロパティ差分：現在のフィルタを適用して表示
  const compareSection = renderDiffCompareSection(fieldDiffs, fldMap, category || 'form', itemA, itemB, 'leaf-only');
  if (!compareSection || compareSection.includes('選択中の抽出ルールに一致する差分はありません')) {
    return '';
  }

  let html = `<div style="border-bottom:2px solid var(--border);padding:12px 16px;background:#fafbfc">`;
  html += `<div class="diff-field-name-row"><span class="field-name-label">このグループの対象</span>　<strong>${esc(fieldName)}</strong> <span style="color:#999;font-size:11px;font-weight:400">（フィールドID: ${esc(String(fieldId))}）</span></div>`;
  html += compareSection;
  html += `</div>`;
  return html;
}

/** fieldList の title（差替えキーワード）の&#32852;合を、環境A→未登録の順で列挙 */
function getDbFieldListTitleKeysUnion(itemA, itemB) {
  const rowsA = itemA?.fieldList || [];
  const rowsB = itemB?.fieldList || [];
  const keys = [];
  const seen = new Set();
  for (const f of rowsA) {
    const k = getFieldListReplaceKeywordKey(f);
    if (!k || seen.has(k)) continue;
    seen.add(k); keys.push(k);
  }
  for (const f of rowsB) {
    const k = getFieldListReplaceKeywordKey(f);
    if (!k || seen.has(k)) continue;
    seen.add(k); keys.push(k);
  }
  return keys;
}

function dbFieldCompareRowHasDiff(titleKey, listGroups, fA, fB) {
  if (listGroups[titleKey]?.length) return true;
  return (fA != null) !== (fB != null);
}

function renderDbFieldOrderComparison(itemA, itemB) {
  const rowsA = itemA?.fieldList || [];
  const rowsB = itemB?.fieldList || [];
  if (!rowsA.length && !rowsB.length) return '';
  const keys = getDbFieldListTitleKeysUnion(itemA, itemB);
  const idxA = new Map();
  const idxB = new Map();
  rowsA.forEach((f, i) => { const k = getFieldListReplaceKeywordKey(f); if (k && !idxA.has(k)) idxA.set(k, i + 1); });
  rowsB.forEach((f, i) => { const k = getFieldListReplaceKeywordKey(f); if (k && !idxB.has(k)) idxB.set(k, i + 1); });
  
  const diffRows = [];
  for (const k of keys) {
    const a = idxA.get(k), b = idxB.get(k);
    if (a === b && a != null) continue; // 完全一致はスキップ
    const fa = rowsA.find(f => getFieldListReplaceKeywordKey(f) === k);
    const fb = rowsB.find(f => getFieldListReplaceKeywordKey(f) === k);
    const st = (a == null || b == null) ? '片側のみ' : '順序差';
    diffRows.push(`<tr><td class="mono">${esc(k)}</td><td>${esc(fa?.name || '&#8212;')}</td><td>${a ?? '&#8212;'}</td><td>${esc(fb?.name || '&#8212;')}</td><td>${b ?? '&#8212;'}</td><td><span class="diff-status-chip ${a == null || b == null ? 'only-a' : 'changed'}">${esc(st)}</span></td></tr>`);
  }
  if (diffRows.length === 0) return '';

  let html = `<div class="card" style="margin:8px 0 16px"><div class="card-header"><h3>フィールド順序の比較（titleキー基準）</h3><span class="tag">${diffRows.length}件の差異</span></div><div class="card-body no-pad" style="overflow-x:auto">`;
  html += `<table class="data-table"><thead><tr><th>差替えキーワード(title)</th><th>表示名A</th><th>順序A</th><th>表示名B</th><th>順序B</th><th>判定</th></tr></thead><tbody>`;
  html += diffRows.join('');
  html += `</tbody></table></div></div>`;
  if (compareDisplayMode !== 'detail') return '';
  return html;
}

function renderFormFieldOrderComparison(itemA, itemB) {
  const rowsA = itemA?.flow_conf?.fields || [];
  const rowsB = itemB?.flow_conf?.fields || [];
  if (!rowsA.length && !rowsB.length) return '';
  const keys = [];
  const seen = new Set();
  for (const f of rowsA) {
    const k = (f && f.field != null) ? String(f.field) : '';
    if (!k || seen.has(k)) continue;
    seen.add(k); keys.push(k);
  }
  for (const f of rowsB) {
    const k = (f && f.field != null) ? String(f.field) : '';
    if (!k || seen.has(k)) continue;
    seen.add(k); keys.push(k);
  }
  const idxA = new Map();
  const idxB = new Map();
  rowsA.forEach((f, i) => { const k = (f && f.field != null) ? String(f.field) : ''; if (k && !idxA.has(k)) idxA.set(k, i + 1); });
  rowsB.forEach((f, i) => { const k = (f && f.field != null) ? String(f.field) : ''; if (k && !idxB.has(k)) idxB.set(k, i + 1); });
  
  const diffRows = [];
  for (const k of keys) {
    const a = idxA.get(k), b = idxB.get(k);
    if (a === b && a != null) continue; // 完全一致はスキップ
    const fa = rowsA.find(f => String(f?.field) === k);
    const fb = rowsB.find(f => String(f?.field) === k);
    const st = (a == null || b == null) ? '片側のみ' : '順序差';
    const la = fa?.form_title || fa?.field_name || fa?.title || '&#8212;';
    const lb = fb?.form_title || fb?.field_name || fb?.title || '&#8212;';
    diffRows.push(`<tr><td class="mono">${esc(k)}</td><td>${esc(la)}</td><td>${a ?? '&#8212;'}</td><td>${esc(lb)}</td><td>${b ?? '&#8212;'}</td><td><span class="diff-status-chip ${a == null || b == null ? 'only-a' : 'changed'}">${esc(st)}</span></td></tr>`);
  }
  if (diffRows.length === 0) return '';

  let html = `<div class="card" style="margin:8px 0 16px"><div class="card-header"><h3>フォーム項目順序の比較（field ID基準）</h3><span class="tag">${diffRows.length}件の差異</span></div><div class="card-body no-pad" style="overflow-x:auto">`;
  html += `<table class="data-table"><thead><tr><th>field ID</th><th>表示名A</th><th>順序A</th><th>表示名B</th><th>順序B</th><th>判定</th></tr></thead><tbody>`;
  html += diffRows.join('');
  html += `</tbody></table></div></div>`;
  if (compareDisplayMode !== 'detail') return '';
  return html;
}

function renderTableColDiffGrid(colKey, colDiffs, itemA, itemB) {
  const fldMap = resolveFieldLabelMapForDiffPair(itemA, itemB);
  const cA = resolveTableColEntry(itemA, colKey);
  const cB = resolveTableColEntry(itemB, colKey);
  const title = cA?.field || cB?.field || colKey;
  let html = `<div style="border-bottom:2px solid var(--border);padding:12px 16px;background:#fafbfc">`;
  html += `<div class="diff-field-name-row"><span class="field-name-label">このグループの対象</span>　<strong>${esc(String(title))}</strong>（一覧の1列）</div>`;
  html += renderDiffCompareSection(colDiffs, fldMap, 'table', itemA, itemB, 'leaf-only');
  html += `</div>`;
  return html;
}

/**
 * DB fieldList の1フィールド分の差分セクションを生成する。
 * renderOneFieldDiffGrid（フォーム用）の DB 版。
 */
function renderOneDbFieldDiffGrid(titleKey, fieldDiffs, itemA, itemB) {
  const fldMap = resolveFieldLabelMapForDiffPair(itemA, itemB);
  const fA = resolveFieldListEntry(itemA, titleKey);
  const fB = resolveFieldListEntry(itemB, titleKey);
  const fieldName = (fA && (fA.name || fA.title)) || (fB && (fB.name || fB.title)) || titleKey;

  // フィールド全体が only-a / only-b の場合
  const wholeFieldDiff = fieldDiffs.find(d =>
    /fieldList\[field:[^\]]+\]$/.test(d.path) && (d.a === undefined || d.b === undefined)
  );

  if (wholeFieldDiff) {
    const isOnlyA = wholeFieldDiff.type === 'removed' || wholeFieldDiff.b === undefined;
    const cls = isOnlyA ? 'only-a' : 'only-b';
    const label = isOnlyA ? '環境Aのみ' : '環境Bのみ';
    const fieldObj = isOnlyA ? wholeFieldDiff.a : wholeFieldDiff.b;
    const typeDisp = fieldObj ? esc(mmFieldTypeDisplay(fieldObj.type || '')) : '';
    let html = `<div style="border-bottom:2px solid var(--border);padding:12px 16px;background:#fafbfc">`;
    html += `<div class="diff-field-name-row"><span class="field-name-label">このグループの対象</span>　<strong>${esc(fieldName)}</strong> <span style="color:#999;font-size:11px;font-weight:400">（差替えキーワード: ${esc(String(titleKey))}）</span></div>`;
    html += '<div class="diff-compare-wrap"><table class="diff-compact-table"><thead><tr><th class="diff-col-status">状態</th><th class="diff-col-prop">比較項目</th><th class="diff-col-env">環境A</th><th class="diff-col-env">環境B</th></tr></thead><tbody>';
    html += `<tr><td><span class="diff-status-chip ${cls}">${label}</span></td>`;
    html += `<td><span class="diff-prop-main">フィールド定義（項目一式）</span></td>`;
    html += `<td>${isOnlyA ? (esc(fieldName) + (typeDisp ? ' <span style="color:#999;font-size:11px">(' + typeDisp + ')</span>' : '')) : '<span class="diff-empty">（この環境には存在しません）</span>'}</td>`;
    html += `<td>${!isOnlyA ? (esc(fieldName) + (typeDisp ? ' <span style="color:#999;font-size:11px">(' + typeDisp + ')</span>' : '')) : '<span class="diff-empty">（この環境には存在しません）</span>'}</td>`;
    html += '</tr></tbody></table></div></div>';
    return html;
  }

  // 通常のプロパティ差分
  const compareSection = renderDiffCompareSection(fieldDiffs, fldMap, 'db', itemA, itemB, 'leaf-only');
  if (!compareSection || compareSection.includes('選択中の抽出ルールに一致する差分はありません')) {
    return '';
  }

  let html = `<div style="border-bottom:2px solid var(--border);padding:12px 16px;background:#fafbfc">`;
  html += `<div class="diff-field-name-row"><span class="field-name-label">このグループの対象</span>　<strong>${esc(fieldName)}</strong> <span style="color:#999;font-size:11px;font-weight:400">（差替えキーワード: ${esc(String(titleKey))}）</span></div>`;
  html += compareSection;
  html += `</div>`;
  return html;
}
/**
 * 差分パネルに実際にレンダリングされるセクション数を返す。
 * ヘッダーの「N件の差異」に使うことで、画面上の表示と件数を一致させる。
 */
function countDiffSections(partitioned) {
  if (!partitioned) return 0;
  var n = 0;
  n += Object.keys(partitioned.flowGroups   || {}).length;
  n += Object.keys(partitioned.listGroups   || {}).length;
  n += Object.keys(partitioned.colGroups    || {}).length;
  n += Object.keys(partitioned.formulaGroups|| {}).length;
  n += Object.keys(partitioned.myPageGroups || {}).length;
  n += Object.keys(partitioned.childrenGroups || {}).length;
  n += Object.keys(partitioned.actionGroups || {}).length;
  n += Object.keys(partitioned.cardGroups || {}).length;
  if (partitioned.passwordMngDiffs  && partitioned.passwordMngDiffs.length)  n++;
  if (partitioned.searchFormDiffs   && partitioned.searchFormDiffs.length)   n++;
  if (partitioned.envelopeDiffs     && partitioned.envelopeDiffs.length)     n++;
  if (partitioned.mailListDiffs     && partitioned.mailListDiffs.length)     n++;
  if (partitioned.selectWhereDiffs  && partitioned.selectWhereDiffs.length)  n++;
  if (partitioned.tableSecurityDiffs && partitioned.tableSecurityDiffs.length) n++;
  if (partitioned.tableBasicDiffs   && partitioned.tableBasicDiffs.length)   n++;
  if (partitioned.otherDiffs        && partitioned.otherDiffs.length)        n++;
  return n;
}

// ============================================================
// Diff cache
// ============================================================

var _diffCache = {};

function invalidateDiffCache() {
  _diffCache = {};
}

/**
 * カテゴリ全アイテムの差分を一括計算してキャッシュする。
 * 同一の envA/envB/compareOrderMode に対しては再計算しない。
 *
 * @returns {{ [matchKey: string]: { status, itemA, itemB, diffs, partitioned } }}
 *   status: 'changed' | 'same' | 'only-a' | 'only-b'
 *   diffs:  deepDiff の結果配列（same/only-* は空配列）
 *   partitioned: partitionDiffsForRender の結果（差分なし時は null）
 */
function getDiffData(category) {
  var cacheKey = category + '|' + compareOrderMode;
  if (_diffCache[cacheKey]) return _diffCache[cacheKey];
  if (!envA || !envB) return {};

  const itemsA = getItems(envA, category);
  const itemsB = getItems(envB, category);

  // first-match wins — renderDetail の find() と一致させる
  const mapB = {};
  for (const it of itemsB) {
    const mk = getMatchKey(category, it);
    if (!(mk in mapB)) mapB[mk] = it;
  }

  const result = {};
  const keysA = new Set();

  for (const it of itemsA) {
    const mk = getMatchKey(category, it);
    keysA.add(mk);
    const paired = mapB[mk];
    if (paired) {
      const diffs = deepDiff(it, paired, getDeepDiffOptions(category));
      var htmlPageDiffCount = 0;
      if (category === 'myarea') {
        var pagesA = (envA.myAreaPages || []).filter(function(p) { return p._myAreaName === (it._dirName || ''); });
        var pagesB = (envB.myAreaPages || []).filter(function(p) { return p._myAreaName === (paired._dirName || ''); });
        var _pageMapB = {};
        for (var _pbi = 0; _pbi < pagesB.length; _pbi++) { _pageMapB[pagesB[_pbi]._filename] = pagesB[_pbi]; }
        var _pageMapA = {};
        for (var _pai = 0; _pai < pagesA.length; _pai++) {
          _pageMapA[pagesA[_pai]._filename] = pagesA[_pai];
          var _pB = _pageMapB[pagesA[_pai]._filename];
          if (!_pB || _pB._source !== pagesA[_pai]._source) { htmlPageDiffCount++; }
        }
        for (var _pbi2 = 0; _pbi2 < pagesB.length; _pbi2++) {
          if (!_pageMapA[pagesB[_pbi2]._filename]) { htmlPageDiffCount++; }
        }
      }
      const partitioned = diffs.length > 0 ? partitionDiffsForRender(diffs, it, paired, category) : null;
      result[mk] = { status: (diffs.length + htmlPageDiffCount) > 0 ? 'changed' : 'same', itemA: it, itemB: paired, diffs, partitioned, htmlPageDiffCount };
    } else {
      result[mk] = { status: 'only-a', itemA: it, itemB: null, diffs: [], partitioned: null };
    }
  }

  for (const it of itemsB) {
    const mk = getMatchKey(category, it);
    if (!keysA.has(mk)) {
      result[mk] = { status: 'only-b', itemA: null, itemB: it, diffs: [], partitioned: null };
    }
  }

  _diffCache[cacheKey] = result;
  return result;
}

/** getDiffData のステータスのみを返す後方互換ラッパー */
function getDiffMap(category) {
  const data = getDiffData(category);
  const result = {};
  for (const k of Object.keys(data)) result[k] = data[k].status;
  return result;
}
