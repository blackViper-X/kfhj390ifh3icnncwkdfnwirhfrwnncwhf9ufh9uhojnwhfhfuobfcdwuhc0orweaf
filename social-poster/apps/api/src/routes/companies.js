const express = require('express');
const companyController = require('../controllers/companyController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(requireRole('SUPERUSER'));

router.post('/', companyController.createCompany);
router.get('/', companyController.getCompanies);
router.get('/:id', companyController.getCompany);
router.patch('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);
router.post('/:id/manager', companyController.createManager);

module.exports = router;
