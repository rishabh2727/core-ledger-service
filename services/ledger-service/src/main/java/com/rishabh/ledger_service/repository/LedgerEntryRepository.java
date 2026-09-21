package com.rishabh.ledger_service.repository;
import java.util.List;


import org.springframework.data.jpa.repository.JpaRepository;


import com.rishabh.ledger_service.model.LedgerEntry;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long>{
    
        // one accountid can have many ledger entries so we use a list here.
        // for account controller, when we were finding by accountnumber
        // we used Optional<> this box holds exactly one value or nothing at all
    List<LedgerEntry> findByAccountId(Long accountId);


}
