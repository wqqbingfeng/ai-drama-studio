const fs = require('fs')

let agentFile = fs.readFileSync('src/ui/pages/AgentMarket.tsx', 'utf-8')

agentFile = agentFile.replace(/bg-\[\#0c0c0f\] border border-\[\#16161a\]/g, '`${theme.bgPanel} border ${theme.borderColor}`')
agentFile = agentFile.replace(/bg-\[\#050507\] border border-\[\#16161a\]/g, '`${theme.bgInput} border ${theme.borderColor}`')
agentFile = agentFile.replace(/text-gray-300 whitespace-pre-wrap font-sans text-gray-300/g, 'text-gray-600 whitespace-pre-wrap font-sans')
agentFile = agentFile.replace(/bg-\[\#070709\] border border-\[\#15151a\]/g, '`${theme.bgCard} border ${theme.borderColorLight}`')
agentFile = agentFile.replace(/text-gray-400 leading-relaxed font-sans/g, '`${theme.textMain} leading-relaxed font-sans`')
agentFile = agentFile.replace(/border-\[\#1f1f26\]/g, 'border-gray-200')
agentFile = agentFile.replace(/bg-\[\#0a0a0d\]/g, '`${theme.bgCard}`')

fs.writeFileSync('src/ui/pages/AgentMarket.tsx', agentFile)
