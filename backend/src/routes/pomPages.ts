import express from 'express';
import {
    getAllPomSets,
    getPomSetById,
    createPomSet,
    deletePomSet
} from '../controllers/pomPageController';

const router = express.Router();

router.get('/', getAllPomSets);           // GET /api/pom-pages
router.get('/:id', getPomSetById);        // GET /api/pom-pages/:id
router.post('/', createPomSet);           // POST /api/pom-pages
router.delete('/:id', deletePomSet);      // DELETE /api/pom-pages/:id

export default router;
