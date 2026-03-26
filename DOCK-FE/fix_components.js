const fs = require('fs');
function rep(f, replaces) {
  if(!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8'), o = c;
  replaces.forEach(r => c = c.replace(r[0], r[1]));
  if(c !== o) {
    fs.writeFileSync(f, c, 'utf8');
    console.log('Fixed ' + f);
  }
}
rep('c:/ksc4305/duckchi/S14P21C102-FE/DOCK-FE/src/features/payment/views/components/common/PaymentOverviewView.tsx', [
  [/'\.\/PaymentExpenseGroupSection'/g, "'../detail/PaymentExpenseGroupSection'"],
  [/'\.\/PaymentRequestActionButton'/g, "'../detail/PaymentRequestActionButton'"]
]);
rep('c:/ksc4305/duckchi/S14P21C102-FE/DOCK-FE/src/features/payment/views/components/detail/PaymentExpenseSelectionCard.tsx', [
  [/'\.\/PaymentExpenseStatusBadge'/g, "'../common/PaymentExpenseStatusBadge'"]
]);
rep('c:/ksc4305/duckchi/S14P21C102-FE/DOCK-FE/src/features/payment/views/components/entry/PaymentTabContent.tsx', [
  [/'\.\/PaymentAccountHistoryFormView'/g, "'../history/PaymentAccountHistoryFormView'"],
  [/'\.\/PaymentAccountHistoryListView'/g, "'../history/PaymentAccountHistoryListView'"],
  [/'\.\/PaymentAccountHistorySplitView'/g, "'../history/PaymentAccountHistorySplitView'"],
  [/'\.\/PaymentExpenseDetailView'/g, "'../detail/PaymentExpenseDetailView'"],
  [/'\.\/PaymentManualEntrySetupView'/g, "'../manual/PaymentManualEntrySetupView'"],
  [/'\.\/PaymentManualEntrySplitView'/g, "'../manual/PaymentManualEntrySplitView'"],
  [/'\.\/PaymentOcrFlow'/g, "'../ocr/PaymentOcrFlow'"],
  [/'\.\/PaymentOverviewView'/g, "'../common/PaymentOverviewView'"]
]);
