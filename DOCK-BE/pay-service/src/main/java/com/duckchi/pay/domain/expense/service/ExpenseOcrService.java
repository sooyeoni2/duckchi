package com.duckchi.pay.domain.expense.service;

import com.duckchi.pay.domain.expense.dto.response.ExpenseOcrDraftResponse;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.multipart.MultipartFile;

public interface ExpenseOcrService {

    ExpenseOcrDraftResponse analyzeReceipt(MultipartFile image);

    JsonNode analyzeReceiptRaw(MultipartFile image);
}
