/* Spiral viewer &#8212; split from spiral_viewer.html */

// Sidebar, views, detail panels

/**
 * フォームフィールドの add キーは配列構造でフィールドタイプにより意味が変わる。
 * - メール系（mm_email, mm_email_nc）:
 *     add[0] = null:制限しない / "3":許可する / "4":拒否する
 *     add[1..] = "0":PC(モバイル以外) / "6":Vodafone(TM)変換 / "o_mobile":その他モバイル / その他:ドメイン名そのまま
 * - その他: そのまま表示
 * ※ デプロイの取りこぼし対策で、本ヘルパーは敢えて spiralRender.js 内にインライン定義する。
 */
function formatAddFieldInline(val, fieldType) {
  if (val === null || val === undefined) return '<span style="color:#999">制限しない</span>';
  if (!(val instanceof Array)) return esc(String(val));
  if (val.length === 0) return '<span style="color:#999">&#8212;</span>';
  var ft = String(fieldType || '');
  if (ft.indexOf('mm_email') === 0) {
    var first = val[0];
    var mode;
    if (first === null || first === undefined || first === '') mode = '制限しない';
    else if (String(first) === '3') mode = '許可する';
    else if (String(first) === '4') mode = '拒否する';
    else mode = String(first);
    var domainMap = { '0': 'PC (モバイルドメイン以外)', '6': 'Vodafone(TM)ドメイン変換', 'o_mobile': 'その他モバイルドメイン' };
    var entries = [];
    for (var i = 1; i < val.length; i++) {
      var d = val[i];
      if (d === null || d === undefined || d === '') continue;
      var ds = String(d);
      entries.push(domainMap[ds] || ds);
    }
    var out = '<strong>' + esc(mode) + '</strong>';
    if (entries.length > 0) out += '<br><small style="color:#666">' + esc(entries.join(' / ')) + '</small>';
    return out;
  }
  try { return esc(JSON.stringify(val)); } catch (e) { return esc(String(val)); }
}

