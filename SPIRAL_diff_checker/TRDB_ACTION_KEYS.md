# TRDBアクション設定 JSONキー調査メモ

## action_list の確認済みキー（実JSONより）

| 設定項目 | JSONキー | 値の例 / 備考 |
|---|---|---|
| アクション名 | `actionName` | 文字列。action_list内のマッチングキー |
| アクション（処理） | `command` | `"insert"` / `"update"` / `"upsert"` |
| 発動条件 | `execCondition` | `0`=無条件, `1`=抽出ルールにマッチ |
| 発動条件の抽出ルールID | `select_id` | 環境固有ID。envSpecificKeysで除外 |
| アクション対象DB (name) | `db` | TRDBの `name` と同じ値（同一ファイル内） |
| アクション対象DB ID | `tgt_db_id` | 環境固有ID。envSpecificKeysで除外 |
| TRDB自身のID | `db_id` | 環境固有ID。envSpecificKeysで除外 |
| **アクション処理条件** | `commandCase` | 数値（ビットエンコード）。**差分比較対象** |
| 識別キー TRDB側 | `trdb_search_field` | フィールドの `title` |
| 識別キー 対象DB側 | `tgt_search_field` | フィールドの `title` |
| 認証キー TRDB側 | `trdb_search_field2` | フィールドの `title`。省略可 |
| 認証キー 対象DB側 | `tgt_search_field2` | フィールドの `title`。省略可 |
| フィールドマッピング配列 | `field_mapping` | 配列 |
| └ TRDBフィールド | `field_mapping[].left_field` | フィールドの `title` |
| └ 対象フィールド | `field_mapping[].right_field` | フィールドの `title` |
| └ null更新許可 | `field_mapping[].allowNullUpdate` | `"true"` / `"false"` 文字列。省略可 |
| └ **演算子** | `field_mapping[].operator` | `"+="` など。省略時は上書き（=） |

---

## commandCase の性質

`commandCase` は**アクションの処理条件**（フォーマットチェック・識別キーチェック等8項目の選択肢）を数値1つにビットエンコードしたもの。

- `3145728`（0x300000）= insert の標準値
- `3354675`（0x333333）= upsert の標準値
- `805380114` = update（識別キー+認証キー付き）の例

各ビット位置と設定項目の対応は未解析だが、**同一の設定なら同じ値になる**ため差分比較に使える。

---

## 実行順番について

`action_list` 配列のインデックス順が実行順番。独立したキーは存在しない。

---

## execCondition の値

| 値 | 意味 |
|---|---|
| `0` | 無条件 |
| `1` | 抽出ルールにマッチ（`select_id` で指定） |

---

## command の値

| 値 | 意味 |
|---|---|
| `"insert"` | 登録 |
| `"update"` | 更新 |
| `"upsert"` | 更新登録 |

---

## アクション処理条件（commandCase の設定画面項目）

設定画面に存在する条件と、その選択肢の一覧。JSONキーへの対応はcommandCase内でビットエンコードされているため個別キーはなし。

| チェック項目 | 発動タイミング | 選択肢 |
|---|---|---|
| フォーマットチェック | フォーマットエラー | エラー終了 / 正常終了 / 次アクションへ / NULLに変換し次チェックへ |
| 識別キーチェック | 識別キーがNULL | エラー終了 / 正常終了 / 次アクションへ |
| 認証キーチェック | 認証キーがNULL | エラー終了 / 正常終了 / 次アクションへ |
| 更新対象チェック（0件） | 更新対象なし | エラー終了 / 正常終了 / 次アクションへ |
| 更新対象チェック（1件） | 更新対象が1行 | エラー終了 / 正常終了 / 次アクションへ / 次チェックへ |
| 更新対象チェック（2件以上） | 更新対象が2行以上 | エラー終了 / 正常終了 / 次アクションへ / 次チェックへ |
| 入力必須チェック | 必須フィールドにNULLで更新 | エラー終了 / 正常終了 / 次アクションへ / NULLを維持し次チェックへ |
| 重複不可チェック | 重複エラー | エラー終了 / 正常終了 / 次アクションへ |

---

## コード上の参照

- `spiralRender.js:1067` — アクション一覧テーブルのレンダリング
- `spiralDiff.js:146-149` — `action_list` を `actionName` キーでマッチ
- `spiralDiff.js:174-181` — envSpecificKeys（`tgt_db_id`, `select_id` 等）
- `spiralDiff.js:470-473` — action_list 差分の `actionGroups` への振り分け
- `spiralConfig.js` — FIELD_LABELS / VALUE_LABELS でラベル定義済み
