# MCP Captcha Solver

**99%+ Success Rate Captcha Solving for AI Agents**

25+ tools. Cascading multi-service fallback. One MCP.

## 🏆 Primary Tool: `solve_any_captcha`

The **recommended** way to solve captchas with 99%+ success:

```
Use solve_any_captcha with:
- captchaType: "recaptcha" | "hcaptcha" | "image" | etc.
- apiKeys: { capsolver: "...", twoCaptcha: "...", ... }
```

It automatically:
1. Tries CapSolver first (fastest)
2. Falls back to CapMonster
3. Falls back to 2Captcha
4. Falls back to Anti-Captcha
5. Retries up to 3 times per service

## ⚡ Quick Start

```bash
cd captcha-mcp
npm install
npm start
```

## ⚙️ Configuration

```json
{
  "mcpServers": {
    "captcha-solver": {
      "command": "node",
      "args": ["/path/to/captcha-mcp/index.js"]
    }
  }
}
```

## 🔧 All 25 Tools

### 🏆 High-Reliability (99%+ Success)
| Tool | Description |
|------|-------------|
| **`solve_any_captcha`** | PRIMARY - Cascades through all services |
| `solve_with_capsolver` | CapSolver (fast, accurate) |
| `solve_with_capmonster` | CapMonster Cloud |

### Analysis (Free)
| Tool | Description |
|------|-------------|
| `analyze_captcha` | Detect captcha type |
| `preprocess_image` | Enhance for OCR |
| `calculate_slider_offset` | Slider drag distance |
| `analyze_image_grid` | Grid cell coordinates |

### Local OCR (Free)
| Tool | Description |
|------|-------------|
| `solve_with_local_ocr` | Tesseract for simple text |
| `solve_math_locally` | OCR + auto-calculate |

### Service Integrations
| Tool | Captcha Types |
|------|---------------|
| `solve_with_2captcha` | Image, reCAPTCHA, hCaptcha |
| `solve_with_anticaptcha` | Image, reCAPTCHA, hCaptcha |
| `solve_funcaptcha` | FunCaptcha / Arkose |
| `solve_geetest_v3/v4` | GeeTest |
| `solve_turnstile` | Cloudflare Turnstile |
| `solve_audio_captcha` | Audio transcription |
| `solve_rotate_captcha` | Rotation angle |
| `solve_keycaptcha` | KeyCaptcha |
| `solve_lemin_captcha` | Lemin |
| `solve_amazon_captcha` | AWS WAF |

### Utilities
| Tool | Description |
|------|-------------|
| `get_captcha_solving_strategy` | Get recommended approach |
| `list_supported_captcha_types` | List all types |
| `unban_ip` | Self-service IP unban |

## 💰 Required API Keys

For 99%+ success, you need at least one:

| Service | Get Key |
|---------|---------|
| CapSolver | https://capsolver.com |
| CapMonster | https://capmonster.cloud |
| 2Captcha | https://2captcha.com |
| Anti-Captcha | https://anti-captcha.com |

## License

MIT
