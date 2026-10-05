// Farmer-facing veterinary professional DIRECTORY (read-only).
// Only active professionals are returned; filtering happens in the database.
const { sendSuccess } = require('../utils/response');
const { listActiveProfessionals } = require('../services/professionalService');

// GET /api/vets
// Optional filters: province, district, professionalType, specialisation.
const listProfessionals = async (req, res) => {
  const professionals = await listActiveProfessionals({
    province: req.query.province,
    district: req.query.district,
    professionalType: req.query.professionalType,
    specialisation: req.query.specialisation,
  });

  return sendSuccess(res, { professionals, count: professionals.length });
};

module.exports = { listProfessionals };
