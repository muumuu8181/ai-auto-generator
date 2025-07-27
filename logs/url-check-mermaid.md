# 🌐 URL Accessibility Check Report

**チェック実行時刻**: 2025/7/27 7:16:22

## 📊 Overall Status Flow

```mermaid
graph TD
    A[🚀 URL Check Start] --> B[📋 1 URLs Scanned]
    B --> C{🔍 Accessibility Test}
    C -->|1 URLs| D[✅ Accessible]
    C -->|0 URLs| E[❌ Failed]
    
    E --> F{🚨 Error Type}
    F -->|0 URLs| G[🚨 404 Not Found]
    F -->|0 URLs| H[⚠️ Other Errors]
    
    D --> I[📊 Check Complete]
    G --> I
    H --> I
    
    style A fill:#e3f2fd
    style D fill:#e8f5e8
    style G fill:#ffcdd2
    style H fill:#fff3e0
    style I fill:#f3e5f5
```

## 📈 Status Distribution

```mermaid
pie title URL Accessibility Status
    "Accessible (1)" : 1
    
```

## 🎯 Performance Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Total URLs | 1 | 📊 |
| Accessible | 1 | ✅ |
| Failed | 0 | ✅ |
| 404 Errors | 0 | ✅ |
| Success Rate | 100.0% | 🎯 |


