const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runTests() {
    const testFiles = fs.readdirSync(__dirname)
        .filter(f => f.endsWith('.test.html'));

    if (testFiles.length === 0) {
        console.log('No test files found');
        process.exit(0);
    }

    const browser = await chromium.launch();
    let totalPassed = 0;
    let totalFailed = 0;

    for (const file of testFiles) {
        const filePath = path.join(__dirname, file);
        const fileUrl = 'file://' + filePath;

        console.log(`\nRunning ${file}...`);

        const page = await browser.newPage();

        // Capture console output
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('  [console]', msg.text());
            }
        });

        await page.goto(fileUrl);

        // Wait for tests to complete (summary element gets updated)
        await page.waitForFunction(() => {
            const summary = document.getElementById('summary');
            return summary && !summary.textContent.includes('Running');
        }, { timeout: 10000 });

        // Extract results
        const results = await page.evaluate(() => {
            const summary = document.getElementById('summary');
            const resultsEl = document.getElementById('results');
            const lines = [];

            if (resultsEl) {
                for (const div of resultsEl.querySelectorAll('div')) {
                    lines.push({
                        text: div.textContent,
                        passed: div.classList.contains('pass')
                    });
                }
            }

            // Parse summary "Passed: X, Failed: Y"
            const match = summary.textContent.match(/Passed:\s*(\d+).*Failed:\s*(\d+)/);
            const passed = match ? parseInt(match[1], 10) : 0;
            const failed = match ? parseInt(match[2], 10) : 0;

            return { lines, passed, failed };
        });

        // Print individual test results
        for (const line of results.lines) {
            const prefix = line.passed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
            console.log(`  ${prefix} ${line.text}`);
        }

        totalPassed += results.passed;
        totalFailed += results.failed;

        await page.close();
    }

    await browser.close();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);

    process.exit(totalFailed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
});
