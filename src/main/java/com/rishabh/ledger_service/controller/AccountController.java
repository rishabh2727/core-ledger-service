package com.rishabh.ledger_service.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.rishabh.ledger_service.model.Account;
import org.springframework.http.ResponseEntity;
import com.rishabh.ledger_service.repository.AccountRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
// import org.springframework.web.bind.annotation.RequestParam;
// import org.springframework.web.bind.annotation.*;



// The controller is the piece that says:
//  "when an HTTP request comes in at this specific URL and method,
//   run this specific Java method.


@RestController
@RequestMapping("/accounts")
public class AccountController{
    // this controller needs an AccountRepository to 
    // do its job, so we make a constructor here
    // we declare a field here of type AccountRepository
    private final AccountRepository accountRepository;

    // this is the constructor, two different things with the same 
    // name.
    public AccountController(AccountRepository accountRepository){
        // take whatever was passed in as the parameter,
        //  and store it into this object's permanent field
        this.accountRepository = accountRepository;
    }


    @PostMapping
    public ResponseEntity<Account> createAccount(@RequestBody Account account){
        account.setStatus("ACTIVE");
        Account saved = accountRepository.save(account);
        return ResponseEntity.ok(saved);
    }

    // handles GET /accounts/5, GET /accounts/12
    @GetMapping("/{id}")
    public ResponseEntity<Account> getAccount(@PathVariable Long id) {
        return accountRepository.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
    }
    
}


