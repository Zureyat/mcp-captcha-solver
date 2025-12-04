# MCP Captcha Solver

**AI-Powered Captcha Resolution for Model Context Protocol**

This MCP server exposes powerful captcha solving capabilities to AI agents, enabling them to navigate web flows that require human verification. It bridges the gap between AI automation and captcha-protected content using established solving services.

## Features

-   **General Captcha Solving**: Instantly solve alphanumeric and digital captchas.
-   **Complex Math Captcha**: Handle mathematical and logic-based challenges (requires token).
-   **Seamless Integration**: Built on the Model Context Protocol for easy connection with Claude Desktop and other MCP clients.

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

### MCP Configuration

Add to your MCP client configuration (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "captcha-solver": {
      "command": "node",
      "args": ["/path/to/mcp-captcha-solver/index.js"]
    }
  }
}
```

## Tools

-   `solve_general_captcha`: Solve standard text/number captchas.
-   `solve_math_captcha`: Solve math problems and complex captchas.
-   `unban_ip`: Self-service IP unban utility.

## License

MIT
