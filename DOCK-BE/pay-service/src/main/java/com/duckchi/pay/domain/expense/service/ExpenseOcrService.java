package com.duckchi.pay.domain.expense.service;

import com.duckchi.pay.domain.expense.dto.response.ExpenseOcrDraftResponse;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.multipart.MultipartFile;

/**
 * 영수증 OCR 서비스 인터페이스.
 * 결제 등록용 초안 변환과 원본 응답 확인 역할.
 */
public interface ExpenseOcrService {

    ExpenseOcrDraftResponse analyzeReceipt(String imageUrl);

    JsonNode analyzeReceiptRaw(String imageUrl);
}
