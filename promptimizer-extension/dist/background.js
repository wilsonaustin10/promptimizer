const S={simple:{"gpt-4o":`You are an expert prompt engineer. Transform the user's prompt for GPT-4o:
- Add clear role definition
- Break into numbered steps
- Specify output format
- Add "Think step-by-step" for reasoning

Return ONLY the optimized prompt.`,"claude-3-sonnet":`You are an expert prompt engineer. Transform the user's prompt for Claude 3 Sonnet:
- Use XML tags for structure (<task>, <context>)
- Provide context upfront
- Include specific formatting
- Add ethical framing

Return ONLY the optimized prompt.`,"gemini-1.5":`You are an expert prompt engineer. Transform the user's prompt for Gemini 1.5:
- Use structured sections
- Include reasoning requests
- Specify response length
- Add evaluation criteria

Return ONLY the optimized prompt.`,"o3-mini":`You are an expert prompt engineer. Transform the user's prompt for o3-mini:
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
Return ONLY the optimized prompt formatted with clear sections, using markdown headings where appropriate.

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
Return ONLY the optimized prompt using proper XML structure and professional formatting.

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
Return ONLY the optimized prompt with professional structure and clear sections.

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
Return ONLY the optimized prompt using professional structure with clear sections and headings.

# QUALITY STANDARDS
- Highly structured and logical
- Optimized for reasoning efficiency
- Clear success criteria and constraints
- Balanced detail appropriate for o3-mini's capabilities`}},y={"gpt-4o":{api:"openai",model:"gpt-4o-mini",maxTokens:1200,temperature:.3},"claude-3-sonnet":{api:"openai",model:"gpt-3.5-turbo-1106",maxTokens:1e3,temperature:.3},"gemini-1.5":{api:"openai",model:"gpt-3.5-turbo-1106",maxTokens:1e3,temperature:.3},"o3-mini":{api:"openai",model:"o3-mini-2025-01-31",maxTokens:1e5,temperature:1}};async function x(t,e,r="simple",n){var l,s,p;const i=await L();if(!i)throw new Error("API key not configured. Please set up your API key in settings.");const a=S[r][e],o=y[e];try{const c=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${i}`},body:JSON.stringify({model:o.model,messages:[{role:"system",content:a},{role:"user",content:`Optimize this prompt for ${e}: ${t}`}],temperature:o.temperature,max_tokens:o.maxTokens,stream:o.model!=="o3-mini-2025-01-31"})});if(!c.ok)throw new Error(`API request failed: ${c.statusText}`);if(o.model==="o3-mini-2025-01-31"){const d=(await c.json()).choices[0].message.content;return n&&n(d),d}else{const h=c.body.getReader(),d=new TextDecoder;let m="";for(;;){const{done:I,value:E}=await h.read();if(I)break;const w=d.decode(E).split(`
`);for(const f of w)if(f.startsWith("data: ")){const g=f.slice(6);if(g==="[DONE]")continue;try{const T=(p=(s=(l=JSON.parse(g).choices)==null?void 0:l[0])==null?void 0:s.delta)==null?void 0:p.content;T&&(m+=T,n&&n(m))}catch{}}}return m}}catch(c){throw console.error("API call failed:",c),c}}const u=new Map,A=24*60*60*1e3;function O(t,e,r){return`${r}:${e}:${t.toLowerCase().trim()}`}function k(t,e,r){const n=O(t,e,r),i=u.get(n);return i&&Date.now()-i.timestamp<A?i.result:(i&&u.delete(n),null)}function N(t,e,r,n){const i=O(t,e,r);if(u.set(i,{result:n,timestamp:Date.now()}),u.size>100){const a=u.keys().next().value;u.delete(a)}}async function L(){return new Promise(t=>{chrome.storage.sync.get(["apiKey"],e=>{t(e.apiKey||"")})})}function P(t){const e=t.toLowerCase();return e.includes("code")||e.includes("function")||e.includes("implement")||e.includes("debug")?"code_generation":e.includes("analyze")||e.includes("explain")||e.includes("compare")?"analytical":e.includes("write")||e.includes("story")||e.includes("create")?"creative_writing":"general"}function b(t,e,r){const n=[];return!t.includes("You are")&&e.includes("You are")&&n.push("Added role definition for clarity"),r==="claude-3-sonnet"&&e.includes("<")&&n.push("Added XML-style structure tags"),e.includes("step")&&!t.includes("step")&&n.push("Broke down into clear steps"),e.length>t.length*1.5&&n.push("Added specific constraints and context"),n}chrome.runtime.onInstalled.addListener(()=>{chrome.contextMenus.create({id:"optimizePrompt",title:"Optimize this prompt",contexts:["selection"]})});chrome.contextMenus.onClicked.addListener((t,e)=>{t.menuItemId==="optimizePrompt"&&t.selectionText&&(chrome.storage.local.set({selectedText:t.selectionText,fromContextMenu:!0}),chrome.action.openPopup())});chrome.runtime.onMessage.addListener((t,e,r)=>{if(t.action==="optimizePrompt"){const{rawPrompt:n,targetModel:i,qualityLevel:a="simple"}=t.data,o=k(n,i,a);if(o){console.log(`Cache hit - instant response! (${a} quality)`),r({success:!0,data:o,cached:!0});return}return x(n,i,a,s=>{chrome.runtime.sendMessage({action:"optimizationProgress",data:{partialResult:s}}).catch(()=>{})}).then(s=>{const p={optimizedPrompt:s,detectedIntent:P(n),qualityLevel:a,metadata:{originalLength:n.length,optimizedLength:s.length,optimizationTips:b(n,s,i),model:y[i].model}};N(n,i,a,p),r({success:!0,data:p})}).catch(s=>{r({success:!1,error:s.message})}),!0}});
