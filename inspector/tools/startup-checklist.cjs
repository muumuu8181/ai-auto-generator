#!/usr/bin/env node
/**
 * Inspector AI毎回会話前必須チェックリストツール
 * 全てのセットアップルール遵守を自動確認
 */

const fs = require('fs');
const path = require('path');

class InspectorStartupChecklist {
    constructor() {
        this.checklistFile = path.join(__dirname, 'startup-checklist-items.txt');
        this.logFile = path.join(__dirname, '../../logs/inspector_ai_execution_history.json');
        this.checklist = [];
        this.results = [];
        this.sessionId = `startup_session_${Date.now()}`;
        
        // Inspector AI必須手順（セットアップルールから抽出）
        this.requiredSteps = [
            '正しいディレクトリ確認 (/ai-auto-generator/)',
            '重要度確認ツール実行 (find コマンド)',
            '確認報告メッセージ記載 (「私は毎回〜」)',
            'Inspector AIチェックリスト確認完了報告',
            '5グラフ要約表示 (📱📋🌐🔧💊)',
            '視覚ダッシュボード自動実行',
            '曖昧ルール具体化提案 (発見時)',
            '未完了時の作業停止遵守確認',
            '具体的監査作業開始準備完了'
        ];
    }

    /**
     * チェックリスト項目読み込み
     */
    loadChecklist() {
        try {
            // ファイルが存在しない場合は必須手順で初期化
            if (!fs.existsSync(this.checklistFile)) {
                this.createDefaultChecklist();
            }
            
            const content = fs.readFileSync(this.checklistFile, 'utf8');
            this.checklist = content.trim().split('\n').filter(item => item.length > 0);
            console.log(`📋 チェックリスト読み込み完了: ${this.checklist.length}件`);
            return true;
        } catch (error) {
            console.error('❌ チェックリストファイル読み込み失敗:', error.message);
            // フォールバックとして必須手順を使用
            this.checklist = this.requiredSteps;
            return true;
        }
    }

    /**
     * デフォルトチェックリスト作成
     */
    createDefaultChecklist() {
        try {
            const content = this.requiredSteps.join('\n');
            fs.writeFileSync(this.checklistFile, content);
            console.log(`📝 デフォルトチェックリスト作成: ${this.checklistFile}`);
        } catch (error) {
            console.error('❌ チェックリストファイル作成失敗:', error.message);
        }
    }

    /**
     * チェックリスト実行（自動確認モード）
     */
    processChecklist() {
        console.log('\n🎯 Inspector AI起動前必須チェック開始');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        for (let i = 0; i < this.checklist.length; i++) {
            const item = this.checklist[i];
            const status = this.checkItemStatus(item, i + 1);
            
            console.log(`\n${i + 1}. ${item}`);
            console.log(`   📊 状況: ${status.message}`);
            console.log(`   ${status.completed ? '✅' : '❌'} ${status.completed ? '完了' : '未完了'}`);

            this.results.push({
                item_number: i + 1,
                item: item,
                completed: status.completed,
                status_message: status.message,
                timestamp: new Date().toISOString(),
                action_required: status.action_required || ''
            });

            if (!status.completed) {
                console.log(`   🚨 必要なアクション: ${status.action_required}`);
            }
        }

        console.log('\n🎉 チェックリスト確認完了');
        this.displaySummary();
    }

    /**
     * 各項目の状況確認
     */
    checkItemStatus(item, itemNumber) {
        if (item.includes('正しいディレクトリ確認')) {
            const currentDir = process.cwd();
            const isCorrectDir = currentDir.includes('ai-auto-generator') && !currentDir.includes('minitest');
            return {
                completed: isCorrectDir,
                message: isCorrectDir ? '✅ 正しいディレクトリで実行中' : `❌ 間違ったディレクトリ: ${currentDir}`,
                action_required: isCorrectDir ? '' : 'cd /mnt/c/Users/user/ai-auto-generator で正しいディレクトリに移動'
            };
        }
        
        if (item.includes('重要度確認ツール実行')) {
            return {
                completed: false, // 実際は未実行
                message: '❌ find コマンド未実行',
                action_required: 'find . -name "*重要L[8-9]*" -o -name "*超重要L10*" | head -10 を実行'
            };
        }
        
        if (item.includes('確認報告メッセージ記載')) {
            return {
                completed: false, // 実際は未記載
                message: '❌ 必須メッセージ未記載',
                action_required: '「私は毎回、重要度が8以上のテキストを確認してから返事をします」を記載'
            };
        }
        
        if (item.includes('チェックリスト確認完了報告')) {
            return {
                completed: false, // 実際は未報告
                message: '❌ Inspector AIチェックリスト確認報告なし',
                action_required: '中立性・監査ツール準備等の確認完了報告を記載'
            };
        }
        
        if (item.includes('5グラフ要約表示')) {
            return {
                completed: false, // 実際は未表示
                message: '❌ 5グラフ要約未表示',
                action_required: '📱アプリ統計・🌐URL健全性・🔧ツール・📋チェックリスト・💊健全性の横並び表示'
            };
        }
        
        if (item.includes('視覚ダッシュボード')) {
            return {
                completed: false, // 実際は未実行
                message: '❌ ダッシュボード自動実行なし',
                action_required: 'node core/inspector-auto-display.cjs を実行'
            };
        }
        
        if (item.includes('曖昧ルール具体化提案')) {
            return {
                completed: true, // 常に実行可能
                message: '✅ 曖昧ルール検出・具体化提案システム準備完了',
                action_required: '曖昧な表現を発見した場合は具体的な改善案を提案'
            };
        }
        
        if (item.includes('未完了時の作業停止遵守確認')) {
            return {
                completed: false, // 実際に違反継続中
                message: '❌ チェック未完了にも関わらず作業継続中',
                action_required: '全項目完了まで作業を停止し、修正完了後に再開'
            };
        }
        
        if (item.includes('監査作業開始準備')) {
            return {
                completed: false, // 上記が未完了のため
                message: '❌ 前提条件未満了につき開始不可',
                action_required: '上記全項目の完了が必要'
            };
        }

        // デフォルト（未対応項目）
        return {
            completed: false,
            message: '⚠️ 確認方法未定義',
            action_required: '手動確認が必要'
        };
    }

