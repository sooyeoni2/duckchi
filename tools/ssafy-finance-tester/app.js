const STORAGE_KEY = 'ssafy-finance-tester-config';

const defaults = {
  baseUrl: 'https://finopenapi.ssafy.io/ssafy/api/v1/edu',
  apiKey: '',
  userKey: '',
  authUserId: '',
  institutionCode: '00100',
  fintechAppNo: '001',
  proxyUrl: 'http://127.0.0.1:43120/proxy',
};

const elements = {
  baseUrl: document.querySelector('#baseUrl'),
  apiKey: document.querySelector('#apiKey'),
  userKey: document.querySelector('#userKey'),
  authUserId: document.querySelector('#authUserId'),
  authState: document.querySelector('#authState'),
  authFeedback: document.querySelector('#authFeedback'),
  createUserButton: document.querySelector('#createUserButton'),
  searchUserButton: document.querySelector('#searchUserButton'),
  clearUserButton: document.querySelector('#clearUserButton'),
  institutionCode: document.querySelector('#institutionCode'),
  fintechAppNo: document.querySelector('#fintechAppNo'),
  proxyUrl: document.querySelector('#proxyUrl'),
  operationList: document.querySelector('#operationList'),
  selectedOperationMeta: document.querySelector('#selectedOperationMeta'),
  endpointText: document.querySelector('#endpointText'),
  formTitle: document.querySelector('#formTitle'),
  formSummary: document.querySelector('#formSummary'),
  dynamicForm: document.querySelector('#dynamicForm'),
  requestBody: document.querySelector('#requestBody'),
  responseBody: document.querySelector('#responseBody'),
  responsePreview: document.querySelector('#responsePreview'),
  responseMeta: document.querySelector('#responseMeta'),
  previewTitle: document.querySelector('#previewTitle'),
  previewSubtitle: document.querySelector('#previewSubtitle'),
  statusBadge: document.querySelector('#statusBadge'),
  saveConfigButton: document.querySelector('#saveConfigButton'),
  resetConfigButton: document.querySelector('#resetConfigButton'),
  refreshTemplateButton: document.querySelector('#refreshTemplateButton'),
  resetTemplateButton: document.querySelector('#resetTemplateButton'),
  sendRequestButton: document.querySelector('#sendRequestButton'),
  clearResponseButton: document.querySelector('#clearResponseButton'),
};

const operations = [
  { id: 'bank-codes', title: '은행 코드 조회', description: '상품 등록 전에 은행 코드를 먼저 확인합니다.', endpoint: '/bank/inquireBankCodes', apiName: 'inquireBankCodes', requiresUserKey: false, category: '공통', summary: '은행 코드 목록을 불러옵니다.', fields: [] },
  { id: 'product-create', title: '수시입출금 상품 개설', description: '새 상품을 만들고 바로 응답 정보를 확인합니다.', endpoint: '/demandDeposit/createDemandDeposit', apiName: 'createDemandDeposit', requiresUserKey: false, category: '상품', summary: '은행별 입출금 상품을 생성합니다.', fields: [
    { key: 'bankCode', label: '은행 코드', type: 'text', placeholder: '999', defaultValue: '999', help: '예: 999(싸피은행)' },
    { key: 'accountName', label: '상품명', type: 'text', placeholder: '테스트 수시입출금 상품', defaultValue: '테스트 수시입출금 상품' },
    { key: 'accountDescription', label: '상품 설명', type: 'textarea', placeholder: '개발 중 확인용 상품입니다.', defaultValue: '개발 중 확인용 상품입니다.', full: true },
  ] },
  { id: 'product-list', title: '수시입출금 상품 목록', description: '등록된 상품 목록을 앱 카드처럼 확인합니다.', endpoint: '/demandDeposit/inquireDemandDepositList', apiName: 'inquireDemandDepositList', requiresUserKey: false, category: '상품', summary: '사용 가능한 상품 목록을 불러옵니다.', fields: [] },
  { id: 'account-create', title: '계좌 개설', description: '상품 고유번호를 넣어서 사용자 계좌를 개설합니다.', endpoint: '/demandDeposit/createDemandDepositAccount', apiName: 'createDemandDepositAccount', requiresUserKey: true, category: '계좌', summary: '상품을 실제 사용자 계좌로 개설합니다.', fields: [
    { key: 'accountTypeUniqueNo', label: '상품 고유번호', type: 'text', placeholder: '001-1-ffa4253081d540', full: true, help: '상품 목록 조회 응답의 accountTypeUniqueNo를 넣으세요.' },
  ] },
  { id: 'account-list', title: '계좌 목록', description: '사용자의 계좌를 잔액 카드 형태로 확인합니다.', endpoint: '/demandDeposit/inquireDemandDepositAccountList', apiName: 'inquireDemandDepositAccountList', requiresUserKey: true, category: '계좌', summary: '사용자의 입출금 계좌 전체를 불러옵니다.', fields: [] },
  { id: 'account-detail', title: '계좌 단건', description: '계좌 상세와 잔액을 홈 화면처럼 보여줍니다.', endpoint: '/demandDeposit/inquireDemandDepositAccount', apiName: 'inquireDemandDepositAccount', requiresUserKey: true, category: '계좌', summary: '계좌 하나의 상세 정보를 조회합니다.', fields: [
    { key: 'accountNo', label: '계좌번호', type: 'text', placeholder: '0016174648358792', full: true },
  ] },
  { id: 'deposit', title: '입금', description: '실제 앱에서 입금하듯 금액과 메모만 넣어 테스트합니다.', endpoint: '/demandDeposit/updateDemandDepositAccountDeposit', apiName: 'updateDemandDepositAccountDeposit', requiresUserKey: true, category: '거래', summary: '선택한 계좌로 입금합니다.', fields: [
    { key: 'accountNo', label: '계좌번호', type: 'text', placeholder: '0016174648358792', full: true },
    { key: 'transactionBalance', label: '입금 금액', type: 'number', placeholder: '1000', defaultValue: '1000' },
    { key: 'transactionSummary', label: '입금 메모', type: 'text', placeholder: '테스트 입금', defaultValue: '테스트 입금' },
  ] },
  { id: 'withdrawal', title: '출금', description: '출금 금액과 메모만 넣고 바로 실행합니다.', endpoint: '/demandDeposit/updateDemandDepositAccountWithdrawal', apiName: 'updateDemandDepositAccountWithdrawal', requiresUserKey: true, category: '거래', summary: '선택한 계좌에서 출금합니다.', fields: [
    { key: 'accountNo', label: '계좌번호', type: 'text', placeholder: '0016174648358792', full: true },
    { key: 'transactionBalance', label: '출금 금액', type: 'number', placeholder: '1000', defaultValue: '1000' },
    { key: 'transactionSummary', label: '출금 메모', type: 'text', placeholder: '테스트 출금', defaultValue: '테스트 출금' },
  ] },
  { id: 'transfer', title: '계좌 이체', description: '출금 계좌와 입금 계좌를 넣고 이체를 테스트합니다.', endpoint: '/demandDeposit/updateDemandDepositAccountTransfer', apiName: 'updateDemandDepositAccountTransfer', requiresUserKey: true, category: '거래', summary: '한 계좌에서 다른 계좌로 이체합니다.', fields: [
    { key: 'withdrawalAccountNo', label: '출금 계좌번호', type: 'text', placeholder: '0016174648358792' },
    { key: 'depositAccountNo', label: '입금 계좌번호', type: 'text', placeholder: '0204667768182760' },
    { key: 'transactionBalance', label: '이체 금액', type: 'number', placeholder: '1000', defaultValue: '1000' },
    { key: 'withdrawalTransactionSummary', label: '출금 메모', type: 'text', placeholder: '테스트 출금(이체)', defaultValue: '테스트 출금(이체)' },
    { key: 'depositTransactionSummary', label: '입금 메모', type: 'text', placeholder: '테스트 입금(이체)', defaultValue: '테스트 입금(이체)' },
  ] },
  { id: 'history-list', title: '입출금 내역', description: '기간과 계좌를 넣으면 거래내역이 타임라인처럼 나옵니다.', endpoint: '/demandDeposit/inquireTransactionHistoryList', apiName: 'inquireTransactionHistoryList', requiresUserKey: true, category: '조회', summary: '계좌의 입출금 내역 목록을 조회합니다.', fields: [
    { key: 'accountNo', label: '계좌번호', type: 'text', placeholder: '0016174648358792', full: true },
    { key: 'startDate', label: '조회 시작일', type: 'date8', defaultValue: formatDateOnly(new Date()) },
    { key: 'endDate', label: '조회 종료일', type: 'date8', defaultValue: formatDateOnly(new Date()) },
    { key: 'transactionType', label: '거래 구분', type: 'select', defaultValue: 'A', options: [
      { value: 'A', label: '전체' }, { value: 'M', label: '입금만' }, { value: 'D', label: '출금만' },
    ] },
    { key: 'orderByType', label: '정렬 순서', type: 'select', defaultValue: 'DESC', options: [
      { value: 'DESC', label: '최신순' }, { value: 'ASC', label: '오래된순' },
    ] },
  ] },
  { id: 'history-detail', title: '거래내역 단건', description: '거래 고유번호 하나를 조회해 상세 카드를 확인합니다.', endpoint: '/demandDeposit/inquireTransactionHistory', apiName: 'inquireTransactionHistory', requiresUserKey: true, category: '조회', summary: '특정 거래 내역 하나를 조회합니다.', fields: [
    { key: 'accountNo', label: '계좌번호', type: 'text', placeholder: '0016174648358792' },
    { key: 'transactionUniqueNo', label: '거래 고유번호', type: 'text', placeholder: '61' },
  ] },
];

