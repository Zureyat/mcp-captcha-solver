#!/usr/bin/env node

/**
 * MCP Captcha Solver - Enhanced Version 2.0
 * 
 * A comprehensive MCP server providing multiple strategies for captcha solving:
 * - Local OCR (Tesseract.js) - No external API needed
 * - Image Analysis - Type detection, slider solving, grid analysis
 * - External Services - 2Captcha, Anti-Captcha, and more
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import tool modules
import { performOCR, performCaptchaOCR, solveMathCaptchaLocally } from './tools/ocr.js';
import {
    analyzeCaptchaType,
    calculateSliderOffset,
    preprocessImage,
    analyzeImageGrid
} from './tools/image-analysis.js';
import {
    solveWithZwhyzzz,
    solveWithJfbym,
    solveWith2Captcha,
    solveWithAntiCaptcha,
    solveWithFallback
} from './tools/services.js';

// Create server instance
const server = new Server(
    {
        name: "mcp-captcha-solver",
        version: "2.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Tool definitions
const TOOLS = [
    // === ANALYSIS TOOLS ===
    {
        name: "analyze_captcha",
        description: "Analyze an image to detect what type of captcha it is (text, math, slider, grid selection). Use this first to determine which solving method to use.",
        inputSchema: {
            type: "object",
            properties: {
                imageBase64: {
                    type: "string",
                    description: "Base64 encoded captcha image (without data:image prefix)"
                }
            },
            required: ["imageBase64"]
        }
    },
    {
        name: "preprocess_image",
        description: "Preprocess an image for better OCR results. Apply grayscale, sharpening, thresholding, or inversion.",
        inputSchema: {
            type: "object",
            properties: {
                imageBase64: {
                    type: "string",
                    description: "Base64 encoded image"
                },
                grayscale: { type: "boolean", default: true },
                sharpen: { type: "boolean", default: true },
                threshold: {
                    type: ["boolean", "integer"],
                    description: "Apply threshold (true for default 128, or specify value)"
                },
                invert: { type: "boolean", default: false }
            },
            required: ["imageBase64"]
        }
    },

    // === LOCAL OCR TOOLS (No External API) ===
    {
        name: "solve_with_local_ocr",
        description: "Solve text captcha using local Tesseract OCR. No external API calls. Best for simple alphanumeric captchas.",
        inputSchema: {
            type: "object",
            properties: {
                imageBase64: {
                    type: "string",
                    description: "Base64 encoded captcha image"
                },
                language: {
                    type: "string",
                    default: "eng",
                    description: "OCR language (eng, chi_sim, chi_tra, etc.)"
                }
            },
            required: ["imageBase64"]
        }
    },
    {
        name: "solve_math_locally",
        description: "Solve math captcha using local OCR + evaluation. Extracts expression and calculates result. No external API.",
        inputSchema: {
            type: "object",
            properties: {
                imageBase64: {
                    type: "string",
                    description: "Base64 encoded math captcha image"
                }
            },
            required: ["imageBase64"]
        }
    },

    // === SLIDER/PUZZLE TOOLS ===
    {
        name: "calculate_slider_offset",
        description: "Analyze a slider puzzle image to estimate the drag offset needed to solve it.",
        inputSchema: {
            type: "object",
            properties: {
                backgroundBase64: {
                    type: "string",
                    description: "Base64 encoded slider background image"
                },
                pieceBase64: {
                    type: "string",
                    description: "Base64 encoded puzzle piece image (optional)"
                }
            },
            required: ["backgroundBase64"]
        }
    },
    {
        name: "analyze_image_grid",
        description: "Analyze an image selection grid (e.g., reCAPTCHA 'select all traffic lights'). Returns cell coordinates for clicking.",
        inputSchema: {
            type: "object",
            properties: {
                imageBase64: {
                    type: "string",
                    description: "Base64 encoded grid image"
                },
                gridSize: {
                    type: "integer",
                    default: 3,
                    description: "Expected grid size (3 for 3x3, 4 for 4x4)"
                }
            },
            required: ["imageBase64"]
        }
    },

    // === EXTERNAL SERVICE TOOLS ===
    {
        name: "solve_general_captcha",
        description: "Solve general text/number captcha using zwhyzzz service (free, rate-limited)",
        inputSchema: {
            type: "object",
            properties: {
                imageBase64: {
                    type: "string",
                    description: "Base64 encoded captcha image"
                }
            },
            required: ["imageBase64"]
        }
    },
    {
        name: "solve_math_captcha",
        description: "Solve math captcha using jfbym service (requires token)",
        inputSchema: {
            type: "object",
            properties: {
                imageBase64: { type: "string" },
                token: { type: "string", description: "jfbym API token" },
                type: { type: "string", default: "50106" }
            },
            required: ["imageBase64", "token"]
        }
    },
    {
        name: "solve_with_2captcha",
        description: "Solve captcha using 2Captcha service. Supports image, reCAPTCHA, and hCaptcha.",
        inputSchema: {
            type: "object",
            properties: {
                apiKey: { type: "string", description: "2Captcha API key" },
                captchaType: {
                    type: "string",
                    enum: ["image", "recaptcha", "hcaptcha"],
                    default: "image"
                },
                imageBase64: { type: "string", description: "For image captchas" },
                siteKey: { type: "string", description: "For reCAPTCHA/hCaptcha" },
                pageUrl: { type: "string", description: "Page URL for reCAPTCHA/hCaptcha" }
            },
            required: ["apiKey"]
        }
    },
    {
        name: "solve_with_anticaptcha",
        description: "Solve captcha using Anti-Captcha service. Supports image, reCAPTCHA, and hCaptcha.",
        inputSchema: {
            type: "object",
            properties: {
                apiKey: { type: "string", description: "Anti-Captcha API key" },
                captchaType: {
                    type: "string",
                    enum: ["image", "recaptcha", "hcaptcha"],
                    default: "image"
                },
                imageBase64: { type: "string" },
                siteKey: { type: "string" },
                pageUrl: { type: "string" }
            },
            required: ["apiKey"]
        }
    },
    {
        name: "solve_with_fallback",
        description: "Try multiple services in sequence until one succeeds. Provides automatic fallback.",
        inputSchema: {
            type: "object",
            properties: {
                imageBase64: { type: "string" },
                services: {
                    type: "array",
                    items: { type: "string" },
                    default: ["zwhyzzz", "2captcha", "anticaptcha"],
                    description: "Services to try in order"
                },
                twoCaptchaKey: { type: "string" },
                antiCaptchaKey: { type: "string" }
            },
            required: ["imageBase64"]
        }
    },

    // === UTILITY TOOLS ===
    {
        name: "unban_ip",
        description: "Attempt to unban your IP from the zwhyzzz service",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "get_captcha_solving_strategy",
        description: "Get recommended strategy for solving a specific captcha type",
        inputSchema: {
            type: "object",
            properties: {
                captchaType: {
                    type: "string",
                    enum: ["text", "math", "slider", "recaptcha_v2", "recaptcha_v3", "hcaptcha", "image_selection"],
                    description: "Type of captcha"
                }
            },
            required: ["captchaType"]
        }
    }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        let result;

        switch (name) {
            // Analysis tools
            case "analyze_captcha":
                result = await analyzeCaptchaType(args.imageBase64);
                break;

            case "preprocess_image":
                result = await preprocessImage(args.imageBase64, {
                    grayscale: args.grayscale,
                    sharpen: args.sharpen,
                    threshold: args.threshold,
                    invert: args.invert
                });
                break;

            // Local OCR tools
            case "solve_with_local_ocr":
                result = await performCaptchaOCR(args.imageBase64, {
                    lang: args.language || 'eng'
                });
                break;

            case "solve_math_locally":
                result = await solveMathCaptchaLocally(args.imageBase64);
                break;

            // Slider/puzzle tools
            case "calculate_slider_offset":
                result = await calculateSliderOffset(args.backgroundBase64, args.pieceBase64);
                break;

            case "analyze_image_grid":
                result = await analyzeImageGrid(args.imageBase64, args.gridSize || 3);
                break;

            // External services
            case "solve_general_captcha":
                result = await solveWithZwhyzzz(args.imageBase64);
                break;

            case "solve_math_captcha":
                result = await solveWithJfbym(args.imageBase64, args.token, args.type);
                break;

            case "solve_with_2captcha":
                result = await solveWith2Captcha({
                    apiKey: args.apiKey,
                    type: args.captchaType || 'image',
                    imageBase64: args.imageBase64,
                    siteKey: args.siteKey,
                    pageUrl: args.pageUrl
                });
                break;

            case "solve_with_anticaptcha":
                result = await solveWithAntiCaptcha({
                    apiKey: args.apiKey,
                    type: args.captchaType || 'image',
                    imageBase64: args.imageBase64,
                    siteKey: args.siteKey,
                    pageUrl: args.pageUrl
                });
                break;

            case "solve_with_fallback":
                result = await solveWithFallback(args.imageBase64, {
                    services: args.services,
                    apiKeys: {
                        twoCaptcha: args.twoCaptchaKey,
                        antiCaptcha: args.antiCaptchaKey
                    }
                });
                break;

            // Utility tools
            case "unban_ip":
                try {
                    const response = await fetch('http://ca.zwhyzzz.top:8092/unban');
                    const text = await response.text();
                    result = { status: response.status, message: text };
                } catch (error) {
                    result = { error: error.message };
                }
                break;

            case "get_captcha_solving_strategy":
                result = getCaptchaSolvingStrategy(args.captchaType);
                break;

            default:
                throw new Error(`Unknown tool: ${name}`);
        }

        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
    } catch (error) {
        return {
            content: [{ type: "text", text: JSON.stringify({ error: error.message }) }],
            isError: true
        };
    }
});

/**
 * Get recommended strategy for solving a captcha type
 */
