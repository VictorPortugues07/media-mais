package com.mediamais.platform.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class AbacatePayConfig {

    @Value("${abacatepay.api-url}")
    private String apiUrl;

    @Value("${abacatepay.api-key}")
    private String apiKey;

    @Bean
    public RestClient abacatePayRestClient() {
        return RestClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }
}
