#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Configuration
const GENERAL_CAPTCHA_URL = "http://ca.zwhyzzz.top:8092/";
const MATH_CAPTCHA_URL = "https://www.jfbym.com/api/YmServer/customApi";

// Create server instance
const server = new Server(
    {
        name: "captcha-solver",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Helper function for general captcha
async function solveGeneralCaptcha(imageBase64) {
    try {
        const response = await fetch(`${GENERAL_CAPTCHA_URL}identify_GeneralCAPTCHA`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ImageBase64: imageBase64,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.msg && data.msg.includes("触发限流策略")) {
            return { error: data.msg };
        }

        if (data.result) {
            return { result: data.result };
        } else {
            return { error: "Identification failed", raw: data };
        }
    } catch (error) {
        return { error: error.message };
    }
}

// Helper function for math captcha
async function solveMathCaptcha(imageBase64, token, type = "50106") {
    try {
        const response = await fetch(MATH_CAPTCHA_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                image: imageBase64,
                type: type,
                token: token,
                developer_tag: "41acabfb0d980a24e6022e89f9c1bfa4",
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        return { error: error.message };
    }
}

// Helper function for QQ Group
async function getQQGroup() {
    try {
        const response = await fetch(`${GENERAL_CAPTCHA_URL}getQQGroup`);
        const text = await response.text();
        return text;
    } catch (error) {
        return "Failed to get group number";
    }
}

// Helper function for unban
async function unbanIP() {
    try {
        const response = await fetch(`${GENERAL_CAPTCHA_URL}unban`);
        const text = await response.text();
        return { status: response.status, message: text };
    } catch (error) {
        return { error: error.message };
    }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "solve_general_captcha",
                description: "Solve a general digital/English captcha using the zwhyzzz service",
                inputSchema: {
                    type: "object",
                    properties: {
                        imageBase64: {
                            type: "string",
                            description: "Base64 encoded image string of the captcha (without data:image/... prefix)",
                        },
                    },
                    required: ["imageBase64"],
                },
            },
            {
                name: "solve_math_captcha",
                description: "Solve a math or complex captcha using the jfbym service (requires token)",
                inputSchema: {
                    type: "object",
                    properties: {
                        imageBase64: {
                            type: "string",
                            description: "Base64 encoded image string of the captcha",
                        },
                        token: {
                            type: "string",
                            description: "User token for jfbym service",
                        },
                        type: {
                            type: "string",
                            description: "Captcha type code (default 50106 for calculate_ry)",
                            default: "50106",
                        },
                    },
                    required: ["imageBase64", "token"],
                },
            },
            {
                name: "get_qq_group",
                description: "Get the QQ group number for support",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "unban_ip",
                description: "Attempt to self-service unban IP from the captcha service",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
        ],
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case "solve_general_captcha": {
            const imageBase64 = String(args.imageBase64);
            const result = await solveGeneralCaptcha(imageBase64);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }

        case "solve_math_captcha": {
            const imageBase64 = String(args.imageBase64);
            const token = String(args.token);
            const type = args.type ? String(args.type) : "50106";
            const result = await solveMathCaptcha(imageBase64, token, type);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }

        case "get_qq_group": {
            const result = await getQQGroup();
            return {
                content: [{ type: "text", text: result }],
            };
        }

        case "unban_ip": {
            const result = await unbanIP();
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});

// Start the server
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Captcha MCP Server running on stdio");
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
