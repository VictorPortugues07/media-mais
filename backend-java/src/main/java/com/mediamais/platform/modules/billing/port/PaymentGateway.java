package com.mediamais.platform.modules.billing.port;

public interface PaymentGateway {

    BillingCreationResult criarCobranca(BillingCreationCommand command);

    boolean validarAssinaturaWebhook(String rawPayload, String signatureHeader);
}