let selectedOperationId = operations[0].id;
let fieldValues = {};
let currentMember = null;
let authEvent = null;
let linkedAccounts = [];
let selectedAccountNo = '';

function loadConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaults, ...JSON.parse(stored) } : { ...defaults };
  } catch (error) {
    return { ...defaults };
  }
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readConfigFromInputs()));
  setStatus('success', '설정을 저장했습니다.');
  refreshOperationUi();
}

function resetConfig() {
  setConfigToInputs({ ...defaults });
  currentMember = null;
  authEvent = null;
  updateAuthState();
  renderAuthFeedback();
  saveConfig();
  rebuildForm(true);
}

function setConfigToInputs(config) {
  elements.baseUrl.value = config.baseUrl;
  elements.apiKey.value = config.apiKey;
  elements.userKey.value = config.userKey;
  elements.authUserId.value = config.authUserId ?? '';
  elements.institutionCode.value = config.institutionCode;
  elements.fintechAppNo.value = config.fintechAppNo;
  elements.proxyUrl.value = config.proxyUrl;
}

function readConfigFromInputs() {
  return {
    baseUrl: elements.baseUrl.value.trim(),
    apiKey: elements.apiKey.value.trim(),
    userKey: elements.userKey.value.trim(),
    authUserId: elements.authUserId.value.trim(),
    institutionCode: elements.institutionCode.value.trim(),
    fintechAppNo: elements.fintechAppNo.value.trim(),
    proxyUrl: elements.proxyUrl.value.trim(),
  };
}

function getMemberBaseUrl(baseUrl) {
  return baseUrl.replace(/\/edu\/?$/, '');
}

function getSelectedOperation() {
  return operations.find((operation) => operation.id === selectedOperationId) || operations[0];
}

function findOperationById(operationId) {
  return operations.find((operation) => operation.id === operationId) || operations[0];
}

