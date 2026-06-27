/* Spiral viewer &#8212; split from spiral_viewer.html */

// Labels and HTML formatting

/** フィールド名の日本語ラベルを取得（未定義ならそのまま返す） */
function fieldLabel(key) {
    return FIELD_LABELS[key] || key;
}

/** DB fieldList の mm_* 型を SPIRAL 相当の日本語表記に変換（未登録なら元の文字列） */
function mmFieldTypeDisplay(type) {
    if (type == null || type === '') return '';
    var s = String(type);
    if (typeof MM_FIELD_TYPE_LABELS !== 'undefined' && MM_FIELD_TYPE_LABELS[s]) {
        return MM_FIELD_TYPE_LABELS[s];
    }
    return s;
}

/** 設定値の日本語ラベルを取得（未定義なら元の値を返す） */
function valueLabel(key, val) {
    if (val === null || val === undefined) return null;
    
    var s = String(val);

    // 値自体が mm_ 型コード（フィールドタイプ）なら、キーに関わらず優先的に変換
    if (s.indexOf('mm_') === 0 && MM_FIELD_TYPE_LABELS[s]) {
        return MM_FIELD_TYPE_LABELS[s];
    }

    // フィールド型コードの変換（キー名による判定）
    if (key === 'type' || key === 'field_type' || key === 'field_type_name' || key === 'm_fieldType' || key === 'mm_fieldType') {
        if (MM_FIELD_TYPE_LABELS[s]) return MM_FIELD_TYPE_LABELS[s];
    }

    var map = VALUE_LABELS[key];
    if (!map) return val;
    var strVal = String(val);
    if (map[strVal] !== undefined) return map[strVal];
    return val;
}

/** 値をフォーマットして表示用HTMLを返す（ラベル付き）。fieldLabelMap があるとき rfid:/fid: をフィールド名に展開 */
function formatLabeledValue(key, val, fieldLabelMap) {
    if (val === null || val === undefined) return '<sp' + 'an sty' + 'le="col' + 'or:#999">&#8212;</sp' + 'an>';
    var map = fieldLabelMap || {};
    // ソート値の特別処理: {field_keyword}_(up|down) → フィールド名（昇順/降順）
    if (key === 'sort' && typeof val === 'string') {
        var sm = String(val).match(/^(.+)_(up|down)$/i);
        if (sm) {
            var sk = sm[1];
            var sdir = sm[2].toLowerCase() === 'up' ? '（昇順）' : '（降順）';
            var skwm = (typeof VALUE_LABELS !== 'undefined' && VALUE_LABELS.sort) || {};
            var sfn = map[sk] || skwm[sk] || sk;
            return esc(sfn + sdir) + ' <sp' + 'an sty' + 'le="col' + 'or:#999;font-si' + 'ze:11px">(' + esc(String(val)) + ')</sp' + 'an>';
        }
    }
    var label = valueLabel(key, val);
    var strVal = String(val);
    if (label !== val && String(label) !== strVal) {
        var paren = '';
        var hasMap = false;
        for (var k in map) { if (map.hasOwnProperty(k)) { hasMap = true; break; } }
        if (hasMap) {
            paren = replaceSpiralFieldReferences(strVal, map);
        } else {
            paren = strVal;
        }
        return esc(String(label)) + ' <sp' + 'an sty' + 'le="col' + 'or:#999;font-si' + 'ze:11px">(' + esc(paren) + ')</sp' + 'an>';
    }
    if (typeof val === 'boolean') return val ? 'はい' : 'いいえ';
    return formatValue(val, map);
}

/**
 * 入力設定（param_type）を表示。特殊入力のときは括弧内の選択（hide_param_type / support_input）を併記する。
 */
