/* Spiral viewer &#8212; split from spiral_viewer.html */

// Categories

const CATEGORIES = [
  { key: 'overview', icon: '&#128202;', label: '概要' },
  { key: 'db', icon: '&#128452;&#65039;', label: 'データベース' },
  { key: 'form', icon: '&#128221;', label: 'フォーム' },
  { key: 'myarea', icon: '&#128272;', label: 'マイエリア' },
  { key: 'select', icon: '&#128269;', label: '抽出ルール' },
  { key: 'trigger', icon: '&#9889;', label: 'トリガー' },
  { key: 'constraint', icon: '&#128279;', label: 'DB連携' },
  { key: 'table', icon: '&#128203;', label: '一覧表・単表' },
  { key: 'mail', icon: '&#9993;&#65039;', label: 'メール' },
  { key: 'program', icon: '&#128187;', label: 'カスタムプログラム' },
  { key: 'module', icon: '&#128230;', label: 'カスタムモジュール' },
];

// FIELD_LABELS, VALUE_LABELS

// ============================================================================
// ■ ラベル定義セクション（ここを編集して表示名をカスタマイズできます）
// ============================================================================

// --- フィールド名 → 日本語ラベル ---
// キー: JSONのプロパティ名, 値: 画面に表示する日本語名
const FIELD_LABELS = {
  // 共通
  id: 'ID',
  name: 'DB名',
  title: 'タイトル',
  comment: 'コメント',
  type: '種別',
  version: 'バージョン',
  status: 'ステータス',
  application: 'アプリケーション',

  // DB
  record_limit: 'レコード上限',
  fieldList: 'フィールド一覧',
  check_regist_auth_selected: '登録認証チェック',

  // DB フィールド属性
  not_null_flg: '入力必須',
  unique_flg: '重複不可',
  index_flg: 'インデックス',
  primary_key_flg: '主キー',
  is_encrypted: '暗号化',
  shared: '共有フィールド',
  radio_flg: 'ラジオボタン表示',
  autoval_trig: 'フィールド値自動生成トリガー',
  app_role: 'アプリロール',
  set_default: 'デフォルト値',
  _interface_field_id: 'インターフェースID',

  // DB フィールド属性（追加）
  file_field_attribute: 'ファイル属性',
  extensions: '許可する拡張子',
  extension_limit: '拡張子制限',
  null_extension: '拡張子なし許可',
  candidates: '選択肢数',
  idAry: 'セレクト:ID値',
  keywordAry: 'セレクト:ラベル名',

  // フォーム
  db: '対象DB',
  db_id: 'DB ID',  
  secure_level: 'セキュリティレベル',
  csrf_protection: 'CSRF保護',
  confirm_flg: '確認ページ使用',
  valchk_flg: '入力チェック',
  multi_thanks: '複数サンクス',
  next_page: '次ページ遷移',
  allow_http_flg: 'HTTP許可',
  allow_xss_flg: 'XSSフィルタ許可',
  allow_click_jacking_flg: 'クリックジャッキング許可',
  allow_ip_flg: 'IPアクセス制限',
  allow_security_content_flg: 'セキュリティコンテンツ許可',
  allow_post_only_flg: 'POST限定',
  allow_url_flg: 'URL許可',
  restrict_dynamic_keywords: '動的な差替えキーワードの制限',
  restrict_record_value_keyword: 'レコード値キーワード制限',
  mass_assignment_block: 'マスアサインメントブロック',
  area_close_flg: '締切りフラグ',
  remote_limit_on: '受付件数制限',
  remote_limit: '受付上限件数',
  open_date_on: '公開日設定',
  expire_date_on: '終了日設定',
  expire_date: '終了日時',
  open_expire_wday_on: '曜日制限設定',
  notice_flg: '通知フラグ',
  limit_notice_flg: '上限通知フラグ',
  post_control_term: '連続投稿制限(秒)',
  over_limit_url: '受付上限時リダイレクトURL',
  closed_page_type: '締切りページ種別',
  last_update_fld: '最終更新フィールド',
  lat_lon_agree_page: '位置情報同意ページ',
  flow_conf: 'フロー設定',
  field_order: 'フィールド順序',
  design_confirm: '確認画面デザイン',
  design_thanks: '完了画面デザイン',
  design_close: '締め切り画面デザイン',
  design_error: 'エラー画面デザイン',

  // フォーム フロー設定
  han2zen: '半角→全角変換',
  space2null: 'スペースをNULL変換',
  depend_err: '機種依存文字エラー',
  key_type: 'キータイプ',
  reg_type: '登録種別',
  stage: 'ステージ',
  close_type: '閉鎖種別',
  close_url: '閉鎖時リダイレクトURL',
  errcd: 'エラーコード',
  id_include: 'ID含む',
  flow_finish: 'フロー完了',
  db_limit: 'DB制限',
  referenceFlag: '参照フラグ',
  is_form_setting_zipcode: '郵便番号設定',
  block_xsrf_flg: 'XSRF対策',

  // フォーム デザイン
  design_tmpl: 'デザインテンプレート',
  custom_flg: 'カスタムHTML使用',
  custom_update: 'カスタム更新日時',
  body_bgcolor: '背景色',
  header_bgcolor: 'ヘッダー背景色',
  header_title: 'ヘッダータイトル',
  header_text: 'ヘッダーテキスト',
  header_rmesg: '通常メッセージ',
  header_emesg: 'エラーメッセージ',
  html_title: 'HTMLタイトル',
  sub_text: 'サブテキスト',
  submitbutton_value: '送信ボタン文言',
  backbutton_value: '戻るボタン文言',
  header_font_size: 'ヘッダーフォントサイズ',
  header_font_color: 'ヘッダーフォント色',
  footer_text: 'フッターテキスト',
  send_seal_size: '送信シールサイズ',
  send_seal_lang: '送信シール言語',
  table_type: 'テーブルタイプ',
  multidevice: 'マルチデバイス設定',
  need_string: '必須マーク文字',
  nn_err_msg: '必須エラーメッセージ',
  not_null_alter: '未入力エラーメッセージ',
  dup_err_msg: '重複エラーメッセージ',
  dup2_err_msg: '重複エラーメッセージ2',
  cnf_err_msg: '確認エラーメッセージ',
  depend_err_msg: '機種依存文字エラーメッセージ',
  mem_err_msg: '認証失敗メッセージ',
  sys_err_disp: 'システムエラー表示',

  // フォーム フィールド
  field: 'フィールドID',
  field_name: 'フィールド名',
  field_type: 'フィールド型',
  field_type_name: 'フィールド型名',
  form_title: '項目タイトル',
  form_title_use: 'フォーム表示名使用',
  not_null: '入力必須',
  valchk: '入力値チェック',
  msg: 'エラーメッセージ',
  param_type: '入力設定',
  support_input: '入力補助',
  static_value: '固定値',
  select_type: '選択肢の表示形式',
  hide_param_type: '非表示パラメータ種別',
  order: '表示順',
  use_cf: '確認入力使用',
  unique: '重複不可',
  placeholder_use: 'プレースホルダー使用',
  note: '注意事項',
  note_use: '注意事項を表示する',
  sample: '例文',
  sample_use: '例文を表示する',
  prefix: '接頭語',
  prefix_use: '接頭語表示',
  suffix: '接尾語',
  suffix_use: '接尾語表示',
  add: '追加設定',
  add_chk: 'その他許可する半角文字を設定する',
  starts_with: '開始文字制限テキスト',
  permit: '許可する拡張子',
  prohibit: '禁止パターン',
  byte_chk: '入力バイト数制限',
  char_limit: '入力文字',
  starts_with_chk: '開始文字制限',
  min: '入力バイト数下限',
  max: '入力バイト数上限',
  field_chk_opt: 'フィールドチェックオプション',
  placeholder1: 'プレースホルダー',
  checkbox_line: '選択項目の並び',
  add_char: 'その他許可する半角文字（内容）',
  hz_convert_chk: '数字・記号・アルファベット変換する',
  hz_convert_type: '変換種別',
  begin: '範囲（下限値）',
  end: '範囲（上限値）',
  range_age_chk: '年齢制限',
  begin_age: '年齢制限（下限）',
  end_age: '年齢制限（上限）',
  operator_age: '年齢制限（許可フラグ）',
  begin_today: '本日との差（下限）',
  end_today: '本日との差（上限）',
  operator_today: '本日との差（許可フラグ）',
  img_limit_over: 'ファイルサイズエラーメッセージ',
  invalid_file_type: 'ファイルタイプエラーメッセージ',
  file_size: 'ファイルサイズ上限値',
  file_size_unit: 'ファイルサイズ単位',

  // 緯度経度 GPS同意設定
  gps_agr_msg: 'GPS同意メッセージ',
  gps_agr_ok_btn: 'GPS同意ボタン（OK）',
  gps_agr_ng_btn: 'GPS同意ボタン（NG）',
  gps_err_msg: 'GPSエラーメッセージ',
  gps_agr_au: 'GPS同意（au）',
  gps_agr_ms: 'GPS同意（SoftBank MS）',
  gps_agr_sb: 'GPS同意（SoftBank）',
  gps_agr_i: 'GPS同意（docomo）',

  // フォーム 日時関連
  update_entry: '入力画面更新日',
  update_confirm: '確認画面更新日',
  update_thanks: '完了画面更新日',
  update_error: 'エラー画面更新日',
  update_closed: '締め切り画面更新日',
  update_notice: '通知更新日',

  // マイエリア
  auth_type: '認証方式',
  password_mng: 'パスワード管理',
  fido_mng: 'FIDO管理',
  login_lock: 'ログインロック',
  member_detect_field: '会員検出フィールド',
  from_address: '差出人メールアドレス',
  notice_mode: '通知モード',
  click_login_flg: 'ワンクリックログイン',
  top_page_url: 'ログイン後遷移先',
  after_logout_url: 'ログアウト後URL',
  url_eternal: 'URL無期限',
  loginlock_notice_flg: 'ロック通知',
  login_err_count: 'ログインエラー上限回数',
  login_lock_time: 'ロック時間(分)',
  session_expire: 'セッション有効時間(分)',
  auto_login_hours: '自動ログイン有効時間(時)',
  login_post_disabled_flg: 'ログインPOST無効',
  login_view_list: 'ログインビューリスト',
  my_page_list: 'マイページ一覧',
  common_err: '共通エラーページ',
  login_err: 'ログインエラーページ',
  login_lock_err: 'ログインロックページ',
  click_login_page: 'ワンクリックログインページ',
  reg_success: 'パスワード登録成功ページ',
  conf_success: 'パスワード確認成功ページ',
  rereg_source: '再登録ソースページ',
  rereg_success: '再登録成功ページ',
  pass_error: 'パスワードエラーページ',
  status_page: 'ステータスページ',
  session_timeout_page: 'セッションタイムアウトページ',
  click_login_timeout_page: 'ワンクリックタイムアウトページ',
  password_field: 'パスワードフィールド',
  id_field: 'IDフィールド',
  auth_field: '認証フィールド',
  password_level: 'パスワード強度レベル',
  reg_notice_flg: '登録通知',
  reg_subject: '登録通知件名',
  reg_body: '登録通知本文',
  del_notice_flg: '削除通知',
  del_subject: '削除通知件名',
  del_body: '削除通知本文',
  rereg_url_expire: '再登録URL有効期限(分)',
  block_rereg_csrf: '再登録CSRF対策',
  use_fido_flg: 'FIDO使用',
  use_pass_flg: 'パスワード使用',
  default_state: 'デフォルト状態',

  // テーブル一覧
  data_row: '表示件数',
  sort: '初期ソート',
  access: 'アクセス権限',
  my_area_info: 'マイエリア情報',
  cols: 'カラム設定',
  rows: '行設定',
  cells: 'セル設定',
  page_name: 'ページ名',
  page_title: 'ページタイトル',
  page_id: 'ページID',
  setting_mode: '設定モード',
  update_flg: '更新可否',
  delete_flg: '削除可否',
  limit_info: '表示件数選択肢',
  dl_mode: 'ダウンロードモード',
  dl_table_ids: 'ダウンロードテーブルID',
  selectable_dl_fmt: 'ダウンロード形式選択',
  dl_file_fmt: 'ダウンロードファイル形式',
  search_form: '検索フォーム',
  card: '単表',
  dl_table: 'ダウンロードテーブル',

  // 抽出ルール
  select_name: '抽出ルール名',
  advanced_flg: '高度な条件',
  id_range_flg: 'IDレンジ指定',
  id_ge: 'ID下限',
  id_lt: 'ID上限',
  id_modulo_flg: 'IDモジュロ指定',
  id_modulo_divisor: 'モジュロ除数',
  id_modulo_surplus: 'モジュロ余り',
  rec_limit_flg: 'レコード制限',
  rec_limit: 'レコード上限',
  exists_mode: '存在モード',
  select_where: '抽出ルール式',

  // トリガー
  trigger_id: 'トリガーID',
  seq_order: '実行順序',
  event: 'イベント',
  calc_formula_list: '演算式一覧',
  result_field_id: '結果フィールド',
  error_type: 'エラー種別',
  condition: '条件式',
  formula: '演算式',
  calc_formula_field_rel: '演算式フィールド関連',

  // アクションリスト（TRDB）
  action_list: 'アクション一覧',
  actionName: 'アクション名',
  command: '処理',
  execCondition: '発動条件',
  commandCase: 'アクション処理条件',
  trdb_search_field: '識別キー（TRDB側）',
  tgt_search_field: '識別キー（対象DB側）',
  trdb_search_field2: '認証キー（TRDB側）',
  tgt_search_field2: '認証キー（対象DB側）',
  allowNullUpdate: 'null更新許可',
  operator: '演算子',

  // DB連携
  left_db: '参照元DB',
  left_db_id: '参照元DB ID',
  left_field: 'マスタキー',
  right_db: 'マスタDB',
  right_db_id: 'マスタDB ID',
  right_field: '参照キー',
  strength: '連携方法',
  mstOnInsertCascade: 'INSERT時カスケード',
  mstOnDeleteCascade: 'DELETE時カスケード',

  // メール
  envelope: 'エンベロープ（送信設定）',
  list: '配信リスト',
  ready_flg: '配信状態',
  url_secs_count: 'URL有効期間(秒)',
  url_secs_login: 'ログインURL有効期間(秒)',
  night_stop_period: '携帯夜間配信',
  attribute: '属性',
  subject: '件名',
  from_name: '差出人名',
  content_type: 'コンテンツタイプ',
  parts: 'パーツ数',
  message_list: 'メッセージ一覧',
  message_name: 'メッセージ名',
  swap_flg: '差替フラグ',
  contents: 'コンテンツ',
  content_name: 'コンテンツ名',
  body: '本文',
  category_name: 'カテゴリ名',
  public_flg: '公開フラグ',
  list_name: 'リスト名',
  select: '抽出ルール',
  select_id: '抽出ルールID',
  del_err_auto_flg: 'エラー自動削除',
  n5_count: 'N5カウント',
  n5_except_flg: 'N5除外',
  reflect_stop_db_flg: 'DB停止反映',
  recipient_field: '宛先フィールド',
  domain_detect: 'ドメイン検知',
  form_id: 'フォームID',

  // カスタムプログラム
  php_script: 'PHPスクリプト',
  scheduled: '定期実行',
  timing: 'スケジュール(cron)',
  notify_on_complete: '完了通知',
  allow_no_signature: '署名なし許可',

  // カスタムモジュール
  kind: '種別',
  parent_path: '親パス',
  children: '子モジュール',

  // マイページ
  my_page_type_id: 'ページ種別',
  active_flg: '有効',
  page_detail: 'ページ詳細',
  url: 'URL',

  // テーブル列
  m_width: '列幅',
  m_fieldType: 'フィールド型',
  m_linkType: 'リンク種別',
  m_linkTarget: 'リンクターゲット',
  m_viewMode: '表示モード',
  m_fieldCalc: '計算フィールド',
  m_linkEncode: 'リンクエンコード',

  // 検索フォーム
  keyword: 'キーワード',
  design_type: 'デザイン種別',
  button_name: 'ボタン文言',
  field_conf_list: 'フィールド設定一覧',
  where_syntax: '条件構文',
  has_extension: '拡張設定あり',
  extension: '拡張設定',
  multi_search: '複合検索',
  action: 'アクション',
  ex_type: '拡張タイプ',
  item_name: '項目名',
  filter_type: 'フィルター種別',
  my_area_id: 'マイエリアID',
};

