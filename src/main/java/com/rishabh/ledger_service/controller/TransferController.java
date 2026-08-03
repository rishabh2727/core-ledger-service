package com.rishabh.ledger_service.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.rishabh.ledger_service.model.Account;
import com.rishabh.ledger_service.model.IdempotencyKey;
import com.rishabh.ledger_service.dto.TransferRequest;
import com.rishabh.ledger_service.model.LedgerEntry;
import com.rishabh.ledger_service.repository.LedgerEntryRepository;
import com.rishabh.ledger_service.repository.AccountRepository;
import com.rishabh.ledger_service.repository.IdempotencyKeyRepository;
@RestController
@RequestMapping("/transfers")
public class TransferController {
    private final LedgerEntryRepository ledgerEntryRepository;
    private final AccountRepository accountRepository;
    private final IdempotencyKeyRepository idempotencyKeyRepository;

    public TransferController(LedgerEntryRepository ledgerEntryRepository,AccountRepository accountRepository,
            IdempotencyKeyRepository idempotencyKeyRepository){
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.accountRepository = accountRepository;
        this.idempotencyKeyRepository = idempotencyKeyRepository;
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

// make transfer endpoint, which would send a post request, 
// always use dependency injection to declare and inject the repositroy
// as a field on the controller via the constructor, so it can be used as 
// variable to call methods like save(), findbyid, and others to query
// the database, some are automatically provided by spring boot by extending
// the JPA repository.
    @PostMapping
    @Transactional
    // wraps the entire method in one database transaction: 
    // if anything inside throws an error partway through 
    // (say, the second save() fails), everything that already happened
    //  inside this method — including the first save()
    //  — gets rolled back automatically, as if none of it occurred.
    public ResponseEntity<?> createTransfer(@RequestBody TransferRequest request){
        // this is wrong, because finding the account by id, is only poosible
        // by querying the database, and that is what the repository does, 
        // request object is a dto object, it is what is passed over to the server
        // and converted by spring boot from json to dto object. it contains the 
        // from and to account id fields and other fields, we want to find that 
        // passed in account id in dto object and use account repository to find it
        // using the findByAccountId method.
        
        Long fromId = request.getFromAccountId();
        Long toId = request.getToAccountId();
        String idemKey = request.getIdempotencyKey();
        // the methods like .findByAccountId belong to repository
    
        Optional<Account> fromAccount1 = accountRepository.findById(fromId);
        Optional<Account> toAccount2 = accountRepository.findById(toId);
        Optional<IdempotencyKey> idempotencyKey = idempotencyKeyRepository.findById(idemKey);
        
        // check if idemKey exists in the idempotencyKey table in database, if yes,
        // this is a duplicate transfer with same id, and it should not go through
        if (idempotencyKey.isPresent()){
            return ResponseEntity.ok("Transfer already processed. Transaction ID: " + idempotencyKey.get().getTransactionId());
        }

        if (fromAccount1.isEmpty() ||  toAccount2.isEmpty()){
            return ResponseEntity.badRequest().body("One or Both Accounts do not exist");
        }
        // BigDecimal can't be compared with < or > directly
        // those operators do not work on objects, instead use compareTo(...)
        BigDecimal currentBalance = calculateBalance(request.getFromAccountId());
        if (currentBalance.compareTo(request.getAmount()) < 0) {
            return ResponseEntity.badRequest().body("Insufficient funds.");     
        }
        long transactionId = ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE);

        LedgerEntry debit = new LedgerEntry();
        debit.setAccountId(request.getFromAccountId());
        debit.setTransactionId(transactionId);
        debit.setType(LedgerEntry.TransactionType.DEBIT);
        debit.setAmount(request.getAmount());
        ledgerEntryRepository.save(debit);

        LedgerEntry credit = new LedgerEntry();
        credit.setAccountId(request.getToAccountId());
        credit.setTransactionId(transactionId);
        credit.setType(LedgerEntry.TransactionType.CREDIT);
        credit.setAmount(request.getAmount());
        ledgerEntryRepository.save(credit);

        IdempotencyKey usedKey = new IdempotencyKey();
        usedKey.setKey(idemKey);
        usedKey.setTransactionId(transactionId);
        idempotencyKeyRepository.save(usedKey);

        return ResponseEntity.ok("Transfer completed. Transaction ID: " + transactionId);

    }

}


