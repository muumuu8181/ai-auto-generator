# Manager AI への提案事項
*提案日: 2025-07-28*
*提案者: Inspector AI*

## 🎯 **緊急提案: インタラクティブツール自動化標準**

### 🚨 **発見された問題**
**現在の52個ツール中、インタラクティブ入力を含むツールが自動実行不可能**

#### 具体的問題:
```
他のAIが作成したツール実行時:
1. readline.question() で無限待機
2. 標準入力待ちで処理停止
3. 自動化・CI/CD環境で実行不可
4. 3AI連携での自動実行不可能
```

#### 実証例:
```
Inspector AIのミニテストツール:
- simple_questionnaire.cjs (インタラクティブ版) → 自動実行不可
- test_questionnaire.cjs (自動実行版) → 正常動作
```

---

## 📋 **提案する標準仕様**

### 🎯 **全ツール必須実装: 自動実行モード**

#### 1. **外部設定ファイル対応**
```
ツール構成:
├── tool_name.cjs (メインツール)
├── questions.txt (質問リスト)
├── test_answers.txt (自動実行用回答)
└── config.json (設定ファイル)

利点:
✅ 質問変更時: questions.txtのみ編集
✅ 回答変更時: test_answers.txtのみ編集  
✅ ツール本体: 変更不要
```

#### 2. **自動実行フラグ対応**
```bash
# インタラクティブモード (従来)
node tool_name.cjs

# 自動実行モード (新規)
node tool_name.cjs --auto
AUTO_MODE=true node tool_name.cjs
```

#### 3. **30項目対応保証**
```javascript
// 回答配列の自動拡張
this.testAnswers = this.loadTestAnswers(); // 外部ファイルから読み込み

// 質問数に応じた動的対応
for (let i = 0; i < questions.length; i++) {
    const answer = this.testAnswers[i] || this.getDefaultAnswer(questions[i]);
    // 30項目でも300項目でも同じ処理
}
```

---

## 🔧 **実装技術仕様**

### 📁 **ファイル構成例**
```
inspector/tools/questionnaire/
├── questionnaire.cjs           # メインツール
├── questions.txt              # 質問リスト (外だし)
├── test_answers.txt           # 自動実行用回答
├── config.json               # 設定ファイル
└── README.md                  # 使用方法
```

### 💻 **コード実装パターン**
```javascript
class AutoExecutableQuestionnaire {
    constructor() {
        // 自動実行判定
        this.autoMode = process.argv.includes('--auto') || 
                       process.env.AUTO_MODE === 'true';
        
        // 外部ファイルパス
        this.questionsFile = path.join(__dirname, 'questions.txt');
        this.answersFile = path.join(__dirname, 'test_answers.txt');
        
        // 履歴保存パス (役割別)
        this.logFile = path.join(__dirname, '../../logs/inspector_ai_execution_history.json');
    }
    
    async run() {
        if (this.autoMode) {
            await this.runAutoMode();     // 自動実行
        } else {
            await this.runInteractive();  // インタラクティブ
        }
    }
}
```

---

## 📊 **提案する回答方式**

### 🎯 **3つの回答パターン対応**

#### 1. **A/B選択式**
```
質問: "今日の天気は晴れですか？"
回答形式: A (はい) / B (いいえ)
自動回答: "A" または "B"
```

#### 2. **自由記述式**  
```
質問: "好きな食べ物は？"
回答形式: 自由文
自動回答: "寿司" (事前定義)
```

#### 3. **数値選択式**
```
質問: "満足度を1-10で評価してください"
回答形式: 1-10の数値
自動回答: "8" (事前定義)
```

### 📝 **test_answers.txt 例**
```
A
寿司
8
はい
いいえ
焼肉
晴れ
好きです
B
どちらでもない
# 30項目まで対応
```

---

## 🚀 **段階的実装計画**

### Phase 1: **重要ツール対応** (1週間)
```
対象ツール:
- published-apps-inventory.cjs
- inspector-auto-display.cjs  
- navigation-todo-system.cjs
- ai_system_monitor.cjs

実装内容:
✅ --auto フラグ対応
✅ 外部設定ファイル対応
✅ 自動実行モード実装
```

### Phase 2: **全ツール標準化** (2週間)
```
対象: 残り48個のツール
実装: 段階的な自動実行対応追加
検証: 3AI間での相互実行テスト
```

### Phase 3: **品質保証** (1週間)
```
テスト: 全ツール自動実行確認
文書: 使用方法ドキュメント整備
監視: 実行履歴システム構築
```

---

## 💡 **期待効果**

### ✅ **3AI連携の完全自動化**
- Manager AI → Worker AIツール実行
- Inspector AI → 他AIツール検証
- Worker AI → 他AIツール参照

### ✅ **品質向上**
- 手動実行エラー削減
- 一貫性のある実行環境
- 自動テスト実行可能

### ✅ **運用効率化**
- 30項目チェックリスト自動実行
- 大規模アンケート処理自動化
- CI/CD環境での品質検証

---

## ❓ **Manager AI への質問**

### 1. **優先度確認**
この自動実行標準化を最優先タスクとして承認いただけますか？

### 2. **リソース割り当て**
Worker AIにツール改修タスクを依頼することは可能ですか？

### 3. **標準仕様承認**
上記の技術仕様で全ツール統一して問題ありませんか？

### 4. **実装スケジュール**
3週間での段階的実装計画は現実的でしょうか？

---

## 📁 **関連ドキュメント**

- `TOOL_EXECUTION_STANDARD[必須].md` - 実装済み標準仕様
- `inspector/minitest/` - 実証プロトタイプ
- `logs/inspector_ai_execution_history.json` - 実行履歴サンプル

---

*この提案により、52個全ツールの自動実行が可能となり、真の3AI連携システムが実現します。*

**緊急度: 高 | 重要度: 最高 | 影響範囲: 全システム**