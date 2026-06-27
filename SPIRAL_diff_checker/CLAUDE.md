# SPIRAL 設定ビューアー & 差分比較ツール

## プロジェクト概要

SPIRALの設定エクスポートフォルダ（JSON）を読み込み、Webブラウザ上で設定内容を閲覧、および2つの環境間（環境A・環境B）での設定差分を比較するためのツール。

## 技術スタック

- **Frontend**: Vanilla JavaScript (ES6+), CSS (Custom Properties)
- **Backend (Load)**: PHP (JS/CSSファイルの `require_once` 読み込みに使用)
- **Target**: SPIRAL エクスポートフォルダ構造

## ディレクトリ構成

- `GitCode/spiralConfigChk/spiral/`
  - `form/spiralSettingChk/edit_page.php`: メインのエントリポイント。
  - `custom_module/forSPIRALConfig/`
    - `style.css`: アプリ全体のスタイル定義。
    - `JS/`: 主要ロジック
      - `spiralParser.js`: フォルダ内JSONの読み込みとカテゴリ分け。
      - `spiralDiff.js`: JSONの深層比較（Deep Diff）と差分表示ロジック。
      - `spiralConfig.js`: カテゴリ定義、日本語ラベル（FIELD_LABELS/VALUE_LABELS）。
      - `spiralRender.js`: サイドバー、一覧、詳細画面のレンダリング。
      - `spiralFieldMap.js`: ID（rfid/fid）と表示名のマッピング。
      - `spiralState.js`: グローバル変数（envA, envB等）の状態管理。
      - `spiralLabelFormat.js`: 値のフォーマット（はい/いいえ、ラベル変換）。
      - `spiralInit.js`: イベントリスナー、読み込みの初期化。

## 主要なカテゴリ (CATEGORIES)

概要(overview), データベース(db), 抽出ルール(select), トリガー(trigger), DB制約(constraint), フォーム(form), マイエリア(myarea), テーブル一覧(table), メール配信(mail), カスタムプログラム(program), カスタムモジュール(module)

## ロジックのポイント

- **Deep Diff**: `spiralDiff.js` で、環境間のJSON差分を再帰的に抽出。
- **フィールド名置換**: `spiralFieldMap.js` で、SPIRAL独自の `$rfid:N$` などの記法を、DB定義から取得した表示名に変換して表示。
- **文字コード**: `spiralParser.js` 内で `TextDecoder` を使用し、EUC-JP, UTF-8, Shift_JIS を切り替え可能。

## 開発方針

- **トークン節約**: 設定項目のラベル定義（`FIELD_LABELS`）などは `spiralConfig.js` に集約されているため、ラベルの追加・修正時はそのファイルのみを参照する。
- **UI更新**: `navigate(category, item)` 関数により SPA 風の画面遷移を実現している。

## SPIRAL環境におけるJS保存エラー回避ナレッジ

### 1. エラーの原因

SPIRALの管理画面（PHPバリデータ/WAF）が、JavaScriptコード内の特定の記述を「サーバーへの攻撃（SQLインジェクションや不正なPHP変数展開）」と誤認して、通信を遮断（リダイレクト）することが原因。

- **PHP変数展開との重複**: `${変数名}` という記法（テンプレートリテラル）が、PHPの文字列内変数展開と全く同じであるため、不正なプログラムとして検知される。
- **SQLキーワードの検出**: 文字列中に `SELECT`, `UPDATE`, `INSERT`, `DELETE`, `FROM`, `WHERE` などの単語がそのまま含まれていると、SQLインジェクション攻撃とみなされる。
- **最新JS構文の未サポート**: SPIRAL内部のバリデータが古い場合、`?.`（オプショナルチェイニング）や `??`（Null合体演算子）などの最新構文を解析できず、構文エラーとしてブロックする。

### 2. 解消方法

問題となっている箇所を、古いブラウザやセキュリティフィルタでも解釈可能な「古典的（ES5形式）な記述」に書き換える。

