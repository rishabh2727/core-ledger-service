package com.rishabh.ledger_service.repository;

import com.rishabh.ledger_service.model.Account;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

// This is the interface-based magic, like we get all methods like save()
// findAll(), for free by just extedning JpaRepository
public interface AccountRepository extends JpaRepository<Account, Long>{
    // never write the actual query logic. Spring reads the method name
    //  itself at startup, parses it word by word (find By AccountNumber), 
    // and automatically generates the correct SQL behind the scenes
    Optional<Account> findByAccountNumber(String accountNumber);


    
}
