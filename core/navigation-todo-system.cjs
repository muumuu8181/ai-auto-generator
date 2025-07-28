#!/usr/bin/env node
/**
 * 毎回会話開始時の迷子防止Todoシステム
 * 「今から何しようとしてたっけ？」を即座に解決
 */

const fs = require('fs');
const path = require('path');

class NavigationTodoSystem {
    constructor() {
        this.todoPath = path.join(__dirname, '../logs/navigation-todo.json');
        this.currentStatus = {
            timestamp: new Date().toISOString(),
            session_context: "Inspector AI - 自動化推進フェーズ",
            immediate_tasks: [],
            ongoing_projects: [],
            blocked_items: [],
            next_priorities: [],
            automation_progress: {
                current_level: "40%自動化",
                target_level: "70%自動化 (短期目標)",
                key_bottlenecks: []
            }
        };
        
        this.loadExistingTodo();
        this.updateCurrentStatus();
    }

    /**
     * 既存Todo読み込み
     */
    loadExistingTodo() {
        if (fs.existsSync(this.todoPath)) {
            try {
                const existing = JSON.parse(fs.readFileSync(this.todoPath, 'utf8'));
                this.currentStatus = { ...this.currentStatus, ...existing };
            } catch (error) {
                console.log('📋 新規Todoシステム初期化');
            }
        }
    }

    /**
     * 現在のステータス更新
     */
    updateCurrentStatus() {
        // 即座に実行すべきタスク
        this.currentStatus.immediate_tasks = [
            {
                id: "auto-1",
                title: "毎回会話開始時の自動実行",
                description: "GitHub clone → インベントリ → ダッシュボード → ブラウザ起動",
                status: "completed", 
                tool: "published-apps-inventory.cjs + auto-browser-launcher.cjs",
                automation_level: "automated"
            },
            {
                id: "std-1", 
                title: "unified_file_search.cjs実装",
                description: "Glob/Grep/LS/Read統一化 - 検索作業完全自動化",
                status: "pending",
                priority: "high",
                automation_level: "target"
            },
            {
                id: "std-2",
                title: "server_manager.cjs実装", 
                description: "ポート管理・サーバー起動停止の完全自動化",
                status: "pending",
                priority: "medium",
                automation_level: "target"
            }
        ];

        // 進行中プロジェクト
        this.currentStatus.ongoing_projects = [
            {
                title: "Inspector AI自動化推進",
                progress: "40% → 70%を目指す",
                current_phase: "標準化ツール開発",
                next_milestone: "検索・サーバー管理の統一化完了",
                estimated_completion: "短期（1-2週間）"
            },
            {
                title: "published-apps監視システム",
                progress: "基盤完成、運用中",
                current_phase: "145件アプリの安定監視", 
                next_milestone: "エラー38件の自動修復機能",
                estimated_completion: "中期（1ヶ月）"
            }
        ];

        // ブロック項目
        this.currentStatus.blocked_items = [
            {
                title: "WSL2ブラウザ自動起動",
                blocker: "プラットフォーム依存の起動問題",
                current_workaround: "手動アクセス方法提示",
                resolution_needed: "Windows環境特化対応"
            }
        ];

        // 次の優先事項
        this.currentStatus.next_priorities = [
            {
                rank: 1,
                task: "unified_file_search.cjs完成",
                reason: "コマンドバリエーション削減の最重要ツール",
                impact: "検索作業30% → 0%手動化"
            },
            {
                rank: 2, 
                task: "full_sync_pipeline.cjs実装",
                reason: "毎回会話開始時の完全ワンコマンド化",
                impact: "会話開始作業の100%自動化"
            },
            {
                rank: 3,
                task: "error_recovery.cjs実装", 
                reason: "障害時の自動復旧機能",
                impact: "エラー対応の自動化"
            }
        ];

        // 自動化進捗更新
        this.currentStatus.automation_progress.key_bottlenecks = [
            "ファイル検索の手法統一（現在：状況判断）", 
            "サーバー管理の標準化（現在：都度コマンド）",
            "データ同期パイプラインの手動要素"
        ];
    }

