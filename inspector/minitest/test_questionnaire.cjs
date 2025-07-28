#!/usr/bin/env node
/**
 * テスト用質問ツール（自動回答版）
 */

const fs = require('fs');
const path = require('path');

class TestQuestionnaire {
    constructor() {
        this.questionsFile = path.join(__dirname, 'questions.txt');
        this.logFile = path.join(__dirname, '../../logs/inspector_ai_execution_history.json');
        this.questions = [];
        this.answers = [];
        this.sessionId = `session_${Date.now()}`;
        
        // テスト用回答
        this.testAnswers = ['晴れ', 'はい', '焼肉'];
    }

    /**
     * 質問ファイル読み込み
     */
    loadQuestions() {
        try {
            const content = fs.readFileSync(this.questionsFile, 'utf8');
            this.questions = content.trim().split('\n').filter(q => q.length > 0);
            console.log(`📋 質問読み込み完了: ${this.questions.length}件`);
            return true;
        } catch (error) {
            console.error('❌ 質問ファイル読み込み失敗:', error.message);
            return false;
        }
    }

    /**
     * 自動回答実行
     */
    processQuestions() {
        console.log('\n🎯 質問開始 (テスト用自動回答)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        for (let i = 0; i < this.questions.length; i++) {
            const question = this.questions[i];
            const answer = this.testAnswers[i] || '未回答';
            
            console.log(`\n❓ 質問${i + 1}: ${question}`);
            console.log(`💬 回答: ${answer}`);

            this.answers.push({
                question_number: i + 1,
                question: question,
                answer: answer,
                timestamp: new Date().toISOString()
            });

            console.log(`✅ 回答${i + 1}記録: ${answer}`);
        }

        console.log('\n🎉 全質問完了');
    }

    /**
     * 実行履歴保存
     */
    saveExecutionHistory() {
        const executionRecord = {
            timestamp: new Date().toISOString(),
            tool_name: 'test_questionnaire.cjs',
            session_id: this.sessionId,
            execution_time_ms: Date.now() - parseInt(this.sessionId.split('_')[1]),
            success: true,
            input_parameters: {
                questions_file: this.questionsFile,
                questions_count: this.questions.length,
                test_mode: true
            },
            output_summary: {
                total_questions: this.questions.length,
                total_answers: this.answers.length,
                completion_rate: `${this.answers.length}/${this.questions.length}`
            },
            detailed_results: this.answers
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
     * 結果表示
     */
    displayResults() {
        console.log('\n📋 回答結果サマリー');
        console.log('═══════════════════════════════════════');
        
        this.answers.forEach((item, index) => {
            console.log(`${index + 1}. ${item.question}`);
            console.log(`   回答: ${item.answer}`);
            console.log(`   時刻: ${item.timestamp}`);
            console.log('');
        });

        console.log(`🎯 セッションID: ${this.sessionId}`);
        console.log(`📊 完了率: ${this.answers.length}/${this.questions.length}`);
    }

    /**
     * メイン実行
     */
    run() {
        console.log('🔧 [' + new Date().toISOString() + '] test_questionnaire.cjs 実行開始');
        
        const startTime = Date.now();

        try {
            // 質問読み込み
            if (!this.loadQuestions()) {
                throw new Error('質問ファイル読み込み失敗');
            }

            // 質問処理
            this.processQuestions();

            // 結果表示
            this.displayResults();

            // 履歴保存
            this.saveExecutionHistory();

            const executionTime = Date.now() - startTime;
            console.log(`✅ [${new Date().toISOString()}] test_questionnaire.cjs 実行完了 - 所要時間: ${executionTime}ms`);

        } catch (error) {
            console.error(`❌ [${new Date().toISOString()}] test_questionnaire.cjs 実行失敗: ${error.message}`);
        }
    }
}

// 実行
if (require.main === module) {
    const questionnaire = new TestQuestionnaire();
    questionnaire.run();
}

module.exports = TestQuestionnaire;