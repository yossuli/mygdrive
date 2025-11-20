# mygdrive

`mygdrive` は既存の `gdrive` CLI をラップして、よく使う操作を簡単にする小さな TypeScript 製 CLI ラッパーです。

## セットアップ (開発)

```bash
# 依存をインストール
pnpm install

# 開発実行（インストールせずに直接実行）
pnpm run dev -- <command>
```

## ビルドと実行

```bash
pnpm run build
node dist/cli.js <command>
# またはグローバルにインストール
pnpm add -g .
mygdrive <command>
```

## 前提

- `gdrive` CLI がシステムにインストールされ、`gdrive` コマンドで利用可能であること。

## 例

- ファイル一覧: `mygdrive list`
- ファイルアップロード: `mygdrive upload ./path/to/file`
- ファイルダウンロード: `mygdrive download <fileId> ./out`

詳細は `mygdrive --help` を参照してください。
