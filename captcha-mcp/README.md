# MCP Captcha Solver

**Comprehensive AI-Powered Captcha Resolution for Model Context Protocol**

This MCP server provides AI agents with multiple strategies to solve captchas—from local OCR to external services, slider puzzles to reCAPTCHA.

## 🚀 Features

| Category | Tools | Description |
|----------|-------|-------------|
| **Local OCR** | `solve_with_local_ocr`, `solve_math_locally` | Tesseract.js - No external API |
| **Analysis** | `analyze_captcha`, `preprocess_image` | Detect type, enhance images |
| **Slider/Puzzle** | `calculate_slider_offset`, `analyze_image_grid` | Solve visual puzzles |
| **External Services** | `solve_with_2captcha`, `solve_with_anticaptcha` | reCAPTCHA, hCaptcha support |
| **Fallback** | `solve_with_fallback` | Auto-retry multiple services |

## 📦 Installation

```bash
cd captcha-mcp
npm install
npm start
```

## ⚙️ Configuration

Add to your MCP client (e.g., Claude Desktop `claude_desktop_config.json`):

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

## 🔧 Available Tools (13 Total)

### Analysis Tools
- **`analyze_captcha`** - Detect captcha type (text, math, slider, grid)
- **`preprocess_image`** - Enhance image for better OCR
- **`get_captcha_solving_strategy`** - Get recommended solving approach

### Local OCR (No API Required)
- **`solve_with_local_ocr`** - Read text captchas locally with Tesseract
- **`solve_math_locally`** - OCR + auto-calculate math expressions

### Slider & Grid Tools
- **`calculate_slider_offset`** - Estimate drag distance for slider puzzles
- **`analyze_image_grid`** - Get cell coordinates for image selection

### External Services
- **`solve_general_captcha`** - Free service (rate-limited)
- **`solve_math_captcha`** - jfbym service (requires token)
- **`solve_with_2captcha`** - 2Captcha (image, reCAPTCHA, hCaptcha)
- **`solve_with_anticaptcha`** - Anti-Captcha integration
- **`solve_with_fallback`** - Try multiple services in sequence

### Utilities
- **`unban_ip`** - Self-service IP unban

## 💡 Usage Examples

### Simple Text Captcha
```
AI: Use solve_with_local_ocr with the captcha image
Result: { "text": "A3Kp9", "confidence": 87 }
```

### Math Captcha
```
AI: Use solve_math_locally
Result: { "expression": "12+8", "result": "20" }
```

### Slider Puzzle
```
AI: Use calculate_slider_offset with the background image
Result: { "estimatedOffset": 156, "hint": "Drag slider 156px from left" }
```

### reCAPTCHA v2
```
AI: Use solve_with_2captcha with apiKey, siteKey, and pageUrl
Result: { "result": "03AGdBq24PBCbG..." }
```

## 🧠 Solving Strategies

| Captcha Type | Recommended Approach |
|--------------|---------------------|
| Distorted Text | Local OCR → External fallback |
| Math Problems | `solve_math_locally` (instant) |
| Slider Puzzle | `calculate_slider_offset` + mouse simulation |
| reCAPTCHA v2 | 2Captcha or Anti-Captcha |
| hCaptcha | External service required |
| Image Selection | `analyze_image_grid` + AI vision |

## ⚠️ Requirements

- **Node.js** 18+
- **API Keys** (optional): 2Captcha, Anti-Captcha for advanced challenges
- Images sent to external services when using those tools

## License

MIT
