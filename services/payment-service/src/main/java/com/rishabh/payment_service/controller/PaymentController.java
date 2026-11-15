package com.rishabh.payment_service.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rishabh.payment_service.dto.PaymentRequest;
import com.rishabh.payment_service.model.Payment;
import com.rishabh.payment_service.repository.PaymentRepository;
import com.rishabh.payment_service.service.PaymentOrchestrationService;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final PaymentOrchestrationService paymentOrchestrationService;

    public PaymentController(PaymentRepository paymentRepository,
                             PaymentOrchestrationService paymentOrchestrationService) {
        this.paymentRepository = paymentRepository;
        this.paymentOrchestrationService = paymentOrchestrationService;
    }

    @PostMapping
    public Payment createPayment(@RequestBody PaymentRequest request) {
        return paymentOrchestrationService.createPayment(request);
    }

    @GetMapping
    public Page<Payment> listPayments(@PageableDefault(size = 20) Pageable pageable) {
        return paymentRepository.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPayment(@PathVariable Long id) {
        return paymentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
