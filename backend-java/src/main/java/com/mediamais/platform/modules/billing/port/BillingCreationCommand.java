package com.mediamais.platform.modules.billing.port;

public record BillingCreationCommand(
    Long anuncioId,
    Long anuncianteId,
    Long pontoMidiaId,
    String tituloCampanha,
    String nomePonto,
    String tier,
    int valorCentavos,
    String clienteNome,
    String clienteEmail,
    String clienteWhatsapp,
    String returnUrl,
    String completionUrl
) {}
