import { Router, Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import ContractService from '../services/contract';
import { User, Contract } from '../types';

const createStudentContract = (srv: ContractService) => async (req: Request, res: Response): Promise<void> => {
  const contract = req.body as Contract;

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
  const { username } = req.user as User;

  try {
    const contracts = await srv.getStudentContracts(username);
    res.json(contracts);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const updateContractStatus = (srv: ContractService) => async (req: Request, res: Response): Promise<void> => {
  const { contractId } = req.params;
  const { status } = req.body as Contract;

  try {
    await srv.updateContractStatus(contractId, status);
    res.json({ success: `Contract id: ${contractId} updated.` });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

export default (db: Pool): Router => {
  const router = Router();
  const contractService = new ContractService(db);

  // TODO: apidoc for all
  router.get('/', getStudentContracts(contractService));
  router.post('/', createStudentContract(contractService));
  router.patch('/:contractId', updateContractStatus(contractService));

  return router;
};
