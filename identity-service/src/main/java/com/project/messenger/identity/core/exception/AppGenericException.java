package com.project.messenger.identity.core.exception;

import lombok.Getter;

@Getter
public class AppGenericException extends RuntimeException {

    private final String code;

    public AppGenericException(String code, String message) {
        super(message);
        this.code = code;
    }
}
