/**
 * Plotter module for rendering graphs using Plotly
 */

const Plotter = (function() {
    let plotContainer = null;
    let currentTraces = [];

    const defaultLayout = {
        margin: { t: 20, r: 30, b: 60, l: 60 },
        xaxis: {
            title: { text: 'x', font: { size: 20 } },
            tickfont: { size: 16 },
            gridcolor: '#e2e8f0',
            zerolinecolor: '#94a3b8',
            zerolinewidth: 2
        },
        yaxis: {
            title: { text: 'y', font: { size: 20 } },
            tickfont: { size: 16 },
            gridcolor: '#e2e8f0',
            zerolinecolor: '#94a3b8',
            zerolinewidth: 2
        },
        showlegend: false,
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        hovermode: 'closest'
    };

    const defaultConfig = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        displaylogo: false
    };

    /**
     * Initialize the plotter with a container element
     */
    function init(containerId) {
        plotContainer = document.getElementById(containerId);
        if (!plotContainer) {
            throw new Error(`Container element '${containerId}' not found`);
        }

        // Create initial empty plot
        Plotly.newPlot(plotContainer, [], defaultLayout, defaultConfig);
    }

    /**
     * Plot multiple functions
     * @param {Array} functions - Array of {expression, color, isLatex}
     * @param {Object} settings - {xMin, xMax, yMin, yMax, yAuto, showGrid, lineWidth}
     */
    function plotFunctions(functions, settings) {
        currentTraces = [];
        const errors = [];

        for (const func of functions) {
            const result = Parser.compile(func.expression, func.isLatex);

            if (!result.success) {
                errors.push(`"${func.expression}": ${result.error}`);
                continue;
            }

            const points = Parser.generatePoints(
                result.compiled,
                'x',
                settings.xMin,
                settings.xMax
            );

            currentTraces.push({
                x: points.x,
                y: points.y,
                type: 'scatter',
                mode: 'lines',
                line: {
                    color: func.color,
                    width: settings.lineWidth
                },
                name: func.expression,
                hovertemplate: 'x: %{x:.3f}<br>y: %{y:.3f}<extra></extra>'
            });
        }

        const layout = buildLayout(settings);
        Plotly.react(plotContainer, currentTraces, layout, defaultConfig);

        return errors;
    }

    /**
     * Plot a parametric curve
     * @param {Object} parametric - {xExpr, yExpr, color, tMin, tMax}
     * @param {Object} settings - plot settings
     */
    function plotParametric(parametric, settings) {
        currentTraces = [];
        const errors = [];

        const resultX = Parser.compile(parametric.xExpr, parametric.isLatex);
        const resultY = Parser.compile(parametric.yExpr, parametric.isLatex);

        if (!resultX.success) {
            errors.push(`x(t): ${resultX.error}`);
        }
        if (!resultY.success) {
            errors.push(`y(t): ${resultY.error}`);
        }

        if (resultX.success && resultY.success) {
            const points = Parser.generateParametricPoints(
                resultX.compiled,
                resultY.compiled,
                parametric.tMin,
                parametric.tMax
            );

            currentTraces.push({
                x: points.x,
                y: points.y,
                type: 'scatter',
                mode: 'lines',
                line: {
                    color: parametric.color,
                    width: settings.lineWidth
                },
                name: `(${parametric.xExpr}, ${parametric.yExpr})`,
                hovertemplate: 'x: %{x:.3f}<br>y: %{y:.3f}<extra></extra>'
            });
        }

        const layout = buildLayout(settings);
        Plotly.react(plotContainer, currentTraces, layout, defaultConfig);

        return errors;
    }

    /**
     * Generate tick values and labels for π scale
     */
    function generatePiTicks(min, max) {
        const tickvals = [];
        const ticktext = [];

        // Find the range in terms of π
        const minPi = min / Math.PI;
        const maxPi = max / Math.PI;
        const range = maxPi - minPi;

        // Determine step size based on range
        let step;
        if (range <= 2) step = 0.25;
        else if (range <= 4) step = 0.5;
        else if (range <= 8) step = 1;
        else step = 2;

        // Generate ticks
        const start = Math.ceil(minPi / step) * step;
        const end = Math.floor(maxPi / step) * step;

        for (let i = start; i <= end + 0.001; i += step) {
            tickvals.push(i * Math.PI);
            ticktext.push(formatPiLabel(i));
        }

        return { tickvals, ticktext };
    }

    /**
     * Format a number as a π label
     */
    function formatPiLabel(n) {
        if (Math.abs(n) < 0.001) return '0';
        if (Math.abs(n - 1) < 0.001) return 'π';
        if (Math.abs(n + 1) < 0.001) return '-π';

        // Handle fractions
        const fractions = [
            { val: 0.25, str: 'π/4' },
            { val: 0.5, str: 'π/2' },
            { val: 0.75, str: '3π/4' },
            { val: 1.5, str: '3π/2' },
        ];

        for (const frac of fractions) {
            if (Math.abs(Math.abs(n) - frac.val) < 0.001) {
                return n < 0 ? '-' + frac.str : frac.str;
            }
        }

        // For integers, show as nπ
        if (Math.abs(n - Math.round(n)) < 0.001) {
            const rounded = Math.round(n);
            if (rounded === 1) return 'π';
            if (rounded === -1) return '-π';
            return rounded + 'π';
        }

        // For other values, show decimal approximation
        return n.toFixed(2) + 'π';
    }

    /**
     * Build Plotly layout object from settings
     */
    function buildLayout(settings) {
        const layout = JSON.parse(JSON.stringify(defaultLayout));

        layout.xaxis.range = [settings.xMin, settings.xMax];

        // Apply π scale if enabled
        if (settings.xPiScale) {
            const piTicks = generatePiTicks(settings.xMin, settings.xMax);
            layout.xaxis.tickmode = 'array';
            layout.xaxis.tickvals = piTicks.tickvals;
            layout.xaxis.ticktext = piTicks.ticktext;
        }

        if (settings.yAuto) {
            layout.yaxis.autorange = true;
        } else {
            layout.yaxis.range = [settings.yMin, settings.yMax];
        }

        if (!settings.showGrid) {
            layout.xaxis.showgrid = false;
            layout.yaxis.showgrid = false;
        }

        return layout;
    }

    /**
     * Clear the plot
     */
    function clear() {
        currentTraces = [];
        Plotly.react(plotContainer, [], defaultLayout, defaultConfig);
    }

    /**
     * Export plot as PNG
     */
    function exportPNG() {
        return Plotly.downloadImage(plotContainer, {
            format: 'png',
            width: 1200,
            height: 800,
            filename: 'function-plot'
        });
    }

    /**
     * Export plot as SVG
     */
    function exportSVG() {
        return Plotly.downloadImage(plotContainer, {
            format: 'svg',
            width: 1200,
            height: 800,
            filename: 'function-plot'
        });
    }

    /**
     * Update layout settings without replotting data
     */
    function updateLayout(settings) {
        const layout = buildLayout(settings);
        Plotly.relayout(plotContainer, layout);
    }

    return {
        init,
        plotFunctions,
        plotParametric,
        clear,
        exportPNG,
        exportSVG,
        updateLayout
    };
})();
