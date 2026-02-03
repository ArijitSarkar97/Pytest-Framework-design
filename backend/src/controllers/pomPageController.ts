import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllPomSets = async (req: Request, res: Response) => {
    try {
        const pomSets = await prisma.pomPageSet.findMany({
            include: {
                pages: {
                    include: { elements: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(pomSets);
    } catch (error) {
        console.error('Error fetching POM sets:', error);
        res.status(500).json({ error: 'Failed to fetch POM sets' });
    }
};

export const getPomSetById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const pomSet = await prisma.pomPageSet.findUnique({
            where: { id },
            include: {
                pages: {
                    include: { elements: true }
                }
            }
        });

        if (!pomSet) {
            return res.status(404).json({ error: 'POM set not found' });
        }

        res.json(pomSet);
    } catch (error) {
        console.error('Error fetching POM set:', error);
        res.status(500).json({ error: 'Failed to fetch POM set' });
    }
};

export const createPomSet = async (req: Request, res: Response) => {
    const { name, sourceUrl, pages } = req.body;

    try {
        const pomSet = await prisma.pomPageSet.create({
            data: {
                name: name || `POM_Pages_${Date.now()}`,
                sourceUrl,
                pages: {
                    create: (pages || []).map((page: any) => ({
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
                }
            },
            include: {
                pages: {
                    include: { elements: true }
                }
            }
        });

        res.status(201).json(pomSet);
    } catch (error) {
        console.error('Error creating POM set:', error);
        res.status(500).json({ error: 'Failed to create POM set' });
    }
};

export const deletePomSet = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.pomPageSet.delete({
            where: { id }
        });

        res.json({ message: 'POM set deleted successfully' });
    } catch (error) {
        console.error('Error deleting POM set:', error);
        res.status(500).json({ error: 'Failed to delete POM set' });
    }
};
