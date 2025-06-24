const R={simple:{"gpt-4o":`You are an expert prompt engineer. Transform the user's prompt for GPT-4o:
- Add clear role definition
- Break into numbered steps
- Specify output format
- Add "Think step-by-step" for reasoning

Return ONLY the optimized prompt. Do NOT include any explanations, descriptions, or commentary about the prompt.`,"claude-3-sonnet":`You are an expert prompt engineer. Transform the user's prompt for Claude 3 Sonnet:
- Use XML tags for structure (<task>, <context>)
- Provide context upfront
- Include specific formatting
- Add ethical framing

Return ONLY the optimized prompt. Do NOT include any explanations, descriptions, or commentary about the prompt.`,"gemini-1.5":`You are an expert prompt engineer. Transform the user's prompt for Gemini 1.5:
- Use structured sections
- Include reasoning requests
- Specify response length
- Add evaluation criteria

Return ONLY the optimized prompt. Do NOT include any explanations, descriptions, or commentary about the prompt.`,"o3-mini":`You are an expert prompt engineer. Transform the user's prompt for o3-mini:
- Add clear role definition and constraints
- Structure with numbered steps
- Include specific success criteria
- Add "Think step-by-step" for complex tasks

Return ONLY the optimized prompt.`},advanced:{"gpt-4o":`# ROLE
You are a SENIOR PROMPT ENGINEER with deep expertise in GPT-4o optimization patterns.

# OBJECTIVE
Transform the user's raw prompt into a production-ready, highly optimized version that leverages GPT-4o's capabilities for maximum performance and reliability.

# TRANSFORMATION GUIDELINES
1. **Role Definition**: Start with clear, specific role assignment ("You are a [specific expert]...")
2. **Task Structure**: Break complex requests into numbered, sequential steps
3. **Output Specification**: Define exact format, length, and structure requirements
4. **Reasoning Enhancement**: Add "Think step-by-step" or "Show your work" for analytical tasks
5. **Constraints & Guardrails**: Include specific limitations and success criteria
6. **Context Injection**: Add relevant background information and examples when beneficial
7. **Error Handling**: Include instructions for edge cases and uncertainty

# OUTPUT FORMAT
Return ONLY the optimized prompt formatted with clear sections, using markdown headings where appropriate. Do NOT include any explanations or descriptions about what the prompt is designed to do. Do NOT add a title or heading like "# Optimized Prompt for GPT-4o" - start directly with the actual prompt content.

# QUALITY STANDARDS
The optimized prompt should be:
- Specific and unambiguous
- Structured for consistent results
- Enhanced with relevant constraints
- Optimized for GPT-4o's reasoning capabilities`,"claude-3-sonnet":`# ROLE
You are a SENIOR PROMPT ENGINEER specializing in Claude 3 Sonnet optimization with deep understanding of its architectural strengths.

# OBJECTIVE
Transform the user's raw prompt into a comprehensive, well-structured prompt that maximizes Claude 3 Sonnet's performance through proper XML structuring and ethical framing.

# TRANSFORMATION GUIDELINES
1. **XML Structure**: Use semantic tags like <task>, <context>, <requirements>, <constraints>, <output_format>
2. **Ethical Framing**: Emphasize helpful, harmless, honest approach
3. **Detailed Context**: Provide comprehensive background and reasoning
4. **Specific Examples**: Include concrete examples when beneficial
5. **Clear Boundaries**: Define what should and shouldn't be included
6. **Step-by-Step**: Break complex tasks into logical sequences
7. **Verification**: Add self-checking mechanisms

# OUTPUT FORMAT
Return ONLY the optimized prompt using proper XML structure and professional formatting. Do NOT include any meta-commentary or descriptions about the prompt. Do NOT add a title or heading - start directly with the prompt content.

# QUALITY STANDARDS
- Comprehensive context and clear structure
- Ethical considerations and safety guidelines
- Detailed requirements and success criteria
- Claude-optimized XML formatting`,"gemini-1.5":`# ROLE
You are a SENIOR PROMPT ENGINEER with expertise in Gemini 1.5's multimodal and reasoning capabilities.

# OBJECTIVE
Transform the user's raw prompt into a comprehensive, structured prompt that leverages Gemini 1.5's strengths in reasoning, analysis, and structured thinking.

# TRANSFORMATION GUIDELINES
1. **Structured Sections**: Use clear headings and logical organization
2. **Reasoning Transparency**: Include "Explain your reasoning" and "Show your work"
3. **Multimodal Awareness**: Reference relevant multimodal capabilities when applicable
4. **Length Specifications**: Define expected response length and detail level
5. **Evaluation Criteria**: Include metrics for success and quality assessment
6. **Comprehensive Context**: Provide thorough background and constraints
7. **Iterative Refinement**: Include self-improvement instructions

# OUTPUT FORMAT
Return ONLY the optimized prompt with professional structure and clear sections. Do NOT include any explanations about the prompt's purpose or design. Do NOT add a title heading - start directly with the prompt content.

# QUALITY STANDARDS
- Comprehensive and well-organized
- Transparency in reasoning requirements
- Specific evaluation criteria
- Optimized for Gemini's analytical strengths`,"o3-mini":`# ROLE
You are a SENIOR PROMPT ENGINEER with deep expertise in o3-mini's reasoning and efficiency capabilities.

# OBJECTIVE
Transform the user's raw prompt into a highly optimized, production-ready prompt that maximizes o3-mini's reasoning capabilities while maintaining efficiency.

# TRANSFORMATION GUIDELINES
1. **Precise Role Definition**: Establish clear expertise and context
2. **Reasoning Structure**: Use step-by-step thinking and logical progression
3. **Efficiency Optimization**: Balance thoroughness with conciseness for o3-mini
4. **Success Metrics**: Define clear, measurable outcomes
5. **Constraint Management**: Include specific limitations and guardrails
6. **Context Integration**: Provide necessary background without redundancy
7. **Quality Assurance**: Include verification and error-checking steps

# OUTPUT FORMAT
Return ONLY the optimized prompt using professional structure with clear sections and headings. Do NOT add any explanatory text about what the prompt does or how it's designed. Do NOT add a title heading like "Optimized Prompt" - start directly with the prompt content.

# QUALITY STANDARDS
- Highly structured and logical
- Optimized for reasoning efficiency
- Clear success criteria and constraints
- Balanced detail appropriate for o3-mini's capabilities`}},O={"gpt-4o":{api:"openai",model:"gpt-4o-mini",maxTokens:1200,temperature:.3},"claude-3-sonnet":{api:"openai",model:"gpt-3.5-turbo-1106",maxTokens:1e3,temperature:.3},"gemini-1.5":{api:"openai",model:"gpt-3.5-turbo-1106",maxTokens:1e3,temperature:.3},"o3-mini":{api:"openai",model:"o3-mini",maxTokens:1e5,reasoningEffort:"medium"}};async function S(t,e,n="simple",i){var h,c,d;const o=await b();if(!o)throw new Error("API key not configured. Please set up your API key in settings.");const s=R[n][e],a=O[e];try{const r={model:a.model,messages:[{role:"system",content:s},{role:"user",content:`Optimize this prompt for ${e}: ${t}`}]};a.model==="o3-mini"?(r.reasoning_effort=a.reasoningEffort,r.max_completion_tokens=a.maxTokens,r.stream=!1):(r.temperature=a.temperature,r.max_tokens=a.maxTokens,r.stream=!0);const p=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify(r)});if(!p.ok){const m=await p.text();throw console.error("API Error Details:",{status:p.status,statusText:p.statusText,body:m,model:a.model,requestBody:r}),new Error(`API request failed: ${p.status} ${p.statusText} - ${m}`)}if(a.model==="o3-mini"){const u=(await p.json()).choices[0].message.content;return i&&i(u),u}else{const m=p.body.getReader(),u=new TextDecoder;let f="";for(;;){const{done:x,value:E}=await m.read();if(x)break;const I=u.decode(E).split(`
`);for(const g of I)if(g.startsWith("data: ")){const T=g.slice(6);if(T==="[DONE]")continue;try{const y=(d=(c=(h=JSON.parse(T).choices)==null?void 0:h[0])==null?void 0:c.delta)==null?void 0:d.content;y&&(f+=y,i&&i(f))}catch{}}}return f}}catch(r){throw console.error("API call failed:",r),r}}function P(t){const e=[/^#+ ?(?:Optimized )?Prompt (?:for|optimized for) .+?$/gmi,/^#+ ?(?:Prompt|Optimized) .+?$/gmi,/This (?:optimized )?prompt is designed to.+?\./gi,/This prompt (?:will )?leverage.+?\./gi,/The following prompt.+?\./gi,/Here's the optimized prompt.+?:/gi,/Below is the optimized prompt.+?:/gi,/I've optimized.+?\./gi,/The optimized prompt.+?:/gi,/^This .+? prompt .+?\.\s*/gm,/^Here is .+? prompt.+?:?\s*/gmi,/^The .+? prompt.+?:?\s*/gmi];let n=t;for(const i of e)n=n.replace(i,"");return n=n.trim().replace(/\n{3,}/g,`

`),n=n.replace(/^\n+/,""),n}const l=new Map,A=24*60*60*1e3;function w(t,e,n){return`${n}:${e}:${t.toLowerCase().trim()}`}function z(t,e,n){const i=w(t,e,n),o=l.get(i);return o&&Date.now()-o.timestamp<A?o.result:(o&&l.delete(i),null)}function k(t,e,n,i){const o=w(t,e,n);if(l.set(o,{result:i,timestamp:Date.now()}),l.size>100){const s=l.keys().next().value;l.delete(s)}}async function b(){return new Promise(t=>{chrome.storage.sync.get(["apiKey"],e=>{t(e.apiKey||"")})})}function D(t){const e=t.toLowerCase();return e.includes("code")||e.includes("function")||e.includes("implement")||e.includes("debug")?"code_generation":e.includes("analyze")||e.includes("explain")||e.includes("compare")?"analytical":e.includes("write")||e.includes("story")||e.includes("create")?"creative_writing":"general"}function L(t,e,n){const i=[];return!t.includes("You are")&&e.includes("You are")&&i.push("Added role definition for clarity"),n==="claude-3-sonnet"&&e.includes("<")&&i.push("Added XML-style structure tags"),e.includes("step")&&!t.includes("step")&&i.push("Broke down into clear steps"),e.length>t.length*1.5&&i.push("Added specific constraints and context"),i}chrome.runtime.onInstalled.addListener(()=>{chrome.contextMenus.create({id:"optimizePrompt",title:"Optimize this prompt",contexts:["selection"]})});chrome.contextMenus.onClicked.addListener((t,e)=>{t.menuItemId==="optimizePrompt"&&t.selectionText&&(chrome.storage.local.set({selectedText:t.selectionText,fromContextMenu:!0}),chrome.action.openPopup())});chrome.runtime.onMessage.addListener((t,e,n)=>{if(t.action==="optimizePrompt"){const{rawPrompt:i,targetModel:o,qualityLevel:s="simple"}=t.data,a=z(i,o,s);if(a){console.log(`Cache hit - instant response! (${s} quality)`),n({success:!0,data:a,cached:!0});return}return S(i,o,s,c=>{chrome.runtime.sendMessage({action:"optimizationProgress",data:{partialResult:c}}).catch(()=>{})}).then(c=>{const d=P(c),r={optimizedPrompt:d,detectedIntent:D(i),qualityLevel:s,metadata:{originalLength:i.length,optimizedLength:d.length,optimizationTips:L(i,d,o),model:O[o].model}};k(i,o,s,r),n({success:!0,data:r})}).catch(c=>{n({success:!1,error:c.message})}),!0}});
