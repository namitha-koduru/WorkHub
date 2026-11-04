import { Router } from 'express';
import {
  createSuggestion,
  getSuggestions,
  decideSuggestion,
} from '../controllers/suggestion.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createSuggestionSchema,
  decideSuggestionSchema,
} from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createSuggestionSchema), createSuggestion);
router.get('/', getSuggestions);
router.patch('/:suggestionId/status', validate(decideSuggestionSchema), decideSuggestion);

export default router;

