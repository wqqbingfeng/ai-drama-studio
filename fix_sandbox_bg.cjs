const fs = require('fs');
let code = fs.readFileSync('src/ui/pages/AgentMarket.tsx', 'utf8');

code = code.replace(
  'className="w-full h-40 bg-[#121216] border border-[#1b1b22] rounded-xl p-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#E2AB46] resize-none"',
  'className={`w-full h-40 ${theme.bgInput} border ${theme.borderColor} rounded-xl p-2.5 text-xs ${theme.textMain} focus:outline-none focus:border-[#E2AB46] resize-none`}'
);

fs.writeFileSync('src/ui/pages/AgentMarket.tsx', code, 'utf8');
console.log('Fixed sandbox text area background');
