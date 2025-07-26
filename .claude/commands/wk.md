# /wk - AI Auto Workflow 短縮コマンド v0.18

## 使用方法
- `/wk` - 単一アプリ生成（`/wk-st`と同じ）
- `/wk 3` - 3個のアプリを連続生成（`/wk-st 3`と同じ）
- `/wk 5` - 5個のアプリを連続生成（`/wk-st 5`と同じ）
- `/wk 13` - 13個のアプリを連続生成（`/wk-st 13`と同じ）

## 実行

### 引数チェックと転送
```bash
!echo "🚀 /wk 短縮コマンド実行"

# 引数をそのまま /wk-st に転送
!ARGS="$@"
!if [ -z "$ARGS" ]; then
  echo "📱 単一アプリ生成モード"
  exec bash -c "source .claude/commands/wk-st.md"
else
  echo "🔄 連続生成モード: $ARGS 個のアプリ"
  exec bash -c "source .claude/commands/wk-st.md" -- "$ARGS"
fi
```

## 注意事項
このコマンドは `/wk-st` コマンドのエイリアスです。全ての機能・品質検証システムは `/wk-st` と同等です。

---
*短縮コマンドv0.18 - 3段階品質検証対応*