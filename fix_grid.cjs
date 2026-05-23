const fs = require('fs');
let code = fs.readFileSync('src/ui/pages/AgentMarket.tsx', 'utf8');

code = code.replace(/className="xl:col-span-7 flex flex-col gap-4 min-h-0"/, 'className="xl:col-span-4 flex flex-col gap-4 min-h-0"');
code = code.replace(/xl:col-span-5 \$\{theme\.bgCard\} border \$\{theme\.borderColor\}/, 'xl:col-span-8 ${theme.bgCard} border ${theme.borderColor}');

fs.writeFileSync('src/ui/pages/AgentMarket.tsx', code, 'utf8');
console.log('Grid spans updated.');
