package com.project.messenger.identity.controller;

import com.project.messenger.identity.core.exception.AppObjectAlreadyExistsException;
import com.project.messenger.identity.core.exception.AppObjectNotFoundException;
import com.project.messenger.identity.core.exception.AppObjectUnauthorizedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(AppObjectNotFoundException.class)
    public ProblemDetail userNotFound() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Active user not found");
    }

    @ExceptionHandler(AppObjectUnauthorizedException.class)
    public ProblemDetail passwordConfirmationFailed() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail invalidCredentials() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    @ExceptionHandler(AppObjectAlreadyExistsException.class)
    public ProblemDetail duplicateUser() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Account details are already in use");
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    public ProblemDetail invalidRequest() {
        // Do not serialize rejected values, especially passwords.
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request fields or JSON");
    }

    @ExceptionHandler(RuntimeException.class)
    public ProblemDetail unexpectedFailure() {
        // Database failures, including concurrent constraint violations, are not all duplicate-user errors.
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to process request");
    }
}
