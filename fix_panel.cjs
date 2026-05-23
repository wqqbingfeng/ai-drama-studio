const fs = require('fs');
let code = fs.readFileSync('src/ui/pages/AgentMarket.tsx', 'utf8');

// We need to replace the prompt text expanding logic to expand the whole block.
// Find the block: <div className={`p-4 rounded-2xl ${theme.bgPanel} border ${theme.borderColorLight} space-y-4`}>
// up to: {/* Highly condensed Sandbox Test zone */}

const blockStartString = `<div className={\`p-4 rounded-2xl \${theme.bgPanel} border \${theme.borderColorLight} space-y-4\`}>`;
const blockEndString = `{/* Highly condensed Sandbox Test zone */}`;

let startIndex = code.indexOf(blockStartString);
let endIndex = code.indexOf(blockEndString);

if (startIndex !== -1 && endIndex !== -1) {
  let blockContent = code.substring(startIndex, endIndex);

  // We change the block to be a collapsible container.
  // We'll wrap the inner content.
  // Instead of the current expanded check inside, we'll wrap everything.

  // Remove the old collapsed view lines
  blockContent = blockContent.replace(
    /\{\/\* Collapsed \/ Expanded state with faint overlay \*\/\}[\s\S]*?<\/div>\n\s*<\/div>\n\s*\)}/,
    `{/* Collapsed / Expanded state with faint overlay */}
                          <div className="relative">
                            <div className="text-[11px] leading-relaxed text-gray-500 font-mono whitespace-pre-wrap">
                              {selectedAgent.systemPrompt}
                            </div>
                            {selectedPresetIndex === -1 && !isEditingPrompt && (
                              <div className="mt-2 flex justify-end">
                                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded leading-none font-bold">手动修改过</span>
                              </div>
                            )}
                          </div>
                        )}`
  );

  // Replace the outer div wrapper
  let newBlock = `<div className={\`rounded-2xl \${theme.bgPanel} border \${theme.borderColorLight} overflow-hidden\`}>
                      <div 
                        className={\`p-3 flex items-center justify-between cursor-pointer \${promptExpanded ? \`border-b \${theme.borderColorLight}\` : ''}\`}
                        onClick={() => setPromptExpanded(!promptExpanded)}
                      >
                        <span className={\`text-xs font-bold \${theme.textTitle} tracking-tight flex items-center gap-1.5\`}>
                          <Settings size={14} className="text-gray-400" />
                          系统预设提示词
                        </span>
                        <div className="flex items-center gap-2">
                           <button className="text-[10px] text-gray-500 hover:text-gray-800">
                             {promptExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                           </button>
                        </div>
                      </div>

                      {promptExpanded && (
                        <div className="p-4 space-y-4">
${blockContent.substring(blockStartString.length)}
                      )}
                    </div>

                    `;
  
  code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
  fs.writeFileSync('src/ui/pages/AgentMarket.tsx', code, 'utf8');
  console.log('Successfully updated the panel in AgentMarket.');
} else {
  console.log('Could not find the block to replace.');
}
