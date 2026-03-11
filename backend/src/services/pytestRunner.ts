import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
// @ts-ignore
import { parseStringPromise } from 'xml2js';
import { FrameworkGenerator } from './frameworkGenerator';
import { PlaywrightFrameworkGenerator } from './playwrightFrameworkGenerator';
import { JavascriptPlaywrightFrameworkGenerator } from './javascriptPlaywrightFrameworkGenerator';

const prisma = new PrismaClient();

interface TestExecutionStart {
    frameworkId: string;
}

export class PytestRunner {
    private static runningExecutions = new Map<string, any>(); // Store active processes if needed

    static async executeTest(frameworkId: string, testFiles?: string[]): Promise<string> {
        console.log(`[PytestRunner] executeTest called for ${frameworkId} with ${testFiles?.length || 0} files`);
        // 1. Create execution record
        const execution = await prisma.testExecution.create({
            data: {
                frameworkId,
                status: 'running',
                startTime: new Date(),
            }
        });

        // 2. Identify the test directory & Generate Files
        const framework = await prisma.framework.findUnique({
            where: { id: frameworkId },
            include: {
                pages: {
                    include: { elements: true }
                },
                tests: {
                    include: { steps: true }
                }
            }
        });

        if (!framework) {
            throw new Error(`Framework ${frameworkId} not found`);
        }

        // Generate files on disk
        let projectPath: string;
        if ((framework as any).frameworkType === 'javascript-playwright') {
            projectPath = await JavascriptPlaywrightFrameworkGenerator.generate(framework);
        } else if ((framework as any).frameworkType === 'pytest-playwright') {
            projectPath = await PlaywrightFrameworkGenerator.generate(framework);
        } else {
            projectPath = await FrameworkGenerator.generate(framework);
        }

        console.log(`[PytestRunner] Starting execution ${execution.id} for project ${framework.projectName} at ${projectPath} ${testFiles ? `(Files: ${testFiles.join(', ')})` : '(All Tests)'}`);


        // 3. Spawn PyTest process
        // We use `python -m pytest` or `pytest` directly. 
        // We need to ensure we use the venv if it exists.

        let pytestCommand = 'pytest';
        let isJavascript = false;

        // Check frameworkType to differenitate Python vs Node
        if ((framework as any).frameworkType === 'javascript-playwright') {
            isJavascript = true;
            pytestCommand = 'npx';
        } else {
            const venvPath = path.join(projectPath, 'venv', 'bin', 'pytest');
            try {
                await fs.access(venvPath);
                pytestCommand = venvPath;
                console.log(`[PytestRunner] Using venv pytest: ${pytestCommand}`);
            } catch {
                console.log(`[PytestRunner] Using system pytest`);
            }
        }

        const junitFileName = `report-${execution.id}.xml`;
        const junitReportPath = path.join(projectPath, junitFileName);
        const quotedReportPath = `"${junitReportPath}"`;
        const quotedPytestCmd = `"${pytestCommand}"`;

        let shellCmd = '';

        if (isJavascript) {
            // Check if node dependencies are installed
            try {
                await fs.access(path.join(projectPath, 'node_modules'));
            } catch {
                console.log(`[PytestRunner] node_modules not found. Running npm install for ${projectPath}...`);
                await new Promise((resolve, reject) => {
                    const installCmd = spawn('npm install && npx playwright install --with-deps chromium', [], {
                        cwd: projectPath,
                        shell: true
                    });
                    installCmd.stdout.on('data', data => console.log(`[npm] ${data}`));
                    installCmd.stderr.on('data', data => console.log(`[npm err] ${data}`));
                    installCmd.on('close', code => {
                        if (code === 0) resolve(true);
                        else reject(new Error(`npm install failed with code ${code}`));
                    });
                });
            }

            // PLAYWRIGHT_JUNIT_OUTPUT_NAME enables dynamic report names in Playwright Junit Reporter
            shellCmd = `PLAYWRIGHT_JUNIT_OUTPUT_NAME=${quotedReportPath} ${quotedPytestCmd} playwright test`;
        } else {
            shellCmd = `${quotedPytestCmd} --junitxml=${quotedReportPath} -v`;
        }

        // Handle multiple files / parallel execution
        if (testFiles && testFiles.length > 0) {
            // Validate paths
            for (const file of testFiles) {
                if (file.includes('..') || file.startsWith('/')) {
                    throw new Error(`Invalid test file path: ${file}`);
                }
            }
            if (isJavascript) {
                shellCmd += ' ' + testFiles.map(f => `"${f}"`).join(' ');
            } else {
                if (testFiles.length > 1) {
                    shellCmd += ' -n auto';
                }
                shellCmd += ' ' + testFiles.map(f => `"${f}"`).join(' ');
            }
        }

        const child = spawn(shellCmd, [], {
            cwd: projectPath,
            shell: true
        });

        child.stdout.on('data', (data) => {
            console.log(`[PytestRunner] stdout: ${data}`);
        });

        child.stderr.on('data', (data) => {
            console.error(`[PytestRunner] stderr: ${data}`);
        });

        // Store process reference if we want to allow cancellation (omitted for brevity)

        // Handle process completion
        child.on('close', async (code) => {
            console.log(`[PytestRunner] Process exited with code ${code}`);

            const endTime = new Date();
            const duration = endTime.getTime() - execution.startTime.getTime();

            let status = code === 0 ? 'passed' : 'failed';
            let results: any[] = [];

            // Parse JUnit XML report
            try {
                const xmlData = await fs.readFile(junitReportPath, 'utf-8');
                const parsed = await parseStringPromise(xmlData);

                // Extract metrics
                const suite = parsed.testsuites.testsuite[0].$;
                const totalTests = parseInt(suite.tests || '0');
                const failCount = parseInt(suite.failures || '0');
                const errorCount = parseInt(suite.errors || '0');
                const skipCount = parseInt(suite.skipped || '0');
                const passCount = totalTests - failCount - errorCount - skipCount;

                // Update Execution Record
                await prisma.testExecution.update({
                    where: { id: execution.id },
                    data: {
                        status: failCount > 0 || errorCount > 0 ? 'failed' : 'passed',
                        endTime,
                        duration,
                        totalTests,
                        passCount,
                        failCount,
                        errorCount,
                        skipCount
                    }
                });

                // Parse individual test cases
                if (parsed.testsuites.testsuite[0].testcase) {
                    for (const tc of parsed.testsuites.testsuite[0].testcase) {
                        const tcMeta = tc.$;
                        let tcStatus = 'passed';
                        let errorMessage = null;

                        if (tc.failure) {
                            tcStatus = 'failed';
                            errorMessage = tc.failure[0]._;
                        } else if (tc.error) {
                            tcStatus = 'error';
                            errorMessage = tc.error[0]._;
                        } else if (tc.skipped) {
                            tcStatus = 'skipped';
                        }

                        await prisma.testResult.create({
                            data: {
                                executionId: execution.id,
                                testName: tcMeta.name,
                                className: tcMeta.classname,
                                status: tcStatus,
                                duration: parseFloat(tcMeta.time || '0') * 1000, // Convert s to ms
                                errorMessage: errorMessage?.substring(0, 500) // Truncate mainly
                            }
                        });
                    }
                }

            } catch (err) {
                console.error('[PytestRunner] Error parsing report:', err);
                await prisma.testExecution.update({
                    where: { id: execution.id },
                    data: { status: 'error', endTime, duration }
                });
            }
        });

        return execution.id;
    }
}