/** DBフィールドの mm_* 型コード → SPIRAL管理画面相当の日本語表記 */
const MM_FIELD_TYPE_LABELS = {
  mm_email_nc: 'メールアドレス（大・小文字無視）',
  mm_sex: '性別',
  mm_zip_code: '郵便番号',
  mm_pref: '都道府県',
  mm_phone: '電話番号',
  mm_alternative: 'セレクト',
  mm_multiple: 'マルチセレクト',
  mm_multiple128: 'マルチセレクト(128項目)',
  mm_bool: 'ブーリアン',
  mm_name: 'テキストフィールド(32 bytes)',
  mm_name_hirakana: 'テキストフィールド(32 bytes)かな',
  mm_name_katakana: 'テキストフィールド(32 bytes)カナ',
  mm_name_roman: 'テキストフィールド(32 bytes)ローマ字',
  mm_text_field64: 'テキストフィールド(64 bytes)',
  mm_address_hirakana: 'テキストフィールド(64 bytes)かな',
  mm_address_katakana: 'テキストフィールド(64 bytes)カナ',
  mm_address_roman: 'テキストフィールド(64 bytes)ローマ字',
  mm_text_field: 'テキストフィールド(128 bytes)',
  mm_text_area256: 'テキストエリア(256 bytes)',
  mm_text_area512: 'テキストエリア(512 bytes)',
  mm_text_area1024: 'テキストエリア(1024 bytes)',
  mm_text_area: 'テキストエリア(2048 bytes)',
  mm_text_area4096: 'テキストエリア(4096 bytes)',
  mm_text_area8192: 'テキストエリア(8192 bytes)',
  mm_number6: '数字・記号・アルファベット(6 bytes)',
  mm_number32: '数字・記号・アルファベット(32 bytes)',
  mm_integer: '整数',
  mm_real: '実数',
  mm_money: '通貨',
  mm_regist_date: '登録日時',
  mm_date_ymdhhmmss: '日付（○年○月○日 ○時○分○秒）',
  mm_date_ymdhhmm: '日付（○年○月○日 ○時○分）',
  mm_date_ymdhh: '日付（○年○月○日 ○時）',
  mm_date_ymd: '日付（○年○月○日）',
  mm_date_ym: '日付（○年○月）',
  mm_date_md: '日付（○月○日）',
  mm_date_wday: '曜日（○曜日）',
  mm_interval_ym: '時間（○年○カ月）',
  mm_interval_d: '時間（○日）',
  mm_interval_w: '時間（○週間）',
  mm_date_hhmm: '時刻（○時○分）',
  mm_invalid_email: '不正アドレスフラグ',
  mm_mobile: 'モバイルドメインフラグ',
  mm_duplicate: '重複フラグ',
  mm_error_count: '配信エラーカウント',
  mm_deliver_error: '配信エラー',
  mm_digest_sha256: 'メッセージダイジェスト（SHA256）',
  mm_digest_sha1: 'メッセージダイジェスト（SHA1）',
  mm_digest_md5: 'メッセージダイジェスト（MD5）',
  mm_password: 'パスワード',
  mm_lat_lon: '緯度経度',
  mm_email: 'メールアドレス（大・小文字区別）',
  mm_ezpassword: '簡易パスワード',
  mm_file: 'ファイル',
  mm_image100k: '画像(100KiB)',
  mm_optout: 'オプトアウト',
};

