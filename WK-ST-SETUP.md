# /wk-st Command Setup Guide

**元の`/wk-st`コマンドを使用したい場合の設定手順**

## Background
- このリポジトリのコマンド: `/generate`
- 元のコマンド名: `/wk-st` (work_start)
- 機能は同じですが、コマンド名が異なります

## Option 1: /generate コマンドを使用（推奨）
このリポジトリをそのまま使用:
```bash
claude
/generate  # 同じ機能
```

## Option 2: /wk-st コマンドに変更

### Step 1: コマンドファイル名変更
```bash
# ai-auto-generator ディレクトリで実行
mv .claude/commands/generate.md .claude/commands/wk-st.md
```

### Step 2: コマンド内容の更新
`.claude/commands/wk-st.md` の最初の行を変更:
```markdown
# /wk-st - AI Auto App Generator
```

### Step 3: 動作確認
```bash
claude
/wk-st  # 元のコマンド名で実行可能
```

## Option 3: 両方使用可能にする

### コピーしてエイリアス作成
```bash
cp .claude/commands/generate.md .claude/commands/wk-st.md
```

編集: `.claude/commands/wk-st.md`
```markdown
# /wk-st - AI Auto App Generator (Alias for /generate)

Same functionality as /generate command.
```

これで両方のコマンドが使用可能:
```bash
claude
/generate  # または
/wk-st     # どちらも同じ機能
```

## 実際の設定手順 (Option 2の場合)

### 1. Repository Clone
```bash
git clone https://github.com/muumuu8181/ai-auto-generator.git
cd ai-auto-generator
```

### 2. Command Name Change  
```bash
mv .claude/commands/generate.md .claude/commands/wk-st.md
```

### 3. Edit Command Title
```bash
# .claude/commands/wk-st.md の1行目を変更
sed -i '1s/# \/generate.*/# \/wk-st - AI Auto App Generator/' .claude/commands/wk-st.md
```

### 4. Follow Main Setup
[SETUP.md](SETUP.md) の手順に従って設定を完了

### 5. Use /wk-st Command
```bash
claude
/wk-st
```

## Summary

| Option | Command Available | Setup Required |
|--------|------------------|----------------|
| 1 | `/generate` | [SETUP.md](SETUP.md) のみ |
| 2 | `/wk-st` | ファイル名変更 + [SETUP.md](SETUP.md) |
| 3 | `/generate` + `/wk-st` | ファイルコピー + [SETUP.md](SETUP.md) |

**推奨**: Option 1 (`/generate`) - 追加設定不要

**元のコマンド名希望**: Option 2 - 簡単な名前変更のみ

すべてのオプションで同じ機能（AI自動アプリ生成・GitHub Pages公開）が利用可能です。