- **テンプレートリテラルの排除**: バッククォート（`）と` ${}`を使用せず、シングルクォート（'）と`+` 演算子による文字列結合に書き換える。
- **最新演算子の置き換え**:
  - `obj?.prop` → `(obj && obj.prop)`
  - `val ?? default` → `(val !== null && val !== undefined ? val : default)`
- **アロー関数の置換**: `() => {}` を `function() {}` に書き換える。

### 3. エラーを起こさないための工夫

SPIRAL上でJSを管理・保存する際は、最初から以下の「超・保守的ルール」で記述することを推奨。

- **キーワードの分割（物理的遮断）**:
  - SQLキーワード: `'SEL' + 'ECT'`, `'UPD' + 'ATE'` のように、単語を分割して結合する。
  - HTMLタグ・属性: `'<sp' + 'an'`, `'sty' + 'le'`, `'cla' + 'ss'` など、検知されやすいHTML文字列も分割する。
- **徹底したES5準拠**:
  - 変数の宣言には `var` を使用する（`const`, `let` が原因になることもあるため）。
  - `Object.keys` や `indexOf` などの標準的なメソッド以外（特にES6以降）の使用を避ける。
- **コメントアウト内のチェック**: 実行されないコメントアウトの中にある記法さえも検知対象になるため、不要なコードは残さず削除するか、同様に分割する。

# 4. SPIRAL設定ファイルの構造

```text
MTATMS/
├── icon.png
├── info.json
└── devel/
    └── info.json
    └── custom_module/
        └── custom_module1.json //カスタムモジュールの内容
        └── custom_module2.json //カスタムモジュールの内容
        └── custom_module3.json //カスタムモジュールの内容

    └── custom_program/
        └── custom_program1.json //カスタムプログラムの内容
        └── custom_program2.json //カスタムプログラムの内容
        └── custom_program3.json //カスタムプログラムの内容

└── web/
    └── info.json
    └── form/
         └── formA/
            └── closed_page.html    //締切り画面のソース
            └── confirm_page.html   //確認画面のソース
            └── edit_page.html      //入力画面のソース
            └── err_chk.tsv         //共通エラー？
            └── err_page.html       //エラー画面のソース
            └── info.json           //フィールド別チェック
            └── thanks_page.html    //完了画面のソース
         └── formB/
            └── closed_page.html    //締切り画面のソース
            └── confirm_page.html   //確認画面のソース
            └── edit_page.html      //入力画面のソース
            └── err_chk.tsv         //共通エラー？
            └── err_page.html       //エラー画面のソース
            └── info.json           //フィールド別チェック
            └── thanks_page.html    //完了画面のソース
         └── formC/
         └── formD/        

    └── table/
        └── table1/
            └── info.json       //締切り画面のソース
            └── source.html     //一覧表ソース
            └── card_page/
                └── card0.html  //単表ソース
                └── card1.html  //単表ソース
                └── card2.html  //単表ソース
            └── searchForm/
                └── sf000000000  //検索フォームソース
        └── table2/     
      
    └── my_area/
        └── my_areaA/            //マイエリアタイトル
            └── click_login_page.html          //クリックログインページ
            └── click_login_timeout_page.html   //クリックログイン期限終了
            └── common_err.html   //その他のエラー 
            └── conf_success.html   //元メアド入力完了
            └── info.json      //設定ファイル
            └── login_err.html //ログインエラー画面
            └── login_lock_err.html //ログインロック画面
            └── pass error.html     //パスワードエラー
            └── reg_success.html    //基本使用しないパスワード登録ページ
            └── rereg_source.html   //新しいパスワードの入力ページ
            └── rereg_success.html    //パスワード再登録完了
            └── session_timeout_page.html   //セッションエラー
            └── status_page.html      //非公開時のページ
            └── rereg_sta.html  手続き開始

            └── my_page/            //マイエリアタイトル
                └── custom_page1.html   //カスタムページのソース
                └── custom_page2.html   //カスタムページのソース

            └── db/
                └── info.json
                └── constraint/
                    A_DB_B_DB.json  //仮想DB
                └── db/
                    └── admin_DB.json   //DBの設定内容
                    └── store_DB.json   //DBの設定内容
                    └── mail_DB.json    //DBの設定内容

                └── select/
                    └── admin_DB_select_1.json   //DBの抽出ルール
                    └── store_DB_select_1.json   //DBの抽出ルール
                    └── store_DB_select_2.json   //DBの抽出ルール
                    └── mail_DB_select_1.json    //DBの抽出ルール
                    └── mail_DB_select_2.json    //DBの抽出ルール
                    └── mail_DB_select_3.json    //DBの抽出ルール

                └── trigger/
                    └── admin_DB_trigger_1.json   //DBのトリガ
                    └── store_DB_trigger_1.json   //DBのトリガ
                    └── store_DB_trigger_2.json   //DBのトリガ
                    └── mail_DB_trigger_1.json    //DBのトリガ
                    └── mail_DB_trigger_2.json    //DBのトリガ

                └── extra/
                    └── info.json  //バッチ処理？

                └── mail/
                    └── info.json
                    └── follow/         //シークエンス配信設定
                        └── mail_info1.json         //シークエンス配信の封筒設定とリスト設定
                        └── mail_info2.json         //シークエンス配信の封筒設定とリスト設定
                        └── mail_info3.json         //シークエンス配信の封筒設定とリスト設定

                    └── thanks/         //サンクスメール設定
                        └── mail_info1.json     //サンクスメールの封筒設定とリスト設定
                        └── mail_info2.json     //サンクスメールの封筒設定とリスト設定
                        └── mail_info3.json     //サンクスメールの封筒設定とリスト設定
