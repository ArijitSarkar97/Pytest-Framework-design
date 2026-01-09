import { Router } from 'express';
import * as controller from '../controllers/frameworkController';

const router = Router();

router.get('/', controller.getAllFrameworks);
router.get('/:id', controller.getFrameworkById);
router.post('/', controller.createFramework);
router.put('/:id', controller.updateFramework);
router.delete('/:id', controller.deleteFramework);

export default router;
