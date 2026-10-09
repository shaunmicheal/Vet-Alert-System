const { sendSuccess } = require('../utils/response');
const { listActiveProfessionals } = require('../services/professionalService');

const listProfessionals = async (req, res) => {
  const professionals = await listActiveProfessionals({
    province: req.query.province,
    district: req.query.district,
    professionalType: req.query.professionalType,
    specialisation: req.query.specialisation,
    search: req.query.search,
  });

  return sendSuccess(res, { professionals, count: professionals.length });
};

module.exports = { listProfessionals };
