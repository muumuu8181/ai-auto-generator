# 進捗表示統一フォーマット[超重要L10]

## 🎯 問題認識
- ws 3実行時に3つアプリ作成の進捗が不明確
- フェーズとアプリ数の混乱（5つのアプリ？5つのフェーズ？）
- Worker報告フォーマットがバラバラ

## 📊 統一進捗表示フォーマット

### **連続アプリ生成時の表示**
```
🚀 [アプリ進捗: 2/3] [フェーズ: 3/5] アプリ生成実行中
📱 現在のアプリ: app-0000019-x7k2m9
⏱️ 現在のフェーズ: Phase 3 - AI Generation
🎯 全体進捗: 66% (2完了 + 1実行中)
```

### **詳細進捗テンプレート**
```markdown
## 🎯 [ws 3] 連続アプリ生成進捗レポート

### 📊 全体進捗
- **実行コマンド**: ws 3
- **対象アプリ数**: 3個
- **完了アプリ**: 2個 ✅
- **実行中アプリ**: 1個 🔄
- **残りアプリ**: 0個 ⏳
- **全体進捗率**: 66%

### 📱 現在作業中
- **アプリID**: app-0000019-x7k2m9  
- **現在フェーズ**: Phase 3/5 - AI Generation
- **フェーズ進捗**: 60% (3/5フェーズ完了)
- **予想残り時間**: 約15分

### ✅ 完了済みアプリ
1. **app-0000017-k7x9m2** (完了) ✅
2. **app-0000018-m9x3k2** (完了) ✅

### ⏳ 待機中アプリ  
なし（全て処理済み）

### 🔍 品質チェック状況
- **完了アプリの品質**: 2/2 検証済み ✅
- **実行中チェック**: Phase 3.5で検証予定
- **Inspector評価**: 完了後実施予定
```

## 🎯 Worker AI報告統一フォーマット

### **アプリ完了時の必須報告形式**
```markdown
# 🎉 アプリ完了報告

## 📱 基本情報
- **アプリID**: app-XXXXXXX-XXXXXX
- **完了日時**: YYYY-MM-DD HH:MM:SS
- **総作業時間**: XX分
- **連続生成**: X/Y個目（該当時のみ）

## ✅ 完了確認チェックリスト
- [ ] index.html作成・動作確認済み
- [ ] reflection.md作成済み  
- [ ] requirements.md作成済み
- [ ] work_log.md作成済み
- [ ] published-appsに正しく配置済み
- [ ] Phase 3.5品質検証完了

## 🎯 技術仕様
- **主要技術**: [使用技術スタック]
- **ファイル構成**: [作成ファイル一覧]
- **機能概要**: [実装機能の要約]

## 📊 品質メトリクス
- **動作確認**: [ブラウザテスト結果]
- **レスポンシブ**: [モバイル対応状況]  
- **アクセシビリティ**: [基本対応状況]

## 🔍 次回改善点
- **学習事項**: [今回学んだこと]
- **改善提案**: [次回への提案]
- **注意事項**: [他のWorker AIへの伝達事項]
```

### **進行中の状況報告形式**
```markdown
# 🔄 作業進捗報告

## 📊 現在状況
- **アプリID**: app-XXXXXXX-XXXXXX
- **現在フェーズ**: Phase X/5 - [フェーズ名]
- **フェーズ進捗**: XX%
- **連続生成進捗**: X/Y個目

## ⏱️ 作業状況
- **開始時刻**: HH:MM:SS
- **現在時刻**: HH:MM:SS  
- **経過時間**: XX分
- **予想残り時間**: XX分

## 🎯 現在の作業内容
[具体的に何をしているかの説明]

## ⚠️ 発生した問題・注意事項
[問題があれば記載、なければ「特になし」]
```

## 🔧 Manager AI作成ツール

### **progress-monitor.cjs** (新規作成予定)
```javascript
class ProgressMonitor {
    constructor(totalApps, currentApp = 1) {
        this.totalApps = totalApps;
        this.currentApp = currentApp;
        this.currentPhase = 1;
        this.totalPhases = 5;
    }
    
    displayProgress() {
        const appProgress = `${this.currentApp}/${this.totalApps}`;
        const phaseProgress = `${this.currentPhase}/${this.totalPhases}`;
        const overallPercent = Math.round(
            ((this.currentApp - 1) * 100 + (this.currentPhase / this.totalPhases) * 100) 
            / this.totalApps
        );
        
        console.log(`🚀 [アプリ進捗: ${appProgress}] [フェーズ: ${phaseProgress}] 実行中`);
        console.log(`🎯 全体進捗: ${overallPercent}%`);
    }
    
    updatePhase(phase) {
        this.currentPhase = phase;
        this.displayProgress();
    }
    
    nextApp() {
        this.currentApp++;
        this.currentPhase = 1;
        this.displayProgress();
    }
}
```

## 👁️ Inspector AI チェックルール（チェック項目のみ）

### **Inspector AIが策定するチェック項目**
```markdown
# Inspector AI チェックルール

## 📋 進捗表示チェック項目
- [ ] アプリ進捗が正確に表示されているか
- [ ] フェーズ進捗が混乱なく表示されているか
- [ ] 全体進捗率が計算通りか
- [ ] 予想時間が妥当か

## 📋 Worker報告チェック項目  
- [ ] 統一フォーマットに従っているか
- [ ] 必須項目が全て記載されているか
- [ ] 品質メトリクスが具体的か
- [ ] 次回改善点が建設的か

## 📋 連続生成チェック項目
- [ ] 指定個数のアプリが実際に作成されているか
- [ ] 途中で停止していないか
- [ ] 各アプリの品質が維持されているか
- [ ] リソース使用量が適切か
```

**注意**: Inspector AIはこれらのチェック項目を策定し、チェック結果を報告するが、**全体ルールの決定はManager AIが行う**

## 🎯 実装優先順位

### v0.21での実装
1. **進捗表示統一フォーマット**確立
2. **Worker報告フォーマット**標準化  
3. **progress-monitor.cjs**作成
4. **ws コマンド改善**

### v0.22での拡張
1. **Inspector AIチェックシステム**統合
2. **自動品質レポート**生成
3. **継続改善サイクル**確立

---

**ルール策定責任**: Manager AI
**チェック実行責任**: Inspector AI  
**フォーマット遵守責任**: Worker AI