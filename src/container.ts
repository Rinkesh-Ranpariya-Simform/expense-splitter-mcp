import { GroupRepository } from './repositories/GroupRepository.js';
import { MemberRepository } from './repositories/MemberRepository.js';
import { ExpenseRepository } from './repositories/ExpenseRepository.js';
import { SettlementRepository } from './repositories/SettlementRepository.js';
import { GroupService } from './services/GroupService.js';
import { ExpenseService } from './services/ExpenseService.js';
import { BalanceService } from './services/BalanceService.js';
import { SettlementService } from './services/SettlementService.js';
import { HistoryService } from './services/HistoryService.js';
import { ExportService } from './services/ExportService.js';

export interface Container {
  groupService: GroupService;
  expenseService: ExpenseService;
  balanceService: BalanceService;
  settlementService: SettlementService;
  historyService: HistoryService;
  exportService: ExportService;
}

export function createContainer(): Container {
  // Repositories
  const groupRepo = new GroupRepository();
  const memberRepo = new MemberRepository();
  const expenseRepo = new ExpenseRepository();
  const settlementRepo = new SettlementRepository();

  // Services
  const groupService = new GroupService(groupRepo, memberRepo, expenseRepo, settlementRepo);
  const expenseService = new ExpenseService(expenseRepo, groupService);
  const balanceService = new BalanceService(expenseRepo, settlementRepo, groupRepo, memberRepo);
  const settlementService = new SettlementService(settlementRepo, groupRepo, memberRepo);
  const historyService = new HistoryService(
    expenseRepo,
    settlementRepo,
    groupRepo,
    memberRepo,
    balanceService,
  );
  const exportService = new ExportService(groupRepo, memberRepo, expenseRepo, settlementRepo);

  return {
    groupService,
    expenseService,
    balanceService,
    settlementService,
    historyService,
    exportService,
  };
}
