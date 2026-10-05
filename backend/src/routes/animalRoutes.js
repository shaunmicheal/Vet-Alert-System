// Animal routes. Mounted at /api/animals.
// Locked to logged-in farmers - other roles get 403, guests get 401.
const express = require('express');
const { z } = require('zod');

const { validate, validateParams, idParamSchema } = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const {
  listAnimals,
  createAnimal,
  getAnimal,
  updateAnimal,
  deleteAnimal,
} = require('../controllers/animalController');
const { ANIMAL_TYPES, ANIMAL_SEXES } = require('../utils/constants');

const router = express.Router();

router.use(authMiddleware, requireRole('FARMER'));

const animalFields = {
  animalType: z.enum(ANIMAL_TYPES),
  name: z.string().trim().min(1).max(80).optional(),
  tagNumber: z.string().trim().min(1).max(60).optional(),
  breed: z.string().trim().min(1).max(80).optional(),
  age: z.number().int().min(0).max(100).optional(),
  sex: z.enum(ANIMAL_SEXES).optional(),
};

const createAnimalSchema = z.object(animalFields);
const updateAnimalSchema = z
  .object(animalFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

router.get('/', listAnimals);
router.post('/', validate(createAnimalSchema), createAnimal);
router.get('/:id', validateParams(idParamSchema), getAnimal);
router.put('/:id', validateParams(idParamSchema), validate(updateAnimalSchema), updateAnimal);
router.patch('/:id', validateParams(idParamSchema), validate(updateAnimalSchema), updateAnimal);
router.delete('/:id', validateParams(idParamSchema), deleteAnimal);

module.exports = router;
