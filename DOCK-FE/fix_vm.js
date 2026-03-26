const fs = require('fs'); 
function r(f) { 
  if(!fs.existsSync(f)) return; 
  let c = fs.readFileSync(f, 'utf8'), o = c; 
  c = c.replace(/draftState\.draft\./g, 'draftState.'); 
  c = c.replace(/draftState\.status === 'loaded'/g, "draftState.status === 'editing'"); 
  if(f.includes('PaymentTabContent.tsx')) { 
    c = c.replace(/openDraft/g, 'selectHistory'); 
    c = c.replace(/prepareSplitStep/g, 'splitEqually'); 
    c = c.replace(/updateParticipantSplitAmount/g, 'updateAmount'); 
    c = c.replace(/selectedParticipantCount/g, "(draftState.status==='editing'?draftState.participants.filter(p=>p.isSelected).length:0)"); 
    c = c.replace(/splitAmountTotal/g, "(draftState.status==='editing'?draftState.participants.reduce((s,p)=>s+p.splitAmount,0):0)"); 
  } 
  if(c !== o) { 
    fs.writeFileSync(f, c, 'utf8'); 
    console.log('Patched ' + f); 
  } 
} 
r('c:/ksc4305/duckchi/S14P21C102-FE/DOCK-FE/src/features/payment/views/components/entry/PaymentTabContent.tsx'); 
r('c:/ksc4305/duckchi/S14P21C102-FE/DOCK-FE/src/features/payment/views/components/history/PaymentAccountHistoryFormView.tsx'); 
r('c:/ksc4305/duckchi/S14P21C102-FE/DOCK-FE/src/features/payment/views/components/history/PaymentAccountHistorySplitView.tsx');
