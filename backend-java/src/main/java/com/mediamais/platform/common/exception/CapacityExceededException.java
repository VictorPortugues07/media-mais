package com.mediamais.platform.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class CapacityExceededException extends BusinessException {
    private final int tempoOcupado;
    private final int tempoDisponivel;
    private final int duracaoTentada;
    private final int limiteTotal;

    public CapacityExceededException(int tempoOcupado, int tempoDisponivel, int duracaoTentada, int limiteTotal) {
        super(
            String.format("A capacidade da grade de %ds foi atingida (ocupado: %ds, disponível: %ds, tentado: %ds)",
                limiteTotal, tempoOcupado, tempoDisponivel, duracaoTentada),
            HttpStatus.CONFLICT,
            "CAPACIDADE_EXCEDIDA"
        );
        this.tempoOcupado = tempoOcupado;
        this.tempoDisponivel = tempoDisponivel;
        this.duracaoTentada = duracaoTentada;
        this.limiteTotal = limiteTotal;
    }
}
