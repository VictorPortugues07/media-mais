package com.mediamais.platform.infrastructure.storage.port;

public interface StorageService {

    PresignedUploadResult gerarPresignedUploadUrl(String contentType, long tamanhoBytes, String extensao);

    String getPublicUrl(String r2Key);

    void deletarObjeto(String r2Key);
}
