const fs = require('fs');
let code = fs.readFileSync('src/ui/pages/AgentMarket.tsx', 'utf8');

if (!code.includes('Settings,')) {
  code = code.replace(/Search, Plus,/, 'Settings, Search, Plus,');
}

fs.writeFileSync('src/ui/pages/AgentMarket.tsx', code, 'utf8');
console.log('Import added.');
