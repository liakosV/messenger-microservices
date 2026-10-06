package com.project.messenger.chat.controller;
import com.project.messenger.chat.core.ChatException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.*;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ChatException.class)
    public ProblemDetail domain(ChatException exception) { return ProblemDetail.forStatusAndDetail(exception.getStatus(), exception.getMessage()); }
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class,
            HandlerMethodValidationException.class, ConstraintViolationException.class, MethodArgumentTypeMismatchException.class})
    public ProblemDetail invalidRequest() { return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request fields or pagination"); }
    @ExceptionHandler(RuntimeException.class)
    public ProblemDetail failure() { return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to process request"); }
}