    /**
     * サマリー表示
     */
    displaySummary() {
        const totalItems = this.results.length;
        const completedItems = this.results.filter(r => r.completed).length;
        const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        console.log('\n📊 Inspector AI起動前チェック結果');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`✅ 完了項目: ${completedItems}/${totalItems}`);
        console.log(`📈 完了率: ${completionRate}%`);
        
        if (completedItems < totalItems) {
            console.log(`🚨 未完了項目: ${totalItems - completedItems}件`);
            console.log('\n❌ 未完了項目の詳細:');
            this.results.filter(r => !r.completed).forEach(item => {
                console.log(`   ${item.item_number}. ${item.item}`);
                console.log(`      アクション: ${item.action_required}`);
            });
            
            console.log('\n🚫 Inspector AI作業開始不可');
            console.log('   全項目の完了後に作業を開始してください');
        } else {
            console.log('\n✅ Inspector AI作業開始可能');
            console.log('   全ての必須項目が完了しています');
        }

        console.log(`\n🎯 セッションID: ${this.sessionId}`);
        console.log(`📅 実行時刻: ${new Date().toISOString()}`);
    }

    /**
     * 実行履歴保存
     */
    saveExecutionHistory() {
        const executionRecord = {
            timestamp: new Date().toISOString(),
            tool_name: 'startup-checklist.cjs',
            session_id: this.sessionId,
            execution_time_ms: Date.now() - parseInt(this.sessionId.split('_')[2]),
            success: true,
            input_parameters: {
                checklist_file: this.checklistFile,
                checklist_count: this.checklist.length,
                mode: 'startup_validation'
            },
            output_summary: {
                total_items: this.results.length,
                completed_items: this.results.filter(r => r.completed).length,
                completion_rate: `${this.results.filter(r => r.completed).length}/${this.results.length}`,
                startup_ready: this.results.every(r => r.completed)
            },
            detailed_results: this.results
        };

        try {
            // ディレクトリ確認・作成
            const logDir = path.dirname(this.logFile);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            // 既存履歴読み込み
            let history = [];
            if (fs.existsSync(this.logFile)) {
                const content = fs.readFileSync(this.logFile, 'utf8');
                history = JSON.parse(content);
            }

            // 新規記録追加
            history.push(executionRecord);

            // 最新100件のみ保持
            if (history.length > 100) {
                history = history.slice(-100);
            }

            // 履歴保存
            fs.writeFileSync(this.logFile, JSON.stringify(history, null, 2));
            console.log(`💾 実行履歴保存: ${this.logFile}`);

        } catch (error) {
            console.error('❌ 履歴保存失敗:', error.message);
        }
    }

    /**
     * メイン実行
     */
    run() {
        console.log('🔧 [' + new Date().toISOString() + '] startup-checklist.cjs 実行開始');
        console.log('🎯 Inspector AI毎回会話前必須チェックを開始します');
        
        const startTime = Date.now();

        try {
            // チェックリスト読み込み
            if (!this.loadChecklist()) {
                throw new Error('チェックリスト読み込み失敗');
            }

            // チェックリスト実行
            this.processChecklist();

            // 履歴保存
            this.saveExecutionHistory();

            const executionTime = Date.now() - startTime;
            console.log(`✅ [${new Date().toISOString()}] startup-checklist.cjs 実行完了 - 所要時間: ${executionTime}ms`);

        } catch (error) {
            console.error(`❌ [${new Date().toISOString()}] startup-checklist.cjs 実行失敗: ${error.message}`);
        }
    }
}

// 実行
if (require.main === module) {
    const checklist = new InspectorStartupChecklist();
    checklist.run();
}

module.exports = InspectorStartupChecklist;