import { Router, Request, Response } from 'express';
import ContractService from '../services/contract';
import { Pool } from 'mysql2/promise';
import { Contract } from '../types';

const createStudentContract = (srv: ContractService) => async (req: Request, res: Response): Promise<void> => {
  const contract = req.body.contract as Contract;

  try {
    const contractId = await srv.createStudentContract(contract);
    res.json({ contractId });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const getStudentContracts = (srv: ContractService) => async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  try {
    const contracts = await srv.getStudentContracts(studentId);
    res.json({ contracts });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const updateStudentContract = (srv: ContractService) => async (req: Request, res: Response): Promise<void> => {
  const { contractId } = req.params;
  const contract = req.body.contract as Contract;

  try {
    await srv.updateStudentContract(contractId, contract);
    res.json({ success: `Contract id: ${contractId} updated.` });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

export default (router: Router, db: Pool): void => {
  const contractService = new ContractService(db);

  router.post('/:studentId/contracts/', createStudentContract(contractService));
  router.get('/:studentId/contracts/', getStudentContracts(contractService));
  router.patch('/:studentId/contracts/:contractId', updateStudentContract(contractService));
};
