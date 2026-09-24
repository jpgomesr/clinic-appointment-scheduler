import professionalsRepository from "../repository/professionals.repository";

const professionalsService = {
   getAll: async () => {
      return await professionalsRepository.findAll();
   },
};

export default professionalsService;
