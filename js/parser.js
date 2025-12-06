/**
 * Parser module for converting LaTeX and standard math notation to evaluable expressions
 */

const Parser = (function() {
    // LaTeX to math.js conversion rules
    const latexReplacements = [
        // Fractions: \frac{a}{b} -> (a)/(b)
        { pattern: /\\frac\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
          replace: '(($1)/($2))' },

        // Square root: \sqrt{x} -> sqrt(x)
        { pattern: /\\sqrt\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, replace: 'sqrt($1)' },

        // Nth root: \sqrt[n]{x} -> nthRoot(x, n)
        { pattern: /\\sqrt\s*\[([^\]]+)\]\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, replace: 'nthRoot($2, $1)' },

        // Trigonometric functions
        { pattern: /\\sin/g, replace: 'sin' },
        { pattern: /\\cos/g, replace: 'cos' },
        { pattern: /\\tan/g, replace: 'tan' },
        { pattern: /\\cot/g, replace: 'cot' },
        { pattern: /\\sec/g, replace: 'sec' },
        { pattern: /\\csc/g, replace: 'csc' },

        // Inverse trig functions
        { pattern: /\\arcsin/g, replace: 'asin' },
        { pattern: /\\arccos/g, replace: 'acos' },
        { pattern: /\\arctan/g, replace: 'atan' },
        { pattern: /\\asin/g, replace: 'asin' },
        { pattern: /\\acos/g, replace: 'acos' },
        { pattern: /\\atan/g, replace: 'atan' },

        // Hyperbolic functions
        { pattern: /\\sinh/g, replace: 'sinh' },
        { pattern: /\\cosh/g, replace: 'cosh' },
        { pattern: /\\tanh/g, replace: 'tanh' },

        // Logarithms
        { pattern: /\\ln/g, replace: 'log' },
        { pattern: /\\log_{10}/g, replace: 'log10' },
        { pattern: /\\log_\{10\}/g, replace: 'log10' },
        { pattern: /\\log/g, replace: 'log10' },

        // Exponential
        { pattern: /\\exp/g, replace: 'exp' },
        { pattern: /e\^\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, replace: 'exp($1)' },

        // Absolute value: \abs{x} or |x| or \left|x\right|
        { pattern: /\\abs\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, replace: 'abs($1)' },
        { pattern: /\\left\|([^|]+)\\right\|/g, replace: 'abs($1)' },
        { pattern: /\|([^|]+)\|/g, replace: 'abs($1)' },

        // Constants
        { pattern: /\\pi/g, replace: 'pi' },
        { pattern: /\\e(?![a-zA-Z])/g, replace: 'e' },
        { pattern: /\\infty/g, replace: 'Infinity' },

        // Operators
        { pattern: /\\cdot/g, replace: '*' },
        { pattern: /\\times/g, replace: '*' },
        { pattern: /\\div/g, replace: '/' },
        { pattern: /\\pm/g, replace: '+' },

        // Powers with braces: x^{2} -> x^(2)
        { pattern: /\^\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, replace: '^($1)' },

        // Subscripts (remove for evaluation)
        { pattern: /_\{[^{}]*\}/g, replace: '' },
        { pattern: /_[a-zA-Z0-9]/g, replace: '' },

        // Remove LaTeX formatting commands
        { pattern: /\\left/g, replace: '' },
        { pattern: /\\right/g, replace: '' },
        { pattern: /\\,/g, replace: '' },
        { pattern: /\\;/g, replace: '' },
        { pattern: /\\!/g, replace: '' },
        { pattern: /\\quad/g, replace: '' },
        { pattern: /\\qquad/g, replace: '' },

        // Floor and ceiling
        { pattern: /\\lfloor\s*([^\\]+)\s*\\rfloor/g, replace: 'floor($1)' },
        { pattern: /\\lceil\s*([^\\]+)\s*\\rceil/g, replace: 'ceil($1)' },
    ];

    /**
     * Convert LaTeX expression to math.js compatible format
     */
    function latexToMath(latex) {
        let result = latex.trim();

        // Apply all replacement rules (may need multiple passes for nested structures)
        for (let pass = 0; pass < 3; pass++) {
            for (const rule of latexReplacements) {
                result = result.replace(rule.pattern, rule.replace);
            }
        }

        // Clean up any remaining braces
        result = result.replace(/\{/g, '(').replace(/\}/g, ')');

        // Add implicit multiplication
        result = addImplicitMultiplication(result);

        return result;
    }

    /**
     * Add implicit multiplication where needed
     * e.g., 2x -> 2*x, x(x+1) -> x*(x+1), (x)(y) -> (x)*(y)
     */
    function addImplicitMultiplication(expr) {
        let result = expr;

        // Number followed by variable or function: 2x -> 2*x, 2sin -> 2*sin
        result = result.replace(/(\d)([a-zA-Z])/g, '$1*$2');

        // Variable followed by opening paren: x(... -> x*(
        result = result.replace(/([a-zA-Z])(\()/g, (match, v, p) => {
            // Check if it's a function name
            const functions = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc',
                             'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
                             'sqrt', 'abs', 'log', 'log10', 'exp', 'floor', 'ceil',
                             'nthRoot', 'pow', 'sign', 'round'];

            // Look backwards to see if this is part of a function name
            const beforeMatch = result.substring(0, result.indexOf(match));
            for (const func of functions) {
                if (beforeMatch.endsWith(func.slice(0, -1)) && v === func.slice(-1)) {
                    return match; // It's a function, don't add multiplication
                }
            }

            // Check if single letter is a known function
            if (functions.includes(v)) {
                return match;
            }

            return v + '*' + p;
        });

        // Closing paren followed by opening paren: )( -> )*(
        result = result.replace(/\)\(/g, ')*(');

        // Closing paren followed by variable: )x -> )*x
        result = result.replace(/\)([a-zA-Z])/g, ')*$1');

        // Number followed by opening paren: 2( -> 2*(
        result = result.replace(/(\d)\(/g, '$1*(');

        // Closing paren followed by number: )2 -> )*2
        result = result.replace(/\)(\d)/g, ')*$1');

        return result;
    }

    /**
     * Parse and compile an expression for evaluation
     */
    function compile(expression, isLatex = false) {
        let mathExpr = isLatex ? latexToMath(expression) : addImplicitMultiplication(expression);

        try {
            const compiled = math.compile(mathExpr);
            return {
                success: true,
                compiled: compiled,
                expression: mathExpr
            };
        } catch (error) {
            return {
                success: false,
                error: `Parse error: ${error.message}`,
                expression: mathExpr
            };
        }
    }

    /**
     * Evaluate a compiled expression at a given value
     */
    function evaluate(compiled, variable, value) {
        try {
            const scope = {};
            scope[variable] = value;
            return compiled.evaluate(scope);
        } catch (error) {
            return NaN;
        }
    }

    /**
     * Generate data points for plotting
     */
    function generatePoints(compiled, variable, min, max, numPoints = 1000) {
        const step = (max - min) / numPoints;
        const xValues = [];
        const yValues = [];

        for (let i = 0; i <= numPoints; i++) {
            const x = min + i * step;
            const y = evaluate(compiled, variable, x);

            // Handle discontinuities by checking for large jumps
            if (yValues.length > 0) {
                const lastY = yValues[yValues.length - 1];
                if (Math.abs(y - lastY) > 100 && !isNaN(lastY) && !isNaN(y)) {
                    // Insert NaN to create a break in the line
                    xValues.push(x);
                    yValues.push(NaN);
                }
            }

            xValues.push(x);
            yValues.push(isFinite(y) ? y : NaN);
        }

        return { x: xValues, y: yValues };
    }

    /**
     * Generate parametric curve points
     */
    function generateParametricPoints(compiledX, compiledY, tMin, tMax, numPoints = 1000) {
        const step = (tMax - tMin) / numPoints;
        const xValues = [];
        const yValues = [];

        for (let i = 0; i <= numPoints; i++) {
            const t = tMin + i * step;
            const x = evaluate(compiledX, 't', t);
            const y = evaluate(compiledY, 't', t);

            xValues.push(isFinite(x) ? x : NaN);
            yValues.push(isFinite(y) ? y : NaN);
        }

        return { x: xValues, y: yValues };
    }

    /**
     * Convert expression to LaTeX for display
     */
    function toLatex(expression) {
        // Simple conversions for display
        let latex = expression
            .replace(/\*/g, ' \\cdot ')
            .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
            .replace(/sin\(/g, '\\sin(')
            .replace(/cos\(/g, '\\cos(')
            .replace(/tan\(/g, '\\tan(')
            .replace(/log\(/g, '\\ln(')
            .replace(/log10\(/g, '\\log_{10}(')
            .replace(/exp\(/g, 'e^{')
            .replace(/pi/g, '\\pi')
            .replace(/\^(\d+)/g, '^{$1}')
            .replace(/\^\(([^)]+)\)/g, '^{$1}');

        // Fix exp closing braces
        let expCount = (latex.match(/e\^\{/g) || []).length;
        for (let i = 0; i < expCount; i++) {
            latex = latex.replace(/e\^\{([^}]+)\)\s*/, 'e^{$1}');
        }

        return latex;
    }

    return {
        compile,
        evaluate,
        generatePoints,
        generateParametricPoints,
        latexToMath,
        toLatex,
        addImplicitMultiplication
    };
})();
