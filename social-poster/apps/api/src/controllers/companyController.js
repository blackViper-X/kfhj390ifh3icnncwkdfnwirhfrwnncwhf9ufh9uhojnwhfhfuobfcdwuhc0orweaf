const companyService = require('../services/companyService');

async function createCompany(req, res, next) {
  try {
    const company = await companyService.createCompany(req.body, req.user.id);
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
}

async function getCompanies(req, res, next) {
  try {
    const companies = await companyService.getCompanies();
    res.json({ success: true, data: companies });
  } catch (error) {
    next(error);
  }
}

async function getCompany(req, res, next) {
  try {
    const company = await companyService.getCompany(req.params.id);
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
}

async function updateCompany(req, res, next) {
  try {
    const company = await companyService.updateCompany(req.params.id, req.body, req.user.id);
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
}

async function deleteCompany(req, res, next) {
  try {
    await companyService.deleteCompany(req.params.id, req.user.id);
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    next(error);
  }
}

async function createManager(req, res, next) {
  try {
    const manager = await companyService.createManager(req.params.id, req.body, req.user.id);
    res.status(201).json({ success: true, data: manager });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  createManager,
};
