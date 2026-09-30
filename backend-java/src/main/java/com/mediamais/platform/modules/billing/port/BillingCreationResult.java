package com.mediamais.platform.modules.billing.port;

public record BillingCreationResult(
    String abacateBillingId,
    String urlCheckout,
    String pixQrCode,
    String pixCopiaCola,
    int valorCentavos,
    String status
) {}
