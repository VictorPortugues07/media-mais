package com.mediamais.platform.modules.establishment.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PricingScoringService {

    public static final double PESO_FLUXO = 0.30;
    public static final double PESO_TEMPO = 0.35;
    public static final double PESO_PERFIL = 0.20;
    public static final double PESO_EXCLUSIVIDADE = 0.15;

    public record TierInfo(
        String tier,
        double cotaMensalReais,
        int cotaMensalCentavos,
        int repassePontoCentavos,
        int receitaMidiaMaisCentavos
    ) {}

    public record ScoreResult(
        double notaFluxo,
        double notaTempo,
        double notaPerfil,
        double notaExclusividade,
        double scorePonderado,
        TierInfo tierInfo
    ) {}

    public double mapearNotaFluxo(String fluxo) {
        if (fluxo == null) return 3.5;
        String f = fluxo.toLowerCase();
        if (f.contains("150 a 300") || f.contains("mais de 100") || f.contains("mais de 300") || f.contains("> 100") || f.contains(">100")) return 5.0;
        if (f.contains("80 a 150") || f.contains("51 a 100")) return 4.5;
        if (f.contains("30 a 80") || f.contains("31 a 50") || f.contains("30-80") || f.contains("31-50")) return 3.5;
        if (f.contains("até 30") || f.contains("10 a 30") || f.contains("menos de 30") || f.contains("10-30")) return 2.5;
        return 3.5;
    }

    public double mapearNotaTempo(String tempo) {
        if (tempo == null) return 3.5;
        String t = tempo.toLowerCase();
        if (t.contains("até 5") || t.contains("5 min") || t.contains("até 15 min")) return 2.5;
        if (t.contains("6 a 15") || t.contains("15 a 30 min") || t.contains("15-30")) return 3.5;
        if (t.contains("16 a 30") || t.contains("30 a 60 min") || t.contains("30-60")) return 4.5;
        if (t.contains("mais de 30") || t.contains("1 a 2 horas") || t.contains("mais de 2 horas") || t.contains("1-2 horas")) return 5.0;
        return 3.5;
    }

    public double calcularScorePonderado(double notaFluxo, double notaTempo, double notaPerfil, double notaExclusividade) {
        double score = (notaFluxo * PESO_FLUXO) +
                       (notaTempo * PESO_TEMPO) +
                       (notaPerfil * PESO_PERFIL) +
                       (notaExclusividade * PESO_EXCLUSIVIDADE);

        return BigDecimal.valueOf(score)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    public TierInfo determinarTier(double scorePonderado) {
        if (scorePonderado >= 4.21) {
            return new TierInfo("Ouro", 249.00, 24900, 12450, 12450);
        }
        if (scorePonderado >= 3.31) {
            return new TierInfo("Prata", 199.00, 19900, 9950, 9950);
        }
        return new TierInfo("Bronze", 149.00, 14900, 7450, 7450);
    }

    public ScoreResult calcularPrecificacaoCompleta(
        String fluxoDiario,
        String tempoPermanencia,
        Double notaFluxoManual,
        Double notaTempoManual,
        Double notaPerfilManual,
        Double notaExclusividadeManual
    ) {
        double notaFluxo = notaFluxoManual != null ? notaFluxoManual : mapearNotaFluxo(fluxoDiario);
        double notaTempo = notaTempoManual != null ? notaTempoManual : mapearNotaTempo(tempoPermanencia);
        double notaPerfil = notaPerfilManual != null ? notaPerfilManual : 3.5;
        double notaExclusividade = notaExclusividadeManual != null ? notaExclusividadeManual : 3.5;

        double score = calcularScorePonderado(notaFluxo, notaTempo, notaPerfil, notaExclusividade);
        TierInfo tierInfo = determinarTier(score);

        return new ScoreResult(notaFluxo, notaTempo, notaPerfil, notaExclusividade, score, tierInfo);
    }
}