function formatParamTypeWithSpecial(f, fieldLabelMap) {
    if (!f) return '<sp' + 'an sty' + 'le="col' + 'or:#999">&#8212;</sp' + 'an>';
    var map = fieldLabelMap || {};
    var pt = String(f.param_type || '0');
    var ft = String(f.field_type || '');
    var mainLabel = valueLabel('par' + 'am_ty' + 'pe', pt);
    
    if (pt !== '2') return formatLabeledValue('par' + 'am_ty' + 'pe', pt, map);

    var parts = [];
    
    var supportCode = String(f.support_input || '0').replace(/^\s+|\s+$/g, '');
    if (supportCode !== '0') {
        if (ft.indexOf('text_fi' + 'eld64') >= 0 || ft === 'mm_num' + 'ber32') {
            if (supportCode === '6') parts.push('登録者IPアドレス自動取得');
        } else if (ft.indexOf('text_fi' + 'eld') >= 0 || ft.indexOf('text_ar' + 'ea') >= 0) {
            if (supportCode === '7') parts.push('登録者ユーザエージェント自動取得');
        } else if (ft.indexOf('da' + 'te') >= 0 || ft === 'mm_reg' + 'ist_da' + 'te') {
            if (supportCode === '4' || supportCode === '5') parts.push('登録日時自動取得');
        }
        
        if (parts.length === 0) {
            var sub = valueLabel('sup' + 'port_inp' + 'ut', supportCode);
            if (sub && sub !== supportCode) parts.push(sub);
        }
    }

    var hideCode = String(f.hide_param_type || '0').replace(/^\s+|\s+$/g, '');
    if (hideCode !== '0') {
        var subHide = valueLabel('hi' + 'de_par' + 'am_ty' + 'pe', hideCode);
        if (subHide && subHide !== hideCode) parts.push(subHide);
    }

    if (f.static_value != null && String(f.static_value).replace(/^\s+|\s+$/g, '') !== '') {
        var sv = replaceSpiralFieldReferences(String(f.static_value), map);
        parts.push('値/参照: ' + sv);
    }

    if (parts.length > 0) {
        var unique = [];
        for (var i = 0; i < parts.length; i++) {
            var isDup = false;
            for (var j = 0; j < unique.length; j++) { if (unique[j] === parts[i]) { isDup = true; break; } }
            if (!isDup) unique.push(parts[i]);
        }
        var joined = '';
        for (var k = 0; k < unique.length; k++) {
            if (k > 0) joined += ' / ';
            joined += esc(String(unique[k]));
        }
        return '<str' + 'ong>' + esc(mainLabel) + '</str' + 'ong><br><sma' + 'll sty' + 'le="col' + 'or:var(--text-light)">（' + joined + '）</sma' + 'll>';
    }
    return '<str' + 'ong>' + esc(mainLabel) + '</str' + 'ong> <sp' + 'an sty' + 'le="col' + 'or:#999;font-si' + 'ze:11px">(詳細未設定)</sp' + 'an>';
}

/**
 * フォームフィールドの add キーは配列構造でフィールドタイプにより意味が変わる。
 * - メール系（mm_email, mm_email_nc）:
 *     add[0] = null:制限しない / "3":許可する / "4":拒否する
 *     add[1..] = "0":PC(モバイル以外) / "6":Vodafone(TM)変換 / "o_mobile":その他モバイル / その他:ドメイン名そのまま
 * - ファイル系（mm_file）: ファイルサイズ設定フラグ
 */
