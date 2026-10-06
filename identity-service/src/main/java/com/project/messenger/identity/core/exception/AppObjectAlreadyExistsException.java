package com.project.messenger.identity.core.exception;

public class AppObjectAlreadyExistsException extends AppGenericException {

    public AppObjectAlreadyExistsException(String code, String message) {
        super(code + "_ALREADY_EXISTS", message);
    }
}
