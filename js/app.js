/**
 * Main application module
 */

(function() {
    // State
    let currentMode = 'standard'; // 'standard', 'latex', 'parametric'
    let functionCount = 1;
    const colors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2'];

    // DOM Elements
    const elements = {
        // Mode toggles
        modeRadios: document.querySelectorAll('input[name="mode"]'),

        // Function inputs
        standardInput: document.getElementById('standard-input'),
        parametricInput: document.getElementById('parametric-input'),
        addFunctionBtn: document.getElementById('add-function'),

        // Parametric inputs
        paramX: document.getElementById('param-x'),
        paramY: document.getElementById('param-y'),
        paramColor: document.getElementById('param-color'),
        tMin: document.getElementById('t-min'),
        tMax: document.getElementById('t-max'),

        // LaTeX preview
        latexPreview: document.getElementById('latex-preview'),
        previewContent: document.getElementById('preview-content'),

        // Settings
        xMin: document.getElementById('x-min'),
        xMax: document.getElementById('x-max'),
        xPiScale: document.getElementById('x-pi-scale'),
        yMin: document.getElementById('y-min'),
        yMax: document.getElementById('y-max'),
        yAuto: document.getElementById('y-auto'),
        showGrid: document.getElementById('show-grid'),
        lineWidth: document.getElementById('line-width'),

        // Buttons
        plotBtn: document.getElementById('plot-btn'),
        clearBtn: document.getElementById('clear-btn'),
        exportPngBtn: document.getElementById('export-png'),
        exportSvgBtn: document.getElementById('export-svg'),

        // Error display
        errorMessage: document.getElementById('error-message')
    };

    /**
     * Initialize the application
     */
    function init() {
        // Initialize plotter
        Plotter.init('plot-container');

        // Set up event listeners
        setupEventListeners();

        // Initial plot
        plot();
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Mode switching
        elements.modeRadios.forEach(radio => {
            radio.addEventListener('change', handleModeChange);
        });

        // Add function button
        elements.addFunctionBtn.addEventListener('click', addFunctionInput);

        // Plot button
        elements.plotBtn.addEventListener('click', plot);

        // Clear button
        elements.clearBtn.addEventListener('click', clear);

        // Export buttons
        elements.exportPngBtn.addEventListener('click', () => Plotter.exportPNG());
        elements.exportSvgBtn.addEventListener('click', () => Plotter.exportSVG());

        // Live preview for LaTeX mode
        elements.standardInput.addEventListener('input', handleInputChange);

        // Parametric inputs
        elements.paramX.addEventListener('input', handleInputChange);
        elements.paramY.addEventListener('input', handleInputChange);

        // Y-auto toggle
        elements.yAuto.addEventListener('change', handleYAutoChange);

        // Enter key to plot
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName === 'INPUT' && activeElement.type !== 'checkbox') {
                    e.preventDefault();
                    plot();
                }
            }
        });
    }

    /**
     * Handle mode change (standard/latex/parametric)
     */
    function handleModeChange(e) {
        currentMode = e.target.value;

        // Toggle input visibility
        elements.standardInput.classList.toggle('hidden', currentMode === 'parametric');
        elements.parametricInput.classList.toggle('hidden', currentMode !== 'parametric');
        elements.addFunctionBtn.classList.toggle('hidden', currentMode === 'parametric');

        // Toggle LaTeX preview
        elements.latexPreview.classList.toggle('hidden', currentMode !== 'latex');

        // Update preview if switching to LaTeX
        if (currentMode === 'latex') {
            updateLatexPreview();
        }
    }

    /**
     * Handle input changes
     */
    function handleInputChange(e) {
        if (currentMode === 'latex') {
            updateLatexPreview();
        }
    }

    /**
     * Update LaTeX preview
     */
    function updateLatexPreview() {
        const inputs = elements.standardInput.querySelectorAll('.function-input');
        let latex = '';

        inputs.forEach((input, index) => {
            if (input.value.trim()) {
                if (index > 0) latex += ', \\quad ';
                latex += `f_{${index + 1}}(x) = ${input.value}`;
            }
        });

        if (latex) {
            try {
                katex.render(latex, elements.previewContent, {
                    throwOnError: false,
                    displayMode: true
                });
            } catch (e) {
                elements.previewContent.textContent = latex;
            }
        } else {
            elements.previewContent.innerHTML = '<span style="color: #94a3b8;">Enter a function to see preview</span>';
        }
    }

    /**
     * Add a new function input field
     */
    function addFunctionInput() {
        if (functionCount >= 6) {
            showError('Maximum 6 functions allowed');
            return;
        }

        const container = elements.standardInput;
        const entry = document.createElement('div');
        entry.className = 'function-entry';
        entry.dataset.index = functionCount;

        entry.innerHTML = `
            <div class="function-row">
                <span class="function-label">f(x) =</span>
                <input type="text" class="function-input" placeholder="Enter function" data-index="${functionCount}">
                <input type="color" class="color-picker" value="${colors[functionCount % colors.length]}" data-index="${functionCount}">
            </div>
            <button class="remove-function" title="Remove">×</button>
        `;

        // Insert before the add button
        container.insertBefore(entry, elements.addFunctionBtn);

        // Add remove button listener
        entry.querySelector('.remove-function').addEventListener('click', () => {
            entry.remove();
            functionCount--;
            renumberFunctions();
        });

        // Add input listener for LaTeX preview
        entry.querySelector('.function-input').addEventListener('input', handleInputChange);

        functionCount++;
    }

    /**
     * Renumber function labels after removal
     */
    function renumberFunctions() {
        const entries = elements.standardInput.querySelectorAll('.function-entry');
        entries.forEach((entry, index) => {
            entry.dataset.index = index;
            entry.querySelector('.function-input').dataset.index = index;
            entry.querySelector('.color-picker').dataset.index = index;
        });
    }

    /**
     * Handle Y-auto checkbox change
     */
    function handleYAutoChange() {
        const disabled = elements.yAuto.checked;
        elements.yMin.disabled = disabled;
        elements.yMax.disabled = disabled;
    }

    /**
     * Get current settings from UI
     */
    function getSettings() {
        const xPiScale = elements.xPiScale.checked;
        let xMin = parseFloat(elements.xMin.value) || -10;
        let xMax = parseFloat(elements.xMax.value) || 10;

        // When using π scale, interpret values as multiples of π
        if (xPiScale) {
            xMin = xMin * Math.PI;
            xMax = xMax * Math.PI;
        }

        return {
            xMin,
            xMax,
            xPiScale,
            yMin: parseFloat(elements.yMin.value) || -10,
            yMax: parseFloat(elements.yMax.value) || 10,
            yAuto: elements.yAuto.checked,
            showGrid: elements.showGrid.checked,
            lineWidth: parseInt(elements.lineWidth.value) || 2
        };
    }

    /**
     * Plot the functions
     */
    function plot() {
        hideError();
        const settings = getSettings();

        if (currentMode === 'parametric') {
            plotParametric(settings);
        } else {
            plotFunctions(settings);
        }
    }

    /**
     * Plot regular functions
     */
    function plotFunctions(settings) {
        const inputs = elements.standardInput.querySelectorAll('.function-input');
        const functions = [];

        inputs.forEach((input, index) => {
            const expr = input.value.trim();
            if (expr) {
                const colorPicker = elements.standardInput.querySelector(
                    `.color-picker[data-index="${input.dataset.index}"]`
                );
                functions.push({
                    expression: expr,
                    color: colorPicker ? colorPicker.value : colors[index % colors.length],
                    isLatex: currentMode === 'latex'
                });
            }
        });

        if (functions.length === 0) {
            showError('Please enter at least one function');
            return;
        }

        const errors = Plotter.plotFunctions(functions, settings);

        if (errors.length > 0) {
            showError(errors.join('<br>'));
        }
    }

    /**
     * Plot parametric curve
     */
    function plotParametric(settings) {
        const xExpr = elements.paramX.value.trim();
        const yExpr = elements.paramY.value.trim();

        if (!xExpr || !yExpr) {
            showError('Please enter both x(t) and y(t) expressions');
            return;
        }

        const parametric = {
            xExpr,
            yExpr,
            color: elements.paramColor.value,
            tMin: parseFloat(elements.tMin.value) || 0,
            tMax: parseFloat(elements.tMax.value) || 2 * Math.PI,
            isLatex: false
        };

        const errors = Plotter.plotParametric(parametric, settings);

        if (errors.length > 0) {
            showError(errors.join('<br>'));
        }
    }

    /**
     * Clear the plot and inputs
     */
    function clear() {
        Plotter.clear();
        hideError();

        // Reset to single function input
        const entries = elements.standardInput.querySelectorAll('.function-entry');
        entries.forEach((entry, index) => {
            if (index === 0) {
                entry.querySelector('.function-input').value = '';
            } else {
                entry.remove();
            }
        });
        functionCount = 1;

        // Clear parametric inputs
        elements.paramX.value = '';
        elements.paramY.value = '';

        // Clear LaTeX preview
        elements.previewContent.innerHTML = '';
    }

    /**
     * Show error message
     */
    function showError(message) {
        elements.errorMessage.innerHTML = message;
        elements.errorMessage.classList.remove('hidden');
    }

    /**
     * Hide error message
     */
    function hideError() {
        elements.errorMessage.classList.add('hidden');
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);
})();