/** フィールドタイプ別に「設定値の詳細」で表示するキーの一覧（表示順） */
const FORM_FIELD_KEYS_BY_TYPE = (function() {
  var textFull  = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','valchk','not_null','unique','char_limit','add_chk','add_char','hz_convert_chk','hz_convert_type','byte_chk','min','max','msg'];
  var textRoman = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','valchk','not_null','unique','char_limit','add_chk','add_char','byte_chk','min','max','msg'];
  var textArea  = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','valchk','not_null','char_limit','add_chk','add_char','hz_convert_chk','hz_convert_type','byte_chk','min','max','msg'];
  var numAlpha  = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','valchk','not_null','unique','char_limit','add_chk','add_char','starts_with_chk','starts_with','byte_chk','min','max','msg'];
  var select    = ['form_title','sample_use','sample','note_use','note','suffix_use','prefix','suffix','checkbox_line','valchk','not_null','msg'];
  var multiSel  = ['form_title','sample_use','sample','note_use','note','suffix_use','prefix','suffix','checkbox_line','valchk','not_null','support_input','begin','end','msg'];
  var bool      = ['form_title','sample_use','sample','note_use','note','suffix_use','prefix','suffix','select_type','checkbox_line','valchk','not_null','msg'];
  var email     = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','use_cf','valchk','not_null','unique','add','cnf_err_msg','msg'];
  var sexPref   = ['form_title','sample_use','sample','note_use','note','suffix_use','prefix','suffix','valchk','not_null','msg'];
  var zip       = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','valchk','not_null','msg'];
  var phone     = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','valchk','not_null','unique','msg'];
  var integer   = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','valchk','not_null','unique','support_input','begin','end','msg'];
  var real      = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','valchk','not_null','support_input','begin','end','msg'];
  var money     = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','valchk','not_null','support_input','begin','end','msg'];
  var dateTime  = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','valchk','not_null','unique','support_input','begin','end','begin_today','end_today','operator_today','msg'];
  var dateYmd   = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','valchk','not_null','unique','support_input','begin','end','range_age_chk','begin_age','end_age','operator_age','begin_today','end_today','operator_today','msg'];
  var timeRange = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','valchk','not_null','unique','support_input','begin','end','msg'];
  var weekday   = ['form_title','sample_use','sample','note_use','note','suffix_use','prefix','suffix','checkbox_line','valchk','not_null','unique','msg'];
  var passwd    = ['form_title','sample_use','sample','note_use','note','placeholder_use','placeholder1','suffix_use','prefix','suffix','use_cf','valchk','not_null','char_limit','add_chk','add_char','hz_convert_chk','hz_convert_type','byte_chk','min','max','cnf_err_msg','msg'];
  var file      = ['form_title','note_use','note','valchk','not_null','add','file_size','file_size_unit','permit','img_limit_over','invalid_file_type','msg'];
  var image     = ['form_title','note_use','note','valchk','not_null','img_limit_over','invalid_file_type','msg'];
  var m = {};
  ['mm_name','mm_name_hirakana','mm_name_katakana','mm_text_field64','mm_address_hirakana','mm_address_katakana','mm_text_field'].forEach(function(t){m[t]=textFull;});
  ['mm_name_roman','mm_address_roman'].forEach(function(t){m[t]=textRoman;});
  ['mm_text_area256','mm_text_area512','mm_text_area1024','mm_text_area','mm_text_area4096','mm_text_area8192'].forEach(function(t){m[t]=textArea;});
  ['mm_number6','mm_number32'].forEach(function(t){m[t]=numAlpha;});
  m['mm_alternative']=select;
  ['mm_multiple','mm_multiple128'].forEach(function(t){m[t]=multiSel;});
  m['mm_bool']=bool;
  ['mm_email_nc','mm_email'].forEach(function(t){m[t]=email;});
  ['mm_sex','mm_pref'].forEach(function(t){m[t]=sexPref;});
  m['mm_zip_code']=zip;
  m['mm_phone']=phone;
  m['mm_lat_lon']=phone;
  m['mm_optout']=['form_title','valchk','not_null','msg'];
  m['mm_integer']=integer;
  m['mm_real']=real;
  m['mm_money']=money;
  ['mm_date_ymdhhmmss','mm_date_ymdhhmm','mm_date_ymdhh'].forEach(function(t){m[t]=dateTime;});
  m['mm_regist_date']=[];
  m['mm_date_ymd']=dateYmd;
  ['mm_date_ym','mm_date_md','mm_date_hhmm'].forEach(function(t){m[t]=timeRange;});
  ['mm_interval_ym','mm_interval_d','mm_interval_w'].forEach(function(t){m[t]=timeRange;});
  m['mm_date_wday']=weekday;
  ['mm_digest_sha256','mm_digest_sha1','mm_digest_md5','mm_password','mm_ezpassword'].forEach(function(t){m[t]=passwd;});
  m['mm_file']=file;
  m['mm_image100k']=image;
  return m;
})();