```

# 4. SPIRAL設定パラーメータ フィールド別チェック 対応表


| フィールドタイプ                | 設定項目名（json内対応テキスト）                             | 入力タイプ    | 選択肢/入力値                                                                               |
| ----------------------- | ---------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| 画像(100KiB)              | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | ファイルサイズエラーメッセージ（img_limit_over）                | テキスト     |                                                                                       |
|                         | ファイルタイプエラーメッセージ（）invalid_file_type             | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| メールアドレス（大・小文字無視）        | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 確認入力欄を使用する（use_cf）                             | チェックボックス |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | ドメイン（add）                                      | ラジオボタン   | addの第1引数がNULL：制限しない addの第1引数が4：拒否する addの第1引数が3：許可する                                   |
|                         | 制限するドメイン（add）                                  | チェックボックス | addの配列に0：PC (モバイルドメイン以外) を選択 選択したドメインはテキストで入っている（例：「o_mobile」がある場合は「その他モバイルドメイン」を選択中） |
|                         | ドメインその他                                        | テキスト     |                                                                                       |
|                         | Vodafone(TM)ドメイン変換（add）                        | チェックボックス | addの配列に6：チェックあり                                                                       |
|                         | 確認エラーメッセージ（cnf_err_msg）                        | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 性別                      | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 郵便番号                    | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 都道府県                    | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 電話番号                    | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| セレクト                    | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 選択項目の並び（checkbox_line）                         | ラジオボタン   | lengthwise：縦並び breadthwise：横並び                                                        |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| マルチセレクト                 | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 選択項目の並び（checkbox_line）                         | ラジオボタン   | lengthwise：縦並び breadthwise：横並び                                                        |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| マルチセレクト(128項目)          | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 選択項目の並び（checkbox_line）                         | ラジオボタン   | lengthwise：縦並び breadthwise：横並び                                                        |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| ブーリアン                   | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 選択肢の表示形式（select_type）                          | ラジオボタン   | c：チェックボックス r：ラジオボタン s：プルダウン                                                           |
|                         | 選択項目の並び（checkbox_line）                         | ラジオボタン   | lengthwise：縦並び breadthwise：横並び                                                        |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストフィールド(32 bytes)     | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストフィールド(32 bytes)かな   | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストフィールド(32 bytes)カナ   | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストフィールド(32 bytes)ローマ字 | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストフィールド(64 bytes)     | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストフィールド(64 bytes)かな   | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストフィールド(64 bytes)カナ   | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストフィールド(64 bytes)ローマ字 | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストフィールド(128 bytes)    | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストエリア(256 bytes)      | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストエリア(512 bytes)      | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストエリア(1024 bytes)     | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストエリア(2048 bytes)     | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストエリア(4096 bytes)     | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストエリア(8192 bytes)     | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 数字・記号・アルファベット(6 bytes)  | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 開始文字制限を設定する（starts_with_chk）                   | チェックボックス |                                                                                       |
|                         | 開始文字制限テキスト（starts_with）                        | テキスト     |                                                                                       |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 数字・記号・アルファベット(32 bytes) | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 開始文字制限を設定する（starts_with_chk）                   | チェックボックス |                                                                                       |
|                         | 開始文字制限テキスト（starts_with）                        | テキスト     |                                                                                       |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 整数                      | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 実数                      | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 通貨                      | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 日付（○年○月○日 ○時○分○秒）       | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | 本日との差を設定する                                     | チェックボックス |                                                                                       |
|                         | 本日との差 入力値が本日(登録日)のbegin_today日前から（begin_today） | テキスト     |                                                                                       |
|                         | 本日との差 end_today日後まで（end_today）                 | テキスト     |                                                                                       |
|                         | 本日との差-許可フラグ（operator_today）                    | プルダウン    | 0：を許可 1：以外を許可                                                                         |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 日付（○年○月○日 ○時○分）         | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | 本日との差を設定する                                     | チェックボックス |                                                                                       |
|                         | 本日との差 入力値が本日(登録日)のbegin_today日前から（begin_today） | テキスト     |                                                                                       |
|                         | 本日との差 end_today日後まで（end_today）                 | テキスト     |                                                                                       |
|                         | 本日との差-許可フラグ（operator_today）                    | プルダウン    | 0：を許可 1：以外を許可                                                                         |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 日付（○年○月○日 ○時）           | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | 本日との差を設定する                                     | チェックボックス |                                                                                       |
|                         | 本日との差 入力値が本日(登録日)のbegin_today日前から（begin_today） | テキスト     |                                                                                       |
|                         | 本日との差 end_today日後まで（end_today）                 | テキスト     |                                                                                       |
|                         | 本日との差-許可フラグ（operator_today）                    | プルダウン    | 0：を許可 1：以外を許可                                                                         |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 日付（○年○月○日）              | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | 年齢制限-設定する（range_age_chk）                       | チェックボックス |                                                                                       |
|                         | 年齢制限-下限（begin_age）                             | テキスト     |                                                                                       |
|                         | 年齢制限-上限（end_age）                               | テキスト     |                                                                                       |
|                         | 年齢制限-許可フラグ（operator_age）                       | プルダウン    | 0：を許可 1：以外を許可                                                                         |
|                         | 本日との差を設定する                                     | チェックボックス |                                                                                       |
|                         | 本日との差 入力値が本日(登録日)のbegin_today日前から（begin_today） | テキスト     |                                                                                       |
|                         | 本日との差 end_today日後まで（end_today）                 | テキスト     |                                                                                       |
|                         | 本日との差-許可フラグ（operator_today）                    | プルダウン    | 0：を許可 1：以外を許可                                                                         |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 日付（○年○月）                | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 月日（○月○日）                | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 時刻（○時○分）                | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 曜日（○曜日）                 | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 選択項目の並び（checkbox_line）                         | ラジオボタン   | lengthwise：縦並び breadthwise：横並び                                                        |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 時間（○年○カ月）               | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 時間（○日）                  | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 時間（○週間）                 | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 範囲指定する（support_input）                          | チェックボックス | 未選択時はNULL                                                                             |
|                         | 範囲指定（下限値）（begin）                               | テキスト     |                                                                                       |
|                         | 範囲指定（上限値）（end）                                 | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| メッセージダイジェスト（SHA256）     | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 確認入力欄を使用する（use_cf）                             | チェックボックス |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | 確認エラーメッセージ（cnf_err_msg）                        | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| メッセージダイジェスト（SHA1）       | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 確認入力欄を使用する（use_cf）                             | チェックボックス |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | 確認エラーメッセージ（cnf_err_msg）                        | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| メッセージダイジェスト（MD5）        | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 確認入力欄を使用する（use_cf）                             | チェックボックス |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | 確認エラーメッセージ（cnf_err_msg）                        | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 簡易パスワード                 | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 確認入力欄を使用する（use_cf）                             | チェックボックス |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | 確認エラーメッセージ（cnf_err_msg）                        | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| パスワード                   | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 確認入力欄を使用する（use_cf）                             | チェックボックス |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | 確認エラーメッセージ（cnf_err_msg）                        | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| テキストフィールド(32 bytes)     | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | 入力文字（char_limit）                               | プルダウン    | 0：制限なし 1：ひらがなのみ 2：カタカナのみ 3：半角英字のみ 4：半角数字のみ 5：半角英数のみ                                   |
|                         | その他許可する半角文字を設定する（add_chk）                      | チェックボックス |                                                                                       |
|                         | その他許可する半角文字テキスト（add_char）                      | テキスト     |                                                                                       |
|                         | 数字・記号・アルファベット変換する（hz_convert_chk）              | チェックボックス |                                                                                       |
|                         | 数字・記号・アルファベット変換詳細（hz_convert_type）             | プルダウン    | 1：全角から半角 2：半角から全角                                                                     |
|                         | 入力バイト数制限を設定する（byte_chk）                        | チェックボックス |                                                                                       |
|                         | 入力バイト数下限（min）                                  | テキスト     |                                                                                       |
|                         | 入力バイト数上限（max）                                  | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| ファイル                    | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | ファイルサイズ-設定する（add）                              | チェックボックス |                                                                                       |
|                         | ファイルサイズ-上限値（file_size）                         | テキスト     |                                                                                       |
|                         | ファイルサイズ-単位（file_size_unit）                     | プルダウン    | b：B k：KiB m：MiB                                                                       |
|                         | 許可する拡張子（permit）                                | テキスト     |                                                                                       |
|                         | ファイルサイズエラーメッセージ（img_limit_over）                | テキスト     |                                                                                       |
|                         | ファイルタイプエラーメッセージ（invalid_file_type）             | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| 緯度経度                    | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |
| メールアドレス（大・小文字区別）        | 項目タイトル（form_title）                             | テキスト     |                                                                                       |
|                         | 例文を表示する（sample_use）                            | チェックボックス |                                                                                       |
|                         | 例文（sample）                                     | テキスト     |                                                                                       |
|                         | 注意事項を表示する（note_use）                            | チェックボックス |                                                                                       |
|                         | 注意事項（note）                                     | テキスト     |                                                                                       |
|                         | プレースホルダーを利用する（placeholder_use）                 | チェックボックス |                                                                                       |
|                         | プレースホルダー（placeholder1）                         | テキスト     |                                                                                       |
|                         | 接頭語・接尾語を付加する（suffix_use）                       | チェックボックス |                                                                                       |
|                         | 接頭語（prefix）                                    | テキスト     |                                                                                       |
|                         | 接尾語（suffix）                                    | テキスト     |                                                                                       |
|                         | 確認入力欄を使用する（use_cf）                             | チェックボックス |                                                                                       |
|                         | 入力値チェック（valchk）                                | チェックボックス |                                                                                       |
|                         | 入力必須（not_null）                                 | チェックボックス |                                                                                       |
|                         | 重複不可（unique）                                   | チェックボックス |                                                                                       |
|                         | ドメイン（add）                                      | ラジオボタン   | addの第1引数がNULL：制限しない addの第1引数が4：拒否する addの第1引数が3：許可する                                   |
|                         | 制限するドメイン（add）                                  | チェックボックス | addの配列に0：PC (モバイルドメイン以外) を選択 選択したドメインはテキストで入っている（例：「o_mobile」がある場合は「その他モバイルドメイン」を選択中） |
|                         | ドメインその他                                        | テキスト     |                                                                                       |
|                         | Vodafone(TM)ドメイン変換（add）                        | チェックボックス | addの配列に6：チェックあり                                                                       |
|                         | 確認エラーメッセージ（cnf_err_msg）                        | テキスト     |                                                                                       |
|                         | エラーメッセージ（msg）                                  | テキスト     |                                                                                       |


