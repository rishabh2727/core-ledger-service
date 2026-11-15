package com.rishabh.ledger_service.config;

import java.util.Map;
import java.util.HashMap;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;


// this is how we configure a Kafka producer in Spring
@Configuration
public class KafkaProducerConfig {
    private final String bootstrapServers;

    public KafkaProducerConfig(
            @Value("${spring.kafka.bootstrap-servers}") String bootstrapServers) {
        this.bootstrapServers = bootstrapServers;
    }

    // Kafka equivalent of a repository, an object you inject into your controller
    // and call methods on, except instead of saving to a database, 
    // it sends messages to a topic.
    // it holds all the low-level connection settings
    // where Kafka lives, how to send JSON text
    @Bean
    public ProducerFactory<String, String> producerFactory(){
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        return new DefaultKafkaProducerFactory<>(config);
    }

    // friendlier tool built on top of that factory,
    // it needs the factory internally so that when you
    // later call kafkaTemplate.send(...), it knows exactly how 
    // to actually reach Kafka and format the message correctly.
    //  KafkaTemplate itself doesn't reinvent any of that,
    // it just wraps the factory in a simpler interface for you to use.
    @Bean
    public KafkaTemplate<String, String> kafkaTemplate(){
        // we construct a Kafka template object and it needs one thing to
        // do its job, that is Producer Factory, with all the settings,
        // we call producer factory method here defined above
        return new KafkaTemplate<>(producerFactory());
    }

}
