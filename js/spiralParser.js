/* Spiral viewer &#8212; split from spiral_viewer.html */

// Folder parser

class SpiralParser {
  /**
   * EUC-JPファイルを判定するバイトスキャン。
   * 「連続する2バイトが両方とも 0xC0 以上」はUTF-8では絶対に不可能
   *（UTF-8の継続バイトは最大 0xBF）だが、EUC-JPの2バイト文字では頻繁に現れる。
   */
  static looksLikeEucJp(buffer) {
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length - 1; i++) {
      // UTF-8では不可能: 連続バイトが両方 >= 0xC0
      if (bytes[i] >= 0xC0 && bytes[i + 1] >= 0xC0) return true;
      // EUC-JP 半角カナ: 0x8E + 0xA1-0xDF
      if (bytes[i] === 0x8E && bytes[i + 1] >= 0xA1 && bytes[i + 1] <= 0xDF) return true;
    }
    return false;
  }

  static async readFileAsText(file) {
    const encoding = document.getElementById('encodingSelect').value;
    const buffer = await file.arrayBuffer();
    if (encoding === 'auto') {
      // UTF-8を試す前にEUC-JPバイトパターンを先にチェック。
      // EUC-JPファイルがたまたまUTF-8として有効と判定されて文字化けするのを防ぐ。
      if (SpiralParser.looksLikeEucJp(buffer)) {
        return new TextDecoder('euc-jp', { fatal: false }).decode(buffer);
      }
      try {
        const utf8 = new TextDecoder('utf-8', { fatal: true });
        return utf8.decode(buffer);
      } catch {
        try {
          return new TextDecoder('euc-jp', { fatal: false }).decode(buffer);
        } catch {
          return new TextDecoder('shift_jis', { fatal: false }).decode(buffer);
        }
      }
    }
    const decoder = new TextDecoder(encoding, { fatal: false });
    return decoder.decode(buffer);
  }

  static async parseDirectory(files) {
    const data = {
      app: null,
      databases: [], selects: [], triggers: [], constraints: [],
      forms: [], myAreas: [], tables: [],
      mails: [], programs: [], modules: [],
      customPages: [], myAreaPages: [],
      _files: {},
      _folderName: '',
      _sourceType: 'json' // 'json' = SPIRALエクスポート, 'php' = PHPソース構造
    };
    const rootPrefix = SpiralParser.findRoot(files);
    data._folderName = files.length > 0 ? (files[0].webkitRelativePath.split('/')[0] || '') : '';
    for (const file of files) {
      const relPath = file.webkitRelativePath.substring(rootPrefix.length);
      // .git/ など隠しシステムディレクトリはスキップ
      if (relPath.startsWith('.git/') || relPath === '.gitignore' || relPath === '.git') continue;
      try {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'json') {
          const text = await SpiralParser.readFileAsText(file);
          const json = JSON.parse(text);
          data._files[relPath] = json;
          SpiralParser.categorize(data, relPath, json, file.name);
        } else if (['html', 'tsv', 'xsl', 'php', 'css'].includes(ext)) {
          const text = await SpiralParser.readFileAsText(file);
          data._files[relPath] = text;
          if (ext === 'html' && /^web\/my_area\/[^/]+\/my_page\/custom_page/.test(relPath)) {
            const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const pageTitle = titleMatch ? titleMatch[1].trim() : file.name.replace(/\.html$/, '');
            data.customPages.push({
              _path: relPath,
              _filename: file.name,
              _myAreaName: relPath.split('/')[2],
              _title: pageTitle,
              _source: text
            });
          } else if (ext === 'html' && /^web\/my_area\/[^/]+\/[^/]+\.html$/.test(relPath)) {
            data.myAreaPages.push({
              _path: relPath,
              _filename: file.name,
              _myAreaName: relPath.split('/')[2],
              _source: text
            });
          }
          // PHPソース構造（SPIRAL/form/, SPIRAL/my_area/ など）のカテゴライズ
          SpiralParser.categorizePhpSource(data, relPath, text, file.name);
        }
      } catch (e) { console.warn('[SpiralParser] skip:', file.name, e); }
    }
    // PHPソースが読み込まれた場合は sourceType を更新
    if (data.forms.length > 0 || data.myAreas.length > 0 || data.tables.length > 0 || data.modules.length > 0) {
      const hasJson = Object.values(data._files).some(function(v) { return typeof v === 'object' && v !== null && !Array.isArray(v); });
      if (!data.app && !hasJson) data._sourceType = 'php';
    }
    return data;
  }

  static findRoot(files) {
    const first = files[0].webkitRelativePath;
    const parts = first.split('/');
    let prefix = parts[0] + '/';
    for (const f of files) {
      const rp = f.webkitRelativePath.substring(prefix.length);
      // SPIRALエクスポート構造
      if (rp.startsWith('db/') || rp.startsWith('web/') || rp.startsWith('mail/') || rp.startsWith('devel/') || rp === 'info.json') {
        return prefix;
      }
      // PHPソース構造（ルート直下に SPIRAL/ がある場合）
      if (rp.startsWith('SPIRAL/form/') || rp.startsWith('SPIRAL/my_area/') ||
          rp.startsWith('SPIRAL/table/') || rp.startsWith('SPIRAL/custom_module/')) {
        return prefix;
      }
      // PHPソース構造（SPIRAL/サブフォルダを直接選択した場合）
      if (rp.startsWith('form/') || rp.startsWith('my_area/') ||
          rp.startsWith('table/') || rp.startsWith('custom_module/')) {
        return prefix;
      }
    }
    if (parts.length > 1) {
      prefix = parts[0] + '/' + parts[1] + '/';
      for (const f of files) {
        const rp = f.webkitRelativePath.substring(prefix.length);
        if (rp.startsWith('db/') || rp.startsWith('web/') || rp === 'info.json') {
          return prefix;
        }
        if (rp.startsWith('form/') || rp.startsWith('my_area/') ||
            rp.startsWith('table/') || rp.startsWith('custom_module/')) {
          return prefix;
        }
      }
    }
    return prefix;
  }

  /**
   * PHPソース構造（SPIRAL/form/, SPIRAL/my_area/ など）のファイルを
   * 対応するカテゴリへ振り分ける
   */
  static categorizePhpSource(data, relPath, text, filename) {
    var parts = relPath.split('/');
    // relPath が 'SPIRAL/...' か 'form/...' かを判定
    var offset = (parts[0] === 'SPIRAL') ? 1 : 0;
    var category = parts[offset];     // 'form', 'my_area', 'table', 'custom_module'
    var itemDir  = parts[offset + 1]; // 'A_03_form', 'A_01_myarea', '26NGATTC' など
    if (!itemDir || !category) return;

    var itemPath = relPath.split('/').slice(0, offset + 2).join('/');
    var fileKey  = parts.slice(offset + 2).join('/') || filename;

    if (category === 'form') {
      var found = null;
      for (var i = 0; i < data.forms.length; i++) {
        if (data.forms[i]._dirName === itemDir) { found = data.forms[i]; break; }
      }
      if (!found) {
        found = { title: itemDir, _dirName: itemDir, _path: itemPath, _sourceFiles: {}, _sourceType: 'php' };
        data.forms.push(found);
      }
      if (!found._sourceFiles) found._sourceFiles = {};
      found._sourceFiles[fileKey] = text;
      // edit_page.php からフォームフィールドを抽出
      if (filename === 'edit_page.php') {
        found._extractedFields = SpiralParser.extractSpiralFieldsFromPhp(text);
      }

    } else if (category === 'my_area') {
      var found = null;
      for (var i = 0; i < data.myAreas.length; i++) {
        if (data.myAreas[i]._dirName === itemDir) { found = data.myAreas[i]; break; }
      }
      if (!found) {
        found = { title: itemDir, _dirName: itemDir, _path: itemPath, my_page_list: [], _sourceFiles: {}, _sourceType: 'php' };
        data.myAreas.push(found);
      }
      if (!found._sourceFiles) found._sourceFiles = {};
      found._sourceFiles[fileKey] = text;

    } else if (category === 'table') {
      var found = null;
      for (var i = 0; i < data.tables.length; i++) {
        if (data.tables[i]._dirName === itemDir) { found = data.tables[i]; break; }
      }
      if (!found) {
        found = { page_title: itemDir, _dirName: itemDir, _path: itemPath, _sourceFiles: {}, _sourceType: 'php' };
        data.tables.push(found);
      }
      if (!found._sourceFiles) found._sourceFiles = {};
      found._sourceFiles[fileKey] = text;

    } else if (category === 'custom_module') {
      var found = null;
      for (var i = 0; i < data.modules.length; i++) {
        if (data.modules[i]._dirName === itemDir) { found = data.modules[i]; break; }
      }
      if (!found) {
        found = { name: itemDir, _dirName: itemDir, _path: itemPath, _sourceFiles: {}, _sourceType: 'php' };
        data.modules.push(found);
      }
      if (!found._sourceFiles) found._sourceFiles = {};
      found._sourceFiles[fileKey] = text;
    }
  }

  /**
   * SPIRAL フォームの edit_page.php から入力フィールドを抽出する
   * <dl class="cf"> ブロックを解析し、フィールド名・ラベル・タイプ・必須を返す
   */
  static extractSpiralFieldsFromPhp(text) {
    var fields = [];
    var seen = {};

    // <dl class="cf">...</dl> を1ブロックずつ処理
    var dlRe = /<dl[^>]*class="[^"]*cf[^"]*"[^>]*>([\s\S]*?)<\/dl>/g;
    var dlMatch;
    while ((dlMatch = dlRe.exec(text)) !== null) {
      var block = dlMatch[1];

      // <dt> からラベル取得
      var dtMatch = block.match(/<dt[^>]*>([\s\S]*?)<\/dt>/);
      if (!dtMatch) continue;
      var dtContent = dtMatch[1];
      var required = /<span[^>]*class="[^"]*need[^"]*"/.test(dtContent);
      var label = dtContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

      // フィールド名を name 属性から取得（":y"/":m"/":d" サフィックスを除く）
      var fieldName = '';
      var nameMatch = block.match(/name="([^":]+)(?::[^"]+)?"/);
      if (nameMatch) {
        fieldName = nameMatch[1];
      }
      // name がなければ $errorInputColor:xxx$ から推測
      if (!fieldName) {
        var errMatch = block.match(/\$errorInputColor:([^$]+)\$/);
        if (errMatch) fieldName = errMatch[1];
      }
      // submit / detect など制御フィールドは除外
      if (!fieldName || seen[fieldName]) continue;
      if (fieldName === 'submit' || fieldName === 'detect' || fieldName === 'confirm') continue;
      seen[fieldName] = true;

      // タイプ判定
      var type = 'text';
      if (/<select/.test(block)) type = 'select';
      else if (/<textarea/.test(block)) type = 'textarea';
      else if (/type="checkbox"/.test(block)) type = 'checkbox';
      else if (/type="radio"/.test(block)) type = 'radio';
      else if (/type="file"/.test(block)) type = 'file';
      if (/<input[^>]*name="[^"]+:y"/.test(block)) type = 'date';

      // select の選択肢を抽出
      var options = [];
      if (type === 'select') {
        var optRe = /<option[^>]+value="([^"]+)"[^>]*>([^<]+)</g;
        var optM;
        while ((optM = optRe.exec(block)) !== null) {
          if (optM[1] === '') continue; // 「選択してください」は除外
          options.push({ value: optM[1], label: optM[2].trim() });
        }
      }

      var f = { field: fieldName, label: label, required: required, type: type };
      if (options.length > 0) f.options = options;
      fields.push(f);
    }

    return fields;
  }

  static categorize(data, path, json, filename) {
    if (path === 'info.json') {
      data.app = json;
    } else if (path === 'db/info.json' || path === 'mail/info.json' || path === 'devel/info.json' || path === 'extra/info.json') {
      // index files, skip
    } else if (path.startsWith('db/db/') && path.endsWith('.json')) {
      data.databases.push(Object.assign({}, json, { _path: path, _filename: filename }));
    } else if (path.startsWith('db/select/') && path.endsWith('.json')) {
      data.selects.push(Object.assign({}, json, { _path: path, _filename: filename }));
    } else if (path.startsWith('db/trigger/') && path.endsWith('.json')) {
      data.triggers.push(Object.assign({}, json, { _path: path, _filename: filename }));
    } else if (path.startsWith('db/constraint/') && path.endsWith('.json')) {
      data.constraints.push(Object.assign({}, json, { _path: path, _filename: filename }));
    } else if (path.match(/^web\/form\/[^/]+\/info\.json$/)) {
      data.forms.push(Object.assign({}, json, { _path: path, _dirName: path.split('/')[2] }));
    } else if (path.match(/^web\/my_area\/[^/]+\/info\.json$/)) {
      data.myAreas.push(Object.assign({}, json, { _path: path, _dirName: path.split('/')[2] }));
    } else if (path.match(/^web\/table\/[^/]+\/info\.json$/)) {
      data.tables.push(Object.assign({}, json, { _path: path, _dirName: path.split('/')[2] }));
    } else if (path.match(/^mail\/(follow|thanks)\/.*\.json$/)) {
      data.mails.push(Object.assign({}, json, { _path: path, _filename: filename, _mailType: path.split('/')[1] }));
    } else if (path.startsWith('devel/custom_program/') && path.endsWith('.json')) {
      data.programs.push(Object.assign({}, json, { _path: path, _filename: filename }));
    } else if (path.startsWith('devel/custom_module/') && path.endsWith('.json')) {
      data.modules.push(Object.assign({}, json, { _path: path, _filename: filename }));
    }
  }
}