function renderSidebar() {
  const sb = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const env = envA;
  const isCompareMode = currentMode === 'compare' && envB;

  // --- 環境Aが未ロードの場合（初期状態） ---
  if (!env) {
    sb.innerHTML = '<div style="padding:20px;color:#aaa;font-size:12px;text-align:center;">フォルダを読み込むと<br>ここに設定一覧が<br>表示されます</div>';
    if (toggle) toggle.style.display = 'none';
    return;
  }

  if (toggle) toggle.style.display = 'flex';

  let html = '';

  // --- 差分比較モード時: フィルターリセットボタン ---
  if (isCompareMode && isDiffFilterActive()) {
    html += '<div class="sidebar-filter-banner">'
      + '<span>&#9745; 選択フィルター ON</span>'
      + '<button onclick="resetDiffFilter();renderSidebar();renderContent();" class="sidebar-filter-reset">解除</button>'
      + '</div>';
  }

  // --- カテゴリごとにサイドバーを構築 ---
  for (const cat of CATEGORIES) {

    const items = cat.key === 'overview' ? [] : getItems(env, cat.key);
    const count = items.length;
    const isActive = currentView.category === cat.key && !currentView.item;

    // バッジ（件数 + 差分件数）
    let badgeHtml = '';
    if (cat.key !== 'overview') {
      if (isCompareMode) {
        const diffData = getDiffData(cat.key);
        const diffCount = Object.values(diffData).filter(function(e) {
          return e.status === 'changed' || e.status === 'only-a' || e.status === 'only-b';
        }).length;
        const allSel = isCategoryAllSelected(cat.key);
        const selCount = allSel ? count : (diffItemFilter[cat.key] ? diffItemFilter[cat.key].size : 0);
        if (diffCount > 0) {
          badgeHtml = '<span class="badge" style="background:var(--warning);color:#fff">'
            + count + ' <span style="opacity:0.85">(' + diffCount + '差異)</span></span>';
        } else {
          badgeHtml = '<span class="badge">' + count + '</span>';
        }
        if (!allSel) {
          badgeHtml += '<span class="badge" style="background:var(--accent);color:#fff;margin-left:2px">' + selCount + '選択</span>';
        }
      } else {
        badgeHtml = '<span class="badge">' + count + '</span>';
      }
    }

    html += '<div class="sidebar-section">';
    html += '<div class="sidebar-item ' + (isActive ? 'active' : '') + '"'
      + ' onclick="navigate(\'' + cat.key + '\')"'
      + ' title="' + esc(cat.label) + '">'
      + '<span class="icon">' + cat.icon + '</span>'
      + '<span class="sidebar-label">' + cat.label + '</span>'
      + badgeHtml
      + '</div>';

    // サブ項目（カテゴリ内の個別設定）
    if (currentView.category === cat.key && cat.key !== 'overview' && items.length > 0) {
      const subDiffData = isCompareMode ? getDiffData(cat.key) : {};

      // --- 比較モード: 全選択/全解除コントロール ---
      if (isCompareMode) {
        const allSelected = isCategoryAllSelected(cat.key);
        html += '<div class="sidebar-select-ctrl">'
          + '<label class="sidebar-select-all-label">'
          + '<input type="checkbox" ' + (allSelected ? 'checked' : '') + ' onchange="toggleCategoryAllFilter(\'' + cat.key + '\');renderSidebar();renderContent();" onclick="event.stopPropagation();">'
          + ' <span>全選択</span>'
          + '</label>'
          + '<span class="sidebar-select-hint">選択した項目のみ比較</span>'
          + '</div>';
      }

      for (let i = 0; i < items.length; i++) {
        const lbl = getItemLabel(cat.key, items[i]);
        const mk = getMatchKey(cat.key, items[i]);
        const subEntry = subDiffData[mk];
        const subStatus = subEntry ? subEntry.status : null;
        const isSubActive = currentView.item === i;
        const isSelected = isDiffItemSelected(cat.key, mk);

        let subDot = '';
        if (subStatus === 'changed') subDot = '<span class="diff-dot changed" title="差異あり"></span>';
        else if (subStatus === 'only-a') subDot = '<span class="diff-dot removed" title="環境Aのみ"></span>';

        // 比較モード: チェックボックス付き / 通常モード: そのまま
        if (isCompareMode) {
          const dimmed = !isSelected ? ' sidebar-sub-dimmed' : '';
          html += '<div class="sidebar-sub sidebar-sub-checkable' + (isSubActive ? ' active' : '') + dimmed + '"'
            + ' onclick="navigate(\'' + cat.key + '\', ' + i + ')"'
            + ' title="' + esc(lbl.name) + ' - ' + esc(lbl.sub) + '">'
            + '<label class="sidebar-check-label" onclick="event.stopPropagation();">'
            + '<input type="checkbox" ' + (isSelected ? 'checked' : '') + ' onchange="toggleDiffItemFilter(\'' + cat.key + '\', \'' + mk.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\');renderSidebar();renderContent();">'
            + '</label>'
            + subDot + esc(lbl.name)
            + '</div>';
        } else {
          html += '<div class="sidebar-sub ' + (isSubActive ? 'active' : '') + '"'
            + ' onclick="navigate(\'' + cat.key + '\', ' + i + ')"'
            + ' title="' + esc(lbl.name) + ' - ' + esc(lbl.sub) + '">'
            + subDot + esc(lbl.name)
            + '</div>';
        }
      }

      // 環境Bにのみ存在する項目
      if (isCompareMode) {
        const itemsB = getItems(envB, cat.key);
        const keysA = new Set(items.map(function(it) { return getMatchKey(cat.key, it); }));
        for (let i = 0; i < itemsB.length; i++) {
          const mk = getMatchKey(cat.key, itemsB[i]);
          if (!keysA.has(mk)) {
            const lbl = getItemLabel(cat.key, itemsB[i]);
            const isSelected = isDiffItemSelected(cat.key, mk);
            const dimmed = !isSelected ? ' sidebar-sub-dimmed' : '';
            html += '<div class="sidebar-sub sidebar-sub-checkable' + dimmed + '"'
              + ' onclick="navigate(\'' + cat.key + '\', \'b_' + i + '\')"'
              + ' title="環境Bのみ: ' + esc(lbl.name) + '">'
              + '<label class="sidebar-check-label" onclick="event.stopPropagation();">'
              + '<input type="checkbox" ' + (isSelected ? 'checked' : '') + ' onchange="toggleDiffItemFilter(\'' + cat.key + '\', \'' + mk.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\');renderSidebar();renderContent();">'
              + '</label>'
              + '<span class="diff-dot added"></span>' + esc(lbl.name)
              + '</div>';
          }
        }
      }
    }

    html += '</div>'; // sidebar-section end
  }

  sb.innerHTML = html;
}

  
  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    const wrapper = document.getElementById('sidebarWrapper');
    const btn = document.getElementById('sidebarToggle');
    if (wrapper && btn) {
      wrapper.classList.toggle('collapsed', sidebarCollapsed);
      btn.title = sidebarCollapsed ? 'メニューを開く' : 'メニューを閉じる';
      btn.setAttribute('aria-label', btn.title);
    }
  }
  
  function navigate(category, item = null) {
    if (item === null && manualPairCategory !== null && manualPairCategory !== category) {
      manualPairSelA = null;
      manualPairSelB = null;
      manualPairCategory = null;
    }
    currentView = { category, item };
    renderSidebar();
    renderContent();
  }

  function renderContent() {
    const el = document.getElementById('content');
    el.classList.remove('mp-split-mode');
    if (!envA) {
      el.innerHTML = `<div class="welcome"><div class="big-icon">&#9881;&#65039;</div><h2>SPIRAL 設定ビューアー</h2><p>「フォルダを選択」ボタンからSPIRALエクスポートフォルダを読み込んでください。</p></div>`;
      return;
    }
    const { category, item } = currentView;
    if (category === 'overview') {
      renderOverview(el);
    } else if (item !== null) {
      renderDetail(el, category, item);
    } else {
      renderList(el, category);
    }
  }

  function setMode(mode) {
    currentMode = mode;
    document.getElementById('modeView').classList.toggle('active', mode === 'view');
    document.getElementById('modeCompare').classList.toggle('active', mode === 'compare');
    try { localStorage.setItem('spiral_viewer_mode_v1', mode); } catch (_) {}
    updateHeaderCompareInfo();
    updateCompareOrderOptionsVisibility();
    renderSidebar();
    renderContent();
  }

  function updateModeUi(mode) {
    document.getElementById('modeView').classList.toggle('active', mode === 'view');
    document.getElementById('modeCompare').classList.toggle('active', mode === 'compare');
  }

  function updateHeaderCompareInfo() {
    const el = document.getElementById('headerCompareInfo');
    if (!el) return;
    if (comparisonType === 'single-env') {
      if (envA) {
        const name = envA.app?.title || envA.app?.name || '読み込み済';
        el.innerHTML = `<span class="comp-type-badge">同一環境内比較</span><span class="env-a-name">${esc(name)}</span>`;
        el.classList.remove('hidden');
      } else {
        el.innerHTML = '';
        el.classList.add('hidden');
      }
    } else if (currentMode === 'compare' && envA && envB) {
      const nameA = envA.app?.title || envA.app?.name || '環境A';
      const nameB = envB.app?.title || envB.app?.name || '環境B';
      el.innerHTML = `<span class="env-a-name">A: ${esc(nameA)}</span><span>⇔</span><span class="env-b-name">B: ${esc(nameB)}</span>`;
      el.classList.remove('hidden');
    } else if (currentMode === 'compare' && envA && !envB) {
      el.innerHTML = '<span style="color:var(--warning)">環境Bを読み込むと差分を比較できます</span>';
      el.classList.remove('hidden');
    } else {
      el.innerHTML = '';
      el.classList.add('hidden');
    }
  }

  function renderOverview(el) {
    const app = envA.app;
    let html = `<div class="page-title">${esc(app?.name || 'SPIRAL設定')}</div>`;
    html += `<div class="page-subtitle">タイトル: ${esc(app?.title || '')} / オブジェクト数: ${app?.objects?.length || 0}</div>`;
    html += `<div class="overview-grid">`;
    for (const cat of CATEGORIES) {
      if (cat.key === 'overview') continue;
      const items = getItems(envA, cat.key);
      html += `<div class="overview-card" onclick="navigate('${cat.key}')">
    <div class="oc-icon">${cat.icon}</div>
    <div class="oc-count">${items.length}</div>
    <div class="oc-label">${cat.label}</div>
  </div>`;
    }
    html += `</div>`;
    if (currentMode === 'compare' && envB) {
      html += `<div class="section-title">環境間の差分サマリー</div>`;
      html += `<div class="card"><div class="card-body no-pad"><table class="data-table"><thead><tr><th>カテゴリ</th><th>環境A</th><th>環境B</th><th>一致</th><th>差異あり</th><th>Aのみ</th><th>Bのみ</th></tr></thead><tbody>`;
      for (const cat of CATEGORIES) {
        if (cat.key === 'overview') continue;
        const entries = Object.values(getDiffData(cat.key));
        const same    = entries.filter(e => e.status === 'same').length;
        const changed = entries.filter(e => e.status === 'changed').length;
        const onlyA   = entries.filter(e => e.status === 'only-a').length;
        const onlyB   = entries.filter(e => e.status === 'only-b').length;
        html += `<tr onclick="navigate('${cat.key}')" style="cursor:pointer">
      <td>${cat.icon} ${cat.label}</td>
      <td>${getItems(envA, cat.key).length}</td>
      <td>${getItems(envB, cat.key).length}</td>
      <td>${same > 0 ? `<span style="color:var(--success)">${same}</span>` : '-'}</td>
      <td>${changed > 0 ? `<span style="color:var(--warning);font-weight:600">${changed}</span>` : '-'}</td>
      <td>${onlyA > 0 ? `<span style="color:var(--danger)">${onlyA}</span>` : '-'}</td>
      <td>${onlyB > 0 ? `<span style="color:var(--diff-only-b-border)">${onlyB}</span>` : '-'}</td>
    </tr>`;
      }
      html += `</tbody></table></div></div>`;
    }
    el.innerHTML = html;
  }
  
  function renderList(el, category) {
    const cat = CATEGORIES.find(function(c) { return c.key === category; });
    const items = getItems(envA, category);

    if (comparisonType === 'single-env') {
      el.classList.add('mp-split-mode');
      el.innerHTML = renderManualPairList(category, items, cat);
      return;
    }

    const isCompare = currentMode === 'compare' && envB;
    const filterActive = isCompare && !isCategoryAllSelected(category);
    const selectedSet = filterActive ? diffItemFilter[category] : null;

    let html = '<div class="breadcrumb"><span onclick="navigate(\'overview\')">概要</span><span class="sep">&#8250;</span><span>' + cat.icon + ' ' + cat.label + '</span></div>';
    html += '<div class="page-title">' + cat.icon + ' ' + cat.label + '</div>';

    // フィルター状態バナー
    if (isCompare && filterActive) {
      const selCount = selectedSet ? selectedSet.size : 0;
      html += '<div class="diff-filter-banner">'
        + '<span>&#9745; ' + selCount + ' / ' + items.length + ' 件を選択して比較中</span>'
        + '<button onclick="delete diffItemFilter[\'' + category + '\'];renderSidebar();renderContent();" class="diff-filter-reset-btn">このカテゴリを全選択に戻す</button>'
        + '</div>';
    }

    html += '<div class="page-subtitle">' + items.length + ' 件</div>';

    const diffData = isCompare ? getDiffData(category) : {};
    if (isCompare) {
      const entries = Object.values(diffData);
      html += '<div class="diff-summary">'
        + '<div class="diff-stat"><span class="dot" style="background:var(--success)"></span> 一致: ' + entries.filter(function(e) { return e.status === 'same'; }).length + '</div>'
        + '<div class="diff-stat"><span class="dot" style="background:var(--warning)"></span> 差異: ' + entries.filter(function(e) { return e.status === 'changed'; }).length + '</div>'
        + '<div class="diff-stat"><span class="dot" style="background:var(--danger)"></span> Aのみ: ' + entries.filter(function(e) { return e.status === 'only-a'; }).length + '</div>'
        + '<div class="diff-stat"><span class="dot" style="background:var(--diff-only-b-border)"></span> Bのみ: ' + entries.filter(function(e) { return e.status === 'only-b'; }).length + '</div>'
        + '</div>';
    }

    html += '<div class="card"><div class="card-body no-pad"><ul class="item-list">';
    for (let i = 0; i < items.length; i++) {
      const lbl = getItemLabel(category, items[i]);
      const mk = getMatchKey(category, items[i]);
      // フィルターが有効な場合、非選択項目はグレーアウト
      const isFiltered = filterActive && selectedSet && !selectedSet.has(mk);
      const entry = diffData[mk];
      const ds = entry ? entry.status : null;
      let dot = '';
      if (isCompare) {
        if (ds === 'changed') dot = '<span class="diff-dot changed" title="差異あり"></span>';
        else if (ds === 'only-a') dot = '<span class="diff-dot removed" title="環境Aのみ"></span>';
        else if (ds === 'same') dot = '<span style="color:var(--success);margin-right:4px" title="一致">&#10003;</span>';
        else dot = '<span style="color:#999;margin-right:4px;font-size:10px" title="未比較">○</span>';
      }
      const dimStyle = isFiltered ? ' style="opacity:0.4"' : '';
      html += '<li onclick="navigate(\'' + category + '\', ' + i + ')"' + dimStyle + '>'
        + dot
        + '<div><div class="item-name">' + esc(lbl.name) + '</div><div class="item-title">' + esc(lbl.sub) + '</div></div>'
        + '<div class="item-meta">' + esc(lbl.meta) + '</div>'
        + '</li>';
    }
    if (isCompare) {
      const entriesArr = Object.keys(diffData);
      for (let ei = 0; ei < entriesArr.length; ei++) {
        const mk = entriesArr[ei];
        const entry = diffData[mk];
        if (entry.status !== 'only-b') continue;
        const isFiltered = filterActive && selectedSet && !selectedSet.has(mk);
        const itemsB = getItems(envB, category);
        const bi = itemsB.indexOf(entry.itemB);
        if (bi === -1) continue;
        const lbl = getItemLabel(category, entry.itemB);
        const dimStyle = isFiltered ? ' style="opacity:0.4"' : '';
        html += '<li onclick="navigate(\'' + category + '\', \'b_' + bi + '\')"' + dimStyle + '>'
          + '<span class="diff-dot added"></span>'
          + '<div><div class="item-name">' + esc(lbl.name) + '</div>'
          + '<div class="item-title">' + esc(lbl.sub) + ' <span style="color:var(--diff-only-b-border)">[環境Bのみ]</span></div></div>'
          + '</li>';
      }
    }
    html += '</ul></div></div>';

    el.innerHTML = html;
  }

  function renderManualPairList(category, items, cat) {
    const selA = manualPairCategory === category ? manualPairSelA : null;
    const selB = manualPairCategory === category ? manualPairSelB : null;
    const selAName = selA !== null ? esc(getItemLabel(category, items[selA]).name) : null;
    const selBName = selB !== null ? esc(getItemLabel(category, items[selB]).name) : null;
    const canCompare = selA !== null && selB !== null && selA !== selB;

    // 上部バー（固定）
    let html = `<div class="mp-top-bar">`;
    html += `<div class="mp-top-info">`;
    html += `<span class="mp-top-category">${cat.icon} ${cat.label}</span>`;
    html += `<span class="mp-top-count">${items.length} 件</span>`;
    html += `</div>`;
    html += `<div class="mp-top-sel">`;
    html += `<div class="mp-top-chip mp-top-chip-a">`;
    html += `<span class="mp-top-chip-label">比較元</span>`;
    html += selAName ? `<span class="mp-top-chip-name">${selAName}</span>` : `<span class="mp-top-chip-empty">未選択</span>`;
    html += `</div>`;
    html += `<span class="mp-vs">&#8644;</span>`;
    html += `<div class="mp-top-chip mp-top-chip-b">`;
    html += `<span class="mp-top-chip-label">比較先</span>`;
    html += selBName ? `<span class="mp-top-chip-name">${selBName}</span>` : `<span class="mp-top-chip-empty">未選択</span>`;
    html += `</div>`;
    html += `</div>`;
    html += `<button class="mp-compare-btn" ${canCompare ? '' : 'disabled'} onclick="executeManualPairCompare('${category}')">差分比較を実行 &#8594;</button>`;
    html += `</div>`;

    // 左右ペイン（独立スクロール）
    html += `<div class="mp-split">`;

    // 左ペイン（比較元）
    html += `<div class="mp-pane mp-pane-a">`;
    html += `<div class="mp-pane-header mp-pane-header-a">&#9664; 比較元（左に表示）</div>`;
    if (selA !== null) {
      const lblSelA = getItemLabel(category, items[selA]);
      html += `<div class="mp-pane-sel-card mp-pane-sel-card-a has-sel">`;
      html += `<span class="mp-pane-sel-label">選択中</span>`;
      html += `<span class="mp-pane-sel-name">${esc(lblSelA.name)}</span>`;
      if (lblSelA.sub) html += `<span class="mp-pane-sel-sub">${esc(lblSelA.sub)}</span>`;
      html += `</div>`;
    } else {
      html += `<div class="mp-pane-sel-card mp-pane-sel-card-a"><span class="mp-pane-sel-empty">&#8592; クリックして比較元を選択</span></div>`;
    }
    html += `<ul class="mp-pane-list">`;
    for (let i = 0; i < items.length; i++) {
      const lbl = getItemLabel(category, items[i]);
      const isSelected = selA === i;
      const isOther   = selB === i;
      const cls = isSelected ? 'mp-col-item mp-col-item-sel-a' : (isOther ? 'mp-col-item mp-col-item-other' : 'mp-col-item');
      html += `<li class="${cls}" onclick="selectManualPairItem('A','${category}',${i})">`;
      html += `<span class="mp-col-check">${isSelected ? '&#10003;' : ''}</span>`;
      html += `<div class="mp-col-item-body"><div class="mp-col-item-name">${esc(lbl.name)}</div>`;
      if (lbl.sub) html += `<div class="mp-col-item-sub">${esc(lbl.sub)}</div>`;
      html += `</div></li>`;
    }
    if (!items.length) html += `<li class="mp-pane-empty">設定が見つかりません</li>`;
    html += `</ul></div>`;

    // 右ペイン（比較先）
    html += `<div class="mp-pane mp-pane-b">`;
    html += `<div class="mp-pane-header mp-pane-header-b">比較先（右に表示）&#9654;</div>`;
    if (selB !== null) {
      const lblSelB = getItemLabel(category, items[selB]);
      html += `<div class="mp-pane-sel-card mp-pane-sel-card-b has-sel">`;
      html += `<span class="mp-pane-sel-label">選択中</span>`;
      html += `<span class="mp-pane-sel-name">${esc(lblSelB.name)}</span>`;
      if (lblSelB.sub) html += `<span class="mp-pane-sel-sub">${esc(lblSelB.sub)}</span>`;
      html += `</div>`;
    } else {
      html += `<div class="mp-pane-sel-card mp-pane-sel-card-b"><span class="mp-pane-sel-empty">クリックして比較先を選択 &#8594;</span></div>`;
    }
    html += `<ul class="mp-pane-list">`;
    for (let i = 0; i < items.length; i++) {
      const lbl = getItemLabel(category, items[i]);
      const isSelected = selB === i;
      const isOther   = selA === i;
      const cls = isSelected ? 'mp-col-item mp-col-item-sel-b' : (isOther ? 'mp-col-item mp-col-item-other' : 'mp-col-item');
      html += `<li class="${cls}" onclick="selectManualPairItem('B','${category}',${i})">`;
      html += `<span class="mp-col-check">${isSelected ? '&#10003;' : ''}</span>`;
      html += `<div class="mp-col-item-body"><div class="mp-col-item-name">${esc(lbl.name)}</div>`;
      if (lbl.sub) html += `<div class="mp-col-item-sub">${esc(lbl.sub)}</div>`;
      html += `</div></li>`;
    }
    if (!items.length) html += `<li class="mp-pane-empty">設定が見つかりません</li>`;
    html += `</ul></div>`;

    html += `</div>`; // .mp-split
    return html;
  }
  
  function renderDetail(el, category, itemIdx) {
    const cat = CATEGORIES.find(c => c.key === category);
    let itemA, itemB, isOnlyB = false, isManualPair = false;
    let cacheEntry = null; // 通常2環境比較時のキャッシュエントリ
    if (typeof itemIdx === 'string' && itemIdx.startsWith('mp_')) {
      const parts = itemIdx.split('_');
      itemA = getItems(envA, category)[parseInt(parts[1])];
      itemB = getItems(envA, category)[parseInt(parts[2])];
      isManualPair = true;
    } else if (typeof itemIdx === 'string' && itemIdx.startsWith('b_')) {
      const bi = parseInt(itemIdx.substring(2));
      itemB = getItems(envB, category)[bi];
      itemA = null;
      isOnlyB = true;
    } else {
      itemA = getItems(envA, category)[itemIdx];
      if (currentMode === 'compare' && envB) {
        const mk = getMatchKey(category, itemA);
        cacheEntry = getDiffData(category)[mk] || null;
        itemB = cacheEntry ? cacheEntry.itemB : null;
      }
    }
    const item = itemA || itemB;
    const lbl = getItemLabel(category, item);
    let html = `<div class="breadcrumb"><span onclick="navigate('overview')">概要</span><span class="sep">&#8250;</span><span onclick="navigate('${category}')">${cat.icon} ${cat.label}</span><span class="sep">&#8250;</span><span>${esc(lbl.name)}</span></div>`;
    html += `<div class="page-title">${esc(lbl.name)}</div>`;
    html += `<div class="page-subtitle">${esc(lbl.sub)}</div>`;

    // 比較モード時: 比較対象を明示するバー
    if (isManualPair) {
      const nameA = itemA ? (getItemLabel(category, itemA).name || '&#8212;') : '&#8212;';
      const nameB = itemB ? (getItemLabel(category, itemB).name || '&#8212;') : '&#8212;';
      const appName = envA?._folderName || envA?.app?.title || envA?.app?.name || '';
      html += `<div class="compare-context-bar">
    <div class="env-block env-a-block"><div class="env-caption env-a-caption">比較元（画面左）</div>${appName ? `<div class="env-export-name">${esc(appName)}</div>` : ''}<div class="env-value">${esc(nameA)}</div><div class="env-caption" style="margin-top:6px;opacity:0.85">下の左パネルに詳細を表示します</div></div>
    <div class="vs">&#8644;</div>
    <div class="env-block env-b-block"><div class="env-caption env-b-caption">比較先（画面右）</div>${appName ? `<div class="env-export-name">${esc(appName)}</div>` : ''}<div class="env-value">${esc(nameB)}</div><div class="env-caption" style="margin-top:6px;opacity:0.85">下の右パネルに詳細を表示します</div></div>
  </div>`;
    } else if (currentMode === 'compare' && envB) {
      const nameA = itemA ? (getItemLabel(category, itemA).name || '&#8212;') : '該当なし';
      const nameB = itemB ? (getItemLabel(category, itemB).name || '&#8212;') : '該当なし';
      const appNameA = envA?._folderName || envA?.app?.title || envA?.app?.name || '';
      const appNameB = envB?._folderName || envB?.app?.title || envB?.app?.name || '';
      html += `<div class="compare-context-bar">
    <div class="env-block env-a-block"><div class="env-caption env-a-caption">環境A（画面左）</div>${appNameA ? `<div class="env-export-name">${esc(appNameA)}</div>` : ''}<div class="env-value">${esc(nameA)}</div><div class="env-caption" style="margin-top:6px;opacity:0.85">下の左パネルに詳細を表示します</div></div>
    <div class="vs">&#8644;</div>
    <div class="env-block env-b-block"><div class="env-caption env-b-caption">環境B（画面右）</div>${appNameB ? `<div class="env-export-name">${esc(appNameB)}</div>` : ''}<div class="env-value">${esc(nameB)}</div><div class="env-caption" style="margin-top:6px;opacity:0.85">下の右パネルに詳細を表示します</div></div>
  </div>`;
    }

    // 手動ペア比較時のステータス表示
    if (isManualPair && itemA && itemB) {
      const mpDiffs = deepDiff(itemA, itemB, getDeepDiffOptions(category));
      if (mpDiffs.length > 0) {
        const mpPartitioned = partitionDiffsForRender(mpDiffs, itemA, itemB, category);
        html += `<div class="card" style="border-left:4px solid var(--warning);margin-bottom:16px"><div class="card-body" style="padding:12px 16px">`;
        html += `<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">`;
        html += `<span style="font-size:20px">&#9888;&#65039;</span>`;
        html += `<div><div style="font-weight:600;font-size:14px;color:var(--warning)">差異あり</div><div style="font-size:12px;color:var(--text-light);margin-top:2px">${countDiffSections(mpPartitioned)}件の差異があります</div></div>`;
        html += `</div></div></div>`;
      } else {
        html += `<div class="card" style="border-left:4px solid var(--success);margin-bottom:16px"><div class="card-body" style="padding:12px 16px">`;
        html += `<div style="display:flex;align-items:center;gap:12px"><span style="font-size:20px">&#10003;</span>`;
        html += `<div style="font-weight:600;font-size:14px;color:var(--success)">完全一致</div>`;
        html += `</div></div></div>`;
      }
    }

    // 差分モード時のステータス表示（キャッシュから取得）
    if (currentMode === 'compare' && envB && !isOnlyB && !isManualPair) {
      const diffStatus = cacheEntry ? cacheEntry.status : null;
      if (diffStatus === 'changed') {
        html += `<div class="card" style="border-left:4px solid var(--warning);margin-bottom:16px"><div class="card-body" style="padding:12px 16px">`;
        html += `<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">`;
        html += `<span style="font-size:20px">&#9888;&#65039;</span>`;
        html += `<div><div style="font-weight:600;font-size:14px;color:var(--warning)">差異あり</div><div style="font-size:12px;color:var(--text-light);margin-top:2px">${countDiffSections(cacheEntry.partitioned) + (cacheEntry.htmlPageDiffCount || 0)}件の差異があります</div></div>`;
        html += `</div></div></div>`;
      } else if (diffStatus === 'same') {
        html += `<div class="card" style="border-left:4px solid var(--success);margin-bottom:16px"><div class="card-body" style="padding:12px 16px">`;
        html += `<div style="display:flex;align-items:center;gap:12px">`;
        html += `<span style="font-size:20px">&#10003;</span>`;
        html += `<div style="font-weight:600;font-size:14px;color:var(--success)">完全一致</div>`;
        html += `</div></div></div>`;
      } else if (diffStatus === 'only-a') {
        html += `<div class="card" style="border-left:4px solid var(--danger);margin-bottom:16px"><div class="card-body" style="padding:12px 16px">`;
        html += `<div style="display:flex;align-items:center;gap:12px">`;
        html += `<span style="font-size:20px">&#128308;</span>`;
        html += `<div style="font-weight:600;font-size:14px;color:var(--danger)">環境Aのみに存在</div>`;
        html += `</div></div></div>`;
      }
    }

    if (isOnlyB) {
      // 二列表示（左=Aなし、右=B詳細）
      html += '<div class="compare-detail-split" role="region" aria-label="環境Bのみ">'
            + '<section class="compare-detail-col compare-detail-col-a">'
            + '<div class="compare-detail-col-head compare-detail-col-head-a">環境A（左）</div>'
            + '<div class="compare-detail-col-body"><div class="empty-state" style="color:var(--text-light);padding:32px 16px;text-align:center">&#128683; この環境には存在しません</div></div>'
            + '</section>'
            + '<section class="compare-detail-col compare-detail-col-b">'
            + '<div class="compare-detail-col-head compare-detail-col-head-b">環境B（右）</div>'
            + '<div class="compare-detail-col-body">';
      html += renderItemDetail(category, itemB, envB);
      html += '</div></section></div>';
    } else if (isManualPair || (currentMode === 'compare' && envB && itemB)) {
      const envForB = isManualPair ? envA : envB;
      const colHeadA = isManualPair ? '比較元（左）' : '環境A（左）';
      const colHeadB = isManualPair ? '比較先（右）' : '環境B（右）';

      // PHPソース構造アイテムの場合は専用の比較表示で早期リターン
      if ((itemA && itemA._sourceType === 'php') || (itemB && itemB._sourceType === 'php')) {
        html += '<div class="compare-detail-split" role="region" aria-label="PHP ソース比較">';
        html += '<section class="compare-detail-col compare-detail-col-a">'
              + '<div class="compare-detail-col-head compare-detail-col-head-a">' + colHeadA + '</div>'
              + '<div class="compare-detail-col-body">';
        html += itemA ? renderPhpSourceDetail(itemA, itemB) : '<div class="empty-state">この環境には存在しません</div>';
        html += '</div></section>';
        html += '<section class="compare-detail-col compare-detail-col-b">'
              + '<div class="compare-detail-col-head compare-detail-col-head-b">' + colHeadB + '</div>'
              + '<div class="compare-detail-col-body">';
        html += itemB ? renderPhpSourceDetail(itemB, itemA) : '<div class="empty-state">この環境には存在しません</div>';
        html += '</div></section></div>';
        el.innerHTML = html;
        return;
      }

      // 手動ペア: 都度計算 / 通常比較: キャッシュを利用
      const diffs = isManualPair
        ? deepDiff(itemA, itemB, getDeepDiffOptions(category))
        : (cacheEntry ? cacheEntry.diffs : []);
      let listGroups = {}, flowGroups = {};
      let formulaGroups = {}, myPageGroups = {}, passwordMngDiffs = [], searchFormDiffs = [];
      let envelopeDiffs = [], mailListDiffs = [], childrenGroups = {}, actionGroups = {}, selectWhereDiffs = [];
      let otherDiffs = [], cardGroups = {}, tableSecurityDiffs = [], tableBasicDiffs = [];
      if (diffs.length > 0) {
        const partitioned = isManualPair
          ? partitionDiffsForRender(diffs, itemA, itemB, category)
          : (cacheEntry && cacheEntry.partitioned
              ? cacheEntry.partitioned
              : partitionDiffsForRender(diffs, itemA, itemB, category));
        const { colGroups } = partitioned;
        flowGroups = partitioned.flowGroups;
        otherDiffs = partitioned.otherDiffs;
        listGroups = partitioned.listGroups;
        formulaGroups = partitioned.formulaGroups;
        myPageGroups = partitioned.myPageGroups;
        passwordMngDiffs = partitioned.passwordMngDiffs;
        searchFormDiffs = partitioned.searchFormDiffs;
        envelopeDiffs = partitioned.envelopeDiffs;
        mailListDiffs = partitioned.mailListDiffs;
        childrenGroups = partitioned.childrenGroups;
        actionGroups = partitioned.actionGroups || {};
        cardGroups = partitioned.cardGroups || {};
        selectWhereDiffs = partitioned.selectWhereDiffs;
        tableSecurityDiffs = partitioned.tableSecurityDiffs || [];
        tableBasicDiffs = partitioned.tableBasicDiffs || [];
        const diffFldMap = resolveFieldLabelMapForDiffPair(itemA, itemB);
  
      const diffCountLabel = countDiffSections(partitioned) + ' 件の差異';
      html += `<div class="card" style="border-color:var(--diff-change-border)"><div class="card-header" style="background:var(--diff-change)"><h3 style="color:var(--warning-strong)">&#9888; ${diffCountLabel}</h3></div>`;
        html += `<div class="card-body" style="padding:16px 16px 0">`;
  
        html += `<div class="diff-legend"><span class="legend-col"><span class="diff-status-chip changed">差分あり</span></span><span class="legend-col"><span class="diff-status-chip only-a">Aのみ</span></span><span class="legend-col"><span class="diff-status-chip only-b">Bのみ</span></span><span class="legend-col legend-col-a">左パネル=環境A</span><span class="legend-col legend-col-b">右パネル=環境B</span></div>`;
        html += `</div><div class="card-body" style="padding:0 16px 16px">`;
  
        for (const [fieldId, fieldDiffs] of Object.entries(flowGroups)) {
          html += renderOneFieldDiffGrid(fieldId, fieldDiffs, itemA, itemB, category);
        }
        if (category === 'form' && Object.keys(flowGroups).length > 0) {
          html += renderFormFieldOrderComparison(itemA, itemB);
        }
        if (category === 'db') {
          for (const [titleKey, fieldDiffs] of Object.entries(listGroups)) {
            html += renderOneDbFieldDiffGrid(titleKey, fieldDiffs, itemA, itemB);
          }
          html += renderDbFieldOrderComparison(itemA, itemB);
        }
        for (const [colKey, colDiffs] of Object.entries(colGroups)) {
          html += renderTableColDiffGrid(colKey, colDiffs, itemA, itemB);
        }

        for (const [cardTitle, cDiffs] of Object.entries(cardGroups)) {
          html += renderCardGroupDiff(cardTitle, cDiffs, itemA, itemB, diffFldMap);
        }

        html += renderSelectWhereDiff(selectWhereDiffs, itemA, itemB);

        for (const [idx, fDiffs] of Object.entries(formulaGroups)) {
          html += renderFormulaGroupDiff(idx, fDiffs, itemA, itemB, diffFldMap);
        }

        if (passwordMngDiffs.length > 0) {
          html += renderNamedSectionDiff('パスワード管理', passwordMngDiffs, diffFldMap, category, itemA, itemB);
        }

        for (const [idx, pDiffs] of Object.entries(myPageGroups)) {
          html += renderMyPageGroupDiff(idx, pDiffs, itemA, itemB, diffFldMap);
        }

        if (searchFormDiffs.length > 0) {
          html += renderNamedSectionDiff('検索フォーム', searchFormDiffs, diffFldMap, category, itemA, itemB);
        }

        if (tableSecurityDiffs.length > 0) {
          html += renderNamedSectionDiff('セキュリティ設定', tableSecurityDiffs, diffFldMap, category, itemA, itemB);
        }
        if (tableBasicDiffs.length > 0) {
          html += renderNamedSectionDiff('基本設定', tableBasicDiffs, diffFldMap, category, itemA, itemB);
        }

        if (envelopeDiffs.length > 0) {
          html += renderNamedSectionDiff('エンベロープ', envelopeDiffs, diffFldMap, category, itemA, itemB);
        }

        if (mailListDiffs.length > 0) {
          html += renderNamedSectionDiff('配信リスト', mailListDiffs, diffFldMap, category, itemA, itemB);
        }

        for (const [idx, cDiffs] of Object.entries(childrenGroups)) {
          html += renderChildGroupDiff(idx, cDiffs, itemA, itemB, diffFldMap);
        }

        for (const [actionName, aDiffs] of Object.entries(actionGroups)) {
          html += renderActionGroupDiff(actionName, aDiffs, itemA, itemB, diffFldMap);
        }

        if (otherDiffs.length > 0) {
          html += `<div style="border-top:2px solid var(--border);padding:12px 16px 0">`;
          html += `<div class="diff-field-name-row" style="background:#fafbfc;margin-bottom:12px"><span class="field-name-label">その他の設定</span><span style="color:#64748b;font-size:11px;font-weight:500;margin-left:8px">上のグループ以外の差分です。「いま比較している位置」と JSON 上のパスで対象項目を確認できます。</span></div>`;
          html += renderDiffCompareSection(otherDiffs, diffFldMap, category, itemA, itemB, 'full');
          html += `</div>`;
        }
  
        html += `</div></div>`;
      }

      // エラー系画面ソース差分（マイエリアのみ）
      if (category === 'myarea' && !isManualPair && cacheEntry && (cacheEntry.htmlPageDiffCount || 0) > 0 && itemA && itemB) {
        var _dpA_all = (envA.myAreaPages || []).filter(function(p) { return p._myAreaName === (itemA._dirName || ''); });
        var _dpB_all = (envB.myAreaPages || []).filter(function(p) { return p._myAreaName === (itemB._dirName || ''); });
        var _dpMapB = {};
        for (var _dpi = 0; _dpi < _dpB_all.length; _dpi++) { _dpMapB[_dpB_all[_dpi]._filename] = _dpB_all[_dpi]; }
        var _dpMapA = {};
        for (var _dpa = 0; _dpa < _dpA_all.length; _dpa++) { _dpMapA[_dpA_all[_dpa]._filename] = _dpA_all[_dpa]; }
        var _diffPages = [];
        for (var _di = 0; _di < _dpA_all.length; _di++) {
          var _pA = _dpA_all[_di];
          var _pB = _dpMapB[_pA._filename];
          if (!_pB) { _diffPages.push({ type: 'only-a', filename: _pA._filename, pA: _pA, pB: null }); }
          else if (_pA._source !== _pB._source) { _diffPages.push({ type: 'changed', filename: _pA._filename, pA: _pA, pB: _pB }); }
        }
        for (var _di2 = 0; _di2 < _dpB_all.length; _di2++) {
          if (!_dpMapA[_dpB_all[_di2]._filename]) { _diffPages.push({ type: 'only-b', filename: _dpB_all[_di2]._filename, pA: null, pB: _dpB_all[_di2] }); }
        }
        if (_diffPages.length > 0) {
          html += '<div class="card" style="border-color:var(--diff-change-border)"><div class="card-header" style="background:var(--diff-change)"><h3 style="color:var(--warning-strong)">&#9888; ' + _diffPages.length + ' 件の差異（エラー系画面）</h3></div>';
          html += '<div class="card-body" style="padding:16px 16px 0">';
          html += '<div class="diff-legend"><span class="legend-col"><span class="diff-status-chip changed">差分あり</span></span><span class="legend-col"><span class="diff-status-chip only-a">Aのみ</span></span><span class="legend-col"><span class="diff-status-chip only-b">Bのみ</span></span><span class="legend-col legend-col-a">左パネル=環境A</span><span class="legend-col legend-col-b">右パネル=環境B</span></div>';
          html += '</div><div class="card-body" style="padding:0 16px 16px">';
          for (var _dfi = 0; _dfi < _diffPages.length; _dfi++) {
            var _dp = _diffPages[_dfi];
            html += '<div style="border-top:2px solid var(--border);padding:12px 16px 0">';
            html += '<div class="diff-field-name-row" style="background:#fafbfc;margin-bottom:12px"><span class="field-name-label">エラー系画面</span><strong style="margin-left:8px">' + esc(_dp.filename) + '</strong></div>';
            html += '<div class="diff-compare-wrap"><table class="diff-compact-table"><thead><tr><th class="diff-col-status">状態</th><th class="diff-col-prop">ファイル</th><th class="diff-col-env">環境A</th><th class="diff-col-env">環境B</th></tr></thead><tbody>';
            if (_dp.type === 'changed') {
              var _sdl = renderScriptLineDiff(_dp.pA._source || '', _dp.pB._source || '');
              html += '<tr><td><span class="diff-status-chip changed">差分あり</span></td><td><span class="diff-prop-main">' + esc(_dp.filename) + '</span></td>';
              if (_sdl) {
                html += '<td>' + _sdl.a + '</td><td>' + _sdl.b + '</td>';
              } else {
                html += '<td><div class="code-block">' + esc(_dp.pA._source || '') + '</div></td><td><div class="code-block">' + esc(_dp.pB._source || '') + '</div></td>';
              }
              html += '</tr>';
            } else if (_dp.type === 'only-a') {
              html += '<tr><td><span class="diff-status-chip only-a">Aのみ</span></td><td><span class="diff-prop-main">' + esc(_dp.filename) + '</span></td><td>' + esc(_dp.filename) + '</td><td><span class="diff-empty">（この環境には存在しません）</span></td></tr>';
            } else {
              html += '<tr><td><span class="diff-status-chip only-b">Bのみ</span></td><td><span class="diff-prop-main">' + esc(_dp.filename) + '</span></td><td><span class="diff-empty">（この環境には存在しません）</span></td><td>' + esc(_dp.filename) + '</td></tr>';
            }
            html += '</tbody></table></div>';
            html += '</div>';
          }
          html += '</div></div>';
        }
      }

      const dbCompareA = category === 'db' ? { listGroups, actionGroups, pairItem: itemB } : null;
      const dbCompareB = category === 'db' ? { listGroups, actionGroups, pairItem: itemA } : null;

      const _genCtxBase = { formulaGroups, myPageGroups, passwordMngDiffs, searchFormDiffs,
                            envelopeDiffs, mailListDiffs, childrenGroups, selectWhereDiffs, otherDiffs, cardGroups,
                            tableSecurityDiffs, tableBasicDiffs };
      const genCompareCtxA = (category !== 'db' && category !== 'form') ? Object.assign({ pairItem: itemB, isEnvA: true }, _genCtxBase) : null;
      const genCompareCtxB = (category !== 'db' && category !== 'form') ? Object.assign({ pairItem: itemA, isEnvA: false }, _genCtxBase) : null;

      // DB比較時はモード切替トグルを追加
      if (category === 'db' && itemA && itemB) {
        html += '<div class="db-diff-view-toggle">';
        html += '<button class="db-diff-view-btn active" id="dbViewBtnNormal" onclick="switchDbDiffView(\'normal\')">&#128203; フィールド順で表示</button>';
        html += '<button class="db-diff-view-btn" id="dbViewBtnFocus" onclick="switchDbDiffView(\'focus\')">&#9889; 差分フォーカス＋対応線</button>';
        html += '</div>';
        // 差分フォーカスビュー（初期は非表示）
        html += '<div id="dbDiffFocusView" style="display:none">';
        html += renderDbDiffFocusView(itemA, itemB, listGroups);
        html += '</div>';
        // 通常の左右パネル
        html += '<div id="dbDiffNormalView">';
      }

      // フォームのフィールド並び順を同期させるためのコンテキスト
      let formCompareA = null, formCompareB = null;
      if (category === 'form') {
        const fieldsA = itemA?.flow_conf?.fields || [];
        const fieldsB = itemB?.flow_conf?.fields || [];
        const allFieldIds = new Set();
        fieldsA.forEach(f => { if (f.field) allFieldIds.add(String(f.field)); });
        fieldsB.forEach(f => { if (f.field) allFieldIds.add(String(f.field)); });
        const unifiedFieldIds = Array.from(allFieldIds);

        formCompareA = { unifiedFieldIds, pairItem: itemB, flowGroups };
        formCompareB = { unifiedFieldIds, pairItem: itemA, flowGroups };
      }

      // フォーム比較時はモード切替トグルを追加
      if (category === 'form' && itemA && itemB) {
        html += '<div class="db-diff-view-toggle">';
        html += '<button class="db-diff-view-btn active" id="formViewBtnNormal" onclick="switchFormDiffView(\'normal\')">&#128203; フィールド順で表示</button>';
        html += '<button class="db-diff-view-btn" id="formViewBtnFocus" onclick="switchFormDiffView(\'focus\')">&#9889; 差分フォーカス＋対応線</button>';
        html += '</div>';
        html += '<div id="formDiffFocusView" style="display:none">';
        html += renderFormDiffFocusView(itemA, itemB, flowGroups);
        html += '</div>';
        html += '<div id="formDiffNormalView">';
      }

      html += `<div class="compare-detail-split" role="region" aria-label="環境Aと環境Bの設定比較">`;
      html += `<section class="compare-detail-col compare-detail-col-a"><div class="compare-detail-col-head compare-detail-col-head-a">${colHeadA}</div><div class="compare-detail-col-body">`;
      html += renderItemDetail(category, itemA, envA, dbCompareA, formCompareA, genCompareCtxA);
      html += `</div></section>`;
      html += `<section class="compare-detail-col compare-detail-col-b"><div class="compare-detail-col-head compare-detail-col-head-b">${colHeadB}</div><div class="compare-detail-col-body">`;
      html += renderItemDetail(category, itemB, envForB, dbCompareB, formCompareB, genCompareCtxB);
      html += `</div></section></div>`;

      // DB比較: 通常パネルの閉じタグ
      if (category === 'db' && itemA && itemB) {
        html += '</div>'; // #dbDiffNormalView
      }
      // フォーム比較: 通常パネルの閉じタグ
      if (category === 'form' && itemA && itemB) {
        html += '</div>'; // #formDiffNormalView
      }
    } else if (currentMode === 'compare' && envB && !itemB) {
      // 二列表示（左=A詳細、右=Bなし）
      html += '<div class="compare-detail-split" role="region" aria-label="環境Aのみ">'
            + '<section class="compare-detail-col compare-detail-col-a">'
            + '<div class="compare-detail-col-head compare-detail-col-head-a">環境A（左）</div>'
            + '<div class="compare-detail-col-body">';
      html += renderItemDetail(category, itemA);
      html += '</div></section>'
            + '<section class="compare-detail-col compare-detail-col-b">'
            + '<div class="compare-detail-col-head compare-detail-col-head-b">環境B（右）</div>'
            + '<div class="compare-detail-col-body"><div class="empty-state" style="color:var(--text-light);padding:32px 16px;text-align:center">&#128683; この環境には存在しません</div></div>'
            + '</section></div>';
    } else {
      html += renderItemDetail(category, itemA);
    }
    el.innerHTML = html;
    scheduleDbDiffFocusRedraw();
    scheduleFormDiffFocusRedraw();
  }
  
  /**
   * PHPソース構造アイテムの設定表示
   * フォームは抽出済みフィールド一覧、それ以外はページファイル一覧を表示
   * compareOther: 比較相手（差分比較時）
   */
  function renderPhpSourceDetail(item, compareOther) {
    if (!item) return '<div class="empty-state">データがありません</div>';
    var html = '';

    // フォーム: 抽出フィールドを表示
    if (item._extractedFields) {
      var otherFields = (compareOther && compareOther._extractedFields) ? compareOther._extractedFields : null;
      html += renderPhpExtractedFields(item._extractedFields, otherFields);
    }

    // ページファイル一覧（フォーム以外はこれがメイン）
    var files = item._sourceFiles || {};
    var otherFiles = (compareOther && compareOther._sourceFiles) ? compareOther._sourceFiles : null;
    var allKeys = Object.keys(files).sort();
    if (otherFiles) {
      Object.keys(otherFiles).forEach(function(k) {
        if (allKeys.indexOf(k) === -1) allKeys.push(k);
      });
      allKeys.sort();
    }

    if (allKeys.length > 0) {
      var tableTitle = item._extractedFields ? 'ページファイル一覧' : 'ファイル一覧';
      html += '<div class="card"><div class="card-header"><h3>' + tableTitle + '</h3></div>'
            + '<div class="card-body no-pad"><table class="data-table"><thead><tr>'
            + '<th>ファイル名</th>';
      if (otherFiles !== null) html += '<th>差分</th>';
      html += '</tr></thead><tbody>';

      for (var i = 0; i < allKeys.length; i++) {
        var fk = allKeys[i];
        var hasSelf  = fk in files;
        var hasOther = otherFiles !== null && fk in otherFiles;
        var badge = '';
        var rowStyle = '';
        if (otherFiles !== null) {
          if (!hasSelf) {
            badge = '<span class="diff-status-chip only-b">相手のenvのみ</span>';
            rowStyle = ' style="background:var(--diff-add)"';
          } else if (!hasOther) {
            badge = '<span class="diff-status-chip only-a">このenvのみ</span>';
            rowStyle = ' style="background:var(--diff-remove)"';
          } else if (files[fk] !== otherFiles[fk]) {
            badge = '<span class="diff-status-chip changed">差分あり</span>';
            rowStyle = ' style="background:var(--diff-change)"';
          } else {
            badge = '<span style="color:var(--success)">&#10003; 一致</span>';
          }
        }
        html += '<tr' + rowStyle + '><td><code>' + esc(fk) + '</code></td>';
        if (otherFiles !== null) html += '<td>' + badge + '</td>';
        html += '</tr>';
      }
      html += '</tbody></table></div></div>';
    }

    if (!html) html = '<div class="empty-state">ファイルが見つかりません</div>';
    return html;
  }

  /**
   * 抽出済みフォームフィールドを設定一覧テーブルで表示
   * fields: 自環境のフィールド配列, otherFields: 比較相手（null=単体表示）
   */
  function renderPhpExtractedFields(fields, otherFields) {
    // 比較相手のフィールドをMapに変換
    var otherMap = {};
    if (otherFields) {
      for (var i = 0; i < otherFields.length; i++) {
        otherMap[otherFields[i].field] = otherFields[i];
      }
    }

    var html = '<div class="card"><div class="card-header"><h3>フォームフィールド設定</h3>'
             + '<span class="tag" style="background:var(--section-head-border);color:#fff;font-size:11px">edit_page.php より抽出</span>'
             + '</div><div class="card-body no-pad">'
             + '<table class="data-table"><thead><tr>'
             + '<th>#</th><th>フィールド名</th><th>ラベル</th><th>タイプ</th><th>必須</th><th>選択肢数</th>';
    if (otherFields) html += '<th>差分</th>';
    html += '</tr></thead><tbody>';

    var typeLabel = { text: 'テキスト', select: 'セレクト', textarea: 'テキストエリア', checkbox: 'チェックボックス', radio: 'ラジオ', file: 'ファイル', date: '日付', hidden: '隠しフィールド' };

    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var other = otherFields ? otherMap[f.field] : null;
      var rowStyle = '';
      var badge = '';

      if (otherFields) {
        if (!other) {
          rowStyle = ' style="background:var(--diff-remove)"';
          badge = '<span class="diff-status-chip only-a">このenvのみ</span>';
        } else {
          // 詳細差分チェック
          var diffs = [];
          if (f.label !== other.label) diffs.push('ラベル');
          if (f.type !== other.type) diffs.push('タイプ');
          if (f.required !== other.required) diffs.push('必須');
          var optA = (f.options || []).length;
          var optB = (other.options || []).length;
          if (optA !== optB) diffs.push('選択肢数');
          if (diffs.length > 0) {
            rowStyle = ' style="background:var(--diff-change)"';
            badge = '<span class="diff-status-chip changed">差分: ' + esc(diffs.join(' / ')) + '</span>';
          } else {
            badge = '<span style="color:var(--success)">&#10003; 一致</span>';
          }
        }
      }

      var optCount = f.options ? f.options.length : '';
      html += '<tr' + rowStyle + '>';
      html += '<td style="color:var(--text-light);font-size:11px">' + (i + 1) + '</td>';
      html += '<td><code>' + esc(f.field) + '</code></td>';
      html += '<td>' + esc(f.label) + '</td>';
      html += '<td>' + esc(typeLabel[f.type] || f.type) + '</td>';
      html += '<td>' + (f.required ? '<span style="color:var(--danger);font-weight:600">必須</span>' : '') + '</td>';
      html += '<td>' + (optCount !== '' ? optCount + '件' : '') + '</td>';
      if (otherFields) html += '<td>' + badge + '</td>';
      html += '</tr>';

      // 選択肢の内訳（差分がある場合）
      if (otherFields && other && f.options && other.options) {
        var optDiffRows = renderPhpOptionsDiff(f.options, other.options);
        if (optDiffRows) {
          html += '<tr style="background:rgba(0,0,0,0.02)"><td colspan="' + (otherFields ? 7 : 6) + '" style="padding:0 16px 8px 40px">'
                + '<table class="data-table" style="font-size:12px"><thead><tr><th>値</th><th>選択肢ラベル</th><th>差分</th></tr></thead><tbody>'
                + optDiffRows + '</tbody></table></td></tr>';
        }
      }
    }

    // 比較相手にのみ存在するフィールド
    if (otherFields) {
      for (var oi = 0; oi < otherFields.length; oi++) {
        var of2 = otherFields[oi];
        var inSelf = false;
        for (var si = 0; si < fields.length; si++) {
          if (fields[si].field === of2.field) { inSelf = true; break; }
        }
        if (inSelf) continue;
        html += '<tr style="background:var(--diff-add)">';
        html += '<td style="color:var(--text-light);font-size:11px">-</td>';
        html += '<td><code>' + esc(of2.field) + '</code></td>';
        html += '<td>' + esc(of2.label) + '</td>';
        html += '<td>' + esc(typeLabel[of2.type] || of2.type) + '</td>';
        html += '<td>' + (of2.required ? '<span style="color:var(--danger);font-weight:600">必須</span>' : '') + '</td>';
        html += '<td>' + ((of2.options ? of2.options.length : '') !== '' ? (of2.options.length + '件') : '') + '</td>';
        html += '<td><span class="diff-status-chip only-b">相手のenvのみ</span></td>';
        html += '</tr>';
      }
    }

    html += '</tbody></table></div></div>';
    return html;
  }

  /**
   * select フィールドの選択肢を比較してdiff行のHTMLを返す（差分なしはnull）
   */
  function renderPhpOptionsDiff(optA, optB) {
    var mapA = {}, mapB = {};
    for (var i = 0; i < optA.length; i++) mapA[optA[i].value] = optA[i].label;
    for (var i = 0; i < optB.length; i++) mapB[optB[i].value] = optB[i].label;

    var allVals = [];
    var seenV = {};
    for (var i = 0; i < optA.length; i++) { if (!seenV[optA[i].value]) { allVals.push(optA[i].value); seenV[optA[i].value] = true; } }
    for (var i = 0; i < optB.length; i++) { if (!seenV[optB[i].value]) { allVals.push(optB[i].value); seenV[optB[i].value] = true; } }

    var hasDiff = false;
    var rows = '';
    for (var i = 0; i < allVals.length; i++) {
      var v = allVals[i];
      var lA = mapA[v], lB = mapB[v];
      var isDiff = lA !== lB;
      if (isDiff) hasDiff = true;
      if (!isDiff) continue; // 一致行は省略
      var chip = lA === undefined ? '<span class="diff-status-chip only-b">相手のみ</span>'
               : lB === undefined ? '<span class="diff-status-chip only-a">このenvのみ</span>'
               : '<span class="diff-status-chip changed">ラベル相違</span>';
      rows += '<tr><td><code>' + esc(v) + '</code></td>'
            + '<td>' + esc(lA !== undefined ? lA : '（なし）') + ' → ' + esc(lB !== undefined ? lB : '（なし）') + '</td>'
            + '<td>' + chip + '</td></tr>';
    }
    return hasDiff ? rows : null;
  }

  function renderItemDetail(category, item, env, dbCompareCtx, formCompareCtx, genCompareCtx) {
    if (!item && !formCompareCtx) return '<div class="empty-state">データがありません</div>';
    const useEnv = env || envA;
    // PHPソース構造アイテムは専用レンダラーを使用
    if (item && item._sourceType === 'php') {
      var pairItem = genCompareCtx ? genCompareCtx.pairItem : (formCompareCtx ? formCompareCtx.pairItem : null);
      return renderPhpSourceDetail(item, pairItem || null);
    }
    let html = '';
    switch (category) {
      case 'db': html = renderDbDetail(item, dbCompareCtx, useEnv); break;
      case 'select': html = renderSelectDetail(item, useEnv, genCompareCtx); break;
      case 'trigger': html = renderTriggerDetail(item, useEnv, genCompareCtx); break;
      case 'constraint': html = renderConstraintDetail(item, useEnv); break;
      case 'form': html = renderFormDetail(item, useEnv, formCompareCtx); break;
      case 'myarea': html = renderMyAreaDetail(item, useEnv, genCompareCtx); break;
      case 'table': html = renderTableDetail(item, useEnv, genCompareCtx); break;
      case 'mail': html = renderMailDetail(item, useEnv, genCompareCtx); break;
      case 'program': html = renderProgramDetail(item, useEnv, genCompareCtx); break;
      case 'module': html = renderModuleDetail(item, useEnv, genCompareCtx); break;
      case 'custompage': html = renderCustomPageDetail(item, useEnv, genCompareCtx); break;
      default: html = renderGenericDetail(item, useEnv);
    }
    return html;
  }
  
  /** info-grid の dt/dd ペアを生成（ラベル自動変換付き）。isDiff=true で差分ハイライト */
  function gridRow(key, val, fieldLabelMap, isDiff) {
    var diffStyle = isDiff ? ' style="background:var(--diff-change);border-left:3px solid var(--warning)"' : '';
    var diffIcon  = isDiff ? '<span style="color:var(--danger);margin-right:3px;font-size:10px">&#11044;</span>' : '';
    return '<dt' + diffStyle + '>' + diffIcon + esc(fieldLabel(key)) + '</dt>'
         + '<dd' + diffStyle + '>' + formatLabeledValue(key, val, fieldLabelMap) + '</dd>';
  }

  /** 指定キー群から info-grid カードを生成。fieldLabelMap 省略時は item から db / fieldList を推定
   *  diffKeySet: Set<string> — このキーを含む行を差分ハイライト */
  function infoCard(title, item, keys, tag, fieldLabelMap, resolveEnv, diffKeySet) {
    const map = fieldLabelMap !== undefined ? fieldLabelMap : resolveFieldLabelMapForItem(item, resolveEnv);
    var diffCount = 0;
    if (diffKeySet) keys.forEach(function(k) { if (item[k] !== undefined && diffKeySet.has(k)) diffCount++; });
    var diffBadge = diffCount > 0 ? '<span class="tag-diff" style="margin-left:8px">' + diffCount + '件差異</span>' : '';
    let html = '<div class="card"><div class="card-header"><h3>' + esc(title) + '</h3>'
             + (tag ? '<span class="tag">' + esc(String(tag)) + '</span>' : '')
             + diffBadge
             + '</div><div class="card-body"><dl class="info-grid">';
    for (const k of keys) {
      if (item[k] !== undefined) html += gridRow(k, item[k], map, diffKeySet ? diffKeySet.has(k) : false);
    }
    html += '</dl></div></div>';
    return html;
  }
  
  const DB_FIELD_TYPES_WITH_OPTIONS = new Set(['mm_alternative', 'mm_multiple', 'mm_multiple128', 'mm_bool']);
  
  function dbFieldHasSelectOptions(f) {
    return !!(f && DB_FIELD_TYPES_WITH_OPTIONS.has(f.type));
  }
  
  function normSelectOptId(v) {
    if (v === null || v === undefined) return '';
    return String(v);
  }
  
  function normSelectOptKw(v) {
    if (v === null || v === undefined) return '';
    return String(v);
  }
  
  function computeSelectOptionDiffRowIndices(fSelf, fOther) {
    const miss = new Set();
    if (!fSelf || !dbFieldHasSelectOptions(fSelf)) return miss;
    const idsS = fSelf.label?.idAry || [];
    const kwsS = fSelf.label?.keywordAry || [];
    const nSelf = Math.max(idsS.length, kwsS.length);
    if (!fOther || !dbFieldHasSelectOptions(fOther)) {
      for (let j = 0; j < nSelf; j++) miss.add(j);
      return miss;
    }
    const idsO = fOther.label?.idAry || [];
    const kwsO = fOther.label?.keywordAry || [];
    const n = Math.max(nSelf, idsO.length, kwsO.length);
    for (let j = 0; j < n; j++) {
      const sId = j < idsS.length ? idsS[j] : undefined;
      const oId = j < idsO.length ? idsO[j] : undefined;
      const sKw = j < kwsS.length ? kwsS[j] : undefined;
      const oKw = j < kwsO.length ? kwsO[j] : undefined;
      if (normSelectOptId(sId) !== normSelectOptId(oId) || normSelectOptKw(sKw) !== normSelectOptKw(oKw)) miss.add(j);
    }
    return miss;
  }
  
  /** 差分比較時: 行に「差分あり」チップは付けず、tr.db-field-option-row-diff で背景のみ強調 */
  function buildDbFieldOptionsPanelHtml(f, highlightRowIndices) {
    const label = f.label;
    const ids = label && Array.isArray(label.idAry) ? label.idAry : [];
    const kws = label && Array.isArray(label.keywordAry) ? label.keywordAry : [];
    const n = Math.max(ids.length, kws.length);
    const hl = highlightRowIndices && typeof highlightRowIndices.has === 'function' ? highlightRowIndices : null;
    if (n === 0) {
      return '<div class="db-field-options-empty">このフィールド種別では選択肢（idAry / keywordAry）が設定ファイルに含まれていません</div>';
    }
    let inner = '<div class="db-field-options-wrap"><div class="db-field-options-head">選択肢一覧（展開）';
    inner += ` <span class="tag">${n}件</span></div><table class="data-table db-field-options-subtable"><thead><tr><th>選択肢ID</th><th>表示ラベル</th></tr></thead><tbody>`;
    for (let j = 0; j < n; j++) {
      const idVal = j < ids.length ? ids[j] : '';
      const kwVal = j < kws.length ? kws[j] : '';
      const trAttr = hl && hl.has(j) ? ' class="db-field-option-row-diff"' : '';
      inner += `<tr${trAttr}><td class="mono">${esc(idVal)}</td><td>${esc(kwVal)}</td></tr>`;
    }
    inner += '</tbody></table></div>';
    return inner;
  }
  
  /** DBフィールド一覧：セレクト系行の折りたたみ（インライン onclick 用） */
  function toggleDbFieldRow(tr) {
    if (!tr || !tr.classList.contains('db-field-expandable')) return;
    const detail = tr.nextElementSibling;
    if (!detail || !detail.classList.contains('db-field-detail-row')) return;
    const open = detail.style.display !== 'none';
    detail.style.display = open ? 'none' : '';
    tr.classList.toggle('is-expanded', !open);
  }
  
  /** 差分比較の左右パネル：同一差替えキーワードの行をまとめて開閉 */
  function toggleDbFieldRowSynced(tr) {
    if (!tr || !tr.classList.contains('db-field-expandable')) return;
    toggleSyncedFieldRow(tr, 'data-db-field-key', 'tr.db-field-main-row.db-field-expandable[data-db-field-key]');
  }
  
  /**
   * DB差分フォーカスビュー：差分ありフィールドを左右に並べてSVG対応線で結ぶ
   * 左列=環境A順、右列=環境B順
   */
  function renderDbDiffFocusView(itemA, itemB, listGroups) {
    var fieldsA = itemA && itemA.fieldList ? itemA.fieldList : [];
    var fieldsB = itemB && itemB.fieldList ? itemB.fieldList : [];

    // 差分・only-A・only-Bのキーを収集
    var diffKeys = new Set();
    var onlyAKeys = new Set();
    var onlyBKeys = new Set();

    // A側を走査
    for (var i = 0; i < fieldsA.length; i++) {
      var f = fieldsA[i];
      var tk = getFieldListReplaceKeywordKey(f);
      if (!tk) continue;
      var fB = fieldsB.find(function(x) { return getFieldListReplaceKeywordKey(x) === tk; });
      if (!fB) { onlyAKeys.add(tk); continue; }
      if (dbFieldCompareRowHasDiff(tk, listGroups, f, fB)) diffKeys.add(tk);
    }
    // B側のonly-Bを収集
    for (var j = 0; j < fieldsB.length; j++) {
      var fb = fieldsB[j];
      var tbk = getFieldListReplaceKeywordKey(fb);
      if (!tbk) continue;
      var fA2 = fieldsA.find(function(x) { return getFieldListReplaceKeywordKey(x) === tbk; });
      if (!fA2) onlyBKeys.add(tbk);
    }

    // 行を生成するヘルパー（メイン行＋詳細行セット）
    function buildFocusFieldRow(f, rowCls, dataKeyAttr, badge, fldMap, colspanCount) {
      var tk = getFieldListReplaceKeywordKey(f);
      var typeDisp = mmFieldTypeDisplay(f.type || '');
      var hasOptions = dbFieldHasSelectOptions(f);
      // メイン行（クリックで詳細トグル）
      var mainRow = '<tr class="' + rowCls + ' db-field-expandable focus-field-expandable"' + dataKeyAttr + ' onclick="toggleFocusFieldRow(this)" title="クリックで詳細を表示" style="cursor:pointer">';
      mainRow += '<td class="db-field-gutter"><span class="db-field-chevron" aria-hidden="true">&#9660;</span></td>';
      mainRow += '<td class="mono" style="font-size:11px">' + esc(tk || '') + '</td>';
      mainRow += '<td>' + esc(f.name || '') + '</td>';
      mainRow += '<td><span class="field-type">' + esc(typeDisp) + '</span></td>';
      mainRow += '<td>' + badge + '</td>';
      mainRow += '</tr>';

      // 詳細行
      var detailInner = '';
      if (hasOptions) {
        detailInner += buildDbFieldOptionsPanelHtml(f, null);
      }
      detailInner += '<div class="db-field-full-settings" style="' + (hasOptions ? 'margin-top:16px;padding-top:16px;border-top:1px dashed var(--border)' : '') + '">';
      detailInner += '<h4>設定値の詳細</h4><ul class="detail-bullet-list">';
      var sortedKeys = Object.keys(f).sort();
      var skipKeys = { 'id': 1, 'name': 1, 'title': 1, 'type': 1, 'application': 1, '_interface_field_id': 1,
                       'not_null_flg': 1, 'unique_flg': 1, 'index_flg': 1, 'primary_key_flg': 1, 'is_encrypted': 1 };
      for (var si = 0; si < sortedKeys.length; si++) {
        var key = sortedKeys[si];
        if (key === 'label' && hasOptions) continue;
        if (skipKeys[key]) continue;
        var val = f[key];
        if (val === null || val === undefined || val === '') continue;
        var lbl = fieldLabel(key);
        var dispVal = formatLabeledValue(key, val, fldMap);
        var keyName = lbl !== key ? ' <small style="color:#999;font-weight:normal">(' + key + ')</small>' : '';
        detailInner += '<li style="margin-bottom:4px"><strong>' + esc(lbl) + keyName + ':</strong> ' + dispVal + '</li>';
      }
      detailInner += '</ul></div>';
      var detailRow = '<tr class="db-field-detail-row focus-field-detail-row" style="display:none"><td colspan="' + colspanCount + '" class="db-field-detail-cell">' + detailInner + '</td></tr>';

      return mainRow + detailRow;
    }

    // A列・B列の行を生成（メイン行＋詳細行）
    function buildRows(fields, diffK, onlyAK, onlyBK, side, fldMap) {
      var rows = '';
      var colspanCount = 5; // gutter + キーワード + 名前 + 型 + バッジ
      for (var fi = 0; fi < fields.length; fi++) {
        var f = fields[fi];
        var tk = getFieldListReplaceKeywordKey(f);
        if (!tk) continue;
        var isDiff = diffK.has(tk);
        var isOnlyA = side === 'a' && onlyAK.has(tk);
        var isOnlyB = side === 'b' && onlyBK.has(tk);
        var rowCls = isDiff ? 'focus-row-diff' : (isOnlyA ? 'focus-row-only-a' : (isOnlyB ? 'focus-row-only-b' : 'focus-row-same'));
        var dataKeyAttr = isDiff || (!isOnlyA && !isOnlyB) ? ' data-focus-key="' + escAttr(tk) + '"' : '';
        var badge = isDiff ? '<span class="diff-status-chip changed" style="font-size:10px">差分</span>'
                  : (isOnlyA ? '<span class="diff-status-chip only-a" style="font-size:10px">Aのみ</span>'
                  : (isOnlyB ? '<span class="diff-status-chip only-b" style="font-size:10px">Bのみ</span>' : ''));
        rows += buildFocusFieldRow(f, rowCls, dataKeyAttr, badge, fldMap, colspanCount);
      }
      // only-B はB列のみ追加
      if (side === 'b') {
        for (var bk of onlyBK) {
          var fb2 = fields.find(function(x) { return getFieldListReplaceKeywordKey(x) === bk; });
          if (!fb2) continue;
          var badge2 = '<span class="diff-status-chip only-b" style="font-size:10px">Bのみ</span>';
          rows += buildFocusFieldRow(fb2, 'focus-row-only-b', '', badge2, fldMap, colspanCount);
        }
      }
      // only-A はA列のみ追加（ループで既に処理済みなので重複しない）
      return rows;
    }

    var fldMapA = resolveFieldLabelMapForItem(itemA, envA);
    var fldMapB = resolveFieldLabelMapForItem(itemB, envB);
    var rowsA = buildRows(fieldsA, diffKeys, onlyAKeys, onlyBKeys, 'a', fldMapA);
    var rowsB = buildRows(fieldsB, diffKeys, onlyAKeys, onlyBKeys, 'b', fldMapB);

    var totalDiff = diffKeys.size + onlyAKeys.size + onlyBKeys.size;
    if (totalDiff === 0) {
      return '<div class="db-diff-focus-empty">差分のあるフィールドはありません（全フィールド一致）</div>';
    }

    var thead = '<thead><tr><th class="db-field-col-gutter"></th><th>差替えキーワード</th><th>フィールド名</th><th>型</th><th></th></tr></thead>';
    var html = '<div class="db-diff-focus-host" id="dbDiffFocusHost">';
    html += '<svg class="db-diff-focus-svg" id="dbDiffFocusSvg" aria-hidden="true"></svg>';
    html += '<div class="db-diff-focus-col db-diff-focus-col-a">';
    html += '<div class="db-diff-focus-col-head env-a">環境A（A順）</div>';
    html += '<table class="db-diff-focus-table">' + thead + '<tbody>' + rowsA + '</tbody></table>';
    html += '</div>';
    html += '<div class="db-diff-focus-svg-wrap"></div>';
    html += '<div class="db-diff-focus-col db-diff-focus-col-b">';
    html += '<div class="db-diff-focus-col-head env-b">環境B（B順）</div>';
    html += '<table class="db-diff-focus-table">' + thead + '<tbody>' + rowsB + '</tbody></table>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderDbDetail(item, dbCompareCtx, env) {
    var pairForDiff = dbCompareCtx ? dbCompareCtx.pairItem : null;
    var basicInfoKeys = ['id', 'title', 'name', 'type', 'record_limit', 'comment'];
    var basicDiffKeys = null;
    if (pairForDiff) {
      basicDiffKeys = new Set();
      basicInfoKeys.forEach(function(k) {
        var va = item[k] !== undefined ? item[k] : null;
        var vb = pairForDiff[k] !== undefined ? pairForDiff[k] : null;
        if (JSON.stringify(va) !== JSON.stringify(vb)) basicDiffKeys.add(k);
      });
    }
    let html = infoCard('基本情報', item, basicInfoKeys, item.type, undefined, env, basicDiffKeys);
    if (item.fieldList && item.fieldList.length > 0) {
      const listGroups = dbCompareCtx && dbCompareCtx.listGroups != null ? dbCompareCtx.listGroups : null;
      const pairItem = dbCompareCtx && dbCompareCtx.pairItem != null ? dbCompareCtx.pairItem : null;
      const isPairCompare = listGroups != null && pairItem != null;
      const tblClass = isPairCompare ? 'data-table db-field-expand-table db-field-compare-side-table' : 'data-table db-field-expand-table';

      // 差分件数バッジ（比較モード時）
      var dbDiffCount = 0;
      if (isPairCompare) {
        for (var dbtk of getDbFieldListTitleKeysUnion(item, pairItem)) {
          var dbfA = item.fieldList.find(function(f) { return getFieldListReplaceKeywordKey(f) === dbtk; });
          var dbfB = pairItem.fieldList ? pairItem.fieldList.find(function(f) { return getFieldListReplaceKeywordKey(f) === dbtk; }) : null;
          if (dbFieldCompareRowHasDiff(dbtk, listGroups, dbfA, dbfB)) dbDiffCount++;
        }
      }
      var dbDiffBadge = dbDiffCount > 0 ? '<span class="tag-diff">' + dbDiffCount + '件差異</span>' : '';
      var dbTableId = 'dbFieldTable_' + Math.random().toString(36).slice(2, 7);
      var dbFilterBar = (isPairCompare && dbDiffCount > 0)
        ? '<div class="diff-only-filter-bar"><label><input type="checkbox" onchange="toggleDiffOnlyFilter(this, \'' + dbTableId + '\')"> 差分のみ表示 <span class="filter-count">(' + dbDiffCount + '件)</span></label></div>'
        : '';

      html += '<div class="card"><div class="card-header"><h3>フィールド一覧</h3><span class="tag">' + item.fieldList.length + '件</span>' + dbDiffBadge + '</div>' + dbFilterBar + '<div class="card-body no-pad" style="overflow-x:auto">';
      const thead = isPairCompare
        ? `<thead><tr><th class="db-field-col-diff-status" title="相手環境の同一フィールド（差替えキーワード）との差異">差分</th><th class="db-field-col-gutter" title="クリックで詳細を展開（左右同期）"></th><th>#</th><th>差替えキーワード</th><th>フィールド名</th><th>フィールドタイプ</th><th>属性</th></tr></thead>`
        : `<thead><tr><th class="db-field-col-gutter" title="クリックで詳細を展開"></th><th>#</th><th>差替えキーワード</th><th>フィールド名</th><th>フィールドタイプ</th><th>属性</th><th>コメント</th></tr></thead>`;

      html += '<table id="' + dbTableId + '" class="' + tblClass + '">' + thead + '<tbody>';
      for (let i = 0; i < item.fieldList.length; i++) {
        const f = item.fieldList[i];
        let flags = '';
        if (f.not_null_flg) flags += '<span class="flag flag-nn">入力必須</span>';
        if (f.unique_flg) flags += '<span class="flag flag-uq">重複不可</span>';
        if (f.index_flg) flags += '<span class="flag flag-idx">インデックス</span>';
        if (f.primary_key_flg) flags += '<span class="flag flag-pk">主キー</span>';
        if (f.is_encrypted) flags += '<span class="flag flag-enc">暗号化</span>';

        const hasOptions = dbFieldHasSelectOptions(f);

        const zebra = i % 2 === 0 ? 'db-field-zebra-a' : 'db-field-zebra-b';
        const titleKey = getFieldListReplaceKeywordKey(f);
        const fOther = isPairCompare && titleKey ? resolveFieldListEntry(pairItem, titleKey) : null;
        const optionDiff = hasOptions && isPairCompare ? computeSelectOptionDiffRowIndices(f, fOther) : null;
        const rowHasDiff =
          isPairCompare && titleKey ? dbFieldCompareRowHasDiff(titleKey, listGroups, f, fOther) : false;
        const diffCell = isPairCompare ? `<td class="db-field-diff-chip-cell">${rowHasDiff ? '<span class="diff-status-chip changed">差分あり</span>' : ''}</td>` : '';
        const chevronCell = `<td class="db-field-gutter" title="クリックで詳細を表示"><span class="db-field-chevron" aria-hidden="true">&#9660;</span></td>`;

        const mainParts = ['db-field-main-row', zebra];
        if (isPairCompare && rowHasDiff) mainParts.push('db-field-row-has-diff');
        const useSyncExpand = isPairCompare && titleKey;
        const rowCls = `${mainParts.join(' ')} db-field-expandable`;
        const rowClick = useSyncExpand ? ` onclick="toggleDbFieldRowSynced(this)"` : ` onclick="toggleDbFieldRow(this)"`;
        const rowTitle = useSyncExpand ? ' title="クリックで詳細を表示（環境A・B同時に開閉）"' : ' title="クリックで詳細を表示/非表示"';
        const dataKeyAttr = useSyncExpand ? ` data-db-field-key="${escAttr(titleKey)}"` : '';
        const colspan = isPairCompare ? 7 : 8;

        // セル単位の差分マーカー（赤い ＊ を値の前に付ける）
        // rowHasDiff が true の行のみ比較。差分なし行は fOther があってもマーカーを出さない。
        // _jstr: null と undefined を同一視（JSON には undefined がなくキー欠落として現れるため）
        const _cmp = isPairCompare && fOther && rowHasDiff;
        const _jstr = v => JSON.stringify(v != null ? v : null);
        const _M = '<span style="color:var(--danger);font-weight:bold;margin-right:2px">＊</span>';
        const _db_titleDiffers = _cmp && _jstr(f.title) !== _jstr(fOther.title);
        const _db_nameDiffers  = _cmp && _jstr(f.name)  !== _jstr(fOther.name);
        const _db_typeDiffers  = _cmp && _jstr(f.type)  !== _jstr(fOther.type);
        const _flagProps = ['not_null_flg', 'unique_flg', 'index_flg', 'primary_key_flg', 'is_encrypted'];
        const _flagsDiffer = _cmp && _flagProps.some(function(p) { return _jstr(f[p]) !== _jstr(fOther[p]); });
        // どの列でも拾えなかった差分をフォールバックとして差替えキーワード列に表示
        // （label, comment, initial_value 等の詳細設定が異なる場合）
        const _dbAnyFired = _db_titleDiffers || _db_nameDiffers || _db_typeDiffers || _flagsDiffer;
        const _db_titleFinal = _db_titleDiffers || (rowHasDiff && _cmp && !_dbAnyFired);
        const td_title = `<td class="mono">${_db_titleFinal ? _M : ''}${esc(f.title)}</td>`;
        const td_name  = `<td>${_db_nameDiffers  ? _M : ''}${esc(f.name)}</td>`;
        const td_type  = `<td>${_db_typeDiffers  ? _M : ''}<span class="field-type">${esc(mmFieldTypeDisplay(f.type))}</span></td>`;
        const tailCells = isPairCompare
          ? `<td>${_flagsDiffer ? _M : ''}${flags || '&#8212;'}</td>`
          : `<td>${flags || '&#8212;'}</td><td>${esc(f.comment || '')}</td>`;

        html += `<tr class="${rowCls}"${dataKeyAttr}${rowClick}${rowTitle}>${diffCell}${chevronCell}<td>${i + 1}</td>${td_title}${td_name}${td_type}${tailCells}</tr>`;

        const detCls = `db-field-detail-row ${zebra}${isPairCompare && rowHasDiff ? ' db-field-row-has-diff' : ''}`;

          let detailInner = '';
          // 選択肢がある場合は先にテーブル表示
          if (hasOptions) {
            detailInner += buildDbFieldOptionsPanelHtml(f, rowHasDiff ? optionDiff : null);
          }

          // 全フィールド共通：設定値の箇条書き詳細
          detailInner += `<div class="db-field-full-settings" style="${hasOptions ? 'margin-top:16px;padding-top:16px;border-top:1px dashed var(--border)' : ''}">`;
          detailInner += `<h4>設定値の詳細</h4><ul class="detail-bullet-list">`;

          const fldMap = resolveFieldLabelMapForItem(item, env);
          const sortedKeys = Object.keys(f).sort();
          const skipKeys = new Set([
            'id', 'name', 'title', 'type', 'application', '_interface_field_id',
            'not_null_flg', 'unique_flg', 'index_flg', 'primary_key_flg', 'is_encrypted'
          ]);

          for (const key of sortedKeys) {
            if (key === 'label' && hasOptions) continue; // label(選択肢)は既にテーブル表示済みならスキップ
            if (skipKeys.has(key)) continue; // 表に既にある項目はスキップ

            const val = f[key];
            if (val === null || val === undefined || val === '') continue;
            const label = fieldLabel(key);
            const dispVal = formatLabeledValue(key, val, fldMap);
            const keyName = label !== key ? ` <small style="color:#999;font-weight:normal">(${key})</small>` : '';
            detailInner += `<li style="margin-bottom:4px"><strong>${esc(label)}${keyName}:</strong> ${dispVal}</li>`;
          }
          detailInner += `</ul></div>`;
          html += `<tr class="${detCls}" style="display:none"><td colspan="${colspan}" class="db-field-detail-cell">${detailInner}</td></tr>`;
      }
      html += `</tbody></table></div></div>`;
    }

    if (item.action_list && item.action_list.length > 0) {
      var alGroups = dbCompareCtx && dbCompareCtx.actionGroups ? dbCompareCtx.actionGroups : null;
      var alPair = dbCompareCtx && dbCompareCtx.pairItem ? dbCompareCtx.pairItem : null;
      var alIsPair = alGroups !== null && alPair !== null;
      var pairActionList = alPair && alPair.action_list ? alPair.action_list : [];
      var pairActionMap = {};
      for (var pai = 0; pai < pairActionList.length; pai++) {
        if (pairActionList[pai].actionName) pairActionMap[pairActionList[pai].actionName] = pairActionList[pai];
      }
      var alDiffCount = 0;
      if (alIsPair) {
        for (var ai0 = 0; ai0 < item.action_list.length; ai0++) {
          var an0 = item.action_list[ai0].actionName;
          if (!pairActionMap[an0] || (alGroups[an0] && alGroups[an0].length > 0)) alDiffCount++;
        }
        for (var paN in pairActionMap) {
          if (!item.action_list.find(function(a) { return a.actionName === paN; })) alDiffCount++;
        }
      }
      var alBadge = alDiffCount > 0 ? '<span class="tag-diff">' + alDiffCount + '件差異</span>' : '';
      var alColCount = alIsPair ? 8 : 7;

      html += '<div class="card"><div class="card-header"><h3>アクション一覧</h3><span class="tag">' + item.action_list.length + '件</span>' + alBadge + '</div>';
      html += '<div class="card-body no-pad" style="overflow-x:auto"><table class="data-table db-field-expand-table"><thead><tr>';
      if (alIsPair) html += '<th class="db-field-col-diff-status">差分</th>';
      html += '<th class="db-field-col-gutter"></th><th>#</th><th>アクション名</th><th>処理</th><th>発動条件</th><th>識別キー（TRDB→対象）</th><th>マッピング数</th></tr></thead><tbody>';

      var alCmdLbls = {'insert': '登録', 'update': '更新', 'upsert': '更新登録'};
      for (var ai = 0; ai < item.action_list.length; ai++) {
        var ac = item.action_list[ai];
        var aName = ac.actionName || '';
        var isOnlyA = alIsPair && !pairActionMap[aName];
        var hasDiff = alIsPair && !isOnlyA && alGroups[aName] && alGroups[aName].length > 0;
        var diffCell = alIsPair
          ? '<td class="db-field-diff-chip-cell">' + (isOnlyA ? '<span class="diff-status-chip only-a">Aのみ</span>' : hasDiff ? '<span class="diff-status-chip changed">差分あり</span>' : '') + '</td>'
          : '';
        var rowHasDiff = isOnlyA || hasDiff;
        var zebra = ai % 2 === 0 ? 'db-field-zebra-a' : 'db-field-zebra-b';
        var rowCls = 'db-field-main-row db-field-expandable ' + zebra + (rowHasDiff ? ' db-field-row-has-diff' : '');
        var chevron = '<td class="db-field-gutter" title="クリックで詳細を表示"><span class="db-field-chevron">&#9660;</span></td>';
        var mappingCount = ac.field_mapping ? ac.field_mapping.length : 0;
        var alCmdLbl = alCmdLbls[ac.command] || esc(ac.command || '-');
        var alExecLbl = ac.execCondition === 0 ? '無条件' : ac.execCondition === 1 ? '抽出ルール指定' : (ac.execCondition != null ? esc(String(ac.execCondition)) : '-');
        var alSrchCell = '<td class="mono">' + esc(ac.trdb_search_field || '-') + ' &#8594; ' + esc(ac.tgt_search_field || '-');
        if (ac.trdb_search_field2 || ac.tgt_search_field2) alSrchCell += '<br><span style="color:#999;font-size:10px">認証: ' + esc(ac.trdb_search_field2 || '-') + ' &#8594; ' + esc(ac.tgt_search_field2 || '-') + '</span>';
        alSrchCell += '</td>';
        html += '<tr class="' + rowCls + '" onclick="toggleDbFieldRow(this)">' + diffCell + chevron + '<td>' + (ai + 1) + '</td><td>' + esc(aName) + '</td><td>' + alCmdLbl + '</td><td>' + alExecLbl + '</td>' + alSrchCell + '<td>' + mappingCount + '件</td></tr>';

        // 展開行：アクション設定 + field_mapping テーブル
        var detCls = 'db-field-detail-row ' + zebra + (rowHasDiff ? ' db-field-row-has-diff' : '');
        var detInner = '';
        // アクション設定セクション：対象DB名・抽出ルール名をルックアップ
        var alTgtDbName = '-';
        var alTgtDb = null;
        if (ac.tgt_db_id && env && env.databases) {
          alTgtDb = env.databases.find(function(d) { return String(d.id) === String(ac.tgt_db_id); });
          if (alTgtDb) alTgtDbName = alTgtDb.title || alTgtDb.name || '-';
        }
        var leftFldMap = (item && item.fieldList) ? buildRecordFieldLabelMapFromFieldList(item.fieldList) : {};
        var rightFldMap = (alTgtDb && alTgtDb.fieldList) ? buildRecordFieldLabelMapFromFieldList(alTgtDb.fieldList) : {};
        var alSelectName = null;
        if (ac.select_id && env && env.selects) {
          var alSelRule = env.selects.find(function(s) { return String(s.id) === String(ac.select_id); });
          if (alSelRule) alSelectName = alSelRule.select_name || alSelRule._filename || null;
        }
        var alExecDetail = ac.execCondition === 0
          ? '無条件'
          : ac.execCondition === 1
            ? '抽出ルールにマッチ：<strong>' + esc(alSelectName || ac.select_id || '-') + '</strong>'
            : (ac.execCondition != null ? esc(String(ac.execCondition)) : '-');

        detInner += '<div style="padding:10px 16px 8px;border-bottom:1px solid var(--border)">';
        detInner += '<table class="data-table" style="font-size:12px"><tbody>';
        detInner += '<tr><th style="width:180px">アクション</th><td>' + alCmdLbl + '</td></tr>';
        detInner += '<tr><th>アクション対象DB</th><td class="mono">' + esc(alTgtDbName) + '</td></tr>';
        detInner += '<tr><th>発動条件</th><td>' + alExecDetail + '</td></tr>';
        detInner += '<tr><th>識別キー（TRDB→対象）</th><td class="mono">' + esc(ac.trdb_search_field || '-') + ' &#8594; ' + esc(ac.tgt_search_field || '-') + '</td></tr>';
        if (ac.trdb_search_field2 || ac.tgt_search_field2) {
          detInner += '<tr><th>認証キー（TRDB→対象）</th><td class="mono">' + esc(ac.trdb_search_field2 || '-') + ' &#8594; ' + esc(ac.tgt_search_field2 || '-') + '</td></tr>';
        }
        detInner += '</tbody></table></div>';
        if (ac.field_mapping && ac.field_mapping.length > 0) {
          var pairAc = alIsPair ? pairActionMap[aName] : null;
          var pairMpMap = {};
          if (pairAc && pairAc.field_mapping) {
            for (var pmi = 0; pmi < pairAc.field_mapping.length; pmi++) {
              var pm = pairAc.field_mapping[pmi];
              if (pm.left_field) pairMpMap[pm.left_field + '\x00' + (pm.right_field || '')] = pm;
            }
          }
          var fldWithJa = function(engName, fldMap) {
            var jaName = fldMap && engName ? fldMap[engName] : null;
            if (jaName && jaName !== engName) {
              return esc(jaName) + '<br><small style="color:#888;font-size:11px">(' + esc(engName) + ')</small>';
            }
            return esc(engName || '-');
          };
          detInner += '<table class="data-table" style="font-size:12px"><thead><tr>';
          if (alIsPair) detInner += '<th>差分</th>';
          detInner += '<th>#</th><th>TRDBフィールド</th><th>演算子</th><th>対象フィールド</th><th>null更新許可</th></tr></thead><tbody>';
          for (var mi = 0; mi < ac.field_mapping.length; mi++) {
            var mp = ac.field_mapping[mi];
            var mpKey = mp.left_field + '\x00' + (mp.right_field || '');
            var pairMp = alIsPair ? (pairMpMap[mpKey] || null) : null;
            var mpOnlyA = alIsPair && !pairMp;
            var mpDiff = alIsPair && pairMp && (mp.allowNullUpdate !== pairMp.allowNullUpdate || (mp.operator || '') !== (pairMp.operator || ''));
            var mpDiffCell = alIsPair ? '<td>' + (mpOnlyA ? '<span class="diff-status-chip only-a" style="font-size:10px">Aのみ</span>' : mpDiff ? '<span class="diff-status-chip changed" style="font-size:10px">差分あり</span>' : '') + '</td>' : '';
            var allowNull = mp.allowNullUpdate === 'true' ? '許可' : mp.allowNullUpdate === 'false' ? '不許可' : '-';
            var mpStyle = mpOnlyA ? ' style="background:var(--diff-remove)"' : mpDiff ? ' style="background:var(--diff-change)"' : '';
            var mpOpDisp = mp.operator ? '<strong>' + esc(mp.operator) + '</strong>' : '&#8594;';
            detInner += '<tr' + mpStyle + '>' + mpDiffCell + '<td>' + (mi + 1) + '</td><td class="mono">' + fldWithJa(mp.left_field, leftFldMap) + '</td><td style="text-align:center">' + mpOpDisp + '</td><td class="mono">' + fldWithJa(mp.right_field, rightFldMap) + '</td><td>' + allowNull + '</td></tr>';
          }
          if (alIsPair) {
            for (var pmkey in pairMpMap) {
              var pmkParts = pmkey.split('\x00');
              var pmkLeft = pmkParts[0];
              var pmkRight = pmkParts.length > 1 ? pmkParts[1] : '';
              if (!ac.field_mapping.find(function(m) { return m.left_field === pmkLeft && (m.right_field || '') === pmkRight; })) {
                var pmpItem = pairMpMap[pmkey];
                var pmpOpDisp = pmpItem.operator ? '<strong>' + esc(pmpItem.operator) + '</strong>' : '&#8594;';
                detInner += '<tr style="background:var(--diff-only-b)"><td><span class="diff-status-chip only-b" style="font-size:10px">Bのみ</span></td><td>-</td><td class="mono">' + fldWithJa(pmkLeft, leftFldMap) + '</td><td style="text-align:center">' + pmpOpDisp + '</td><td class="mono">' + fldWithJa(pmkRight, rightFldMap) + '</td><td>' + (pmpItem.allowNullUpdate === 'true' ? '許可' : pmpItem.allowNullUpdate === 'false' ? '不許可' : '-') + '</td></tr>';
              }
            }
          }
          detInner += '</tbody></table>';
        } else {
          detInner += '<div style="color:#999;font-size:12px;padding:8px">マッピングなし</div>';
        }
        html += '<tr class="' + detCls + '" style="display:none"><td colspan="' + alColCount + '" class="db-field-detail-cell">' + detInner + '</td></tr>';
      }

      // 環境Bのみのアクション
      if (alIsPair) {
        for (var paN2 in pairActionMap) {
          if (!item.action_list.find(function(a) { return a.actionName === paN2; })) {
            var pac = pairActionMap[paN2];
            html += '<tr class="db-field-main-row" style="background:var(--diff-only-b)">';
            html += '<td class="db-field-diff-chip-cell"><span class="diff-status-chip only-b">Bのみ</span></td>';
            var pacCmdLbl = alCmdLbls[pac.command] || esc(pac.command || '-');
            var pacExecLbl = pac.execCondition === 0 ? '無条件' : pac.execCondition === 1 ? '抽出ルール指定' : (pac.execCondition != null ? esc(String(pac.execCondition)) : '-');
            var pacSrchCell = '<td class="mono">' + esc(pac.trdb_search_field || '-') + ' &#8594; ' + esc(pac.tgt_search_field || '-');
            if (pac.trdb_search_field2 || pac.tgt_search_field2) pacSrchCell += '<br><span style="color:#999;font-size:10px">認証: ' + esc(pac.trdb_search_field2 || '-') + ' &#8594; ' + esc(pac.tgt_search_field2 || '-') + '</span>';
            pacSrchCell += '</td>';
            html += '<td></td><td>-</td><td>' + esc(paN2) + '</td><td>' + pacCmdLbl + '</td><td>' + pacExecLbl + '</td>' + pacSrchCell + '<td>' + (pac.field_mapping ? pac.field_mapping.length : 0) + '件</td></tr>';
          }
        }
      }

      html += '</tbody></table></div></div>';
    }

    return html;
  }

  function renderSelectDetail(item, env, compareCtx) {
    var pairForSel = compareCtx ? compareCtx.pairItem : null;
    var selKeys = ['id', 'select_name', 'db', 'db_id', 'advanced_flg', 'id_range_flg', 'rec_limit_flg', 'rec_limit', 'exists_mode'];
    var selDiffKeys = null;
    if (pairForSel) {
      selDiffKeys = new Set();
      selKeys.forEach(function(k) {
        if (JSON.stringify(item[k] !== undefined ? item[k] : null) !== JSON.stringify(pairForSel[k] !== undefined ? pairForSel[k] : null)) selDiffKeys.add(k);
      });
    }
    let html = infoCard('抽出ルール', item, selKeys, undefined, undefined, env, selDiffKeys);
    if (item.select_where) {
      const selMap = resolveFieldLabelMapForItem(item, env);
      let sw = JSON.stringify(item.select_where, null, 2);
      if (Object.keys(selMap).length) sw = replaceSpiralFieldReferences(sw, selMap);
      var hasDiff = compareCtx && compareCtx.selectWhereDiffs && compareCtx.selectWhereDiffs.length > 0;
      var diffBadge = hasDiff ? '<span class="tag-diff">差分あり</span>' : '';
      html += '<div class="card"><div class="card-header"><h3>条件式</h3>' + diffBadge + '</div><div class="card-body"><div class="code-block">' + esc(sw) + '</div></div></div>';
    }
    return html;
  }
  
  function renderTriggerDetail(item, env, compareCtx) {
    var pairForTrig = compareCtx ? compareCtx.pairItem : null;
    var trigKeys = ['trigger_id', 'name', 'event', 'type', 'seq_order', 'db_id', 'comment'];
    var trigDiffKeys = null;
    if (pairForTrig) {
      trigDiffKeys = new Set();
      trigKeys.forEach(function(k) {
        if (JSON.stringify(item[k] !== undefined ? item[k] : null) !== JSON.stringify(pairForTrig[k] !== undefined ? pairForTrig[k] : null)) trigDiffKeys.add(k);
      });
    }
    let html = infoCard('トリガー設定', item, trigKeys, undefined, undefined, env, trigDiffKeys);
    if (item.calc_formula_list) {
      const e = env !== undefined && env != null ? env : envA;
      const fieldLabelMap = getTriggerFieldLabelMap(e, item.db_id);
      const db = e && e.databases ? e.databases.find(d => String(d.id) === String(item.db_id) || d.name === item.db_id) : null;
      const fieldList = db && db.fieldList ? db.fieldList : [];
      var fgCtx = compareCtx && compareCtx.formulaGroups ? compareCtx.formulaGroups : {};
      var fgDiffCount = Object.keys(fgCtx).length;
      var fgBadge = fgDiffCount > 0 ? '<span class="tag-diff">' + fgDiffCount + '件差異</span>' : '';
      html += '<div class="card"><div class="card-header"><h3>演算式</h3><span class="tag">' + item.calc_formula_list.length + '件</span>' + fgBadge + '</div><div class="card-body no-pad">';
      html += '<table class="data-table"><thead><tr><th>#</th><th>結果フィールド</th><th>条件</th><th>演算式</th></tr></thead><tbody>';
      for (var fi = 0; fi < item.calc_formula_list.length; fi++) {
        var f = item.calc_formula_list[fi];
        const rowMap = Object.assign({}, fieldLabelMap, buildCalcFormulaRfidMap(f, fieldList));
        const condDisp = replaceTriggerKeywords(f.condition, rowMap);
        const formulaDisp = replaceTriggerKeywords(f.formula, rowMap);
        const resKey = String(f.result_field_id);
        const resLab = rowMap[resKey];
        const resultLabel = resLab != null ? (f.result_field_id + ' (' + resLab + ')') : f.result_field_id;
        var rowHasDiff = fgCtx[String(fi)] && fgCtx[String(fi)].length > 0;
        var rowCls = rowHasDiff ? ' class="db-field-row-has-diff"' : '';
        html += '<tr' + rowCls + '><td>' + esc(String(f._seq_order)) + '</td><td class="mono">' + esc(String(resultLabel)) + '</td><td class="mono">' + esc(condDisp) + '</td><td class="mono">' + esc(formulaDisp) + '</td></tr>';
      }
      html += '</tbody></table></div></div>';
    }
    return html;
  }
  
  function constraintDbHtml(dbId, dbName) {
    if (!dbId && !dbName) return '<span style="color:#999">&#8212;</span>';
    const envs = [envA, envB].filter(Boolean);
    for (const e of envs) {
      if (!e || !e.databases) continue;
      const db = e.databases.find(d => (dbId && String(d.id) === String(dbId)) || (dbName && d.name === dbName));
      if (db) {
        const japanese = db.name || '';
        const english = db.title || '';
        if (japanese && english && japanese !== english) {
          return esc(japanese) + ' <span style="color:#999;font-size:11px">（' + esc(english) + '）</span>';
        }
        return esc(japanese || english || dbName);
      }
    }
    return esc(dbName || '');
  }

  function constraintFieldHtml(dbId, dbName, fieldKey) {
    if (!fieldKey) return '<span style="color:#999">&#8212;</span>';
    const envs = [envA, envB].filter(Boolean);
    for (const e of envs) {
      if (!e || !e.databases) continue;
      const db = e.databases.find(d => (dbId && String(d.id) === String(dbId)) || (dbName && d.name === dbName));
      if (!db || !db.fieldList) continue;
      const field = db.fieldList.find(f => f.title === fieldKey || String(f.id) === String(fieldKey));
      if (field) {
        const japanese = field.name || '';
        const english = field.title || fieldKey;
        if (japanese && english && japanese !== english) {
          return esc(japanese) + ' <span style="color:#999;font-size:11px">（' + esc(english) + '）</span>';
        }
        return esc(japanese || english);
      }
    }
    return esc(fieldKey);
  }

  function renderConstraintDetail(item, env) {
    const useEnv = env || envA;
    const map = resolveFieldLabelMapForItem(item, useEnv);
    let html = '<div class="card"><div class="card-header"><h3>DB連携</h3></div><div class="card-body"><dl class="info-grid">';
    if (item.id !== undefined) html += gridRow('id', item.id, map);
    html += `<dt>${esc(fieldLabel('left_db'))}</dt><dd>${constraintDbHtml(item.left_db_id, item.left_db)}</dd>`;
    if (item.left_field !== undefined) html += `<dt>${esc(fieldLabel('left_field'))}</dt><dd>${constraintFieldHtml(item.left_db_id, item.left_db, item.left_field)}</dd>`;
    html += `<dt>${esc(fieldLabel('right_db'))}</dt><dd>${constraintDbHtml(item.right_db_id, item.right_db)}</dd>`;
    if (item.right_field !== undefined) html += `<dt>${esc(fieldLabel('right_field'))}</dt><dd>${constraintFieldHtml(item.right_db_id, item.right_db, item.right_field)}</dd>`;
    if (item.strength !== undefined) html += gridRow('strength', item.strength, map);
    if (item.mstOnInsertCascade !== undefined) html += gridRow('mstOnInsertCascade', item.mstOnInsertCascade, map);
    if (item.mstOnDeleteCascade !== undefined) html += gridRow('mstOnDeleteCascade', item.mstOnDeleteCascade, map);
    if (item.comment !== undefined) html += gridRow('comment', item.comment, map);
    html += '</dl></div></div>';
    return html;
  }
  
  function renderFormDetail(item, env, formCompareCtx) {
    const formFldMap = resolveFieldLabelMapForItem(item, env);
    var pairItemForDiff = formCompareCtx ? formCompareCtx.pairItem : null;
    var formBasicKeys = ['id', 'name', 'title', 'db', 'db_id', 'version', 'type', 'secure_level', 'csrf_protection',
        'confirm_flg', 'valchk_flg', 'multi_thanks', 'next_page', 'last_update_fld',
        'allow_http_flg', 'allow_xss_flg', 'allow_click_jacking_flg', 'allow_ip_flg',
        'allow_security_content_flg', 'allow_post_only_flg', 'restrict_dynamic_keywords',
        'mass_assignment_block', 'area_close_flg', 'remote_limit_on', 'remote_limit',
        'post_control_term', 'over_limit_url', 'open_date_on', 'expire_date_on',
        'expire_date', 'notice_flg', 'limit_notice_flg', 'closed_page_type'];
    var formBasicDiffKeys = null;
    if (pairItemForDiff) {
      formBasicDiffKeys = new Set();
      formBasicKeys.forEach(function(k) {
        var va = (item || {})[k] !== undefined ? (item || {})[k] : null;
        var vb = pairItemForDiff[k] !== undefined ? pairItemForDiff[k] : null;
        if (JSON.stringify(va) !== JSON.stringify(vb)) formBasicDiffKeys.add(k);
      });
    }
    let html = infoCard('フォーム基本設定', item || {}, formBasicKeys, undefined, undefined, env, formBasicDiffKeys);
    const fc = item?.flow_conf;
    const fields = fc?.fields || [];
    
    // 比較モード時の統合リスト処理
    const unifiedFieldIds = formCompareCtx?.unifiedFieldIds;
    const loopCount = unifiedFieldIds ? unifiedFieldIds.length : fields.length;

    if (loopCount > 0) {
      // 差分件数を集計：deepDiff の結果（flowGroups）を直接使用してインライン比較の誤検知を排除
      var formDiffFieldIds = new Set();
      var formOnlyFieldIds = new Set();
      if (formCompareCtx && formCompareCtx.flowGroups !== undefined) {
        var fg = formCompareCtx.flowGroups;
        for (var fgk in fg) {
          var fgDiffs = fg[fgk];
          var isWholeField = false;
          for (var fdi = 0; fdi < fgDiffs.length; fdi++) {
            var fdd = fgDiffs[fdi];
            if (/flow_conf\.fields\[field:[^\]]+\]$/.test(fdd.path) && (fdd.a === undefined || fdd.b === undefined)) {
              isWholeField = true; break;
            }
          }
          if (isWholeField) {
            var existsHere = false;
            for (var efi = 0; efi < fields.length; efi++) {
              if (fields[efi] && String(fields[efi].field) === fgk) { existsHere = true; break; }
            }
            if (existsHere) formOnlyFieldIds.add(fgk);
          } else {
            formDiffFieldIds.add(fgk);
          }
        }
        var pairFields = formCompareCtx.pairItem ? (formCompareCtx.pairItem.flow_conf && formCompareCtx.pairItem.flow_conf.fields ? formCompareCtx.pairItem.flow_conf.fields : []) : [];
        var pairFieldSet = new Set();
        for (var pf of pairFields) { if (pf && pf.field != null) pairFieldSet.add(String(pf.field)); }
        for (var fi = 0; fi < fields.length; fi++) {
          var ff = fields[fi];
          if (!ff || ff.field == null) continue;
          if (!pairFieldSet.has(String(ff.field))) formOnlyFieldIds.add(String(ff.field));
        }
      }
      var formDiffCount = formDiffFieldIds.size + formOnlyFieldIds.size;
      var diffBadge = formDiffCount > 0 ? '<span class="tag-diff">' + formDiffCount + '件差異</span>' : '';
      var tableId = 'formFieldTable_' + Math.random().toString(36).slice(2, 7);
      var filterBarHtml = formDiffCount > 0
        ? '<div class="diff-only-filter-bar"><label><input type="checkbox" onchange="toggleDiffOnlyFilter(this, \'' + tableId + '\')"> 差分のみ表示 <span class="filter-count">(' + formDiffCount + '件)</span></label></div>'
        : '';
      html += '<div class="card"><div class="card-header"><h3>フィールド設定</h3><span class="tag">' + fields.length + '件</span>' + diffBadge + '</div>' + filterBarHtml + '<div class="card-body no-pad" style="overflow-x:auto">';
      html += '<table id="' + tableId + '" class="data-table db-field-expand-table"><thead><tr><th class="db-field-col-gutter"></th><th>#</th><th>フィールド名</th><th>フィールドタイプ</th><th>入力設定</th><th>必須</th><th>入力チェック</th><th>制限等</th><th>エラーメッセージ</th></tr></thead><tbody>';
      
      for (let i = 0; i < loopCount; i++) {
        let f = null;
        if (unifiedFieldIds) {
          const fid = unifiedFieldIds[i];
          f = fields.find(field => String(field.field) === fid);
        } else {
          f = fields[i];
        }

        const zebra = i % 2 === 0 ? 'db-field-zebra-a' : 'db-field-zebra-b';

        if (!f) {
          // この環境には存在しないフィールド（比較用プレースホルダー）
          // 相手側のfidを特定
          var missingFid = unifiedFieldIds ? unifiedFieldIds[i] : '';
          var missingOnlyB = missingFid && !fields.find(function(fx) { return fx && String(fx.field) === missingFid; });
          var missingCls = 'db-field-main-row ' + zebra + ' item-missing form-field-row-only' + (missingOnlyB ? '-b' : '');
          html += '<tr class="' + missingCls + '" data-form-field-key="' + escAttr(missingFid) + '">';
          html += '<td class="db-field-gutter"></td><td>-</td><td colspan="7" style="color:var(--text-light);font-style:italic">（この環境には設定がありません）</td></tr>';
          continue;
        }

        var fieldId = f.field != null ? String(f.field) : '';
        var hasDiffRow = formDiffFieldIds.has(fieldId);
        var isOnlyRow = formOnlyFieldIds.has(fieldId) && !hasDiffRow;
        var diffRowCls = hasDiffRow ? ' form-field-row-has-diff' : (isOnlyRow ? ' form-field-row-only' : '');
        var dataFieldAttr = fieldId ? ' data-form-field-key="' + escAttr(fieldId) + '"' : '';

        let limitInfo = '&#8212;';
        if (f.byte_chk === 't' && (f.min != null || f.max != null)) {
          limitInfo = `${esc(String(f.min || '&#8212;'))}～${esc(String(f.max || '&#8212;'))}バイト`;
        } else if (f.char_limit != null && f.char_limit !== '0') {
          limitInfo = valueLabel('char_limit', f.char_limit) || esc(String(f.char_limit));
        } else if (f.starts_with_chk === 't' && f.starts_with) {
          limitInfo = '開始: ' + esc(truncate(replaceSpiralFieldReferences(String(f.starts_with), formFldMap), 12));
        } else if (f.permit || f.prohibit) {
          limitInfo = [f.permit ? '許可:' + truncate(replaceSpiralFieldReferences(String(f.permit), formFldMap), 10) : '', f.prohibit ? '禁止:' + truncate(replaceSpiralFieldReferences(String(f.prohibit), formFldMap), 10) : ''].filter(Boolean).join(' ');
        }
        const msgDisp = f.msg != null && f.msg !== '' ? esc(truncate(replaceSpiralFieldReferences(String(f.msg), formFldMap), 30)) : '<span style="color:#999">&#8212;</span>';
        
        var rowCls = 'db-field-main-row ' + zebra + ' db-field-expandable' + diffRowCls;
        const chevronCell = `<td class="db-field-gutter" title="クリックで詳細設定を表示"><span class="db-field-chevron" aria-hidden="true">&#9660;</span></td>`;

        // セル単位の差分マーカー（フォームフィールド：赤い ＊ を値の前に付ける）
        // hasDiffRow=true の行のみ比較（deepDiff が差分と判定した行のみ）
        var fmPair = (hasDiffRow && formCompareCtx && formCompareCtx.pairItem && formCompareCtx.pairItem.flow_conf && formCompareCtx.pairItem.flow_conf.fields)
          ? formCompareCtx.pairItem.flow_conf.fields.find(function(pf) { return pf && String(pf.field) === fieldId; })
          : null;
        // _fmJstr: null と undefined を同一視してから JSON.stringify で比較
        var _fmJstr = function(v) { return JSON.stringify(v != null ? v : null); };
        var _fmC = function(keys) { return fmPair ? keys.some(function(k) { return _fmJstr(f[k]) !== _fmJstr(fmPair[k]); }) : false; };
        var _FM = '<span style="color:var(--danger);font-weight:bold;margin-right:2px">＊</span>';
        // フィールド名は「表示値」で比較（form_title || field_name || title の組み合わせが異なる環境でも見た目が同じなら差分なし）
        var _fmNameSelf = f.form_title || f.field_name || f.title || '';
        var _fmNamePair = fmPair ? (fmPair.form_title || fmPair.field_name || fmPair.title || '') : _fmNameSelf;
        var _fmNameDiffers = fmPair && _fmNameSelf !== _fmNamePair;

        var _col_name   = _fmNameDiffers;
        var _col_type   = _fmC(['field_type']);
        var _col_param  = _fmC(['param_type','hide_param_type','support_input','static_value']);
        var _col_null   = _fmC(['not_null']);
        var _col_valchk = _fmC(['valchk']);
        var _col_limit  = _fmC(['byte_chk','min','max','char_limit','starts_with_chk','starts_with','permit','prohibit']);
        var _col_msg    = _fmC(['msg','cnf_err_msg']);
        // どの列でも拾えなかった差分をフォールバックとしてフィールド名列に表示
        // （add, size, ext, unique, input_type 等の詳細設定が異なる場合）
        var _colAnyFired = _col_name || _col_type || _col_param || _col_null || _col_valchk || _col_limit || _col_msg;
        var _col_name_final = _col_name || (hasDiffRow && fmPair && !_colAnyFired);

        html += '<tr class="' + rowCls + '"' + dataFieldAttr + ' onclick="toggleDbFieldRow(this)" title="クリックで全設定値を表示">';
        html += chevronCell
          + '<td>' + esc(f.order) + '</td>'
          + '<td class="mono">' + (_col_name_final ? _FM : '') + esc(_fmNameSelf) + '</td>'
          + '<td>' + (_col_type   ? _FM : '') + '<span class="field-type">' + esc(mmFieldTypeDisplay(f.field_type)) + '</span></td>'
          + '<td>' + (_col_param  ? _FM : '') + formatParamTypeWithSpecial(f, formFldMap) + '</td>'
          + '<td>' + (_col_null   ? _FM : '') + formatLabeledValue('not_null', f.not_null, formFldMap) + '</td>'
          + '<td>' + (_col_valchk ? _FM : '') + formatLabeledValue('valchk', f.valchk, formFldMap) + '</td>'
          + '<td>' + (_col_limit  ? _FM : '') + limitInfo + '</td>'
          + '<td>' + (_col_msg    ? _FM : '') + msgDisp + '</td>'
          + '</tr>';
        
        // 詳細箇条書き行
        html += '<tr class="db-field-detail-row ' + zebra + diffRowCls + '" style="display:none"' + dataFieldAttr + '><td colspan="9" class="db-field-detail-cell">';
        html += `<div class="form-field-full-settings"><h4>設定値の詳細</h4><ul class="detail-bullet-list">`;
        const typeKeys = (typeof FORM_FIELD_KEYS_BY_TYPE !== 'undefined' && f.field_type != null)
          ? (FORM_FIELD_KEYS_BY_TYPE[String(f.field_type)] || null) : null;
        const displayKeys = typeKeys || Object.keys(f).sort();
        const seenKeys = {};
        for (const key of displayKeys) {
          if (seenKeys[key]) continue;
          seenKeys[key] = 1;
          const val = f[key];
          const isEmpty = val === null || val === undefined || val === '';
          if (isEmpty) {
            const pairVal = formCompareCtx?.pairItem?.flow_conf?.fields?.find(pf => pf && String(pf.field) === fieldId)?.[key];
            if (pairVal === null || pairVal === undefined || pairVal === '') continue;
          }
          const label = fieldLabel(key);
          const dispVal = isEmpty ? '<span style="color:#999">（未設定）</span>'
            : ((key === 'add') ? formatAddFieldInline(val, f.field_type) : formatLabeledValue(key, val, formFldMap));
          const keyName = label !== key ? ` <small style="color:#999;font-weight:normal">(${key})</small>` : '';
          html += `<li style="margin-bottom:4px"><strong>${esc(label)}${keyName}:</strong> ${dispVal}</li>`;
        }
        html += `</ul></div></td></tr>`;
      }
      html += `</tbody></table></div></div>`;
    }
    if (fc) {
      const designKeys = ['design_confirm', 'design_thanks', 'design_close', 'design_error'];
      const designLabels = { design_confirm: '確認画面', design_thanks: '完了画面', design_close: '締め切り画面', design_error: 'エラー画面' };
      for (const dk of designKeys) {
        if (fc[dk]) {
          const d = fc[dk];
          html += `<div class="card"><div class="card-header"><h3>${designLabels[dk]} デザイン設定</h3></div><div class="card-body"><dl class="info-grid">`;
          if (d.html_title) html += `<dt>HTMLタイトル</dt><dd>${esc(replaceSpiralFieldReferences(d.html_title, formFldMap))}</dd>`;
          if (d.sub_text) html += `<dt>サブテキスト</dt><dd>${esc(replaceSpiralFieldReferences(d.sub_text, formFldMap))}</dd>`;
          html += `<dt>テンプレート</dt><dd>${esc(d.design_tmpl)}</dd>`;
          html += `<dt>カスタムHTML</dt><dd>${d.custom_flg === 't' ? 'はい' : 'いいえ'}</dd>`;
          html += `<dt>背景色</dt><dd><span style="display:inline-block;width:16px;height:16px;background:${esc(d.body_bgcolor)};border:1px solid #ccc;vertical-align:middle;border-radius:2px"></span> ${esc(d.body_bgcolor)}</dd>`;
          html += `</dl></div></div>`;
        }
      }
    }
    return html;
  }
  
  function renderMyAreaDetail(item, env, compareCtx) {
    var pairForMy = compareCtx ? compareCtx.pairItem : null;
    var myKeys = ['id', 'name', 'title', 'db', 'db_id', 'auth_type', 'member_detect_field', 'from_address',
        'notice_mode', 'click_login_flg', 'top_page_url', 'after_logout_url', 'url_eternal',
        'session_expire', 'auto_login_hours', 'login_post_disabled_flg',
        'loginlock_notice_flg', 'login_err_count', 'login_lock_time',
        'status', 'closed_page_type',
        'allow_xss_flg', 'allow_click_jacking_flg', 'allow_http_flg', 'allow_ip_flg',
        'allow_security_content_flg', 'restrict_dynamic_keywords', 'restrict_record_value_keyword',
        'comment'];
    var myDiffKeys = null;
    if (pairForMy) {
      myDiffKeys = new Set();
      myKeys.forEach(function(k) {
        if (JSON.stringify(item[k] !== undefined ? item[k] : null) !== JSON.stringify(pairForMy[k] !== undefined ? pairForMy[k] : null)) myDiffKeys.add(k);
      });
    }
    let html = infoCard('マイエリア基本設定', item, myKeys, undefined, undefined, env, myDiffKeys);
    if (item.password_mng) {
      const myMap = resolveFieldLabelMapForItem(item, env);
      var pwDiff = compareCtx && compareCtx.passwordMngDiffs && compareCtx.passwordMngDiffs.length > 0;
      var pwBadge = pwDiff ? '<span class="tag-diff">差分あり</span>' : '';
      var pwCard = infoCard('パスワード管理', item.password_mng,
        ['password_field', 'id_field', 'auth_field', 'password_level',
          'reg_notice_flg', 'del_notice_flg', 'rereg_url_expire', 'block_rereg_csrf'], null, myMap);
      if (pwDiff) pwCard = pwCard.replace('<div class="card-header"><h3>パスワード管理</h3>', '<div class="card-header"><h3>パスワード管理</h3>' + pwBadge);
      html += pwCard;
    }
    if (item.my_page_list && item.my_page_list.length > 0) {
      const myListMap = resolveFieldLabelMapForItem(item, env);
      var mpCtx = compareCtx && compareCtx.myPageGroups ? compareCtx.myPageGroups : {};
      var mpDiffCount = Object.keys(mpCtx).length;
      var mpBadge = mpDiffCount > 0 ? '<span class="tag-diff">' + mpDiffCount + '件差異</span>' : '';
      html += '<div class="card"><div class="card-header"><h3>ページ一覧</h3><span class="tag">' + item.my_page_list.length + '件</span>' + mpBadge + '</div><div class="card-body no-pad">';
      html += '<table class="data-table"><thead><tr><th>#</th><th>タイトル</th><th>ページ名</th><th>' + esc(fieldLabel('my_page_type_id')) + '</th><th>' + esc(fieldLabel('active_flg')) + '</th></tr></thead><tbody>';
      for (let i = 0; i < item.my_page_list.length; i++) {
        const p = item.my_page_list[i];
        var rowHasDiff = mpCtx[String(i)] && mpCtx[String(i)].length > 0;
        var rowCls = rowHasDiff ? ' class="db-field-row-has-diff"' : '';
        html += '<tr' + rowCls + '><td>' + (i + 1) + '</td><td class="mono">' + esc(p.title) + '</td><td>' + esc((p.page_detail && p.page_detail.page_name) || p.url || '&#8212;') + '</td><td>' + formatLabeledValue('my_page_type_id', p.my_page_type_id, myListMap) + '</td><td>' + formatLabeledValue('active_flg', p.active_flg, myListMap) + '</td></tr>';
      }
      html += '</tbody></table></div></div>';
    }

    // カスタムページ ソース
    var cpAll = (env && env.customPages) ? env.customPages : [];
    var cpPages = [];
    for (var ci = 0; ci < cpAll.length; ci++) {
      if (cpAll[ci]._myAreaName === item._dirName) { cpPages.push(cpAll[ci]); }
    }
    if (cpPages.length > 0) {
      var pairEnv = null;
      if (compareCtx && compareCtx.pairItem) {
        if (!envB) {
          pairEnv = envA;
        } else if (env === envA) {
          pairEnv = envB;
        } else {
          pairEnv = envA;
        }
      }
      var pairDirName = (pairEnv && compareCtx && compareCtx.pairItem) ? (compareCtx.pairItem._dirName || '') : '';
      var pairCpAll = (pairEnv && pairEnv.customPages) ? pairEnv.customPages : [];
      var pairCpMap = {};
      for (var pi = 0; pi < pairCpAll.length; pi++) {
        if (pairCpAll[pi]._myAreaName === pairDirName) {
          pairCpMap[pairCpAll[pi]._title] = pairCpAll[pi];
        }
      }
      var cpSectionDiff = false;
      for (var ci2 = 0; ci2 < cpPages.length; ci2++) {
        var pairCp0 = pairCpMap[cpPages[ci2]._title];
        if (pairEnv && (!pairCp0 || pairCp0._source !== cpPages[ci2]._source)) { cpSectionDiff = true; break; }
      }
      var cpSectionBadge = cpSectionDiff ? '<span class="tag-diff">差分あり</span>' : '';
      html += '<div class="card"><div class="card-header"><h3>カスタムページ ソース</h3><span class="tag">' + cpPages.length + '件</span>' + cpSectionBadge + '</div>';
      html += '<div class="card-body" style="display:flex;flex-direction:column;gap:8px;padding:12px 16px">';
      for (var ci3 = 0; ci3 < cpPages.length; ci3++) {
        var cp = cpPages[ci3];
        var pairCp = pairCpMap[cp._title];
        var srcDiff = pairEnv && (!pairCp || pairCp._source !== cp._source);
        var srcBadge = srcDiff ? '<span class="tag-diff">差分あり</span>' : (pairEnv ? '' : '');
        var cpBorderStyle = srcDiff ? ' style="border-left:3px solid var(--warning)"' : '';
        html += '<div class="card collapsed"' + cpBorderStyle + '>';
        html += '<div class="card-header" style="padding:10px 16px"><h3 style="font-size:14px">' + esc(cp._title) + '</h3><span class="tag mono" style="font-size:11px">' + esc(cp._filename) + '</span>' + srcBadge + '</div>';
        html += '<div class="card-body"><div class="code-block">' + esc(cp._source || '') + '</div></div>';
        html += '</div>';
      }
      html += '</div></div>';
    }

    return html;
  }

  function renderTableSecurityCard(item, tblMap, secDiffCount) {
    const badge = secDiffCount > 0 ? '<span class="tag-diff">' + secDiffCount + '件差異</span>' : '';

    function secFlag(key) {
      const v = item[key];
      if (v === null || v === undefined) return '<span style="color:#999">&#8212;</span>';
      const isOn = v === 't' || v === true || v === 'true';
      return isOn
        ? '<span style="color:var(--success);font-weight:600">&#10003; 有効</span>'
        : '<span style="color:var(--text-muted)">&#8212; 無効</span>';
    }
    function accessLabel(v) {
      if (v === 'user' || v === '0') return 'ユーザー';
      if (v === 'my_area' || v === '1') return 'マイエリア';
      if (v === 'public' || v === '2') return '一般公開';
      if (v == null) return '<span style="color:#999">&#8212;</span>';
      return esc(String(v));
    }

    let html = '<div class="card"><div class="card-header"><h3>セキュリティ設定</h3>' + badge + '</div><div class="card-body no-pad">';
    html += '<table class="data-table"><thead><tr><th>設定項目</th><th>値</th></tr></thead><tbody>';

    // アクセス権限
    html += '<tr><td>アクセス権限</td><td>' + accessLabel(item.access) + '</td></tr>';
    // IPアクセス制限
    html += '<tr><td>IPアドレスによるアクセス制限</td><td>' + (item.allow_ip_flg != null ? (item.allow_ip_flg === 't' || item.allow_ip_flg === true || item.allow_ip_flg === 'true' ? '<span style="color:var(--warning);font-weight:600">&#9888; 制限あり</span>' : '<span style="color:var(--text-muted)">制限なし</span>') : '<span style="color:#999">&#8212;</span>') + '</td></tr>';
    // 接続元URL
    html += '<tr><td>接続元URLによるアクセス制限</td><td>' + (item.allow_url_flg != null ? (item.allow_url_flg === 't' || item.allow_url_flg === true || item.allow_url_flg === 'true' ? '<span style="color:var(--warning);font-weight:600">&#9888; 制限あり</span>' : '<span style="color:var(--text-muted)">制限なし</span>') : '<span style="color:#999">&#8212;</span>') + '</td></tr>';
    // コンテンツセキュリティ
    html += '<tr><td>コンテンツに関するセキュリティ設定</td><td>' + secFlag('allow_security_content_flg') + '</td></tr>';
    // XSS
    const xssOn = item.allow_xss_flg === 't' || item.allow_xss_flg === true || item.allow_xss_flg === 'true';
    const xssLabel = item.allow_xss_flg != null
      ? (xssOn ? '<span style="color:var(--text-muted)">&#9744; 無効（フィルタ許可）</span>' : '<span style="color:var(--success);font-weight:600">&#9745; 有効（フィルタ適用）</span>')
      : '<span style="color:#999">&#8212;</span>';
    html += '<tr><td>&nbsp;&nbsp;&nbsp;クロスサイトスクリプティング対策</td><td>' + xssLabel + '</td></tr>';
    // クリックジャッキング
    const cjOn = item.allow_click_jacking_flg === 't' || item.allow_click_jacking_flg === true || item.allow_click_jacking_flg === 'true';
    const cjLabel = item.allow_click_jacking_flg != null
      ? (cjOn ? '<span style="color:var(--text-muted)">&#9744; 無効（許可）</span>' : '<span style="color:var(--success);font-weight:600">&#9745; 有効（ブロック）</span>')
      : '<span style="color:#999">&#8212;</span>';
    html += '<tr><td>&nbsp;&nbsp;&nbsp;クリックジャッキング対策</td><td>' + cjLabel + '</td></tr>';
    // 非SSL
    const httpOn = item.allow_http_flg === 't' || item.allow_http_flg === true || item.allow_http_flg === 'true';
    const httpLabel = item.allow_http_flg != null
      ? (httpOn ? '<span style="color:var(--warning)">&#9888; HTTP許可（非SSL可）</span>' : '<span style="color:var(--success)">HTTPS強制</span>')
      : '<span style="color:#999">&#8212;</span>';
    html += '<tr><td>非SSL（http）での登録</td><td>' + httpLabel + '</td></tr>';
    // 動的差替えキーワード制限
    if (item.restrict_dynamic_keywords != null) {
      const rdkOn = item.restrict_dynamic_keywords === 't' || item.restrict_dynamic_keywords === true || item.restrict_dynamic_keywords === 'true';
      html += '<tr><td>動的差替えキーワードの制限</td><td>' + (rdkOn ? '<span style="color:var(--warning);font-weight:600">制限あり</span>' : '<span style="color:var(--text-muted)">制限なし</span>') + '</td></tr>';
    }
    // レコード値キーワード制限
    if (item.restrict_record_value_keyword != null) {
      const rrvOn = item.restrict_record_value_keyword === 't' || item.restrict_record_value_keyword === true || item.restrict_record_value_keyword === 'true';
      html += '<tr><td>レコード値キーワード制限</td><td>' + (rrvOn ? '<span style="color:var(--warning);font-weight:600">制限あり</span>' : '<span style="color:var(--text-muted)">制限なし</span>') + '</td></tr>';
    }

    html += '</tbody></table></div></div>';
    return html;
  }

  function renderTableDetail(item, env, compareCtx) {
    const tblMap = resolveFieldLabelMapForItem(item, env);
    let html = infoCard('テーブル一覧設定', item,
      ['id', 'title', 'page_title', 'page_name', 'page_id', 'db', 'db_id',
        'data_row', 'sort', 'setting_mode', 'update_flg', 'delete_flg',
        'limit_info', 'dl_mode', 'dl_file_fmt', 'comment'], undefined, undefined, env);
    // セキュリティ設定カード
    const secDiffCount = (compareCtx && compareCtx.tableSecurityDiffs) ? compareCtx.tableSecurityDiffs.length : 0;
    html += renderTableSecurityCard(item, tblMap, secDiffCount);
    if (item.cols && item.cols.length > 0) {
      html += `<div class="card"><div class="card-header"><h3>カラム設定</h3><span class="tag">${item.cols.length}列</span></div><div class="card-body no-pad" style="overflow-x:auto">`;
      html += `<table class="data-table"><thead><tr><th>#</th><th>フィールド</th><th>型</th><th>幅</th><th>リンク</th><th>表示モード</th></tr></thead><tbody>`;
      for (let i = 0; i < item.cols.length; i++) {
        const c = item.cols[i];
        const viewMode = c.m_viewMode != null ? replaceSpiralFieldReferences(String(c.m_viewMode), tblMap) : '';
        html += `<tr><td>${i + 1}</td><td class="mono">${esc(c.field)}</td><td><span class="field-type">${esc(mmFieldTypeDisplay(c.m_fieldType))}</span></td><td>${esc(c.m_width)}</td><td>${formatLabeledValue('m_linkType', c.m_linkType, tblMap)}</td><td>${esc(viewMode)}</td></tr>`;
      }
      html += `</tbody></table></div></div>`;
    }
    if (item.search_form) {
      var sfDiff = compareCtx && compareCtx.searchFormDiffs && compareCtx.searchFormDiffs.length > 0;
      var sfBadge = sfDiff ? '<span class="tag-diff">差分あり</span>' : '';
      for (const sf of item.search_form) {
        html += '<div class="card"><div class="card-header"><h3>検索フォーム: ' + esc(sf.title) + '</h3>' + sfBadge + '</div><div class="card-body no-pad" style="overflow-x:auto">';
        html += '<table class="data-table"><thead><tr><th>フィールド</th><th>項目名</th><th>アクション</th><th>拡張タイプ</th></tr></thead><tbody>';
        for (const fc of (sf.field_conf_list || [])) {
          const inm = fc.item_name != null ? replaceSpiralFieldReferences(String(fc.item_name), tblMap) : '';
          const act = fc.action != null ? replaceSpiralFieldReferences(String(fc.action), tblMap) : '';
          const ext = fc.ex_type != null ? replaceSpiralFieldReferences(String(fc.ex_type), tblMap) : '';
          html += '<tr><td class="mono">' + esc(fc.field) + '</td><td>' + esc(inm) + '</td><td>' + esc(act) + '</td><td>' + esc(ext) + '</td></tr>';
        }
        html += '</tbody></table></div></div>';
      }
    }
    if (item.card && item.card.length > 0) {
      var cardDiffKeys = compareCtx && compareCtx.cardGroups ? compareCtx.cardGroups : {};
      var cardDiffCount = Object.keys(cardDiffKeys).length;
      var cardBadge = cardDiffCount > 0 ? '<span class="tag-diff">' + cardDiffCount + '件差異</span>' : '';
      html += `<div class="card"><div class="card-header"><h3>単表</h3><span class="tag">${item.card.length}件</span>${cardBadge}</div><div class="card-body no-pad">`;
      html += `<table class="data-table"><thead><tr><th>名前</th><th>タイトル(title)</th><th>ファイル</th></tr></thead><tbody>`;
      for (const c of item.card) {
        var hasDiff = !!cardDiffKeys[String(c.title)];
        var rowCls = hasDiff ? ' class="db-field-row-has-diff"' : '';
        var chip = hasDiff ? '<span class="diff-status-chip changed" style="font-size:10px;margin-right:4px">差分</span>' : '';
        html += `<tr${rowCls}><td>${chip}${esc(c.name)}</td><td class="mono">${esc(c.title)}</td><td class="mono">${esc(c.file)}</td></tr>`;
      }
      html += `</tbody></table></div></div>`;
    }
    return html;
  }
  
  function renderMailDetail(item, env, compareCtx) {
    const mailMap = resolveFieldLabelMapForItem(item.list || item, env);
    let html = infoCard('メール配信設定', item,
      ['id', 'application', 'ready_flg', 'night_stop_period', 'url_secs_count', 'url_secs_login'],
      item._mailType || item.application, undefined, env);
    if (item.envelope) {
      var envDiff = compareCtx && compareCtx.envelopeDiffs && compareCtx.envelopeDiffs.length > 0;
      var envBadge = envDiff ? '<span class="tag-diff">差分あり</span>' : '';
      var envCard = infoCard('エンベロープ（送信内容）', item.envelope,
        ['id', 'subject', 'name', 'from_address', 'from_name', 'content_type', 'parts', 'application'], null, mailMap);
      if (envDiff) envCard = envCard.replace('<div class="card-header"><h3>エンベロープ（送信内容）</h3>', '<div class="card-header"><h3>エンベロープ（送信内容）</h3>' + envBadge);
      html += envCard;
      if (item.envelope && item.envelope.message_list) {
        for (const msg of item.envelope.message_list) {
          if (msg.contents) {
            for (const ct of msg.contents) {
              if (ct.content && ct.content.body) {
                const body = Object.keys(mailMap).length ? replaceSpiralFieldReferences(ct.content.body, mailMap) : ct.content.body;
                html += '<div class="card"><div class="card-header"><h3>メール本文</h3></div><div class="card-body"><div class="code-block">' + esc(body) + '</div></div></div>';
              }
            }
          }
        }
      }
    }
    if (item.list) {
      var lstDiff = compareCtx && compareCtx.mailListDiffs && compareCtx.mailListDiffs.length > 0;
      var lstBadge = lstDiff ? '<span class="tag-diff">差分あり</span>' : '';
      var lstCard = infoCard('配信リスト', item.list,
        ['id', 'list_name', 'db', 'db_id', 'select', 'select_id', 'recipient_field',
          'domain_detect', 'del_err_auto_flg', 'n5_count', 'n5_except_flg',
          'reflect_stop_db_flg', 'application'], null, mailMap);
      if (lstDiff) lstCard = lstCard.replace('<div class="card-header"><h3>配信リスト</h3>', '<div class="card-header"><h3>配信リスト</h3>' + lstBadge);
      html += lstCard;
    }
    return html;
  }
  
  function renderProgramDetail(item, env, compareCtx) {
    let html = infoCard('カスタムプログラム', item,
      ['id', 'name', 'title', 'version', 'scheduled', 'timing', 'notify_on_complete', 'allow_no_signature', 'comment'],
      undefined, undefined, env);
    if (item.php_script) {
      var phpDiff = compareCtx && compareCtx.otherDiffs && compareCtx.otherDiffs.some(function(d) { return d.path === 'php_script' || (d.path && d.path.startsWith('php_script')); });
      var phpBadge = phpDiff ? '<span class="tag-diff">差分あり</span>' : '';
      html += '<div class="card"><div class="card-header"><h3>PHPスクリプト</h3>' + phpBadge + '</div><div class="card-body"><div class="code-block">' + esc(item.php_script) + '</div></div></div>';
    }
    return html;
  }
  
  function renderModuleDetail(item, env, compareCtx) {
    let html = infoCard('カスタムモジュール: ' + (item.name || ''), item,
      ['id', 'name', 'kind', 'parent_path', 'comment'], item.kind, undefined, env);
    if (item.php_script) {
      var modPhpDiff = compareCtx && compareCtx.otherDiffs && compareCtx.otherDiffs.some(function(d) { return d.path === 'php_script' || (d.path && d.path.startsWith('php_script')); });
      var modPhpBadge = modPhpDiff ? '<span class="tag-diff">差分あり</span>' : '';
      html += '<div class="card"><div class="card-header"><h3>スクリプト</h3>' + modPhpBadge + '</div><div class="card-body"><div class="code-block">' + esc(item.php_script) + '</div></div></div>';
    }
    if (item.children && item.children.length > 0) {
      var cgCtx = compareCtx && compareCtx.childrenGroups ? compareCtx.childrenGroups : {};
      var pairItem = compareCtx && compareCtx.pairItem;
      var isEnvA = !compareCtx || compareCtx.isEnvA !== false;
      var pairChildren = (pairItem && pairItem.children) ? pairItem.children : [];

      var getChildKey = function(ch) { return ch ? String(ch.parent_path || '') + String(ch.name || '') : null; };
      var thisChildMap = {};
      for (var ci = 0; ci < item.children.length; ci++) {
        var k = getChildKey(item.children[ci]);
        if (k) thisChildMap[k] = item.children[ci];
      }

      // 正規順序: 常に「環境Aの並び + 環境Bのみの追記」で両パネルを統一
      var baseChildren = isEnvA ? item.children : pairChildren;
      var extraChildren = isEnvA ? pairChildren : item.children;
      var orderedKeys = [];
      var seenKeys = {};
      var arrToKeys = function(arr) {
        for (var i = 0; i < arr.length; i++) {
          var k = getChildKey(arr[i]);
          if (k && !seenKeys[k]) { orderedKeys.push(k); seenKeys[k] = true; }
        }
      };
      arrToKeys(baseChildren);
      arrToKeys(extraChildren);

      for (var oi = 0; oi < orderedKeys.length; oi++) {
        var key = orderedKeys[oi];
        var child = thisChildMap[key];
        if (!child) {
          // 対になる環境にのみ存在 → 位置合わせ用プレースホルダー
          html += '<div class="card" style="opacity:0.35;border-style:dashed"><div class="card-header"><h3 style="color:#999">' + esc(key.split('/').pop() || key) + '</h3></div><div class="card-body"><span class="diff-empty">この環境には存在しません</span></div></div>';
          continue;
        }
        var childHasDiff = cgCtx[key] && cgCtx[key].length > 0;
        var childBadge = childHasDiff ? '<span class="tag-diff">差分あり</span>' : '';
        var childBorderStyle = childHasDiff ? ' style="border-left:3px solid var(--warning)"' : '';
        html += '<div class="card"' + childBorderStyle + '><div class="card-header"><h3>' + esc(child.name) + '</h3><span class="tag">' + esc(child.kind) + '</span>' + childBadge + '</div><div class="card-body">';
        if (child.php_script) {
          html += '<div class="code-block">' + esc(child.php_script) + '</div>';
        }
        html += '</div></div>';
      }
    }
    return html;
  }
  
  function renderCustomPageDetail(item, env, compareCtx) {
    if (!item) return '<div class="empty-state">データがありません</div>';
    var titleDiff = false;
    var sourceDiff = false;
    if (compareCtx && compareCtx.otherDiffs) {
      for (var i = 0; i < compareCtx.otherDiffs.length; i++) {
        if (compareCtx.otherDiffs[i].path === '_title') { titleDiff = true; }
      }
    }
    if (compareCtx && compareCtx.pairItem) {
      sourceDiff = (item._source || '') !== (compareCtx.pairItem._source || '');
    }
    var titleBadge = titleDiff ? '<span class="tag-diff">差分あり</span>' : '';
    var sourceBadge = sourceDiff ? '<span class="tag-diff">差分あり</span>' : '';
    var html = '<div class="card">';
    html += '<div class="card-header"><h3>カスタムページ情報</h3>' + titleBadge + '</div>';
    html += '<div class="card-body"><dl class="info-grid">';
    html += '<dt>タイトル</dt><dd>' + esc(item._title || '') + '</dd>';
    html += '<dt>マイエリア</dt><dd>' + esc(item._myAreaName || '') + '</dd>';
    html += '<dt>ファイル名</dt><dd>' + esc(item._filename || '') + '</dd>';
    html += '</dl></div></div>';
    if (item._source) {
      html += '<div class="card">';
      html += '<div class="card-header"><h3>HTMLソース</h3>' + sourceBadge + '</div>';
      html += '<div class="card-body"><div class="code-block">' + esc(item._source) + '</div></div></div>';
    }
    return html;
  }

  function renderGenericDetail(item, env) {
    const skip = new Set(['_path', '_filename', '_dirName', '_mailType']);
    const map = resolveFieldLabelMapForItem(item, env);
    let html = `<div class="card"><div class="card-header"><h3>設定値一覧</h3></div><div class="card-body"><dl class="info-grid">`;
    for (const [k, v] of Object.entries(item)) {
      if (skip.has(k)) continue;
      html += gridRow(k, v, map);
    }
    html += `</dl></div></div>`;
    return html;
  }
  function renderFormDiffFocusView(itemA, itemB, flowGroups) {
    var fieldsA = (itemA && itemA.flow_conf && itemA.flow_conf.fields) ? itemA.flow_conf.fields : [];
    var fieldsB = (itemB && itemB.flow_conf && itemB.flow_conf.fields) ? itemB.flow_conf.fields : [];
    var diffIds = new Set(Object.keys(flowGroups));
    var onlyAIds = new Set();
    var onlyBIds = new Set();
    var fMapB = {};
    for (var bi = 0; bi < fieldsB.length; bi++) { if (fieldsB[bi] && fieldsB[bi].field != null) fMapB[String(fieldsB[bi].field)] = fieldsB[bi]; }
    var fMapA = {};
    for (var ai = 0; ai < fieldsA.length; ai++) { if (fieldsA[ai] && fieldsA[ai].field != null) fMapA[String(fieldsA[ai].field)] = fieldsA[ai]; }
    for (var ai2 = 0; ai2 < fieldsA.length; ai2++) { if (!fieldsA[ai2] || fieldsA[ai2].field == null) continue; var _f = String(fieldsA[ai2].field); if (!fMapB[_f]) onlyAIds.add(_f); }
    for (var bi2 = 0; bi2 < fieldsB.length; bi2++) { if (!fieldsB[bi2] || fieldsB[bi2].field == null) continue; var _g = String(fieldsB[bi2].field); if (!fMapA[_g]) onlyBIds.add(_g); }

    var totalDiff = diffIds.size + onlyAIds.size + onlyBIds.size;
    if (totalDiff === 0) {
      return '<div class="db-diff-focus-empty">差分のあるフィールドはありません（全フィールド一致）</div>';
    }

    var fldMapA = resolveFieldLabelMapForItem(itemA, envA);
    var fldMapB = resolveFieldLabelMapForItem(itemB, envB);

    function buildRow(f, rowCls, dataKeyAttr, badge, fldMap) {
      var name = esc(f.form_title || f.field_name || f.title || '');
      var type = esc(mmFieldTypeDisplay(f.field_type || ''));
      var mainRow = '<tr class="' + rowCls + ' db-field-expandable focus-field-expandable"' + dataKeyAttr
        + ' onclick="toggleFormFocusFieldRow(this)" style="cursor:pointer" title="クリックで詳細を表示">'
        + '<td class="db-field-gutter"><span class="db-field-chevron" aria-hidden="true">&#9660;</span></td>'
        + '<td class="mono" style="font-size:11px">' + esc(String(f.field)) + '</td>'
        + '<td>' + name + '</td>'
        + '<td><span class="field-type">' + type + '</span></td>'
        + '<td>' + badge + '</td>'
        + '</tr>';
      var detailHtml = '<div class="form-field-full-settings"><h4>設定値の詳細</h4><ul class="detail-bullet-list">';
      var typeKeys = (typeof FORM_FIELD_KEYS_BY_TYPE !== 'undefined' && f.field_type != null)
        ? (FORM_FIELD_KEYS_BY_TYPE[String(f.field_type)] || null) : null;
      var displayKeys = typeKeys || Object.keys(f).sort();
      var seenKeys = {};
      for (var ki = 0; ki < displayKeys.length; ki++) {
        var key = displayKeys[ki];
        if (seenKeys[key]) continue;
        seenKeys[key] = 1;
        var val = f[key];
        var isEmpty = val === null || val === undefined || val === '';
        if (isEmpty) {
          var fid = String(f.field);
          var pairValA = fMapA[fid] ? fMapA[fid][key] : undefined;
          var pairValB = fMapB[fid] ? fMapB[fid][key] : undefined;
          if ((pairValA === null || pairValA === undefined || pairValA === '') &&
              (pairValB === null || pairValB === undefined || pairValB === '')) continue;
        }
        var lbl = fieldLabel(key);
        var dispVal = isEmpty ? '<span style="color:#999">（未設定）</span>'
          : ((key === 'add') ? formatAddFieldInline(val, f.field_type) : formatLabeledValue(key, val, fldMap));
        var keyName = lbl !== key ? ' <small style="color:#999;font-weight:normal">(' + key + ')</small>' : '';
        detailHtml += '<li style="margin-bottom:4px"><strong>' + esc(lbl) + keyName + ':</strong> ' + dispVal + '</li>';
      }
      detailHtml += '</ul></div>';
      var detailRow = '<tr class="db-field-detail-row focus-field-detail-row" style="display:none"><td colspan="5" class="db-field-detail-cell">' + detailHtml + '</td></tr>';
      return mainRow + detailRow;
    }

    function buildRows(fields, side, fldMap) {
      var rows = '';
      for (var ri = 0; ri < fields.length; ri++) {
        var f = fields[ri];
        if (!f || f.field == null) continue;
        var fid = String(f.field);
        var isDiff = diffIds.has(fid);
        var isOnlyA = side === 'a' && onlyAIds.has(fid);
        var isOnlyB = side === 'b' && onlyBIds.has(fid);
        var rowCls = isDiff ? 'focus-row-diff' : (isOnlyA ? 'focus-row-only-a' : (isOnlyB ? 'focus-row-only-b' : 'focus-row-same'));
        var dataKey = (isDiff || (!isOnlyA && !isOnlyB)) ? ' data-focus-key="' + escAttr(fid) + '"' : '';
        var badge = isDiff ? '<span class="diff-status-chip changed" style="font-size:10px">差分</span>'
                  : (isOnlyA ? '<span class="diff-status-chip only-a" style="font-size:10px">Aのみ</span>'
                  : (isOnlyB ? '<span class="diff-status-chip only-b" style="font-size:10px">Bのみ</span>' : ''));
        rows += buildRow(f, rowCls, dataKey, badge, fldMap);
      }
      if (side === 'b') {
        for (var bk in fMapB) {
          if (!onlyBIds.has(bk)) continue;
          var badge2 = '<span class="diff-status-chip only-b" style="font-size:10px">Bのみ</span>';
          rows += buildRow(fMapB[bk], 'focus-row-only-b', '', badge2, fldMap);
        }
      }
      return rows;
    }

    var thead = '<thead><tr><th class="db-field-col-gutter"></th><th>フィールドID</th><th>フィールド名</th><th>型</th><th></th></tr></thead>';
    var rowsA = buildRows(fieldsA, 'a', fldMapA);
    var rowsB = buildRows(fieldsB, 'b', fldMapB);
    var html = '<div class="db-diff-focus-host" id="formDiffFocusHost">';
    html += '<svg class="db-diff-focus-svg" id="formDiffFocusSvg" aria-hidden="true"></svg>';
    html += '<div class="db-diff-focus-col db-diff-focus-col-a">';
    html += '<div class="db-diff-focus-col-head env-a">環境A（A順）</div>';
    html += '<tab' + 'le class="db-diff-focus-table">' + thead + '<tbo' + 'dy>' + rowsA + '</tbo' + 'dy></tab' + 'le>';
    html += '</div>';
    html += '<div class="db-diff-focus-svg-wrap"></div>';
    html += '<div class="db-diff-focus-col db-diff-focus-col-b">';
    html += '<div class="db-diff-focus-col-head env-b">環境B（B順）</div>';
    html += '<tab' + 'le class="db-diff-focus-table">' + thead + '<tbo' + 'dy>' + rowsB + '</tbo' + 'dy></tab' + 'le>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderNamedSectionDiff(title, sectionDiffs, diffFldMap, category, itemA, itemB) {
    if (!sectionDiffs || !sectionDiffs.length) return '';
    var shown = sectionDiffs.filter(function(d) {
      if (compareDiffFilter === 'all') return true;
      if (compareDiffFilter === 'changed') return d.type === 'changed';
      if (compareDiffFilter === 'only-a') return d.type === 'removed';
      if (compareDiffFilter === 'only-b') return d.type === 'added';
      return true;
    });
    if (!shown.length) return '';
    var html = '<div style="border-bottom:2px solid var(--border);padding:12px 16px;background:#fafbfc">';
    html += '<div class="diff-field-name-row"><span class="field-name-label">' + esc(title) + '</span> <span style="color:#999;font-size:11px">(' + sectionDiffs.length + '件)</span></div>';
    html += renderDiffCompareSection(sectionDiffs, diffFldMap, category, itemA, itemB, 'leaf-only');
    html += '</div>';
    return html;
  }

  function renderActionGroupDiff(actionName, aDiffs, itemA, itemB, diffFldMap) {
    if (!aDiffs || !aDiffs.length) return '';
    var shown = aDiffs.filter(function(d) {
      if (compareDiffFilter === 'all') return true;
      if (compareDiffFilter === 'changed') return d.type === 'changed';
      if (compareDiffFilter === 'only-a') return d.type === 'removed';
      if (compareDiffFilter === 'only-b') return d.type === 'added';
      return true;
    });
    if (!shown.length) return '';
    var wholeNode = null;
    for (var wi = 0; wi < aDiffs.length; wi++) {
      var wd = aDiffs[wi];
      if ((/action_list\[field:[^\]]+\]$/.test(wd.path) || /action_list\[\d+\]$/.test(wd.path)) && (wd.a === undefined || wd.b === undefined)) {
        wholeNode = wd; break;
      }
    }
    var html = '<div style="border-bottom:2px solid var(--border);padding:12px 16px;background:#fafbfc">';
    html += '<div class="diff-field-name-row"><span class="field-name-label">アクション</span> <strong>' + esc(actionName) + '</strong> <span style="color:#999;font-size:11px">(' + aDiffs.length + '件)</span></div>';
    if (wholeNode) {
      var isOnlyA2 = wholeNode.type === 'removed' || wholeNode.b === undefined;
      html += '<div style="margin-top:6px"><span class="diff-status-chip ' + (isOnlyA2 ? 'only-a' : 'only-b') + '">' + (isOnlyA2 ? '環境Aのみ' : '環境Bのみ') + '</span></div>';
    } else {
      html += renderDiffCompareSection(aDiffs, diffFldMap, 'db', itemA, itemB, 'leaf-only');
    }
    html += '</div>';
    return html;
  }

  function renderCardGroupDiff(cardTitle, cardDiffs, itemA, itemB, diffFldMap) {
    if (!cardDiffs || !cardDiffs.length) return '';
    var cA = (itemA && itemA.card) ? itemA.card.find(function(c) { return String(c.title) === cardTitle; }) : null;
    var cB = (itemB && itemB.card) ? itemB.card.find(function(c) { return String(c.title) === cardTitle; }) : null;
    var dispName = (cA && cA.name) || (cB && cB.name) || cardTitle;
    var wholeNode = cardDiffs.find(function(d) {
      return (/card\[field:[^\]]+\]$/.test(d.path) || /card\[\d+\]$/.test(d.path)) && (d.a === undefined || d.b === undefined);
    });
    var html = '<div style="border-bottom:2px solid var(--border);padding:12px 16px;background:#fafbfc">';
    html += '<div class="diff-field-name-row"><span class="field-name-label">単表</span>　<strong>' + esc(dispName) + '</strong> <span style="color:#999;font-size:11px;font-weight:400">（title: ' + esc(cardTitle) + '）</span></div>';
    if (wholeNode) {
      // カード追加・削除時: 全プロパティを行単位で展開（file・id・_ 系は除外）
      var isOnlyA = wholeNode.type === 'removed' || wholeNode.b === undefined;
      var cls = isOnlyA ? 'only-a' : 'only-b';
      var label = isOnlyA ? '環境Aのみ' : '環境Bのみ';
      var cardObj = isOnlyA ? (wholeNode.a || cA) : (wholeNode.b || cB);
      html += '<div class="diff-compare-wrap"><table class="diff-compact-table"><thead><tr>';
      html += '<th class="diff-col-status">状態</th><th class="diff-col-prop">比較項目</th><th class="diff-col-env">環境A</th><th class="diff-col-env">環境B</th>';
      html += '</tr></thead><tbody>';
      if (cardObj) {
        Object.keys(cardObj).forEach(function(k) {
          if (k === 'file' || k === 'id' || /^_/.test(k)) return;
          var v = esc(String(cardObj[k] != null ? cardObj[k] : ''));
          var absent = '<span class="diff-empty">（この環境には存在しません）</span>';
          html += '<tr><td><span class="diff-status-chip ' + cls + '">' + label + '</span></td>';
          html += '<td><span class="diff-prop-main">' + esc(fieldLabel(k)) + '</span></td>';
          html += isOnlyA ? '<td>' + v + '</td><td>' + absent + '</td>' : '<td>' + absent + '</td><td>' + v + '</td>';
          html += '</tr>';
        });
      }
      html += '</tbody></table></div>';
    } else {
      // プロパティ変更: file 以外の全差分を表示（UIフィルタ適用なし）
      html += renderDiffCompareSection(cardDiffs, diffFldMap, 'table', itemA, itemB, 'leaf-only', 'all');
    }
    html += '</div>';
    return html;
  }

  function renderFormulaGroupDiff(idx, formulaDiffs, itemA, itemB, diffFldMap) {
    if (!formulaDiffs || !formulaDiffs.length) return '';
    var listA = (itemA && itemA.calc_formula_list) ? itemA.calc_formula_list : [];
    var listB = (itemB && itemB.calc_formula_list) ? itemB.calc_formula_list : [];
    var f = listA[idx] || listB[idx];
    var resField = f ? (f.result_field_id || '') : '';
    var title = '演算式 #' + (idx + 1) + (resField ? '（結果フィールド: ' + resField + '）' : '');
    var wholeNode = null;
    for (var wi = 0; wi < formulaDiffs.length; wi++) {
      var wd = formulaDiffs[wi];
      if (/calc_formula_list\[\d+\]$/.test(wd.path) && (wd.a === undefined || wd.b === undefined)) {
        wholeNode = wd; break;
      }
    }
    var html = '<div style="border-bottom:2px solid var(--border);padding:12px 16px;background:#fafbfc">';
    html += '<div class="diff-field-name-row"><span class="field-name-label">演算式</span>　<strong>' + esc(title) + '</strong></div>';
    if (wholeNode) {
      var isOnlyA = wholeNode.type === 'removed' || wholeNode.b === undefined;
      var cls = isOnlyA ? 'only-a' : 'only-b';
      var lbl = isOnlyA ? '環境Aのみ' : '環境Bのみ';
      html += '<div class="diff-compare-wrap"><tab' + 'le class="diff-compact-table"><thead><tr><th class="diff-col-status">状態</th><th class="diff-col-prop">比較項目</th><th class="diff-col-env">環境A</th><th class="diff-col-env">環境B</th></tr></thead><tbo' + 'dy>';
      html += '<tr><td><span class="diff-status-chip ' + cls + '">' + lbl + '</span></td><td><span class="diff-prop-main">演算式定義</span></td>';
      html += '<td>' + (isOnlyA ? esc(title) : '<span class="diff-empty">（この環境には存在しません）</span>') + '</td>';
      html += '<td>' + (!isOnlyA ? esc(title) : '<span class="diff-empty">（この環境には存在しません）</span>') + '</td>';
      html += '</tr></tbo' + 'dy></tab' + 'le></div>';
    } else {
      html += renderDiffCompareSection(formulaDiffs, diffFldMap, 'trigger', itemA, itemB, 'leaf-only');
    }
    html += '</div>';
    return html;
  }

  function renderMyPageGroupDiff(idx, pageDiffs, itemA, itemB, diffFldMap) {
    if (!pageDiffs || !pageDiffs.length) return '';
    var pagesA = (itemA && itemA.my_page_list) ? itemA.my_page_list : [];
    var pagesB = (itemB && itemB.my_page_list) ? itemB.my_page_list : [];
    var p = pagesA[idx] || pagesB[idx];
    var title = p ? (p.title || ('マイページ #' + (idx + 1))) : ('マイページ #' + (idx + 1));
    var html = '<div style="border-bottom:2px solid var(--border);padding:12px 16px;background:#fafbfc">';
    html += '<div class="diff-field-name-row"><span class="field-name-label">マイページ</span>　<strong>' + esc(title) + '</strong></div>';
    html += renderDiffCompareSection(pageDiffs, diffFldMap, 'myarea', itemA, itemB, 'leaf-only');
    html += '</div>';
    return html;
  }

  function renderChildGroupDiff(idx, childDiffs, itemA, itemB, diffFldMap) {
    if (!childDiffs || !childDiffs.length) return '';
    var childrenA = (itemA && itemA.children) ? itemA.children : [];
    var childrenB = (itemB && itemB.children) ? itemB.children : [];
    // idx は数値インデックスまたは "parent_path+name" キー文字列
    var c;
    if (/^\d+$/.test(String(idx))) {
      c = childrenA[Number(idx)] || childrenB[Number(idx)];
    } else {
      var findByKey = function(arr) { return arr.find(function(ch) { return ch && (String(ch.parent_path || '') + String(ch.name || '')) === String(idx); }); };
      c = findByKey(childrenA) || findByKey(childrenB);
    }
    var title = c ? (c.name || String(idx)) : String(idx);
    var html = '<div style="border-bottom:2px solid var(--border);padding:12px 16px;background:#fafbfc">';
    html += '<div class="diff-field-name-row"><span class="field-name-label">子モジュール</span>　<strong>' + esc(title) + '</strong></div>';
    html += renderDiffCompareSection(childDiffs, diffFldMap, 'module', itemA, itemB, 'leaf-only');
    html += '</div>';
    return html;
  }

  function renderSelectWhereDiff(selectWhereDiffs, itemA, itemB) {
    if (!selectWhereDiffs || !selectWhereDiffs.length) return '';
    var wa = (itemA && itemA.select_where !== undefined) ? itemA.select_where : undefined;
    var wb = (itemB && itemB.select_where !== undefined) ? itemB.select_where : undefined;
    var jsonA = (wa !== undefined && wa !== null) ? JSON.stringify(wa, null, 2) : null;
    var jsonB = (wb !== undefined && wb !== null) ? JSON.stringify(wb, null, 2) : null;
    var html = '<div style="border-bottom:2px solid var(--border);padding:12px 16px;background:#fafbfc">';
    html += '<div class="diff-field-name-row"><span class="field-name-label">条件式</span>　<strong>抽出条件（select_where）</strong> <span style="color:#999;font-size:11px">(' + selectWhereDiffs.length + '件)</span></div>';
    html += '<div class="diff-compare-wrap"><tab' + 'le class="diff-compact-table"><thead><tr><th class="diff-col-status">状態</th><th class="diff-col-prop">比較項目</th><th class="diff-col-env">環境A</th><th class="diff-col-env">環境B</th></tr></thead><tbo' + 'dy>';
    html += '<tr><td><span class="diff-status-chip changed">差分あり</span></td><td><span class="diff-prop-main">条件式 (select_where)</span></td>';
    html += '<td>' + (jsonA !== null ? '<div class="code-block" style="max-height:200px;font-size:11px">' + esc(jsonA) + '</div>' : '<span class="diff-empty">（なし）</span>') + '</td>';
    html += '<td>' + (jsonB !== null ? '<div class="code-block" style="max-height:200px;font-size:11px">' + esc(jsonB) + '</div>' : '<span class="diff-empty">（なし）</span>') + '</td>';
    html += '</tr></tbo' + 'dy></tab' + 'le></div></div>';
    return html;
  }

  function onSearch(query) {
    if (!envA || !query || query.length < 2) {
      renderSidebar();
      renderContent();
      return;
    }
    const q = query.toLowerCase();
    const results = [];
    for (const cat of CATEGORIES) {
      if (cat.key === 'overview') continue;
      const items = getItems(envA, cat.key);
      for (let i = 0; i < items.length; i++) {
        const lbl = getItemLabel(cat.key, items[i]);
        const searchText = JSON.stringify(items[i]).toLowerCase();
        if (searchText.includes(q)) {
          results.push({ cat, index: i, label: lbl, item: items[i] });
        }
      }
    }
    const el = document.getElementById('content');
    let html = `<div class="page-title">検索結果: "${esc(query)}"</div><div class="page-subtitle">${results.length} 件</div>`;
    html += `<div class="card"><div class="card-body no-pad"><div class="search-results">`;
    for (const r of results) {
      html += `<div class="sr-item" onclick="navigate('${r.cat.key}', ${r.index})"><div class="sr-cat">${r.cat.icon} ${r.cat.label}</div><div class="sr-name">${esc(r.label.name)}</div><div class="sr-path">${esc(r.label.sub)}</div></div>`;
    }
    if (results.length === 0) {
      html += `<div class="empty-state">「${esc(query)}」に一致する設定は見つかりませんでした</div>`;
    }
    html += `</div></div></div>`;
    el.innerHTML = html;
  }
  