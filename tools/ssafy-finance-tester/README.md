# SSAFY Finance Tester

`documents/API명세서v1.1.md`와 `documents/SSAFY금융망API가이드/*.md`를 읽고 자주 확인하는 흐름만 따로 뽑아 만든 독립 실행형 테스트 도구입니다.

## 포함한 요청 템플릿

- 은행 코드 조회
- 수시입출금 상품 개설
- 수시입출금 상품 목록
- 계좌 개설
- 계좌 목록
- 계좌 단건 조회
- 입금
- 출금
- 계좌 이체
- 거래내역 목록
- 거래내역 단건

## 실행 방법

1. `node server.js`
2. 브라우저에서 `http://127.0.0.1:43120`
3. `API Key`, `User Key` 등 공통값 입력
4. 템플릿 선택 후 필요 필드만 수정해서 요청

## 왜 별도 도구로 만들었나

- 기존 앱 네비게이션과 인증 흐름을 건드리지 않습니다.
- 프런트 개발 중 금융망 명세 확인용으로 바로 열어볼 수 있습니다.
- 로컬 프록시가 같이 들어 있어서 브라우저에서 호출할 때 CORS 문제를 피하기 쉽습니다.

## 참고

- 공통 헤더의 `transmissionDate`, `transmissionTime`, `institutionTransactionUniqueNo`는 템플릿 생성 시 자동으로 채워집니다.
- 문서 기준 기본 Base URL은 `https://finopenapi.ssafy.io/ssafy/api/v1/edu`입니다.
- 필요하면 `app.js`의 `operations` 배열에 예금/적금/1원 인증 템플릿도 같은 방식으로 추가할 수 있습니다.