function getCaptchaSolvingStrategy(captchaType) {
    const strategies = {
        text: {
            description: "Simple distorted text captcha",
            recommendedTools: ["solve_with_local_ocr", "solve_general_captcha"],
            steps: [
                "1. Try local OCR first (free, instant)",
                "2. If confidence < 70%, preprocess image and retry",
                "3. Fall back to external service if needed"
            ]
        },
        math: {
            description: "Arithmetic expression captcha",
            recommendedTools: ["solve_math_locally", "solve_math_captcha"],
            steps: [
                "1. Use solve_math_locally for OCR + auto-calculation",
                "2. If failed, use external math captcha service"
            ]
        },
        slider: {
            description: "Drag slider to complete puzzle",
            recommendedTools: ["calculate_slider_offset"],
            steps: [
                "1. Use calculate_slider_offset to estimate drag distance",
                "2. Simulate mouse drag from left edge to estimated offset",
                "3. Add small random offset (+/- 5px) for human-like behavior"
            ]
        },
        recaptcha_v2: {
            description: "Google reCAPTCHA v2 (checkbox + image selection)",
            recommendedTools: ["solve_with_2captcha", "solve_with_anticaptcha"],
            steps: [
                "1. Extract sitekey from page HTML",
                "2. Use external service with pageUrl and siteKey",
                "3. Insert response token into hidden textarea",
                "4. Submit form"
            ]
        },
        recaptcha_v3: {
            description: "Invisible reCAPTCHA with behavior analysis",
            recommendedTools: [],
            steps: [
                "⚠️ Very difficult for AI",
                "1. Requires realistic mouse movements",
                "2. Requires time-on-page and scroll behavior",
                "3. External services can help but expensive"
            ]
        },
        hcaptcha: {
            description: "hCaptcha image selection challenge",
            recommendedTools: ["solve_with_2captcha", "solve_with_anticaptcha"],
            steps: [
                "1. Extract sitekey from page",
                "2. Use external service",
                "3. Similar to reCAPTCHA v2 flow"
            ]
        },
        image_selection: {
            description: "Select all images matching criteria",
            recommendedTools: ["analyze_image_grid"],
            steps: [
                "1. Use analyze_image_grid to get cell coordinates",
                "2. For each cell, AI vision should analyze content",
                "3. Click centers of matching cells",
                "4. If 'verify' fails, repeat with new images"
            ]
        }
    };

    return strategies[captchaType] || {
        description: "Unknown captcha type",
        recommendedTools: ["analyze_captcha"],
        steps: ["First use analyze_captcha to detect the type"]
    };
}

// Start server
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Captcha Solver v2.0 running on stdio");
}

runServer().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
