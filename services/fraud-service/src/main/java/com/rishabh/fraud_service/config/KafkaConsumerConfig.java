package com.rishabh.fraud_service.config;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JacksonJsonDeserializer;

// this will lisiten for incoming request, it sits and waits for a new message to
// showe up on transfer events. when we use the srping annotation Kafka listener,
// spring will automatically call this method every single time a new message arrives.
// @KafkaListener
@Configuration
public class KafkaConsumerConfig {
    private final String bootstrapServers;
    private final String groupId;
    private final boolean listenerAutoStartup;

    public KafkaConsumerConfig(
            @Value("${spring.kafka.bootstrap-servers}") String bootstrapServers,
            @Value("${spring.kafka.consumer.group-id}") String groupId,
            @Value("${spring.kafka.listener.auto-startup:true}") boolean listenerAutoStartup) {
        this.bootstrapServers = bootstrapServers;
        this.groupId = groupId;
        this.listenerAutoStartup = listenerAutoStartup;
    }

    // working with beans and factories,
    @Bean
    // When Fraud Service receives JSON and needs to convert it back into
    //  a real Java object, it needs to know which Java class to build.
    public ConsumerFactory<String, Object> consumerFactory(){
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JacksonJsonDeserializer.class);
        // for trusted packages, only trust our own package.
        config.put(JacksonJsonDeserializer.TRUSTED_PACKAGES, "com.rishabh.fraud_service");
        // we set the header to be false, so that we ignore ledger's class name, because 
        // if fraud trusts that header, it tries to load Ledger's class, it fails and 
        // the message is dropped.
        config.put(JacksonJsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        config.put(JacksonJsonDeserializer.VALUE_DEFAULT_TYPE, TransferCompletedEvent.class.getName());
        return new DefaultKafkaConsumerFactory<>(config);
    }

    // Spring looks for a bean named kafkaListenerContainerFactory by default.
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, Object> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.setAutoStartup(listenerAutoStartup);
        return factory;
    }
}

