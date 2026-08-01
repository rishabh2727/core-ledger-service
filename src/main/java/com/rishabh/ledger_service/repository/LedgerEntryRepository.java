package com.rishabh.ledger_service.repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.rishabh.ledger_service.model.LedgerEntry;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long>{
    
    List<LedgerEntry> findByAccountId(Long accountId);


}
