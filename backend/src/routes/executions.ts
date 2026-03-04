import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PytestRunner } from '../services/pytestRunner';

const router = express.Router();
const prisma = new PrismaClient();

// Trigger a new test run
router.post('/run', async (req, res) => {
    try {
        const { frameworkId, testFiles } = req.body;
        console.log(`[Backend] Received run request for framework ${frameworkId}, files: ${testFiles?.length}`);
        if (!frameworkId) {
            return res.status(400).json({ error: 'Framework ID is required' });
        }

        const executionId = await PytestRunner.executeTest(frameworkId, testFiles);
        res.json({ executionId, status: 'started' });
    } catch (error) {
        console.error('Failed to start execution:', error);
        res.status(500).json({ error: String(error) });
    }
});

// Get execution history for a framework
router.get('/history/:frameworkId', async (req, res) => {
    try {
        const { frameworkId } = req.params;
        const executions = await prisma.testExecution.findMany({
            where: { frameworkId },
            orderBy: { startTime: 'desc' },
            take: 20, // Limit to last 20 runs
            include: {
                _count: {
                    select: { results: true }
                }
            }
        });
        res.json(executions);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Get details of a specific execution
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const execution = await prisma.testExecution.findUnique({
            where: { id },
            include: {
                results: {
                    orderBy: { status: 'asc' } // Failed first
                }
            }
        });

        if (!execution) {
            return res.status(404).json({ error: 'Execution not found' });
        }

        res.json(execution);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

export default router;
