class GUIDesignSystem {
    constructor() {
        this.currentTheme = 'light';
        this.currentTab = 'colors';
        this.initializeElements();
        this.initializeEventListeners();
        this.loadTheme();
        console.log('🎨 GUI Design System initialized');
    }

    initializeElements() {
        this.themeToggle = document.getElementById('themeToggle');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.currentSection = document.getElementById('currentSection');
        this.colorSwatches = document.querySelectorAll('.color-swatch');
        this.fontFamily = document.getElementById('fontFamily');
        this.lineHeight = document.getElementById('lineHeight');
        this.lineHeightValue = document.getElementById('lineHeightValue');
        this.intensitySlider = document.getElementById('intensitySlider');
        this.speedSlider = document.getElementById('speedSlider');
        this.densitySelect = document.getElementById('density');
        this.animationsToggle = document.getElementById('animations');
    }

    initializeEventListeners() {
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        this.colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => this.copyColor(swatch));
        });

        if (this.fontFamily) {
            this.fontFamily.addEventListener('change', () => this.updateFontFamily());
        }

        if (this.lineHeight) {
            this.lineHeight.addEventListener('input', () => this.updateLineHeight());
        }

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
                this.closeSettings();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'd':
                        e.preventDefault();
                        this.toggleTheme();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveSettings();
                        break;
                }
            }
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        this.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName + '-tab');
        });

        this.currentSection.textContent = this.getTabDisplayName(tabName);
        
        if (tabName === 'colors') {
            this.animateColorSwatches();
        }
    }

    getTabDisplayName(tabName) {
        const names = {
            colors: 'カラーパレット',
            typography: 'タイポグラフィ',
            layout: 'レイアウト',
            effects: 'エフェクト',
            buttons: 'ボタン',
            forms: 'フォーム',
            cards: 'カード',
            modals: 'モーダル',
            mobile: 'モバイル',
            tablet: 'タブレット',
            desktop: 'デスクトップ',
            export: 'エクスポート',
            templates: 'テンプレート'
        };
        return names[tabName] || tabName;
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', this.currentTheme);
        this.themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        localStorage.setItem('gui-theme', this.currentTheme);
        this.animateThemeSwitch();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('gui-theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            document.body.setAttribute('data-theme', this.currentTheme);
            this.themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }
    }

    animateThemeSwitch() {
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    copyColor(swatch) {
        const color = swatch.dataset.color;
        navigator.clipboard.writeText(color).then(() => {
            this.showToast(`カラーコードをコピーしました: ${color}`);
            this.animateColorCopy(swatch);
        });
    }

    animateColorCopy(swatch) {
        swatch.style.transform = 'scale(1.1)';
        swatch.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.5)';
        setTimeout(() => {
            swatch.style.transform = '';
            swatch.style.boxShadow = '';
        }, 200);
    }

    animateColorSwatches() {
        const swatches = document.querySelectorAll('.color-swatch');
        swatches.forEach((swatch, index) => {
            swatch.style.animation = 'none';
            setTimeout(() => {
                swatch.style.animation = `fadeIn 0.5s ease ${index * 0.1}s forwards`;
            }, 10);
        });
    }

    updateFontFamily() {
        const selectedFont = this.fontFamily.value;
        const fontFamilies = {
            system: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto"',
            noto: '"Noto Sans JP", sans-serif',
            hiragino: '"Hiragino Kaku Gothic ProN", sans-serif',
            meiryo: '"Meiryo", sans-serif'
        };
        
        const showcase = document.querySelector('.font-showcase');
        if (showcase) {
            showcase.style.fontFamily = fontFamilies[selectedFont];
        }
    }

    updateLineHeight() {
        const value = this.lineHeight.value;
        this.lineHeightValue.textContent = value;
        
        const showcase = document.querySelector('.font-showcase');
        if (showcase) {
            showcase.style.lineHeight = value;
        }
    }

    openSettings() {
        this.settingsModal.classList.add('show');
    }

    closeSettings() {
        this.settingsModal.classList.remove('show');
    }

    saveSettings() {
        const settings = {
            theme: this.currentTheme,
            density: this.densitySelect?.value || 'normal',
            animations: this.animationsToggle?.checked || true,
            fontFamily: this.fontFamily?.value || 'system',
            lineHeight: this.lineHeight?.value || '1.6'
        };
        
        localStorage.setItem('gui-settings', JSON.stringify(settings));
        this.showToast('設定を保存しました');
    }

    loadSettings() {
        const saved = localStorage.getItem('gui-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            if (this.densitySelect) this.densitySelect.value = settings.density;
            if (this.animationsToggle) this.animationsToggle.checked = settings.animations;
            if (this.fontFamily) this.fontFamily.value = settings.fontFamily;
            if (this.lineHeight) this.lineHeight.value = settings.lineHeight;
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }

    exportDesignSystem() {
        const designSystem = {
            colors: this.extractColors(),
            typography: this.extractTypography(),
            spacing: this.extractSpacing(),
            effects: this.extractEffects()
        };
        
        const blob = new Blob([JSON.stringify(designSystem, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'design-system.json';
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('デザインシステムをエクスポートしました');
    }

    extractColors() {
        const colors = {};
        this.colorSwatches.forEach(swatch => {
            const label = swatch.querySelector('.color-label').textContent;
            const value = swatch.dataset.color;
            colors[label] = value;
        });
        return colors;
    }

    extractTypography() {
        return {
            fontFamily: this.fontFamily?.value || 'system',
            lineHeight: this.lineHeight?.value || '1.6',
            sizes: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem',
                '2xl': '1.5rem',
                '3xl': '1.875rem'
            }
        };
    }

    extractSpacing() {
        return {
            xs: '4px',
            sm: '8px',
            md: '16px',
            lg: '24px',
            xl: '32px'
        };
    }

    extractEffects() {
        return {
            shadows: {
                sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                default: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            },
            borderRadius: {
                default: '8px',
                lg: '12px'
            }
        };
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .toast {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.guiDesignSystem = new GUIDesignSystem();
});