function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatDatePretty(value) {
  if (!value || String(value).length !== 8) return value || '-';
  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

function formatTimePretty(value) {
  if (!value || String(value).length !== 6) return value || '-';
  return `${value.slice(0, 2)}:${value.slice(2, 4)}:${value.slice(4, 6)}`;
}

function formatDateTimePretty(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ko-KR');
}

function formatMoney(value) {
  const number = Number(value ?? 0);
  if (Number.isNaN(number)) return `${value ?? '-'}원`;
  return `${number.toLocaleString('ko-KR')}원`;
}

function formatTimeOnly(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}${minutes}${seconds}`;
}

function createInstitutionTransactionUniqueNo(now) {
  const base = `${formatDateOnly(now)}${formatTimeOnly(now)}`;
  const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `${base}${random}`;
}

function getDefaultFieldValues(operation) {
  return Object.fromEntries(operation.fields.map((field) => [field.key, field.defaultValue ?? '']));
}

function mergeFieldValues(operation, nextValues) {
  const merged = { ...getDefaultFieldValues(operation), ...fieldValues };
  Object.entries(nextValues).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      merged[key] = String(value);
    }
  });
  fieldValues = merged;
}

function buildRequestBody() {
  const operation = getSelectedOperation();
  const config = readConfigFromInputs();
  const now = new Date();
  const body = {
    Header: {
      apiName: operation.apiName,
      transmissionDate: formatDateOnly(now),
      transmissionTime: formatTimeOnly(now),
      institutionCode: config.institutionCode || defaults.institutionCode,
      fintechAppNo: config.fintechAppNo || defaults.fintechAppNo,
      apiServiceCode: operation.apiName,
      institutionTransactionUniqueNo: createInstitutionTransactionUniqueNo(now),
      apiKey: config.apiKey,
      ...(operation.requiresUserKey ? { userKey: config.userKey } : {}),
    },
  };

  operation.fields.forEach((field) => {
    if (fieldValues[field.key] !== undefined) body[field.key] = fieldValues[field.key];
  });

  return body;
}

function updateRequestJson() {
  elements.requestBody.value = JSON.stringify(buildRequestBody(), null, 2);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getOperationBadge(operation) {
  return operation.requiresUserKey ? 'User Key 필요' : '앱 키만 필요';
}
function renderAuthFeedback() {
  if (!authEvent) {
    elements.authFeedback.className = 'auth-feedback empty-auth-feedback';
    elements.authFeedback.textContent = '아직 인증 이력이 없습니다. 사용자 생성이나 조회 후 로그인을 실행해보세요.';
    return;
  }

  const badgeClass = authEvent.status === 'success' ? 'success' : authEvent.status === 'error' ? 'error' : 'info';
  elements.authFeedback.className = 'auth-feedback';
  elements.authFeedback.innerHTML = `
    <div class="auth-feedback-card">
      <div class="auth-feedback-head">
        <div>
          <div class="auth-feedback-title">${escapeHtml(authEvent.title)}</div>
          <div class="auth-feedback-sub">${escapeHtml(authEvent.message)}</div>
        </div>
        <span class="auth-badge ${badgeClass}">${escapeHtml(authEvent.badge)}</span>
      </div>
      <div class="auth-info-grid">
        <div class="auth-info-item"><div class="auth-label">사용자 ID</div><div class="auth-value">${escapeHtml(authEvent.userId || '-')}</div></div>
        <div class="auth-info-item"><div class="auth-label">userKey</div><div class="auth-value">${escapeHtml(authEvent.userKey || '-')}</div></div>
        <div class="auth-info-item"><div class="auth-label">기관 코드</div><div class="auth-value">${escapeHtml(authEvent.institutionCode || '-')}</div></div>
        <div class="auth-info-item"><div class="auth-label">마지막 처리 시각</div><div class="auth-value">${escapeHtml(authEvent.occurredAt || '-')}</div></div>
      </div>
    </div>
  `;
}

function updateAuthState() {
  const config = readConfigFromInputs();
  const userId = config.authUserId;
  const userKey = config.userKey;

  if (currentMember?.userId || (userId && userKey)) {
    const name = currentMember?.userName || currentMember?.username || (userId ? userId.split('@')[0] : 'user');
    const shortKey = userKey ? `${userKey.slice(0, 8)}...` : '-';
    elements.authState.textContent = `${name} 로그인됨 · ${shortKey}`;
  } else {
    elements.authState.textContent = '로그인된 사용자가 없습니다.';
  }
}

function applyMember(member, mode) {
  currentMember = member;
  elements.userKey.value = member.userKey || '';
  elements.authUserId.value = member.userId || elements.authUserId.value;
  if (member.institutionCode) elements.institutionCode.value = member.institutionCode;
  authEvent = {
    status: 'success',
    title: mode === 'create' ? '사용자 생성 완료' : '로그인 완료',
    message: mode === 'create' ? '회원이 정상 생성되었고 바로 로그인 상태로 반영했습니다.' : '조회한 계정을 현재 세션에 로그인 상태로 반영했습니다.',
    badge: mode === 'create' ? 'CREATE SUCCESS' : 'LOGIN SUCCESS',
    userId: member.userId || elements.authUserId.value,
    userKey: member.userKey || '-',
    institutionCode: member.institutionCode || elements.institutionCode.value,
    occurredAt: formatDateTimePretty(new Date().toISOString()),
  };
  updateAuthState();
  renderAuthFeedback();
  saveConfig();
  updateRequestJson();
}

function markAuthFailure(title, message) {
  authEvent = {
    status: 'error',
    title,
    message,
    badge: 'AUTH FAILED',
    userId: elements.authUserId.value || '-',
    userKey: elements.userKey.value || '-',
    institutionCode: elements.institutionCode.value || '-',
    occurredAt: formatDateTimePretty(new Date().toISOString()),
  };
  renderAuthFeedback();
}

function refreshOperationUi() {
  const operation = getSelectedOperation();
  const config = readConfigFromInputs();

  elements.formTitle.textContent = operation.title;
  elements.endpointText.textContent = `${config.baseUrl.replace(/\/+$/, '')}${operation.endpoint}`;
  elements.selectedOperationMeta.textContent = operation.description;
  elements.previewTitle.textContent = operation.title;
  elements.previewSubtitle.textContent = operation.summary;

  elements.formSummary.innerHTML = `
    <article class="summary-card"><div class="summary-label">카테고리</div><div class="summary-value">${escapeHtml(operation.category)}</div></article>
    <article class="summary-card"><div class="summary-label">필수 인증</div><div class="summary-value">${escapeHtml(getOperationBadge(operation))}</div></article>
    <article class="summary-card"><div class="summary-label">현재 User Key</div><div class="summary-value">${escapeHtml(config.userKey ? `${config.userKey.slice(0, 12)}...` : '없음')}</div></article>
  `;

  updateAuthState();
  renderAuthFeedback();
}

function renderOperationButtons() {
  elements.operationList.innerHTML = operations.map((operation) => `
    <button type="button" class="operation-card ${operation.id === selectedOperationId ? 'active' : ''}" data-operation-id="${operation.id}">
      <div class="operation-title">${escapeHtml(operation.title)}</div>
      <div class="operation-desc">${escapeHtml(operation.description)}</div>
      <div class="operation-badge">${escapeHtml(getOperationBadge(operation))}</div>
    </button>
  `).join('');

  elements.operationList.querySelectorAll('[data-operation-id]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedOperationId = button.getAttribute('data-operation-id');
      rebuildForm(true);
      renderOperationButtons();
      refreshOperationUi();
      clearPreviewOnly();
    });
  });
}

function renderField(field) {
  const value = fieldValues[field.key] ?? '';
  const wrapperClass = `field-card ${field.full ? 'full' : ''}`;

  if (field.type === 'select') {
    return `
      <label class="${wrapperClass}">
        <span>${escapeHtml(field.label)}</span>
        <select data-field-key="${field.key}">
          ${field.options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
        </select>
        ${field.help ? `<div class="field-help">${escapeHtml(field.help)}</div>` : ''}
      </label>
    `;
  }

  if (field.type === 'textarea') {
    return `
      <label class="${wrapperClass}">
        <span>${escapeHtml(field.label)}</span>
        <textarea data-field-key="${field.key}" placeholder="${escapeHtml(field.placeholder ?? '')}">${escapeHtml(value)}</textarea>
        ${field.help ? `<div class="field-help">${escapeHtml(field.help)}</div>` : ''}
      </label>
    `;
  }

  const inputType = field.type === 'number' ? 'number' : 'text';
  return `
      <label class="${wrapperClass}">
        <span>${escapeHtml(field.label)}</span>
        <input data-field-key="${field.key}" type="${inputType}" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder ?? '')}" />
        ${field.help ? `<div class="field-help">${escapeHtml(field.help)}</div>` : ''}
      </label>
    `;
}

function attachFieldEvents() {
  elements.dynamicForm.querySelectorAll('[data-field-key]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.getAttribute('data-field-key');
      fieldValues[key] = input.value;
      updateRequestJson();
    });
  });
}

function rebuildForm(forceReset) {
  const operation = getSelectedOperation();
  if (forceReset) fieldValues = getDefaultFieldValues(operation);

  if (operation.fields.length === 0) {
    elements.dynamicForm.innerHTML = '<div class="field-card full"><div class="field-help">이 기능은 추가 입력 없이 바로 실행할 수 있습니다.</div></div>';
  } else {
    elements.dynamicForm.innerHTML = `<div class="field-grid">${operation.fields.map(renderField).join('')}</div>`;
    attachFieldEvents();
  }

  refreshOperationUi();
  updateRequestJson();
}

function setStatus(kind, text) {
  elements.statusBadge.className = `status-badge ${kind}`;
  elements.statusBadge.textContent = text;
}

function joinUrl(baseUrl, endpoint) {
  return `${baseUrl.replace(/\/+$/, '')}${endpoint}`;
}

function clearPreviewOnly() {
  elements.responsePreview.className = 'phone-content empty-state';
  elements.responsePreview.innerHTML = '아직 불러온 데이터가 없습니다. 왼쪽에서 기능을 고르고 가운데에서 실행해보세요.';
  elements.responseMeta.textContent = '아직 요청을 보내지 않았습니다.';
  elements.responseBody.value = '';
}

function clearResponse() {
  clearPreviewOnly();
  setStatus('idle', '대기 중');
}
function transactionDirectionClass(name) {
  const text = String(name || '');
  if (text.includes('입금')) return 'in';
  if (text.includes('출금')) return 'out';
  return 'neutral';
}

function renderHeaderCard(header) {
  if (!header || typeof header !== 'object') return '';
  return `
    <article class="header-card">
      <div class="mobile-section-title">응답 헤더</div>
      <div class="info-grid">
        <div class="info-card"><div class="info-label">응답 코드</div><div class="info-value">${escapeHtml(header.responseCode || '-')}</div></div>
        <div class="info-card"><div class="info-label">메시지</div><div class="info-value">${escapeHtml(header.responseMessage || '-')}</div></div>
      </div>
    </article>
  `;
}

function renderAccountCard(account) {
  return `
    <article class="account-card">
      <div class="account-card-top">
        <div>
          <div class="account-bank">${escapeHtml(account.bankName || account.accountName || '계좌')}</div>
          <div class="account-number">${escapeHtml(account.accountNo || '-')}</div>
        </div>
        <div class="account-balance">${formatMoney(account.accountBalance)}</div>
      </div>
      <div class="account-meta">
        <div><div class="mini-label">상품명</div><div class="mini-value">${escapeHtml(account.accountName || '-')}</div></div>
        <div><div class="mini-label">통화</div><div class="mini-value">${escapeHtml(account.currency || account.accountType || '-')}</div></div>
        <div><div class="mini-label">개설일</div><div class="mini-value">${escapeHtml(formatDatePretty(account.accountCreatedDate))}</div></div>
        <div><div class="mini-label">최근 거래일</div><div class="mini-value">${escapeHtml(formatDatePretty(account.lastTransactionDate || ''))}</div></div>
      </div>
    </article>
  `;
}

function renderHistoryCard(item) {
  const directionClass = transactionDirectionClass(item.transactionTypeName);
  const sign = directionClass === 'out' ? '-' : '+';
  return `
    <article class="history-card">
      <div class="history-card-top">
        <div>
          <div class="history-title">${escapeHtml(item.transactionSummary || item.transactionTypeName || '거래')}</div>
          <div class="history-sub">${escapeHtml(formatDatePretty(item.transactionDate))} ${escapeHtml(formatTimePretty(item.transactionTime))}</div>
        </div>
        <div class="history-amount ${directionClass}">${sign}${formatMoney(item.transactionBalance)}</div>
      </div>
      <div class="history-foot">
        <span class="chip-inline ${directionClass}">${escapeHtml(item.transactionTypeName || '-')}</span>
        <span class="mini-label">거래 후 잔액 ${escapeHtml(formatMoney(item.transactionAfterBalance))}</span>
      </div>
      ${item.transactionAccountNo ? `<div class="history-sub">상대 계좌 ${escapeHtml(item.transactionAccountNo)}</div>` : ''}
    </article>
  `;
}

function renderProductCard(item) {
  return `
    <article class="product-card">
      <div class="product-title">${escapeHtml(item.accountName || '상품')}</div>
      <div class="product-sub">${escapeHtml(item.bankName || '-')} · ${escapeHtml(item.accountTypeName || '-')}</div>
      <div class="product-meta">
        <div><div class="mini-label">상품 고유번호</div><div class="mini-value">${escapeHtml(item.accountTypeUniqueNo || '-')}</div></div>
        <div><div class="mini-label">통화 타입</div><div class="mini-value">${escapeHtml(item.accountType || '-')}</div></div>
      </div>
      ${item.accountDescription ? `<div class="history-sub">${escapeHtml(item.accountDescription)}</div>` : ''}
    </article>
  `;
}

function renderSuccessCard(title, subtitle, metaEntries) {
  return `
    <article class="success-card">
      <div class="success-title">${escapeHtml(title)}</div>
      <div class="success-sub">${escapeHtml(subtitle)}</div>
      <div class="success-meta">
        ${metaEntries.map((entry) => `<div><div class="mini-label">${escapeHtml(entry.label)}</div><div class="mini-value">${escapeHtml(entry.value)}</div></div>`).join('')}
      </div>
    </article>
  `;
}

function renderPreview(responseData) {
  const body = responseData?.parsedBody;
  if (!body || typeof body !== 'object') {
    elements.responsePreview.className = 'phone-content empty-state';
    elements.responsePreview.innerHTML = 'JSON 응답을 읽을 수 없어서 화면형 미리보기를 만들지 못했습니다.';
    return;
  }

  const operation = getSelectedOperation();
  const header = body.Header ?? null;
  const record = body.REC ?? body.data ?? null;
  const sections = [];

  if (operation.id === 'bank-codes' && Array.isArray(body.REC)) {
    sections.push('<div class="mobile-stack"><div class="mobile-section-title">은행 코드</div>');
    body.REC.forEach((item) => sections.push(renderSuccessCard(item.bankName || '은행', '코드 정보를 확인했습니다.', [
      { label: '은행 코드', value: item.bankCode || '-' },
      { label: '은행명', value: item.bankName || '-' },
    ])));
    sections.push('</div>');
  } else if (operation.id === 'account-list' && Array.isArray(record)) {
    const totalBalance = record.reduce((sum, item) => sum + Number(item.accountBalance || 0), 0);
    sections.push(`<div class="mobile-stack"><section class="balance-hero"><div class="balance-label">조회된 계좌 수</div><div class="balance-value">${record.length}개</div><div class="balance-sub">총 잔액 ${formatMoney(totalBalance)}</div></section><div class="mobile-section-title">내 계좌</div>${record.map(renderAccountCard).join('')}</div>`);
  } else if (operation.id === 'account-detail' && record && !Array.isArray(record)) {
    sections.push(`<div class="mobile-stack"><section class="balance-hero"><div class="balance-label">현재 잔액</div><div class="balance-value">${formatMoney(record.accountBalance)}</div><div class="balance-sub">${escapeHtml(record.bankName || '-')} · ${escapeHtml(record.accountNo || '-')}</div></section>${renderAccountCard(record)}</div>`);
  } else if (operation.id === 'history-list' && record && Array.isArray(record.list)) {
    sections.push(`<div class="mobile-stack"><section class="balance-hero"><div class="balance-label">조회 결과</div><div class="balance-value">${escapeHtml(record.totalCount || record.list.length)}건</div><div class="balance-sub">거래내역을 최신 앱 스타일로 정리했습니다.</div></section><div class="mobile-section-title">거래 내역</div>${record.list.map(renderHistoryCard).join('') || '<div class="empty-state">거래 내역이 없습니다.</div>'}</div>`);
  } else if (operation.id === 'history-detail' && record && !Array.isArray(record)) {
    sections.push(`<div class="mobile-stack"><div class="mobile-section-title">거래 상세</div>${renderHistoryCard(record)}</div>`);
  } else if ((operation.id === 'product-list' || operation.id === 'product-create') && record) {
    const list = Array.isArray(record) ? record : [record];
    sections.push(`<div class="mobile-stack"><div class="mobile-section-title">상품 목록</div>${list.map(renderProductCard).join('')}</div>`);
  } else if (operation.id === 'account-create' && record && !Array.isArray(record)) {
    sections.push(`<div class="mobile-stack">${renderSuccessCard('계좌 개설 완료', '새 계좌가 생성되었습니다.', [
      { label: '계좌번호', value: record.accountNo || '-' },
      { label: '은행', value: record.bankName || '-' },
      { label: '상품명', value: record.accountName || '-' },
      { label: '개설일', value: formatDatePretty(record.accountCreatedDate) },
    ])}${renderAccountCard(record)}</div>`);
  } else if ((operation.id === 'deposit' || operation.id === 'withdrawal') && record && !Array.isArray(record)) {
    sections.push(`<div class="mobile-stack">${renderSuccessCard(operation.id === 'deposit' ? '입금 완료' : '출금 완료', '거래가 정상 처리되었습니다.', [
      { label: '거래 고유번호', value: record.transactionUniqueNo || '-' },
      { label: '거래일', value: formatDatePretty(record.transactionDate) },
    ])}</div>`);
  } else if (operation.id === 'transfer' && Array.isArray(record)) {
    sections.push(`<div class="mobile-stack"><div class="mobile-section-title">이체 결과</div>${record.map((item) => renderSuccessCard(item.transactionTypeName || '이체', '이체 결과가 기록되었습니다.', [
      { label: '계좌번호', value: item.accountNo || '-' },
      { label: '상대 계좌', value: item.transactionAccountNo || '-' },
      { label: '거래일', value: formatDatePretty(item.transactionDate) },
      { label: '거래번호', value: item.transactionUniqueNo || '-' },
    ])).join('')}</div>`);
  } else if (record) {
    sections.push(`<div class="mobile-stack">${renderSuccessCard('응답 수신 완료', '구조화된 응답을 받았습니다.', [
      { label: '형태', value: Array.isArray(record) ? '목록' : '단건' },
      { label: 'API', value: operation.apiName },
    ])}</div>`);
  }

  if (header) sections.push(renderHeaderCard(header));

  elements.responsePreview.className = 'phone-content';
  elements.responsePreview.innerHTML = sections.join('') || '<div class="empty-state">미리보기용 데이터를 찾지 못했습니다.</div>';
}

async function callProxy(url, body) {
  const config = readConfigFromInputs();
  const response = await fetch(config.proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, method: 'POST', body }),
  });
  return response.json();
}

async function handleMemberAction(mode) {
  const config = readConfigFromInputs();
  const userId = config.authUserId;
  if (!config.apiKey || !userId) {
    setStatus('error', 'API Key와 사용자 이메일을 먼저 입력해주세요.');
    markAuthFailure('인증 준비 부족', 'API Key 또는 사용자 이메일이 비어 있어서 인증을 진행할 수 없습니다.');
    return;
  }

  const base = getMemberBaseUrl(config.baseUrl);
  const endpoint = mode === 'create' ? '/member' : '/member/search';
  const body = { apiKey: config.apiKey, userId };

  setStatus('loading', mode === 'create' ? '사용자 생성 중...' : '사용자 조회 중...');

  try {
    const payload = await callProxy(joinUrl(base, endpoint), body);
    const parsed = payload.parsedBody;

    if (payload.status >= 200 && payload.status < 300 && parsed?.userKey) {
      applyMember(parsed, mode);
      setStatus('success', mode === 'create' ? '사용자 생성 완료' : '로그인 완료');
      elements.responseMeta.textContent = `${payload.status} ${payload.statusMessage || ''}`.trim() + ` · ${payload.durationMs ?? 0}ms`;
      elements.responseBody.value = JSON.stringify(parsed, null, 2);
      elements.responsePreview.className = 'phone-content';
      elements.responsePreview.innerHTML = `<div class="mobile-stack">${renderSuccessCard(mode === 'create' ? '사용자 생성 완료' : '로그인 완료', '이제 다른 금융망 API에서 userKey가 자동으로 사용됩니다.', [
        { label: '사용자 ID', value: parsed.userId || userId },
        { label: '이름', value: parsed.userName || parsed.username || userId.split('@')[0] },
        { label: '기관 코드', value: parsed.institutionCode || config.institutionCode },
        { label: 'userKey', value: parsed.userKey || '-' },
      ])}</div>`;
      elements.previewTitle.textContent = mode === 'create' ? '사용자 생성' : '로그인 완료';
      elements.previewSubtitle.textContent = `${parsed.userId || userId} 계정을 활성화했습니다.`;
    } else {
      const message = parsed?.message || parsed?.responseMessage || parsed?.errorMessage || `응답 코드 ${payload.status}`;
      elements.responseBody.value = JSON.stringify(parsed ?? payload, null, 2);
      setStatus('error', `${mode === 'create' ? '사용자 생성' : '사용자 조회'} 실패`);
      markAuthFailure(mode === 'create' ? '사용자 생성 실패' : '로그인 실패', message);
    }
  } catch (error) {
    setStatus('error', '회원 API 호출 실패');
    elements.responseBody.value = error.message || String(error);
    markAuthFailure('회원 API 호출 실패', error.message || '네트워크 또는 프록시 오류가 발생했습니다.');
  }
}

async function sendRequest() {
  const operation = getSelectedOperation();
  const config = readConfigFromInputs();

  if (!config.baseUrl || !config.proxyUrl) {
    setStatus('error', 'Base URL과 Proxy URL을 확인해주세요.');
    return;
  }
  if (operation.requiresUserKey && !config.userKey) {
    setStatus('error', '먼저 상단에서 사용자 조회/로그인을 해주세요.');
    return;
  }

  const requestBody = buildRequestBody();
  updateRequestJson();
  setStatus('loading', '요청 전송 중...');
  elements.sendRequestButton.disabled = true;

  try {
    const payload = await callProxy(joinUrl(config.baseUrl, operation.endpoint), requestBody);
    const pretty = payload.parsedBody ? JSON.stringify(payload.parsedBody, null, 2) : payload.bodyText || '';
    elements.responseBody.value = pretty;
    elements.responseMeta.textContent = `${payload.status} ${payload.statusMessage || ''}`.trim() + ` · ${payload.durationMs ?? 0}ms`;
    renderPreview(payload);
    setStatus(payload.status >= 200 && payload.status < 300 ? 'success' : 'error', payload.status >= 200 && payload.status < 300 ? '요청 성공' : `요청 실패 (${payload.status})`);
  } catch (error) {
    elements.responseBody.value = error.message || String(error);
    elements.responseMeta.textContent = '프록시 요청에 실패했습니다.';
    elements.responsePreview.className = 'phone-content empty-state';
    elements.responsePreview.innerHTML = '로컬 프록시 서버가 꺼져 있거나 네트워크 오류가 발생했습니다.';
    setStatus('error', '요청 실패');
  } finally {
    elements.sendRequestButton.disabled = false;
  }
}

elements.saveConfigButton.addEventListener('click', saveConfig);
elements.resetConfigButton.addEventListener('click', resetConfig);
elements.refreshTemplateButton.addEventListener('click', updateRequestJson);
elements.resetTemplateButton.addEventListener('click', () => rebuildForm(true));
elements.sendRequestButton.addEventListener('click', sendRequest);
elements.clearResponseButton.addEventListener('click', clearResponse);
elements.createUserButton.addEventListener('click', () => handleMemberAction('create'));
elements.searchUserButton.addEventListener('click', () => handleMemberAction('search'));
elements.clearUserButton.addEventListener('click', () => {
  currentMember = null;
  authEvent = {
    status: 'info',
    title: '로그아웃 완료',
    message: '현재 세션에서 사용자 정보와 userKey를 제거했습니다.',
    badge: 'LOGGED OUT',
    userId: elements.authUserId.value || '-',
    userKey: '-',
    institutionCode: elements.institutionCode.value || '-',
    occurredAt: formatDateTimePretty(new Date().toISOString()),
  };
  elements.authUserId.value = '';
  elements.userKey.value = '';
  updateAuthState();
  renderAuthFeedback();
  saveConfig();
  updateRequestJson();
});

['baseUrl', 'apiKey', 'userKey', 'authUserId', 'institutionCode', 'fintechAppNo', 'proxyUrl'].forEach((key) => {
  elements[key].addEventListener('input', () => {
    refreshOperationUi();
    updateRequestJson();
  });
});

const initialConfig = loadConfig();
setConfigToInputs(initialConfig);
if (initialConfig.authUserId && initialConfig.userKey) {
  currentMember = { userId: initialConfig.authUserId, userKey: initialConfig.userKey, institutionCode: initialConfig.institutionCode };
  authEvent = {
    status: 'info',
    title: '저장된 로그인 정보 복원',
    message: '이전에 저장된 사용자 정보를 불러왔습니다.',
    badge: 'SESSION RESTORED',
    userId: initialConfig.authUserId,
    userKey: initialConfig.userKey,
    institutionCode: initialConfig.institutionCode,
    occurredAt: formatDateTimePretty(new Date().toISOString()),
  };
}
renderOperationButtons();
rebuildForm(true);
clearResponse();
updateAuthState();
renderAuthFeedback();

function getSelectedAccount() {
  return linkedAccounts.find((account) => account.accountNo === selectedAccountNo) || null;
}

function getOperationPreset(operationId, accountNo) {
  const targetAccountNo = accountNo || selectedAccountNo || '';
  const fallbackDeposit = linkedAccounts.find((account) => account.accountNo !== targetAccountNo) || linkedAccounts[0] || null;

  if (operationId === 'account-detail' || operationId === 'deposit' || operationId === 'withdrawal' || operationId === 'history-list' || operationId === 'history-detail') {
    return { accountNo: targetAccountNo };
  }

  if (operationId === 'transfer') {
    return {
      withdrawalAccountNo: targetAccountNo,
      depositAccountNo: fallbackDeposit?.accountNo || '',
    };
  }

  return targetAccountNo ? { accountNo: targetAccountNo } : {};
}

function setActiveOperation(operationId, options = {}) {
  const operation = findOperationById(operationId);
  selectedOperationId = operation.id;
  renderOperationButtons();
  rebuildForm(true);

  const presets = options.presetValues || getOperationPreset(operation.id, options.accountNo);
  if (presets && Object.keys(presets).length > 0) {
    mergeFieldValues(operation, presets);
    rebuildForm(false);
  }

  refreshOperationUi();
  if (options.autoSend) {
    sendRequest();
  } else if (!options.keepPreview) {
    clearPreviewOnly();
  }
}

function renderAccountCard(account, options = {}) {
  const isSelected = account.accountNo && account.accountNo === selectedAccountNo;
  const actionButtons = options.interactive === false ? '' : `
    <div class="account-actions">
      <button type="button" class="mini-action-button" data-account-action="detail" data-account-no="${escapeHtml(account.accountNo || '')}">상세</button>
      <button type="button" class="mini-action-button" data-account-action="deposit" data-account-no="${escapeHtml(account.accountNo || '')}">입금</button>
      <button type="button" class="mini-action-button" data-account-action="withdrawal" data-account-no="${escapeHtml(account.accountNo || '')}">출금</button>
      <button type="button" class="mini-action-button" data-account-action="history" data-account-no="${escapeHtml(account.accountNo || '')}">내역</button>
      <button type="button" class="mini-action-button" data-account-action="transfer" data-account-no="${escapeHtml(account.accountNo || '')}">이체</button>
    </div>
  `;

  return `
    <article class="account-card ${isSelected ? 'selected' : ''}" data-account-select="${escapeHtml(account.accountNo || '')}">
      <div class="account-card-top">
        <div>
          <div class="account-bank">${escapeHtml(account.bankName || account.accountName || '계좌')}</div>
          <div class="account-number">${escapeHtml(account.accountNo || '-')}</div>
        </div>
        <div class="account-balance">${formatMoney(account.accountBalance)}</div>
      </div>
      <div class="account-meta">
        <div><div class="mini-label">상품명</div><div class="mini-value">${escapeHtml(account.accountName || '-')}</div></div>
        <div><div class="mini-label">통화</div><div class="mini-value">${escapeHtml(account.currency || account.accountType || '-')}</div></div>
        <div><div class="mini-label">개설일</div><div class="mini-value">${escapeHtml(formatDatePretty(account.accountCreatedDate))}</div></div>
        <div><div class="mini-label">최근 거래일</div><div class="mini-value">${escapeHtml(formatDatePretty(account.lastTransactionDate || ''))}</div></div>
      </div>
      ${actionButtons}
    </article>
  `;
}

function renderAccountsHome(accounts, options = {}) {
  const totalBalance = accounts.reduce((sum, item) => sum + Number(item.accountBalance || 0), 0);
  const selectedAccount = getSelectedAccount() || accounts[0] || null;
  const heroSub = selectedAccount
    ? `${selectedAccount.bankName || '계좌'} · ${selectedAccount.accountNo || '-'}`
    : '계좌를 선택해 입금, 출금, 이체, 거래내역 조회로 바로 이동할 수 있습니다.';

  return `
    <div class="mobile-stack">
      <section class="balance-hero">
        <div class="balance-label">${escapeHtml(options.heroLabel || '내 계좌 현황')}</div>
        <div class="balance-value">${accounts.length}개</div>
        <div class="balance-sub">총 잔액 ${formatMoney(totalBalance)} · ${escapeHtml(heroSub)}</div>
      </section>
      <div class="mobile-section-title">내 계좌</div>
      ${accounts.map((account) => renderAccountCard(account)).join('')}
    </div>
  `;
}

function renderPreview(responseData) {
  const body = responseData?.parsedBody;
  if (!body || typeof body !== 'object') {
    elements.responsePreview.className = 'phone-content empty-state';
    elements.responsePreview.innerHTML = 'JSON 응답을 읽을 수 없어서 화면형 미리보기를 만들지 못했습니다.';
    return;
  }

  const operation = getSelectedOperation();
  const header = body.Header ?? null;
  const record = body.REC ?? body.data ?? null;
  const sections = [];

  if (operation.id === 'bank-codes' && Array.isArray(body.REC)) {
    sections.push('<div class="mobile-stack"><div class="mobile-section-title">은행 코드</div>');
    body.REC.forEach((item) => sections.push(renderSuccessCard(item.bankName || '은행', '코드 정보를 확인했습니다.', [
      { label: '은행 코드', value: item.bankCode || '-' },
      { label: '은행명', value: item.bankName || '-' },
    ])));
    sections.push('</div>');
  } else if (operation.id === 'account-list' && Array.isArray(record)) {
    linkedAccounts = record;
    if (!selectedAccountNo && record[0]?.accountNo) selectedAccountNo = record[0].accountNo;
    sections.push(renderAccountsHome(record, { heroLabel: '조회된 계좌 수' }));
  } else if (operation.id === 'account-detail' && record && !Array.isArray(record)) {
    selectedAccountNo = record.accountNo || selectedAccountNo;
    sections.push(`<div class="mobile-stack"><section class="balance-hero"><div class="balance-label">현재 잔액</div><div class="balance-value">${formatMoney(record.accountBalance)}</div><div class="balance-sub">${escapeHtml(record.bankName || '-')} · ${escapeHtml(record.accountNo || '-')}</div></section>${renderAccountCard(record)}</div>`);
  } else if (operation.id === 'history-list' && record && Array.isArray(record.list)) {
    sections.push(`<div class="mobile-stack"><section class="balance-hero"><div class="balance-label">조회 결과</div><div class="balance-value">${escapeHtml(record.totalCount || record.list.length)}건</div><div class="balance-sub">거래내역을 최신 앱 스타일로 정리했습니다.</div></section><div class="mobile-section-title">거래 내역</div>${record.list.map(renderHistoryCard).join('') || '<div class="empty-state">거래 내역이 없습니다.</div>'}</div>`);
  } else if (operation.id === 'history-detail' && record && !Array.isArray(record)) {
    sections.push(`<div class="mobile-stack"><div class="mobile-section-title">거래 상세</div>${renderHistoryCard(record)}</div>`);
  } else if ((operation.id === 'product-list' || operation.id === 'product-create') && record) {
    const list = Array.isArray(record) ? record : [record];
    sections.push(`<div class="mobile-stack"><div class="mobile-section-title">상품 목록</div>${list.map(renderProductCard).join('')}</div>`);
  } else if (operation.id === 'account-create' && record && !Array.isArray(record)) {
    sections.push(`<div class="mobile-stack">${renderSuccessCard('계좌 개설 완료', '새 계좌가 생성되었습니다.', [
      { label: '계좌번호', value: record.accountNo || '-' },
      { label: '은행', value: record.bankName || '-' },
      { label: '상품명', value: record.accountName || '-' },
      { label: '개설일', value: formatDatePretty(record.accountCreatedDate) },
    ])}${renderAccountCard(record)}</div>`);
  } else if ((operation.id === 'deposit' || operation.id === 'withdrawal') && record && !Array.isArray(record)) {
    sections.push(`<div class="mobile-stack">${renderSuccessCard(operation.id === 'deposit' ? '입금 완료' : '출금 완료', '거래가 정상 처리되었습니다.', [
      { label: '거래 고유번호', value: record.transactionUniqueNo || '-' },
      { label: '거래일', value: formatDatePretty(record.transactionDate) },
      { label: '계좌번호', value: record.accountNo || selectedAccountNo || '-' },
    ])}</div>`);
  } else if (operation.id === 'transfer' && Array.isArray(record)) {
    sections.push(`<div class="mobile-stack"><div class="mobile-section-title">이체 결과</div>${record.map((item) => renderSuccessCard(item.transactionTypeName || '이체', '이체 결과가 기록되었습니다.', [
      { label: '계좌번호', value: item.accountNo || '-' },
      { label: '상대 계좌', value: item.transactionAccountNo || '-' },
      { label: '거래일', value: formatDatePretty(item.transactionDate) },
      { label: '거래번호', value: item.transactionUniqueNo || '-' },
    ])).join('')}</div>`);
  } else if (record) {
    sections.push(`<div class="mobile-stack">${renderSuccessCard('응답 수신 완료', '구조화된 응답을 받았습니다.', [
      { label: '형태', value: Array.isArray(record) ? '목록' : '단건' },
      { label: 'API', value: operation.apiName },
    ])}</div>`);
  }

  if (header) sections.push(renderHeaderCard(header));

  elements.responsePreview.className = 'phone-content';
  elements.responsePreview.innerHTML = sections.join('') || '<div class="empty-state">미리보기용 데이터를 찾지 못했습니다.</div>';
}

async function loadAccountsOverview(options = {}) {
  const config = readConfigFromInputs();
  if (!config.userKey) return null;

  const operation = findOperationById('account-list');
  const now = new Date();
  const body = {
    Header: {
      apiName: operation.apiName,
      transmissionDate: formatDateOnly(now),
      transmissionTime: formatTimeOnly(now),
      institutionCode: config.institutionCode || defaults.institutionCode,
      fintechAppNo: config.fintechAppNo || defaults.fintechAppNo,
      apiServiceCode: operation.apiName,
      institutionTransactionUniqueNo: createInstitutionTransactionUniqueNo(now),
      apiKey: config.apiKey,
      userKey: config.userKey,
    },
  };

  const payload = await callProxy(joinUrl(config.baseUrl, operation.endpoint), body);
  const record = payload.parsedBody?.REC;
  if (payload.status >= 200 && payload.status < 300 && Array.isArray(record)) {
    linkedAccounts = record;
    if ((!selectedAccountNo || !linkedAccounts.some((account) => account.accountNo === selectedAccountNo)) && record[0]?.accountNo) {
      selectedAccountNo = record[0].accountNo;
    }
    if (options.focusPreview) {
      elements.responseBody.value = JSON.stringify(payload.parsedBody, null, 2);
      elements.responseMeta.textContent = `${payload.status} ${payload.statusMessage || ''}`.trim() + ` · ${payload.durationMs ?? 0}ms`;
      elements.previewTitle.textContent = '내 계좌';
      elements.previewSubtitle.textContent = '계좌를 눌러 바로 입금, 출금, 이체, 거래내역 조회로 이동할 수 있습니다.';
      elements.responsePreview.className = 'phone-content';
      elements.responsePreview.innerHTML = renderAccountsHome(record, { heroLabel: '로그인된 계좌 수' });
    }
    return payload;
  }

  if (options.focusPreview) {
    const message = payload.parsedBody?.Header?.responseMessage || payload.parsedBody?.message || `응답 코드 ${payload.status}`;
    elements.responsePreview.className = 'phone-content empty-state';
    elements.responsePreview.innerHTML = `계좌 목록을 자동으로 불러오지 못했습니다. ${escapeHtml(message)}`;
    elements.responseBody.value = JSON.stringify(payload.parsedBody ?? payload, null, 2);
    elements.responseMeta.textContent = `${payload.status} ${payload.statusMessage || ''}`.trim() + ` · ${payload.durationMs ?? 0}ms`;
  }

  return payload;
}

async function handleMemberAction(mode) {
  const config = readConfigFromInputs();
  const userId = config.authUserId;
  if (!config.apiKey || !userId) {
    setStatus('error', 'API Key와 사용자 이메일을 먼저 입력해주세요.');
    markAuthFailure('인증 준비 부족', 'API Key 또는 사용자 이메일이 비어 있어서 인증을 진행할 수 없습니다.');
    return;
  }

  const base = getMemberBaseUrl(config.baseUrl);
  const endpoint = mode === 'create' ? '/member' : '/member/search';
  const body = { apiKey: config.apiKey, userId };

  setStatus('loading', mode === 'create' ? '사용자 생성 중...' : '사용자 조회 중...');

  try {
    const payload = await callProxy(joinUrl(base, endpoint), body);
    const parsed = payload.parsedBody;

    if (payload.status >= 200 && payload.status < 300 && parsed?.userKey) {
      applyMember(parsed, mode);
      setStatus('success', mode === 'create' ? '사용자 생성 완료' : '로그인 완료');
      await loadAccountsOverview({ focusPreview: true });
      setActiveOperation('account-list', { keepPreview: true });
    } else {
      const message = parsed?.message || parsed?.responseMessage || parsed?.errorMessage || `응답 코드 ${payload.status}`;
      elements.responseBody.value = JSON.stringify(parsed ?? payload, null, 2);
      setStatus('error', `${mode === 'create' ? '사용자 생성' : '사용자 조회'} 실패`);
      markAuthFailure(mode === 'create' ? '사용자 생성 실패' : '로그인 실패', message);
    }
  } catch (error) {
    setStatus('error', '회원 API 호출 실패');
    elements.responseBody.value = error.message || String(error);
    markAuthFailure('회원 API 호출 실패', error.message || '네트워크 또는 프록시 오류가 발생했습니다.');
  }
}

elements.responsePreview.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-account-action]');
  if (actionButton) {
    const accountNo = actionButton.getAttribute('data-account-no') || '';
    selectedAccountNo = accountNo;
    const action = actionButton.getAttribute('data-account-action');
    const actionMap = {
      detail: 'account-detail',
      deposit: 'deposit',
      withdrawal: 'withdrawal',
      history: 'history-list',
      transfer: 'transfer',
    };
    const nextOperationId = actionMap[action];
    if (nextOperationId) {
      setActiveOperation(nextOperationId, { accountNo });
    }
    return;
  }

  const accountCard = event.target.closest('[data-account-select]');
  if (accountCard) {
    const accountNo = accountCard.getAttribute('data-account-select') || '';
    if (accountNo) {
      selectedAccountNo = accountNo;
      setActiveOperation('account-detail', { accountNo, autoSend: true });
    }
  }
});

elements.clearUserButton.addEventListener('click', () => {
  linkedAccounts = [];
  selectedAccountNo = '';
  clearPreviewOnly();
});

loadAccountsOverview({ focusPreview: Boolean(initialConfig.authUserId && initialConfig.userKey) });

const bankingElements = {
  status: document.querySelector('#bankingAppStatus'),
  subtitle: document.querySelector('#bankingPhoneSubtitle'),
  phoneContent: document.querySelector('#bankingPhoneContent'),
  selectedAccount: document.querySelector('#bankingSelectedAccount'),
  actionTabs: document.querySelector('#bankingActionTabs'),
  actionForm: document.querySelector('#bankingActionForm'),
  actionStatus: document.querySelector('#bankingActionStatus'),
  submitButton: document.querySelector('#bankingSubmitButton'),
  refreshButton: document.querySelector('#bankingRefreshButton'),
};

const bankingActions = [
  { id: 'overview', label: '계좌 홈' },
  { id: 'detail', label: '상세 조회' },
  { id: 'deposit', label: '입금' },
  { id: 'withdrawal', label: '출금' },
  { id: 'transfer', label: '이체' },
  { id: 'history', label: '거래내역' },
];

let bankingActionId = 'overview';
let bankingFormValues = {};
let bankingAccountDetail = null;
let bankingHistoryItems = [];

function setBankingStatus(kind, text) {
  if (!bankingElements.actionStatus) return;
  bankingElements.actionStatus.className = `status-badge ${kind}`;
  bankingElements.actionStatus.textContent = text;
}

function setBankingDefaults() {
  const selected = getSelectedAccount();
  const today = formatDateOnly(new Date());
  const fallbackDeposit = linkedAccounts.find((account) => account.accountNo !== selectedAccountNo) || null;
  bankingFormValues = {
    transactionBalance: bankingFormValues.transactionBalance || '1000',
    transactionSummary: bankingFormValues.transactionSummary || '앱 테스트 거래',
    withdrawalTransactionSummary: bankingFormValues.withdrawalTransactionSummary || '앱 출금(이체)',
    depositTransactionSummary: bankingFormValues.depositTransactionSummary || '앱 입금(이체)',
    depositAccountNo: bankingFormValues.depositAccountNo || fallbackDeposit?.accountNo || '',
    startDate: bankingFormValues.startDate || today,
    endDate: bankingFormValues.endDate || today,
    transactionType: bankingFormValues.transactionType || 'A',
    orderByType: bankingFormValues.orderByType || 'DESC',
    accountNo: selected?.accountNo || selectedAccountNo || '',
  };
}

function renderBankingTabs() {
  if (!bankingElements.actionTabs) return;
  bankingElements.actionTabs.innerHTML = bankingActions.map((action) => `
    <button type="button" class="banking-tab ${action.id === bankingActionId ? 'active' : ''}" data-banking-tab="${action.id}">${action.label}</button>
  `).join('');
}

function renderBankingSelectedAccount() {
  if (!bankingElements.selectedAccount) return;
  const selected = getSelectedAccount();
  if (!readConfigFromInputs().userKey) {
    bankingElements.actionForm.innerHTML = '<div class="banking-sheet"><div class="banking-sheet-title">로그인이 필요합니다.</div><div class="banking-sheet-copy">상단에서 사용자 생성 또는 조회 후 로그인하면 모바일 뱅킹이 활성화됩니다.</div></div>';
    bankingElements.submitButton.disabled = true;
    return;
  }
  if (!selected) {
    bankingElements.selectedAccount.textContent = '선택된 계좌가 없습니다. 왼쪽 모바일 앱에서 계좌를 선택해주세요.';
    return;
  }
  bankingElements.selectedAccount.innerHTML = `선택 계좌 <span class="banking-pill">${escapeHtml(selected.accountNo || '-')}</span> · ${escapeHtml(selected.accountName || selected.bankName || '계좌')} · 잔액 ${formatMoney(selected.accountBalance)}`;
}

function renderBankingForm() {
  if (!bankingElements.actionForm) return;
  setBankingDefaults();
  const selected = getSelectedAccount();

  if (!readConfigFromInputs().userKey) {
    bankingElements.actionForm.innerHTML = '<div class="banking-sheet"><div class="banking-sheet-title">로그인이 필요합니다.</div><div class="banking-sheet-copy">상단에서 사용자 생성 또는 조회 후 로그인하면 모바일 뱅킹이 활성화됩니다.</div></div>';
    bankingElements.submitButton.disabled = true;
    return;
  }

  if (!selected && bankingActionId !== 'overview') {
    bankingElements.actionForm.innerHTML = '<div class="banking-sheet"><div class="banking-sheet-title">계좌를 먼저 선택해주세요.</div><div class="banking-sheet-copy">왼쪽 모바일 앱에서 계좌 카드를 누르면 해당 계좌 기준으로 입금, 출금, 이체, 상세내역을 바로 실행할 수 있습니다.</div></div>';
    bankingElements.submitButton.disabled = true;
    return;
  }

  bankingElements.submitButton.disabled = bankingActionId === 'overview';

  if (bankingActionId === 'overview') {
    bankingElements.actionForm.innerHTML = `
      <div class="banking-sheet">
        <div class="banking-sheet-title">모바일 뱅킹 홈</div>
        <div class="banking-sheet-copy">계좌 카드를 선택하면 상세 정보와 거래 액션이 이 영역에 바로 연결됩니다.</div>
        <div class="banking-stat-grid">
          <div class="info-card"><div class="info-label">로그인 계좌 수</div><div class="info-value">${linkedAccounts.length}개</div></div>
          <div class="info-card"><div class="info-label">선택 계좌</div><div class="info-value">${escapeHtml(selected?.accountNo || '-')}</div></div>
        </div>
      </div>
    `;
    return;
  }

  if (bankingActionId === 'detail') {
    bankingElements.actionForm.innerHTML = `
      <div class="banking-sheet">
        <div class="banking-sheet-title">계좌 상세 조회</div>
        <div class="banking-sheet-copy">현재 선택한 계좌의 최신 잔액과 상세 정보를 다시 불러옵니다.</div>
        <div class="banking-stat-grid">
          <div class="info-card"><div class="info-label">계좌번호</div><div class="info-value">${escapeHtml(selected?.accountNo || '-')}</div></div>
          <div class="info-card"><div class="info-label">현재 보이는 잔액</div><div class="info-value">${formatMoney(selected?.accountBalance || 0)}</div></div>
        </div>
      </div>
    `;
    return;
  }

  if (bankingActionId === 'history') {
    bankingElements.actionForm.innerHTML = `
      <div class="banking-sheet">
        <div class="banking-sheet-title">거래내역 조회</div>
        <div class="banking-sheet-copy">기간과 정렬만 선택해서 바로 계좌 내역을 불러옵니다.</div>
        <div class="banking-mini-grid">
          <label><span>시작일</span><input data-banking-field="startDate" type="text" value="${escapeHtml(bankingFormValues.startDate)}" /></label>
          <label><span>종료일</span><input data-banking-field="endDate" type="text" value="${escapeHtml(bankingFormValues.endDate)}" /></label>
          <label><span>거래구분</span><select data-banking-field="transactionType"><option value="A" ${bankingFormValues.transactionType === 'A' ? 'selected' : ''}>전체</option><option value="M" ${bankingFormValues.transactionType === 'M' ? 'selected' : ''}>입금</option><option value="D" ${bankingFormValues.transactionType === 'D' ? 'selected' : ''}>출금</option></select></label>
          <label><span>정렬</span><select data-banking-field="orderByType"><option value="DESC" ${bankingFormValues.orderByType === 'DESC' ? 'selected' : ''}>최신순</option><option value="ASC" ${bankingFormValues.orderByType === 'ASC' ? 'selected' : ''}>오래된순</option></select></label>
        </div>
      </div>
    `;
    return;
  }

  if (bankingActionId === 'transfer') {
    bankingElements.actionForm.innerHTML = `
      <div class="banking-sheet">
        <div class="banking-sheet-title">계좌 이체</div>
        <div class="banking-sheet-copy">선택 계좌에서 다른 사용자 계좌를 포함한 임의의 계좌로 바로 이체합니다.</div>
        <div class="banking-transfer-accounts">
          <div class="info-card"><div class="info-label">출금 계좌</div><div class="info-value">${escapeHtml(selected?.accountNo || '-')}</div></div>
          <label><span>입금 계좌</span><input data-banking-field="depositAccountNo" type="text" value="${escapeHtml(bankingFormValues.depositAccountNo)}" placeholder="상대방 계좌번호를 직접 입력하세요" /></label>
          <label><span>이체 금액</span><input data-banking-field="transactionBalance" type="number" value="${escapeHtml(bankingFormValues.transactionBalance)}" /></label>
          <label><span>출금 메모</span><input data-banking-field="withdrawalTransactionSummary" type="text" value="${escapeHtml(bankingFormValues.withdrawalTransactionSummary)}" /></label>
          <label><span>입금 메모</span><input data-banking-field="depositTransactionSummary" type="text" value="${escapeHtml(bankingFormValues.depositTransactionSummary)}" /></label>
        </div>
      </div>
    `;
    return;
  }

  const title = bankingActionId === 'deposit' ? '입금' : '출금';
  bankingElements.actionForm.innerHTML = `
    <div class="banking-sheet">
      <div class="banking-sheet-title">${title}</div>
      <div class="banking-sheet-copy">계좌를 고른 뒤 금액과 메모만 넣고 바로 실행합니다.</div>
      <div class="banking-mini-grid">
        <div class="info-card"><div class="info-label">선택 계좌</div><div class="info-value">${escapeHtml(selected?.accountNo || '-')}</div></div>
        <div class="info-card"><div class="info-label">현재 잔액</div><div class="info-value">${formatMoney(selected?.accountBalance || 0)}</div></div>
        <label><span>${title} 금액</span><input data-banking-field="transactionBalance" type="number" value="${escapeHtml(bankingFormValues.transactionBalance)}" /></label>
        <label><span>${title} 메모</span><input data-banking-field="transactionSummary" type="text" value="${escapeHtml(bankingFormValues.transactionSummary)}" /></label>
      </div>
    </div>
  `;
}
function attachBankingFormEvents() {
  if (!bankingElements.actionForm) return;
  bankingElements.actionForm.querySelectorAll('[data-banking-field]').forEach((input) => {
    input.addEventListener('input', () => {
      bankingFormValues[input.getAttribute('data-banking-field')] = input.value;
    });
    input.addEventListener('change', () => {
      bankingFormValues[input.getAttribute('data-banking-field')] = input.value;
    });
  });
}

function renderBankingPhone() {
  if (!bankingElements.phoneContent) return;
  const config = readConfigFromInputs();
  const selected = getSelectedAccount();
  if (!config.userKey) {
    bankingElements.status.textContent = '로그인 필요';
    bankingElements.subtitle.textContent = '로그인한 사용자 계좌를 앱처럼 다룹니다.';
    bankingElements.phoneContent.className = 'phone-content empty-state';
    bankingElements.phoneContent.innerHTML = '로그인 후 계좌 목록이 이곳에 표시됩니다.';
    return;
  }
  if (!linkedAccounts.length) {
    bankingElements.status.textContent = '계좌 없음';
    bankingElements.subtitle.textContent = '계좌 목록을 새로고침하거나 계좌를 개설해보세요.';
    bankingElements.phoneContent.className = 'phone-content';
    bankingElements.phoneContent.innerHTML = '<div class="banking-empty-list">조회된 계좌가 없습니다. 새로고침 버튼으로 다시 불러오거나 계좌를 생성해보세요.</div>';
    return;
  }

  const totalBalance = linkedAccounts.reduce((sum, account) => sum + Number(account.accountBalance || 0), 0);
  bankingElements.status.textContent = `${linkedAccounts.length}개 계좌 연결됨`;
  bankingElements.subtitle.textContent = selected ? `${selected.accountNo || '-'} 계좌가 선택되어 있습니다.` : '계좌를 누르면 상세와 액션이 바로 이어집니다.';
  bankingElements.phoneContent.className = 'phone-content';
  bankingElements.phoneContent.innerHTML = `
    <div class="mobile-stack">
      <section class="banking-hero">
        <div class="balance-label">총 보유 계좌</div>
        <div class="balance-value">${linkedAccounts.length}개</div>
        <div class="balance-sub">총 잔액 ${formatMoney(totalBalance)}</div>
      </section>
      <div class="mobile-section-title">계좌 목록</div>
      ${linkedAccounts.map((account) => renderAccountCard(account)).join('')}
      ${selected ? `<div class="mobile-section-title">선택 계좌 요약</div>${renderAccountCard(bankingAccountDetail || selected, { interactive: false })}` : ''}
      ${bankingHistoryItems.length ? `<div class="mobile-section-title">최근 조회한 거래내역</div><div class="banking-history-list">${bankingHistoryItems.slice(0, 8).map(renderHistoryCard).join('')}</div>` : ''}
    </div>
  `;
}

function renderBankingApp() {
  renderBankingTabs();
  renderBankingSelectedAccount();
  renderBankingForm();
  attachBankingFormEvents();
  renderBankingPhone();
}

function buildOperationPayload(operationId, extraFields) {
  const operation = findOperationById(operationId);
  const config = readConfigFromInputs();
  const now = new Date();
  return {
    Header: {
      apiName: operation.apiName,
      transmissionDate: formatDateOnly(now),
      transmissionTime: formatTimeOnly(now),
      institutionCode: config.institutionCode || defaults.institutionCode,
      fintechAppNo: config.fintechAppNo || defaults.fintechAppNo,
      apiServiceCode: operation.apiName,
      institutionTransactionUniqueNo: createInstitutionTransactionUniqueNo(now),
      apiKey: config.apiKey,
      ...(operation.requiresUserKey ? { userKey: config.userKey } : {}),
    },
    ...extraFields,
  };
}

async function executeBankingOperation(operationId, extraFields) {
  const operation = findOperationById(operationId);
  const config = readConfigFromInputs();
  const payload = await callProxy(joinUrl(config.baseUrl, operation.endpoint), buildOperationPayload(operationId, extraFields));
  if (!(payload.status >= 200 && payload.status < 300)) {
    const message = payload.parsedBody?.Header?.responseMessage || payload.parsedBody?.message || `응답 코드 ${payload.status}`;
    throw new Error(message);
  }
  return payload;
}

async function bankingRefreshSelectedAccountData() {
  if (!selectedAccountNo) return;
  try {
    const detailPayload = await executeBankingOperation('account-detail', { accountNo: selectedAccountNo });
    bankingAccountDetail = detailPayload.parsedBody?.REC || null;
  } catch (error) {
    bankingAccountDetail = null;
  }
}

async function bankingSubmitAction() {
  const selected = getSelectedAccount();
  if (!selected && bankingActionId !== 'overview') {
    setBankingStatus('error', '계좌를 먼저 선택해주세요.');
    return;
  }

  bankingElements.submitButton.disabled = true;
  setBankingStatus('loading', '앱 요청 실행 중...');

  try {
    if (bankingActionId === 'detail') {
      await bankingRefreshSelectedAccountData();
      setBankingStatus('success', '상세 조회 완료');
    } else if (bankingActionId === 'history') {
      const historyPayload = await executeBankingOperation('history-list', {
        accountNo: selectedAccountNo,
        startDate: bankingFormValues.startDate,
        endDate: bankingFormValues.endDate,
        transactionType: bankingFormValues.transactionType,
        orderByType: bankingFormValues.orderByType,
      });
      bankingHistoryItems = historyPayload.parsedBody?.REC?.list || [];
      setBankingStatus('success', '거래내역 조회 완료');
    } else if (bankingActionId === 'deposit') {
      await executeBankingOperation('deposit', {
        accountNo: selectedAccountNo,
        transactionBalance: bankingFormValues.transactionBalance,
        transactionSummary: bankingFormValues.transactionSummary,
      });
      await loadAccountsOverview({ focusPreview: false });
      await bankingRefreshSelectedAccountData();
      setBankingStatus('success', '입금 완료');
    } else if (bankingActionId === 'withdrawal') {
      await executeBankingOperation('withdrawal', {
        accountNo: selectedAccountNo,
        transactionBalance: bankingFormValues.transactionBalance,
        transactionSummary: bankingFormValues.transactionSummary,
      });
      await loadAccountsOverview({ focusPreview: false });
      await bankingRefreshSelectedAccountData();
      setBankingStatus('success', '출금 완료');
    } else if (bankingActionId === 'transfer') {
      await executeBankingOperation('transfer', {
        withdrawalAccountNo: selectedAccountNo,
        depositAccountNo: bankingFormValues.depositAccountNo,
        transactionBalance: bankingFormValues.transactionBalance,
        withdrawalTransactionSummary: bankingFormValues.withdrawalTransactionSummary,
        depositTransactionSummary: bankingFormValues.depositTransactionSummary,
      });
      await loadAccountsOverview({ focusPreview: false });
      await bankingRefreshSelectedAccountData();
      setBankingStatus('success', '이체 완료');
    } else {
      setBankingStatus('idle', '계좌 홈입니다.');
    }
  } catch (error) {
    setBankingStatus('error', error.message || '앱 요청에 실패했습니다.');
  } finally {
    renderBankingApp();
    bankingElements.submitButton.disabled = bankingActionId === 'overview';
  }
}

if (bankingElements.actionTabs) {
  bankingElements.actionTabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-banking-tab]');
    if (!button) return;
    bankingActionId = button.getAttribute('data-banking-tab') || 'overview';
    renderBankingApp();
  });
}

if (bankingElements.phoneContent) {
  bankingElements.phoneContent.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-account-action]');
    if (actionButton) {
      selectedAccountNo = actionButton.getAttribute('data-account-no') || '';
      const actionMap = {
        detail: 'detail',
        deposit: 'deposit',
        withdrawal: 'withdrawal',
        history: 'history',
        transfer: 'transfer',
      };
      bankingActionId = actionMap[actionButton.getAttribute('data-account-action')] || 'overview';
      bankingAccountDetail = null;
      renderBankingApp();
      return;
    }

    const accountCard = event.target.closest('[data-account-select]');
    if (accountCard) {
      selectedAccountNo = accountCard.getAttribute('data-account-select') || '';
      bankingActionId = 'detail';
      bankingAccountDetail = null;
      renderBankingApp();
    }
  });
}

if (bankingElements.refreshButton) {
  bankingElements.refreshButton.addEventListener('click', async () => {
    setBankingStatus('loading', '계좌 새로고침 중...');
    await loadAccountsOverview({ focusPreview: false });
    await bankingRefreshSelectedAccountData();
    renderBankingApp();
    setBankingStatus('success', '새로고침 완료');
  });
}

if (bankingElements.submitButton) {
  bankingElements.submitButton.addEventListener('click', bankingSubmitAction);
}

const originalLoadAccountsOverview = loadAccountsOverview;
loadAccountsOverview = async function(options = {}) {
  const result = await originalLoadAccountsOverview(options);
  renderBankingApp();
  return result;
};

const originalHandleMemberAction = handleMemberAction;
handleMemberAction = async function(mode) {
  const result = await originalHandleMemberAction(mode);
  renderBankingApp();
  return result;
};

elements.clearUserButton.addEventListener('click', () => {
  bankingActionId = 'overview';
  bankingFormValues = {};
  bankingAccountDetail = null;
  bankingHistoryItems = [];
  renderBankingApp();
  setBankingStatus('idle', '대기 중');
});

renderBankingApp();

if (initialConfig.authUserId && initialConfig.userKey) {
  loadAccountsOverview({ focusPreview: false });
}


function validateTransferFields(fields) {
  const withdrawalAccountNo = String(fields.withdrawalAccountNo || '').trim();
  const depositAccountNo = String(fields.depositAccountNo || '').trim();
  const amount = Number(fields.transactionBalance || 0);

  if (!withdrawalAccountNo || !depositAccountNo) {
    return { valid: false, message: '이체는 출금 계좌와 입금 계좌를 모두 선택해야 합니다.' };
  }
  if (withdrawalAccountNo === depositAccountNo) {
    return { valid: false, message: '출금 계좌와 입금 계좌는 서로 달라야 합니다.' };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { valid: false, message: '이체 금액은 0원보다 커야 합니다.' };
  }

  return { valid: true };
}

function setBankingDefaults() {
  const selected = getSelectedAccount();
  const today = formatDateOnly(new Date());
  const fallbackDeposit = linkedAccounts.find((account) => account.accountNo !== selectedAccountNo) || null;
  const safeDepositAccountNo = bankingFormValues.depositAccountNo && bankingFormValues.depositAccountNo !== selectedAccountNo
    ? bankingFormValues.depositAccountNo
    : (fallbackDeposit?.accountNo || '');

  bankingFormValues = {
    transactionBalance: bankingFormValues.transactionBalance || '1000',
    transactionSummary: bankingFormValues.transactionSummary || '앱 테스트 거래',
    withdrawalTransactionSummary: bankingFormValues.withdrawalTransactionSummary || '앱 출금(이체)',
    depositTransactionSummary: bankingFormValues.depositTransactionSummary || '앱 입금(이체)',
    depositAccountNo: safeDepositAccountNo,
    startDate: bankingFormValues.startDate || today,
    endDate: bankingFormValues.endDate || today,
    transactionType: bankingFormValues.transactionType || 'A',
    orderByType: bankingFormValues.orderByType || 'DESC',
    accountNo: selected?.accountNo || selectedAccountNo || '',
  };
}

const originalRenderBankingApp = renderBankingApp;
renderBankingApp = function() {
  originalRenderBankingApp();
  if (bankingActionId !== 'transfer') return;

  const candidates = linkedAccounts.filter((account) => account.accountNo !== selectedAccountNo);
  if (candidates.length === 0) {
    bankingElements.submitButton.disabled = true;
    bankingElements.actionForm.insertAdjacentHTML('beforeend', '<div class="banking-sheet"><div class="banking-sheet-title">이체 대상 계좌가 없습니다.</div><div class="banking-sheet-copy">같은 사용자 안에 다른 계좌가 하나 더 있어야 계좌이체를 테스트할 수 있습니다.</div></div>');
    setBankingStatus('error', '이체 대상 계좌가 없습니다.');
  }
};

elements.sendRequestButton.addEventListener('click', (event) => {
  const operation = getSelectedOperation();
  if (operation.id !== 'transfer') return;

  const body = buildRequestBody();
  const validation = validateTransferFields(body);
  if (!validation.valid) {
    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus('error', validation.message);
  }
}, true);

if (bankingElements.submitButton) {
  bankingElements.submitButton.addEventListener('click', (event) => {
    if (bankingActionId !== 'transfer') return;

    const validation = validateTransferFields({
      withdrawalAccountNo: selectedAccountNo,
      depositAccountNo: bankingFormValues.depositAccountNo,
      transactionBalance: bankingFormValues.transactionBalance,
    });

    if (!validation.valid) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setBankingStatus('error', validation.message);
    }
  }, true);
}

function renderAuthFeedback() {
  if (!authEvent) {
    elements.authFeedback.className = 'auth-feedback empty-auth-feedback';
    elements.authFeedback.textContent = '아직 로그인 정보가 없습니다. 사용자 생성 또는 조회 후 로그인해보세요.';
    return;
  }

  elements.authFeedback.className = 'auth-feedback';
  elements.authFeedback.innerHTML = `
    <div class="auth-feedback-card compact-auth-card">
      <div class="auth-info-grid compact-auth-grid">
        <div class="auth-info-item"><div class="auth-label">사용자 ID</div><div class="auth-value">${escapeHtml(authEvent.userId || '-')}</div></div>
        <div class="auth-info-item"><div class="auth-label">마지막 처리 시각</div><div class="auth-value">${escapeHtml(authEvent.occurredAt || '-')}</div></div>
        <div class="auth-info-item"><div class="auth-label">userKey</div><div class="auth-value">${escapeHtml(authEvent.userKey || '-')}</div></div>
      </div>
    </div>
  `;
}

function initializeWorkspaceTabs() {
  const tabs = Array.from(document.querySelectorAll('[data-workspace-tab]'));
  const panes = Array.from(document.querySelectorAll('[data-workspace-pane]'));
  if (!tabs.length || !panes.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-workspace-tab');
      tabs.forEach((candidate) => candidate.classList.toggle('active', candidate === tab));
      panes.forEach((pane) => pane.classList.toggle('active', pane.getAttribute('data-workspace-pane') === target));
    });
  });
}

function disableStoredLoginRestore() {
  currentMember = null;
  authEvent = null;
  linkedAccounts = [];
  selectedAccountNo = '';
  bankingAccountDetail = null;
  bankingHistoryItems = [];
  bankingActionId = 'overview';
  bankingFormValues = {};
  elements.authUserId.value = '';
  elements.userKey.value = '';
  updateAuthState();
  renderAuthFeedback();
  clearPreviewOnly();
  renderBankingApp();
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    stored.userKey = '';
    stored.authUserId = '';
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaults, ...stored }));
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaults, ...readConfigFromInputs(), userKey: '', authUserId: '' }));
  }
}

initializeWorkspaceTabs();
disableStoredLoginRestore();
