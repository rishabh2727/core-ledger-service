package com.rishabh.fraud_service.service;

import java.time.Duration;
import java.time.Instant;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

@Service
public class TransactionVelocityTracker {

    // Keep recent transfers for the last 5 minutes.
    private static final Duration WINDOW = Duration.ofMinutes(5);
    // Keep the Redis key a little longer than the window so it does not expire early.
    private static final Duration KEY_TTL = Duration.ofMinutes(6);
    private static final String KEY_PREFIX = "fraud_velocity:";

    private final StringRedisTemplate redisTemplate;

    public TransactionVelocityTracker(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public long recordAndCountRecentTransfers(Long accountId, Long transactionId) {
        String key = KEY_PREFIX + accountId;
        long now = Instant.now().toEpochMilli();
        long oldestAllowedTime = now - WINDOW.toMillis();

        ZSetOperations<String, String> transfers = redisTemplate.opsForZSet();
        transfers.removeRangeByScore(key, 0, oldestAllowedTime);
        transfers.add(key, String.valueOf(transactionId), now);
        redisTemplate.expire(key, KEY_TTL);

        Long count = transfers.zCard(key);
        return count == null ? 0 : count;
    }
}
