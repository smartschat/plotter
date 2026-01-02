(function() {
    const summaryEl = document.getElementById('summary');
    const resultsEl = document.getElementById('results');
    let passed = 0;
    let failed = 0;

    function logLine(message, className) {
        const line = document.createElement('div');
        line.textContent = message;
        if (className) {
            line.className = className;
        }
        resultsEl.appendChild(line);
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    function normalize(expr) {
        return expr.replace(/\s+/g, '');
    }

    function approxEqual(a, b, epsilon) {
        return Math.abs(a - b) <= (epsilon || 1e-12);
    }

    function test(name, fn) {
        try {
            fn();
            passed += 1;
            logLine('PASS: ' + name, 'pass');
        } catch (error) {
            failed += 1;
            logLine('FAIL: ' + name + ' - ' + error.message, 'fail');
        }
    }

    test('compile: latex log defaults to natural log', function() {
        const result = Parser.compile('\\log(x)', true);
        assert(result.success, result.error || 'expected success');
        assert(normalize(result.expression) === 'log(x)', 'expected log(x), got ' + result.expression);
    });

    test('compile: latex log base', function() {
        const result = Parser.compile('\\log_{2}{x}', true);
        assert(result.success, result.error || 'expected success');
        assert(normalize(result.expression) === 'log(x,2)', 'expected log(x,2), got ' + result.expression);
    });

    test('compile: rejects \\pm', function() {
        const result = Parser.compile('x \\pm 1', true);
        assert(!result.success, 'expected failure');
        assert(result.error && result.error.indexOf('\\pm') !== -1, 'expected pm error, got ' + result.error);
    });

    test('compile: keeps scientific notation', function() {
        const result = Parser.compile('1e-3', false);
        assert(result.success, result.error || 'expected success');
        assert(normalize(result.expression) === '1e-3', 'expected 1e-3, got ' + result.expression);
    });

    test('generatePoints: x^2 monotonic x and bounds', function() {
        const result = Parser.compile('x^2', false);
        assert(result.success, result.error || 'expected success');

        const points = Parser.generatePoints(result.compiled, 'x', -2, 2, 200);
        assert(points.x.length === points.y.length, 'x/y length mismatch');
        assert(points.x.length > 0, 'no points generated');
        assert(approxEqual(points.x[0], -2), 'expected min x -2, got ' + points.x[0]);
        assert(approxEqual(points.x[points.x.length - 1], 2), 'expected max x 2, got ' + points.x[points.x.length - 1]);

        for (let i = 1; i < points.x.length; i++) {
            assert(points.x[i] >= points.x[i - 1], 'x not sorted at index ' + i);
        }
    });

    test('generatePoints: discontinuity yields NaN', function() {
        const result = Parser.compile('1/x', false);
        assert(result.success, result.error || 'expected success');

        const points = Parser.generatePoints(result.compiled, 'x', -1, 1, 200);
        const hasNaN = points.y.some(function(value) {
            return Number.isNaN(value);
        });
        assert(hasNaN, 'expected NaN in y values');
    });

    summaryEl.textContent = 'Passed: ' + passed + ', Failed: ' + failed;
    summaryEl.className = failed === 0 ? 'pass' : 'fail';
})();
