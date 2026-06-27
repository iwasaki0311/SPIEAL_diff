/* Spiral viewer &#8212; split from spiral_viewer.html */

// Field ID / label maps

/** DB定義の fieldList からレコードフィールドID → 表示名のマップを生成 */
function buildRecordFieldLabelMapFromFieldList(fieldList) {
  const map = {};
  if (!fieldList || !fieldList.length) return map;
  fieldList.forEach((f, i) => {
    const id = f.id != null ? String(f.id) : (f.field_id != null ? String(f.field_id) : String(i + 1));
    const label = f.name || f.title || ('フィールド' + id);
    map[id] = label;
    if (f.title != null && String(f.title) !== '' && map[String(f.title)] === undefined) {
      map[String(f.title)] = label;
    }
    if (typeof f.id === 'string') {
      const m = f.id.match(/^field_def(\d+)$/i);
      if (m && map[m[1]] === undefined) map[m[1]] = label;
    }
  });
  return map;
}

/**
 * 演算トリガ1行分の $rfid:N$ 対応。SPIRALでは N は field_def… ではなく
 * calc_formula_field_rel の _replace_field_id（1始まり）で、_field_id は fieldList の title と一致する。
 */
function buildCalcFormulaRfidMap(formulaRow, fieldList) {
  const extra = {};
  if (!formulaRow || !fieldList || !fieldList.length) return extra;
  const rel = formulaRow.calc_formula_field_rel;
  if (!rel || !Array.isArray(rel)) return extra;
  for (const r of rel) {
    if (r == null || r._replace_field_id == null) continue;
    const key = String(r._replace_field_id).trim();
    const tid = r._field_id != null ? String(r._field_id) : '';
    const field = tid ? fieldList.find(fl => String(fl.title) === tid) : null;
    const lab = field ? (field.title || field.name || tid) : tid;
    if (lab) extra[key] = lab;
  }
  return extra;
}

/** 環境とDB ID（またはDB内部名）からフィールドID→表示名のマップを取得 */
function getTriggerFieldLabelMap(env, dbId) {
  if (!env || !env.databases) return {};
  const db = env.databases.find(d => String(d.id) === String(dbId) || d.name === dbId);
  if (!db || !db.fieldList || !db.fieldList.length) return {};
  return buildRecordFieldLabelMapFromFieldList(db.fieldList);
}

/** 設定オブジェクトから参照用マップを得る（DB本体 / db_id 付き設定向け）。env 省略時は環境Aのエクスポートを参照 */
function resolveFieldLabelMapForItem(item, env) {
  const e = env !== undefined && env != null ? env : envA;
  if (!item) return {};
  if (item.fieldList && item.fieldList.length > 0) return buildRecordFieldLabelMapFromFieldList(item.fieldList);
  const dbKey = item.db_id != null && item.db_id !== '' ? item.db_id : item.db;
  if (dbKey != null && dbKey !== '') return getTriggerFieldLabelMap(e, dbKey);
  return {};
}

/** 差分行表示用。両環境のDB定義をマージ（同一IDは環境A優先でラベル表示） */
function resolveFieldLabelMapForDiffPair(itemA, itemB) {
  const ma = resolveFieldLabelMapForItem(itemA, envA);
  const mb = resolveFieldLabelMapForItem(itemB, envB);
  if (ma && Object.keys(ma).length) return { ...mb, ...ma };
  return mb || {};
}

/**
 * SPIRAL内部のレコードフィールド参照を表示名に置換。
 * $rfid:N$ / $fid:N$ に加え、エクスポートJSONに現れる rfid:N / fid:N も対象。
 * また、mm_multiple 等のフィールド型コードも日本語ラベルに置換する。
 */
function replaceSpiralFieldReferences(text, fieldLabelMap) {
  if (text == null || text === '') return '';
  let s = String(text);

  // フィールド型コード（mm_...）を日本語ラベルに置換
  s = s.replace(/\b(mm_[\w]+)\b/g, function(match) {
    return (typeof MM_FIELD_TYPE_LABELS !== 'undefined' && MM_FIELD_TYPE_LABELS[match]) || match;
  });

  if (!fieldLabelMap || !Object.keys(fieldLabelMap).length) return s;
  function toSym(id, kind) {
    const key = String(id).trim();
    const label = fieldLabelMap[key];
    return label != null ? `[${label}]` : `${kind}:${id}`;
  }
  s = s.replace(/\$rfid:([^$]+)\$/g, (_, id) => toSym(id, 'rfid'));
  s = s.replace(/\$fid:([^$]+)\$/g, (_, id) => toSym(id, 'fid'));
  s = s.replace(/\brfid:([\w.-]+)\b/gi, (_, id) => toSym(id, 'rfid'));
  s = s.replace(/\bfid:([\w.-]+)\b/gi, (_, id) => toSym(id, 'fid'));
  return s;
}

/** 条件・演算式など（replaceSpiralFieldReferences と同じ） */
function replaceTriggerKeywords(text, fieldLabelMap) {
  return replaceSpiralFieldReferences(text, fieldLabelMap);
}