/**
 * フォームフィールドの条件付きキーグループ。
 * 有効化フラグ（enableKey）が両環境ともに null/'f'/空 のとき depKeys をスキップし、
 * 古いエクスポートに残留した 'f' 値による誤検知を防ぐ。
 * enableKey が null のグループは checkKeys がすべて null 相当のときにスキップ判定する。
 */
const FORM_FIELD_CONDITIONAL_GROUPS = [
  // 範囲指定が無効（support_input が null/falsy）のとき begin/end は無意味
  { enableKey: 'support_input', depKeys: ['begin', 'end'] },
  // 年齢制限が無効（range_age_chk が null/falsy）のとき age サブキーは無意味
  { enableKey: 'range_age_chk', depKeys: ['begin_age', 'end_age', 'operator_age'] },
  // 本日との差：有効化フラグの JSON キーなし。begin_today/end_today が両方 null 相当なら
  // operator_today（デフォルト '0' が残留しやすい）を含め全サブキーをスキップ
  { enableKey: null, checkKeys: ['begin_today', 'end_today'], depKeys: ['begin_today', 'end_today', 'operator_today'] },
];

// --- 設定値 → 日本語ラベル ---
// キー: JSONのプロパティ名
// 値: { 値: 表示ラベル } のマッピング
// ※ 値はすべて文字列に変換して照合されます
const VALUE_LABELS = {
  // アクション
  command: {
    'insert': '登録',
    'update': '更新',
    'upsert': '更新登録',
  },
  execCondition: {
    '0': '無条件',
    '1': '抽出ルールにマッチ',
  },
  // DB種別
  type: {
    'normal': '通常DB',
    'transaction': 'トランザクションDB',
    'view_n': '通常ビュー',
    'calc': '演算トリガ',
    'action': 'アクショントリガー',
    'reference': '参照トリガー',
    'webhook': 'Webhook',
  },
  // フォーム type (数値)
  // 0=通常(登録), 1=更新
  // ※ 'type' は上記DB種別と共用。数値の場合はこちらが使われます
  // 必要に応じて別キーに分離可

  // 認証方式
  auth_type: {
    '0': 'メール認証',
    '1': 'ID認証',
    '2': 'パスワード認証',
  },
  // セキュリティレベル
  secure_level: {
    '0': '制限なし',
    '1': '標準',
    '2': '高',
    '3': '最高',
  },
  // CSRF保護
  csrf_protection: {
    'unprotected': '無効',
    'protected': '有効',
  },
  // パスワード強度
  password_level: {
    '1': '低（英数字のみ）',
    '2': '中',
    '3': '高（英大小文字+数字+記号）',
  },
  // 通知モード
  notice_mode: {
    '0': '通知なし',
    '1': '通知あり',
  },
  // ステータス
  status: {
    'public': '公開中',
    'private': '非公開',
    'closed': '閉鎖',
  },
  // 閉鎖ページ種別
  closed_page_type: {
    '0': 'デフォルト',
    'inside_page': '内部ページ',
    'redirect': 'リダイレクト',
  },
  // 入力設定（資料どおり：入力項目として使用する / 特殊入力 / 使用しない）
  param_type: {
    '0': '使用しない',
    '1': '入力項目として使用する',
    '2': '特殊入力',
  },
  // 特殊入力の詳細（自動取得系）
  support_input: {
    '0': 'なし',
    '4': '登録日時自動取得',
    '5': '登録日時自動取得',
    '6': '登録者IPアドレス自動取得',
    '7': '登録者ユーザエージェント自動取得',
  },
  // 特殊入力の詳細（hidden系）
  hide_param_type: {
    '0': 'なし',
    '1': '値を引継ぐ(hidden)',
    '2': '固定値(hidden)',
    '3': '登録日時自動取得',
  },
  // 選択肢の表示形式（チェックボックス / ラジオボタン / プルダウン）
  select_type: {
    '': '&#8212;',
    'c': 'チェックボックス',
    'r': 'ラジオボタン',
    's': 'プルダウン',
  },
  // 選択項目の並び（縦並び / 横並び）
  checkbox_line: {
    'lengthwise': '縦並び',
    'breadthwise': '横並び',
  },
  // マイページ種別
  my_page_type_id: {
    '1': '登録フォーム',
    '2': '更新フォーム',
    '4': 'カスタムページ(HTML)',
    '8': 'テーブル一覧',
    '16': 'リダイレクトページ',
  },
  // トリガーイベント
  event: {
    'INSERT': '登録時',
    'UPDATE': '更新時',
    'DELETE': '削除時',
  },
  // ソート（キーワード部分のみ登録。formatLabeledValue 側で _(up|down) を解析して（昇順/降順）を付与）
  sort: {
    'id': 'ID',
  },
  // ダウンロードモード
  dl_mode: {
    '0': '無効',
    '1': '有効',
  },
  // ダウンロードファイル形式
  dl_file_fmt: {
    '0': 'CSV',
    '1': 'TSV',
    '5': 'Excel',
  },
  // 携帯夜間配信
  night_stop_period: {
    '0': '停止なし',
    '1_2200_0700': '22:00&#12316;07:00',
    '1_2100_0800': '21:00&#12316;08:00',
    '1_2300_0600': '23:00&#12316;06:00',
  },
  // ドメイン検知
  domain_detect: {
    'all': '全ドメイン',
    'pc': 'PCのみ',
    'mobile': 'モバイルのみ',
  },
  // 存在モード
  exists_mode: {
    '0': '通常',
    '1': '存在チェック',
  },
  // 連携方法
  strength: {
    '10': '間接連携',
    '50': '直接連携',
    '100': '強制(100)',
  },
  // デザインテンプレート
  design_tmpl: {
    'sys.line': 'システム標準(ライン)',
    'sys.round': 'システム標準(ラウンド)',
    'sys.simple': 'システム標準(シンプル)',
  },
  // テーブルタイプ
  table_type: {
    'm': 'マルチデバイス',
    'p': 'PC用',
    's': 'スマートフォン用',
  },
  // フィルター種別
  filter_type: {
    'all': '全件',
    'login_user': 'ログインユーザーのみ',
  },
  // リンク種別
  m_linkType: {
    '': 'リンクなし',
    'card': '単表',
    'url': 'URL',
  },
  // 設定モード
  setting_mode: {
    'normal': '通常',
    'advanced': '詳細',
  },

  // ブール値風の "t" / "f" 表記
  // SPIRALは真偽値を "t"/"f" で表現する箇所が多い
  confirm_flg: { 't': '使用する', 'f': '使用しない', 'true': '使用する', 'false': '使用しない' },
  valchk_flg: { 't': 'あり', 'f': 'なし', 'true': 'あり', 'false': 'なし' },
  multi_thanks: { 't': 'あり', 'f': 'なし', 'true': 'あり', 'false': 'なし' },
  allow_http_flg: { 't': '許可', 'f': '不許可', 'true': '許可', 'false': '不許可' },
  allow_xss_flg: { 't': '許可', 'f': '不許可', 'true': '許可', 'false': '不許可' },
  allow_click_jacking_flg: { 't': '許可', 'f': '不許可', 'true': '許可', 'false': '不許可' },
  allow_ip_flg: { 't': '制限あり', 'f': '制限なし', 'true': '制限あり', 'false': '制限なし' },
  allow_security_content_flg: { 't': '許可', 'f': '不許可', 'true': '許可', 'false': '不許可' },
  allow_post_only_flg: { 't': 'POST限定', 'f': '制限なし', 'true': 'POST限定', 'false': '制限なし' },
  restrict_dynamic_keywords: { 't': '制限あり', 'f': '制限なし', 'true': '制限あり', 'false': '制限なし' },
  restrict_record_value_keyword: { 't': '制限あり', 'f': '制限なし', 'true': '制限あり', 'false': '制限なし' },
  mass_assignment_block: { 't': 'ブロック', 'f': '許可', 'true': 'ブロック', 'false': '許可' },
  area_close_flg: { 't': '締切り中', 'f': '公開中', 'true': '締切り中', 'false': '公開中' },
  remote_limit_on: { 't': '制限あり', 'f': '制限なし', 'true': '制限あり', 'false': '制限なし' },
  open_date_on: { 't': '設定あり', 'f': '設定なし', 'true': '設定あり', 'false': '設定なし' },
  expire_date_on: { 't': '設定あり', 'f': '設定なし', 'true': '設定あり', 'false': '設定なし' },
  notice_flg: { 't': '通知あり', 'f': '通知なし', 'true': '通知あり', 'false': '通知なし' },
  limit_notice_flg: { 't': '通知あり', 'f': '通知なし', 'true': '通知あり', 'false': '通知なし' },
  ready_flg: { 'true': '配信有効', 'false': '配信無効' },
  scheduled: { 'true': '定期実行あり', 'false': '定期実行なし' },
  notify_on_complete: { 'true': '通知あり', 'false': '通知なし' },
  active_flg: { 'true': '有効', 'false': '無効' },
  update_flg: { 'true': '更新可', 'false': '更新不可' },
  delete_flg: { 'true': '削除可', 'false': '削除不可' },
  click_login_flg: { 'true': '有効', 'false': '無効' },
  url_eternal: { 'true': '無期限', 'false': '期限あり' },
  loginlock_notice_flg: { 'true': '通知あり', 'false': '通知なし' },
  login_post_disabled_flg: { 'true': '無効', 'false': '有効' },
  han2zen: { 't': '変換する', 'f': '変換しない', 'true': '変換する', 'false': '変換しない' },
  space2null: { 't': '変換する', 'f': '変換しない', 'true': '変換する', 'false': '変換しない' },
  custom_flg: { 't': 'カスタムHTML使用', 'f': 'テンプレート使用', 'true': 'カスタムHTML使用', 'false': 'テンプレート使用' },
  advanced_flg: { 'true': '高度な条件', 'false': '通常条件' },
  rec_limit_flg: { 'true': '制限あり', 'false': '無制限' },
  mstOnInsertCascade: { '0': 'なし', '1': 'あり', 'true': 'あり', 'false': 'なし' },
  mstOnDeleteCascade: { '0': 'なし', '1': 'あり', 'true': 'あり', 'false': 'なし' },
  allowNullUpdate: { 'true': '許可', 'false': '不許可' },
  not_null: { 't': '必須', 'f': '任意', 'true': '必須', 'false': '任意' },
  valchk: { 't': 'あり', 'f': 'なし', 'true': 'あり', 'false': 'なし' },
  use_cf: { 't': '使用する', 'f': '使用しない', 'true': '使用する', 'false': '使用しない' },
  not_null_flg: { 't': 'あり', 'f': 'なし', 'true': 'あり', 'false': 'なし' },
  unique_flg: { 't': 'あり', 'f': 'なし', 'true': 'あり', 'false': 'なし' },
  unique: { 't': 'あり', 'f': 'なし', 'true': 'あり', 'false': 'なし' },
  byte_chk: { 't': 'する', 'f': 'しない', 'true': 'する', 'false': 'しない' },
  add_chk: { 't': 'する', 'f': 'しない', 'true': 'する', 'false': 'しない' },
  starts_with_chk: { 't': 'する', 'f': 'しない', 'true': 'する', 'false': 'しない' },
  prefix_use: { 't': 'する', 'f': 'しない', 'true': 'する', 'false': 'しない' },
  suffix_use: { 't': 'する', 'f': 'しない', 'true': 'する', 'false': 'しない' },
  index_flg: { 'true': 'あり', 'false': 'なし' },
  primary_key_flg: { 'true': 'あり', 'false': 'なし' },
  is_encrypted: { 'true': '暗号化', 'false': 'なし' },
  shared: { 'true': '共有', 'false': '非共有' },
  use_fido_flg: { 'true': '使用する', 'false': '使用しない' },
  use_pass_flg: { 'true': '使用する', 'false': '使用しない' },
  reg_notice_flg: { 'true': '通知する', 'false': '通知しない' },
  del_notice_flg: { 'true': '通知する', 'false': '通知しない' },
  block_rereg_csrf: { 'true': '有効', 'false': '無効' },
  // 入力文字
  char_limit: { '0': '制限なし', '1': 'ひらがなのみ', '2': 'カタカナのみ', '3': '半角英字のみ', '4': '半角数字のみ', '5': '半角英数のみ' },
  // 表示制御系のチェックボックス（t/f）
  note_use: { 't': '表示する', 'f': '表示しない', 'true': '表示する', 'false': '表示しない' },
  sample_use: { 't': '表示する', 'f': '表示しない', 'true': '表示する', 'false': '表示しない' },
  placeholder_use: { 't': '利用する', 'f': '利用しない', 'true': '利用する', 'false': '利用しない' },
  hz_convert_chk: { 't': '変換する', 'f': '変換しない', 'true': '変換する', 'false': '変換しない' },
  range_age_chk: { 't': '設定する', 'f': '設定しない', 'true': '設定する', 'false': '設定しない' },
  // 変換種別
  hz_convert_type: { '1': '全角から半角', '2': '半角から全角' },
  // 本日との差・年齢制限の許可フラグ
  operator_today: { '0': 'を許可', '1': '以外を許可' },
  operator_age: { '0': 'を許可', '1': '以外を許可' },
  // ファイルサイズ単位
  file_size_unit: { 'b': 'B', 'k': 'KiB', 'm': 'MiB' },
  // メール種別（_mailType）
  _mailType: { 'follow': 'シークエンス配信', 'thanks': 'サンクスメール' },
};
