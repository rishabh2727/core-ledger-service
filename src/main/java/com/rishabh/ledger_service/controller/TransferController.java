package com.rishabh.ledger_service.controller;

import java.math.BigDecimal;
import java.util.List;

import com.rishabh.ledger_service.model.LedgerEntry;
import com.rishabh.ledger_service.repository.LedgerEntryRepository;

@RestController
@RequestMapping("/transfers")
public class TransferController {
    private final LedgerEntryRepository ledgerEntryRepository;

    public TransferController(LedgerEntryRepository ledgerEntryRepository){
        this.ledgerEntryRepository = ledgerEntryRepository;
    }

    // How much money does this one account currently have?
    // balance = (sum of all CREDIT amounts for this account) −
    //  (sum of all DEBIT amounts for this account)
    private BigDecimal calculateBalance(Long accountId) {
    List<LedgerEntry> entries = ledgerEntryRepository.findByAccountId(accountId);

    BigDecimal balance = BigDecimal.ZERO;
    for (LedgerEntry entry : entries) {
        if (entry.getType() == LedgerEntry.TransactionType.CREDIT) {
            balance = balance.add(entry.getAmount());
        } else {
            balance = balance.subtract(entry.getAmount());
        }
    }
    return balance;
}
    
}