function formatAddFieldValue(val, fieldType) {
    if (val === null || val === undefined) return '<sp' + 'an sty' + 'le="col' + 'or:#999">制限しない</sp' + 'an>';
    if (!(val instanceof Array)) {
        // 配列以外は素の値を表示
        return esc(String(val));
    }
    if (val.length === 0) return '<sp' + 'an sty' + 'le="col' + 'or:#999">&#8212;</sp' + 'an>';
    var ft = String(fieldType || '');

    // メール系
    if (ft.indexOf('mm_email') === 0) {
        var first = val[0];
        var mode;
        if (first === null || first === undefined || first === '') mode = '制限しない';
        else if (String(first) === '3') mode = '許可する';
        else if (String(first) === '4') mode = '拒否する';
        else mode = String(first);

        var domainMap = {
            '0': 'PC (モバイルドメイン以外)',
            '6': 'Vodafone(TM)ドメイン変換',
            'o_mobile': 'その他モバイルドメイン'
        };
        var entries = [];
        for (var i = 1; i < val.length; i++) {
            var d = val[i];
            if (d === null || d === undefined || d === '') continue;
            var ds = String(d);
            entries.push(domainMap[ds] || ds);
        }
        var out = '<str' + 'ong>' + esc(mode) + '</str' + 'ong>';
        if (entries.length > 0) {
            out += '<br><sma' + 'll sty' + 'le="col' + 'or:#666">' + esc(entries.join(' / ')) + '</sma' + 'll>';
        }
        return out;
    }

    // ファイル系（add は配列 / フラグ的）&#8212; そのまま JSON 表示
    try {
        return esc(JSON.stringify(val));
    } catch (e) {
        return esc(String(val));
    }
}

function formatValue(v, fieldLabelMap) {
    var map = fieldLabelMap || {};
    var hasMap = false;
    for (var k in map) { if (map.hasOwnProperty(k)) { hasMap = true; break; } }
    
    if (v === null || v === undefined) return '<sp' + 'an cla' + 'ss="json-null">null</sp' + 'an>';
    if (typeof v === 'boolean') return '<sp' + 'an cla' + 'ss="json-bool">' + v + '</sp' + 'an>';
    if (typeof v === 'number') return '<sp' + 'an cla' + 'ss="json-num">' + v + '</sp' + 'an>';
    if (typeof v === 'string') {
        var t = hasMap ? replaceSpiralFieldReferences(v, map) : v;
        return '<sp' + 'an cla' + 'ss="json-str">' + esc(truncate(t, 200)) + '</sp' + 'an>';
    }
    if (v instanceof Array || (Object.prototype.toString.call(v) === '[object Array]')) {
        return '<sp' + 'an cla' + 'ss="json-str">[' + v.length + '件]</sp' + 'an>';
    }
    if (typeof v === 'object') {
        var count = 0;
        for (var key in v) { if (v.hasOwnProperty(key)) count++; }
        return '<sp' + 'an cla' + 'ss="json-str">{' + count + '項目}</sp' + 'an>';
    }
    return esc(String(v));
}

function formatDetailValue(v, fieldLabelMap) {
    var map = fieldLabelMap || {};
    var hasMap = false;
    for (var k in map) { if (map.hasOwnProperty(k)) { hasMap = true; break; } }

    if (v === null || v === undefined) return '<sp' + 'an sty' + 'le="col' + 'or:#999">null</sp' + 'an>';
    if (typeof v === 'boolean') return '<sp' + 'an sty' + 'le="col' + 'or:#0000ff">' + v + '</sp' + 'an>';
    if (typeof v === 'number') return '<sp' + 'an sty' + 'le="col' + 'or:#098658">' + v + '</sp' + 'an>';
    if (typeof v === 'string') {
        var disp = hasMap ? replaceSpiralFieldReferences(v, map) : v;
        if (disp.length > 500) return '<div cla' + 'ss="co' + 'de-bl' + 'ock">' + esc(disp) + '</div>';
        return esc(disp);
    }
    if (typeof v === 'object') {
        try {
            var s = JSON.stringify(v, null, 2);
            if (hasMap) s = replaceSpiralFieldReferences(s, map);
            if (s.length > 1000) return '<div cla' + 'ss="co' + 'de-bl' + 'ock">' + esc(s.substring(0, 1000)) + '...</div>';
            return '<div cla' + 'ss="co' + 'de-bl' + 'ock">' + esc(s) + '</div>';
        } catch (e) { return esc(String(v)); }
    }
    return esc(String(v));
}
