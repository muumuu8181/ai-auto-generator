# Worker AIバージョン報告必須ルール[超重要L10]

## 🎯 問題認識
Worker AIが作業時に使用したバージョン情報がログから読み取れず、問題発生時の原因特定・改善効果測定が困難

## 📋 必須報告ルール

### **Rule 1: 作業開始時のバージョン確認**
Worker AIは作業開始時に以下を必ず確認・記録：

```bash
# 必須確認コマンド
echo "=== 作業環境バージョン確認 ==="
cat VERSION.md | head -10
echo "現在のワーキングディレクトリ: $(pwd)"
git log --oneline -1
echo "作業開始時刻: $(date)"
```

### **Rule 2: 最終報告での必須記載**
すべての作業完了時、以下の情報を必ず報告：

#### **reflection.md への必須追加**
```markdown
## 🔧 作業環境情報

### バージョン情報
- **AI Auto Generator バージョン**: v0.22
- **Git Commit Hash**: 8a1fdc0 (最新コミット)
- **作業ディレクトリ**: /path/to/ai-auto-generator
- **作業日時**: 2025-XX-XX XX:XX:XX

### 使用したツール・機能
- **統一フォーマット**: [進捗表示フォーマット v0.22]
- **チェックリスト**: [デプロイ完全チェックリスト使用]
- **ガイド**: [リポジトリ間違い防止ガイド v0.22]
- **自動検知**: [不正配置検知システム有効]

### 作業環境の状況
- **フォルダ分担**: worker-ai/専用フォルダ使用
- **相互監視**: Manager AI・Inspector AI連携実施
- **意見提案**: [提案した場合は記載]
```

#### **work_log.md への必須追加**
```markdown
## 🔧 技術環境

**作業環境バージョン**: AI Auto Generator v0.22  
**Git状況**: 8a1fdc0 - v0.22: AI意見提案システム実装  
**使用機能**:
- フォルダ分担システム (v0.21)
- リポジトリ間違い防止ガイド (v0.22)
- デプロイ5段階チェックリスト (v0.21)
- 意見提案システム (v0.22)

**環境固有の問題**: [あれば記載]
**バージョン関連の注意事項**: [あれば記載]
```

### **Rule 3: 統一ログへの自動記録**
unified-logger.cjs が自動的にバージョン情報を記録するよう改善：

```javascript
// 改善案: unified-logger.cjs
constructor(sessionId, appId = null) {
    // バージョン情報自動取得
    const versionInfo = this.getVersionInfo();
    
    this.log('system', 'version_check', 'Version information recorded', {
        autoGeneratorVersion: versionInfo.version,
        gitCommitHash: versionInfo.gitHash,
        workingDirectory: process.cwd(),
        timestamp: new Date().toISOString()
    });
}

getVersionInfo() {
    try {
        const versionFile = fs.readFileSync('./VERSION.md', 'utf8');
        const versionMatch = versionFile.match(/現在のバージョン: (v[\d\.]+)/);
        const gitHash = execSync('git rev-parse --short HEAD', {encoding: 'utf8'}).trim();
        
        return {
            version: versionMatch ? versionMatch[1] : 'unknown',
            gitHash: gitHash
        };
    } catch (error) {
        return {
            version: 'error',
            gitHash: 'error'
        };
    }
}
```

## 📊 バージョン情報の活用

### **問題分析での活用**
```markdown
例）分析時の確認項目
- 「このミスはv0.21で修正済みの問題では？」
- 「v0.22の新機能を使用していたか？」
- 「古いバージョンでの作業による問題か？」
- 「バージョン更新の効果が確認できるか？」
```

### **改善効果測定での活用**
```markdown
例）効果測定の項目
- v0.21導入前後でのリポジトリ間違い発生率
- v0.22意見提案システム導入後の品質向上度
- 各バージョンでの作業効率・品質の変化
- 新機能の実際の利用率・効果
```

### **Worker AI学習での活用**
```markdown
例）学習・引き継ぎでの活用
- 「v0.22環境で効果的だった手法」
- 「このバージョンで注意すべき変更点」
- 「新機能の実際の使用感・改善提案」
- 「バージョン固有の問題・回避策」
```

## 🚫 報告不備への対応

### **バージョン情報未記載の場合**
- ❌ **受付拒否**: バージョン情報なしの完了報告は受け付けない
- ⚠️ **即座修正**: 24時間以内にバージョン情報追記を必須
- 📝 **学習記録**: 「バージョン情報記載忘れ」をreflection.mdに記録

### **不正確な情報の場合**
- 🔍 **自動検証**: unified-logger.cjsのデータと照合
- 📊 **差異指摘**: 不一致があれば即座に修正要求
- 🎯 **正確性強化**: 確認手順の見直し・改善

## 📋 Worker AI用チェックリスト

### **作業開始時チェック**
```markdown
# 🔧 作業開始時バージョン確認

## 必須確認項目
- [ ] `cat VERSION.md | head -10` 実行してバージョン確認
- [ ] `git log --oneline -1` で最新コミット確認
- [ ] `pwd` で作業ディレクトリ確認
- [ ] 作業開始時刻記録

## 確認結果記録
- バージョン: [記録]
- Git Hash: [記録]
- ディレクトリ: [記録]
- 開始時刻: [記録]
```

### **作業完了時チェック**
```markdown
# 📝 作業完了時バージョン報告

## reflection.md 必須記載
- [ ] 🔧 作業環境情報セクション追加
- [ ] AI Auto Generator バージョン記載
- [ ] Git Commit Hash記載
- [ ] 使用したツール・機能記載
- [ ] 作業環境の状況記載

## work_log.md 必須記載
- [ ] 🔧 技術環境セクション追加
- [ ] 作業環境バージョン記載
- [ ] Git状況記載
- [ ] 使用機能記載

## 最終確認
- [ ] バージョン情報の正確性確認
- [ ] 統一ログとの一致確認
- [ ] 次回作業者への引き継ぎ情報充実
```

## 🎯 期待効果

### **問題分析の精度向上**
- バージョン固有の問題の特定
- 改善効果の正確な測定
- 過去ログとの比較分析

### **改善効果の可視化**
- 新機能導入の効果測定
- バージョンアップの価値証明
- 継続改善の根拠データ蓄積

### **Worker AI間の学習促進**
- バージョン別の知見共有
- 環境変化への適応支援
- 効果的手法の横展開

---

**重要**: このルールにより、すべての作業がバージョン情報と紐づけられ、問題分析・改善効果測定・学習促進が大幅に向上する。

**Worker AI必須**: 作業完了報告時にバージョン情報記載は**絶対必須**。未記載の報告は受付拒否。