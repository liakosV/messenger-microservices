package com.project.messenger.identity.core.exception;

public class AppObjectNotFoundException extends AppGenericException {

    public AppObjectNotFoundException(String code, String message) {
        super(code + "_NOT_FOUND", message);
    }
}
