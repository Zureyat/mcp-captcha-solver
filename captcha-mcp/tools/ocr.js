/**
 * OCR Tools - Local text extraction using Tesseract.js
 * No external API calls required
 */

import Tesseract from 'tesseract.js';

/**
 * Perform OCR on a base64 encoded image
 * @param {string} imageBase64 - Base64 encoded image (without data: prefix)
 * @param {string} lang - Language code (e.g., 'eng', 'chi_sim')
 * @returns {Promise<object>} OCR result with text and confidence
 */
export async function performOCR(imageBase64, lang = 'eng') {
    try {
        // Convert base64 to data URL for Tesseract
        const dataUrl = `data:image/png;base64,${imageBase64}`;

        const result = await Tesseract.recognize(
            dataUrl,
            lang,
            {
                logger: m => { } // Silent logging
            }
        );

        return {
            success: true,
            text: result.data.text.trim(),
            confidence: result.data.confidence,
            words: result.data.words.map(w => ({
                text: w.text,
                confidence: w.confidence,
                bbox: w.bbox
            }))
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Perform OCR with preprocessing hints for captchas
 * @param {string} imageBase64 - Base64 encoded image
 * @param {object} options - Processing options
 * @returns {Promise<object>} OCR result
 */
export async function performCaptchaOCR(imageBase64, options = {}) {
    const {
        lang = 'eng',
        whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        psm = 7 // Treat as single text line
    } = options;

    try {
        const dataUrl = `data:image/png;base64,${imageBase64}`;

        const worker = await Tesseract.createWorker(lang);

        await worker.setParameters({
            tessedit_char_whitelist: whitelist,
            tessedit_pageseg_mode: psm.toString()
        });

        const result = await worker.recognize(dataUrl);
        await worker.terminate();

        // Clean up common OCR errors in captchas
        let cleanedText = result.data.text
            .trim()
            .replace(/\s+/g, '') // Remove whitespace
            .replace(/[|lI]/g, '1') // Common confusions
            .replace(/[O]/g, '0')
            .replace(/[S]/g, '5');

        return {
            success: true,
            text: cleanedText,
            rawText: result.data.text.trim(),
            confidence: result.data.confidence
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Extract math expression from image and evaluate
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<object>} Math result
 */
export async function solveMathCaptchaLocally(imageBase64) {
    try {
        const ocrResult = await performCaptchaOCR(imageBase64, {
            whitelist: '0123456789+-*×÷=/xX',
            psm: 7
        });

        if (!ocrResult.success) {
            return ocrResult;
        }

        // Normalize operators
        let expression = ocrResult.text
            .replace(/[×xX]/g, '*')
            .replace(/÷/g, '/')
            .replace(/=/g, '');

        // Try to evaluate the expression
        try {
            // Safe evaluation - only allow numbers and basic operators
            if (!/^[\d\s+\-*/().]+$/.test(expression)) {
                return {
                    success: false,
                    error: 'Expression contains invalid characters',
                    detected: ocrResult.text
                };
            }

            const result = Function(`"use strict"; return (${expression})`)();

            return {
                success: true,
                expression: expression,
                result: Math.round(result).toString(),
                ocrConfidence: ocrResult.confidence
            };
        } catch (evalError) {
            return {
                success: false,
                error: 'Could not evaluate expression',
                detected: ocrResult.text,
                expression: expression
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
