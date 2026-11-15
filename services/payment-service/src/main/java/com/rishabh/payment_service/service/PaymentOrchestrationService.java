package com.rishabh.payment_service.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.rishabh.payment_service.dto.FraudCheckRequest;
import com.rishabh.payment_service.dto.FraudCheckResponse;
import com.rishabh.payment_service.dto.LedgerTransferRequest;
import com.rishabh.payment_service.dto.PaymentRequest;
import com.rishabh.payment_service.model.Payment;
import com.rishabh.payment_service.repository.PaymentRepository;

@Service
public class PaymentOrchestrationService {

    private static final Pattern TRANSACTION_ID_PATTERN = Pattern.compile("Transaction ID:\\s*(\\d+)");

    private final PaymentRepository paymentRepository;
    private final RestClient fraudClient;
    private final RestClient ledgerClient;
    private final String ledgerUsername;
    private final String ledgerPassword;

    public PaymentOrchestrationService(
            PaymentRepository paymentRepository,
            @Value("${fraud.service.base-url}") String fraudBaseUrl,
            @Value("${ledger.service.base-url}") String ledgerBaseUrl,
            @Value("${ledger.service.username}") String ledgerUsername,
            @Value("${ledger.service.password}") String ledgerPassword) {
        this.paymentRepository = paymentRepository;
        this.fraudClient = RestClient.builder().baseUrl(fraudBaseUrl).build();
        this.ledgerClient = RestClient.builder().baseUrl(ledgerBaseUrl).build();
        this.ledgerUsername = ledgerUsername;
        this.ledgerPassword = ledgerPassword;
    }

    public Payment createPayment(PaymentRequest request) {
        Payment payment = new Payment();
        payment.setFromAccountId(request.getFromAccountId());
        payment.setToAccountId(request.getToAccountId());
        payment.setAmount(request.getAmount());
        payment.setStatus(Payment.Status.PENDING);
        payment = paymentRepository.save(payment);

        try {
            FraudCheckResponse fraudDecision = askFraud(payment);
            payment.setFraudScore(fraudDecision.score());
            payment.setFraudReason(fraudDecision.reason());

            if ("DECLINE".equals(fraudDecision.outcome())) {
                payment.setStatus(Payment.Status.DECLINED);
                payment.setUpdatedAt(LocalDateTime.now());
                return paymentRepository.save(payment);
            }

            payment.setStatus(Payment.Status.APPROVED);
            payment.setUpdatedAt(LocalDateTime.now());
            payment = paymentRepository.save(payment);

            Long ledgerTransactionId = tellLedgerToMoveMoney(payment);
            payment.setLedgerTransactionId(ledgerTransactionId);
            payment.setStatus(Payment.Status.COMPLETED);
            payment.setUpdatedAt(LocalDateTime.now());
            return paymentRepository.save(payment);
        } catch (Exception exception) {
            payment.setStatus(Payment.Status.FAILED);
            payment.setFailureReason(exception.getMessage());
            payment.setUpdatedAt(LocalDateTime.now());
            return paymentRepository.save(payment);
        }
    }

    private FraudCheckResponse askFraud(Payment payment) {
        FraudCheckRequest request = new FraudCheckRequest(
                payment.getId(),
                payment.getFromAccountId(),
                payment.getToAccountId(),
                payment.getAmount());

        FraudCheckResponse response = fraudClient.post()
                .uri("/fraud-checks")
                .body(request)
                .retrieve()
                .body(FraudCheckResponse.class);

        if (response == null) {
            throw new IllegalStateException("Fraud Service returned an empty response");
        }

        return response;
    }

    private Long tellLedgerToMoveMoney(Payment payment) {
        LedgerTransferRequest request = new LedgerTransferRequest(
                payment.getFromAccountId(),
                payment.getToAccountId(),
                payment.getAmount(),
                "Payment Service transfer for payment " + payment.getId(),
                "payment-" + payment.getId());

        String response = ledgerClient.post()
                .uri("/transfers")
                .header(HttpHeaders.AUTHORIZATION, ledgerAuthorizationHeader())
                .body(request)
                .retrieve()
                .body(String.class);

        if (response == null) {
            throw new IllegalStateException("Ledger Service returned an empty response");
        }

        Matcher matcher = TRANSACTION_ID_PATTERN.matcher(response);
        if (!matcher.find()) {
            throw new IllegalStateException("Ledger response did not include a transaction id: " + response);
        }

        return Long.valueOf(matcher.group(1));
    }

    private String ledgerAuthorizationHeader() {
        String credentials = ledgerUsername + ":" + ledgerPassword;
        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        return "Basic " + encoded;
    }
}