    /**
     * 「今何してたっけ？」即答機能
     */
    whatAmIDoingNow() {
        console.log('\n🎯 Inspector AI 現在地ナビゲーション');
        console.log('═══════════════════════════════════════');
        console.log(`📅 セッション: ${this.currentStatus.session_context}`);
        console.log(`⏰ 最終更新: ${new Date(this.currentStatus.timestamp).toLocaleString()}`);
        console.log(`📊 自動化レベル: ${this.currentStatus.automation_progress.current_level}`);
        
        console.log('\n🚀 今すぐやるべきこと:');
        this.currentStatus.immediate_tasks
            .filter(task => task.status === 'pending')
            .slice(0, 3)
            .forEach((task, index) => {
                console.log(`  ${index + 1}. ${task.title}`);
                console.log(`     ${task.description}`);
                console.log(`     優先度: ${task.priority} | 自動化: ${task.automation_level}\n`);
            });

        console.log('📋 進行中プロジェクト:');
        this.currentStatus.ongoing_projects.forEach(project => {
            console.log(`  • ${project.title} (${project.progress})`);
            console.log(`    現在: ${project.current_phase}`);
            console.log(`    次: ${project.next_milestone}\n`);
        });

        if (this.currentStatus.blocked_items.length > 0) {
            console.log('🚨 ブロック中の課題:');
            this.currentStatus.blocked_items.forEach(item => {
                console.log(`  ⚠️ ${item.title}`);
                console.log(`     問題: ${item.blocker}`);
                console.log(`     暫定対応: ${item.current_workaround}\n`);
            });
        }

        console.log('🎯 次の優先事項:');
        this.currentStatus.next_priorities.slice(0, 3).forEach(priority => {
            console.log(`  ${priority.rank}. ${priority.task}`);
            console.log(`     理由: ${priority.reason}`);
            console.log(`     効果: ${priority.impact}\n`);
        });
    }

    /**
     * やりかけ作業チェック
     */
    checkUnfinishedWork() {
        console.log('\n🔍 やりかけ・未完了作業チェック');
        console.log('═══════════════════════════════════════');
        
        const unfinished = this.currentStatus.immediate_tasks
            .filter(task => task.status === 'pending' || task.status === 'in_progress');
            
        if (unfinished.length === 0) {
            console.log('✅ 現在、やりかけの作業はありません');
        } else {
            console.log(`📋 未完了作業: ${unfinished.length}件`);
            unfinished.forEach((task, index) => {
                console.log(`\n  ${index + 1}. ${task.title}`);
                console.log(`     ステータス: ${task.status}`);
                console.log(`     説明: ${task.description}`);
                if (task.tool) {
                    console.log(`     ツール: ${task.tool}`);
                }
            });
        }

        // 自動化のボトルネック
        console.log('\n🚧 自動化のボトルネック:');
        this.currentStatus.automation_progress.key_bottlenecks.forEach((bottleneck, index) => {
            console.log(`  ${index + 1}. ${bottleneck}`);
        });
    }

    /**
     * 次にやることの明確化
     */
    whatToDoNext() {
        console.log('\n📋 次にやるべきことの明確な指示');
        console.log('═══════════════════════════════════════');
        
        const nextTask = this.currentStatus.next_priorities[0];
        if (nextTask) {
            console.log(`🎯 最優先タスク: ${nextTask.task}`);
            console.log(`📝 理由: ${nextTask.reason}`);
            console.log(`💡 期待効果: ${nextTask.impact}`);
            
            // 具体的な実装ステップ
            if (nextTask.task.includes('unified_file_search')) {
                console.log('\n🔧 実装ステップ:');
                console.log('  1. 現在の検索パターン調査 (Glob/Grep/LS/Read使用箇所)');
                console.log('  2. unified_file_search.cjs設計・実装');
                console.log('  3. 既存コードの置き換え');
                console.log('  4. 動作確認・テスト');
                console.log('  5. 「コマンド禁止」ルール適用');
            }
        }

        console.log('\n⚡ 即座に実行可能なアクション:');
        console.log('  • node core/automation-level-analyzer.cjs (現状分析)');
        console.log('  • node core/navigation-todo-system.cjs (このナビゲーション)');
        console.log('  • unified_file_search.cjs実装開始');
    }

    /**
     * データ保存
     */
    save() {
        fs.writeFileSync(this.todoPath, JSON.stringify(this.currentStatus, null, 2));
        console.log(`💾 ナビゲーション状態保存: ${this.todoPath}`);
    }

    /**
     * メイン実行
     */
    run() {
        this.whatAmIDoingNow();
        this.checkUnfinishedWork(); 
        this.whatToDoNext();
        this.save();
        
        console.log('\n🎉 ナビゲーション完了 - 迷子防止システム更新済み');
        return this.currentStatus;
    }
}

// 実行
if (require.main === module) {
    const navigator = new NavigationTodoSystem();
    navigator.run();
}

module.exports = NavigationTodoSystem;