package com.project.messenger.identity.core.exception;

public class AppObjectUnauthorizedException extends AppGenericException {

    public AppObjectUnauthorizedException(String code, String message) {
        super(code + "_NOT_AUTHORIZED", message);
    }
}
