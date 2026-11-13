package com.rishabh.fraud_service;

import static java.util.concurrent.TimeUnit.SECONDS;
import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.util.List;
import java.util.Properties;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import com.rishabh.fraud_service.model.FraudDecision;
import com.rishabh.fraud_service.repository.FraudDecisionRepository;

@SpringBootTest(properties = {
        "spring.kafka.listener.auto-startup=true",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
// Testcontainers lets this test start real Docker containers just for the test.
@Testcontainers
class FraudKafkaIntegrationTest {

    // static means JUnit creates one Postgres container for this test class,
    // instead of creating a new one for every test method.
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName("fraud")
            .withUsername("postgres")
            .withPassword("devpassword");

    // This is a real Kafka broker running in Docker for the test.
    @Container
    static KafkaContainer kafka = new KafkaContainer(
            DockerImageName.parse("confluentinc/cp-kafka:7.6.1"));

    @Autowired
    private FraudDecisionRepository fraudDecisionRepository;

    @DynamicPropertySource
    static void configureContainers(DynamicPropertyRegistry registry) {
        // The containers choose their own ports, so we give Spring the real URLs here.
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.kafka.consumer.group-id", () -> "fraud-integration-test");
        registry.add("spring.kafka.consumer.auto-offset-reset", () -> "earliest");
    }

    @BeforeEach
    void deleteExistingDecisions() {
        fraudDecisionRepository.deleteAll();
    }

    @Test
    void consumesKafkaEventAndSavesFraudDecision() throws Exception {
        long transactionId = 12345L;

        // This test pretends to be Ledger by sending the same Kafka message Ledger would send.
        sendTransferEvent(transactionId, "2000.00");

        // Kafka work is not instant, so Awaitility keeps checking until the row appears.
        await().atMost(10, SECONDS).untilAsserted(() -> {
            List<FraudDecision> decisions = fraudDecisionRepository.findAll();

            assertEquals(1, decisions.size());

            FraudDecision decision = decisions.get(0);
            assertEquals(transactionId, decision.getTransactionId());
            assertEquals(0, decision.getAmount().compareTo(new BigDecimal("2000.00")));
            assertEquals(80, decision.getScore());
            assertEquals("DECLINE", decision.getOutcome());
            assertEquals("LARGE_AMOUNT,ROUND_AMOUNT", decision.getReason());
        });
    }

    private void sendTransferEvent(long transactionId, String amount) throws Exception {
        // A Kafka producer is the thing that sends messages into Kafka.
        Properties producerProperties = new Properties();
        producerProperties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers());
        producerProperties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        producerProperties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

        String eventJson = """
                {
                  "transactionId": %d,
                  "fromAccountId": 100,
                  "toAccountId": 200,
                  "amount": %s
                }
                """.formatted(transactionId, amount);

        try (KafkaProducer<String, String> producer = new KafkaProducer<>(producerProperties)) {
            producer.send(new ProducerRecord<>("transfer-events", String.valueOf(transactionId), eventJson))
                    .get(10, SECONDS);
        }
    }
}
