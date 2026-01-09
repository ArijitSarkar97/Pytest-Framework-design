import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllFrameworks = async (req: Request, res: Response) => {
    try {
        const frameworks = await prisma.framework.findMany({
            include: {
                pages: {
                    include: { elements: true }
                },
                tests: {
                    include: { steps: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(frameworks);
    } catch (error) {
        console.error('Error fetching frameworks:', error);
        res.status(500).json({ error: 'Failed to fetch frameworks' });
    }
};

export const getFrameworkById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const framework = await prisma.framework.findUnique({
            where: { id },
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
            return res.status(404).json({ error: 'Framework not found' });
        }

        res.json(framework);
    } catch (error) {
        console.error('Error fetching framework:', error);
        res.status(500).json({ error: 'Failed to fetch framework' });
    }
};

export const createFramework = async (req: Request, res: Response) => {
    const { name, project, lastUrls } = req.body;

    try {
        const framework = await prisma.framework.create({
            data: {
                name: name || 'Unnamed Framework',
                baseUrl: project?.config?.baseUrl || '',
                browser: project?.config?.browser || 'chrome',
                headless: project?.config?.headless ?? true,
                defaultTimeout: project?.config?.defaultTimeout ?? 30000,
                retries: project?.config?.retries ?? 0,
                retryDelay: project?.config?.retryDelay ?? 1000,
                useAllureReport: project?.config?.useAllureReport ?? true,
                screenshotOnFailure: project?.config?.screenshotOnFailure ?? true,
                videoRecording: project?.config?.videoRecording ?? false,
                projectName: project?.projectName || 'pytest-automation',
                totalPages: project?.pages?.length || 0,
                totalTests: project?.tests?.length || 0,
                lastUrls: lastUrls || [],
                pages: {
                    create: (project?.pages || []).map((page: any) => ({
                        name: page.name,
                        elements: {
                            create: (page.elements || []).map((el: any) => ({
                                name: el.name,
                                locatorType: el.locatorType,
                                locatorValue: el.locatorValue,
                                description: el.description || ''
                            }))
                        }
                    }))
                },
                tests: {
                    create: (project?.tests || []).map((test: any) => ({
                        name: test.name,
                        type: test.type || 'smoke',
                        steps: {
                            create: (test.steps || []).map((step: any, idx: number) => ({
                                action: step.action || '',
                                description: step.description || '',
                                value: step.value || '',
                                pageId: step.pageId || '',
                                elementId: step.elementId || '',
                                order: idx
                            }))
                        }
                    }))
                }
            },
            include: {
                pages: { include: { elements: true } },
                tests: { include: { steps: true } }
            }
        });

        res.status(201).json(framework);
    } catch (error) {
        console.error('Error creating framework:', error);
        res.status(500).json({ error: 'Failed to create framework' });
    }
};

export const updateFramework = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, project, lastUrls } = req.body;

    try {
        // Delete existing pages and tests (cascade will handle children)
        await prisma.page.deleteMany({ where: { frameworkId: id } });
        await prisma.test.deleteMany({ where: { frameworkId: id } });

        // Update framework with new data
        const framework = await prisma.framework.update({
            where: { id },
            data: {
                name: name || 'Unnamed Framework',
                version: { increment: 1 },
                baseUrl: project?.config?.baseUrl || '',
                browser: project?.config?.browser || 'chrome',
                headless: project?.config?.headless ?? true,
                defaultTimeout: project?.config?.defaultTimeout ?? 30000,
                retries: project?.config?.retries ?? 0,
                retryDelay: project?.config?.retryDelay ?? 1000,
                useAllureReport: project?.config?.useAllureReport ?? true,
                screenshotOnFailure: project?.config?.screenshotOnFailure ?? true,
                videoRecording: project?.config?.videoRecording ?? false,
                totalPages: project?.pages?.length || 0,
                totalTests: project?.tests?.length || 0,
                lastUrls: lastUrls || [],
                pages: {
                    create: (project?.pages || []).map((page: any) => ({
                        name: page.name,
                        elements: {
                            create: (page.elements || []).map((el: any) => ({
                                name: el.name,
                                locatorType: el.locatorType,
                                locatorValue: el.locatorValue,
                                description: el.description || ''
                            }))
                        }
                    }))
                },
                tests: {
                    create: (project?.tests || []).map((test: any) => ({
                        name: test.name,
                        type: test.type || 'smoke',
                        steps: {
                            create: (test.steps || []).map((step: any, idx: number) => ({
                                action: step.action || '',
                                description: step.description || '',
                                value: step.value || '',
                                pageId: step.pageId || '',
                                elementId: step.elementId || '',
                                order: idx
                            }))
                        }
                    }))
                }
            },
            include: {
                pages: { include: { elements: true } },
                tests: { include: { steps: true } }
            }
        });

        res.json(framework);
    } catch (error) {
        console.error('Error updating framework:', error);
        res.status(500).json({ error: 'Failed to update framework' });
    }
};

export const deleteFramework = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.framework.delete({
            where: { id }
        });

        res.json({ message: 'Framework deleted successfully' });
    } catch (error) {
        console.error('Error deleting framework:', error);
        res.status(500).json({ error: 'Failed to delete framework' });
    }
};
