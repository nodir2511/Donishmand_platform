import{r as w}from"./vendor-CZavDUH4.js";const y=n=>typeof n=="string",B=()=>{let n,e;const t=new Promise((s,a)=>{n=s,e=a});return t.resolve=n,t.reject=e,t},fe=n=>n==null?"":""+n,Ve=(n,e,t)=>{n.forEach(s=>{e[s]&&(t[s]=e[s])})},Ae=/###/g,pe=n=>n&&n.indexOf("###")>-1?n.replace(Ae,"."):n,ge=n=>!n||y(n),_=(n,e,t)=>{const s=y(e)?e.split("."):e;let a=0;for(;a<s.length-1;){if(ge(n))return{};const i=pe(s[a]);!n[i]&&t&&(n[i]=new t),Object.prototype.hasOwnProperty.call(n,i)?n=n[i]:n={},++a}return ge(n)?{}:{obj:n,k:pe(s[a])}},ye=(n,e,t)=>{const{obj:s,k:a}=_(n,e,Object);if(s!==void 0||e.length===1){s[a]=t;return}let i=e[e.length-1],r=e.slice(0,e.length-1),o=_(n,r,Object);for(;o.obj===void 0&&r.length;)i=`${r[r.length-1]}.${i}`,r=r.slice(0,r.length-1),o=_(n,r,Object),o!=null&&o.obj&&typeof o.obj[`${o.k}.${i}`]<"u"&&(o.obj=void 0);o.obj[`${o.k}.${i}`]=t},Ie=(n,e,t,s)=>{const{obj:a,k:i}=_(n,e,Object);a[i]=a[i]||[],a[i].push(t)},X=(n,e)=>{const{obj:t,k:s}=_(n,e);if(t&&Object.prototype.hasOwnProperty.call(t,s))return t[s]},Te=(n,e,t)=>{const s=X(n,t);return s!==void 0?s:X(e,t)},Pe=(n,e,t)=>{for(const s in e)s!=="__proto__"&&s!=="constructor"&&(s in n?y(n[s])||n[s]instanceof String||y(e[s])||e[s]instanceof String?t&&(n[s]=e[s]):Pe(n[s],e[s],t):n[s]=e[s]);return n},q=n=>n.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&");var qe={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;"};const De=n=>y(n)?n.replace(/[&<>"'\/]/g,e=>qe[e]):n;class Ue{constructor(e){this.capacity=e,this.regExpMap=new Map,this.regExpQueue=[]}getRegExp(e){const t=this.regExpMap.get(e);if(t!==void 0)return t;const s=new RegExp(e);return this.regExpQueue.length===this.capacity&&this.regExpMap.delete(this.regExpQueue.shift()),this.regExpMap.set(e,s),this.regExpQueue.push(e),s}}const Ke=[" ",",","?","!",";"],Be=new Ue(20),_e=(n,e,t)=>{e=e||"",t=t||"";const s=Ke.filter(r=>e.indexOf(r)<0&&t.indexOf(r)<0);if(s.length===0)return!0;const a=Be.getRegExp(`(${s.map(r=>r==="?"?"\\?":r).join("|")})`);let i=!a.test(n);if(!i){const r=n.indexOf(t);r>0&&!a.test(n.substring(0,r))&&(i=!0)}return i},re=(n,e,t=".")=>{if(!n)return;if(n[e])return Object.prototype.hasOwnProperty.call(n,e)?n[e]:void 0;const s=e.split(t);let a=n;for(let i=0;i<s.length;){if(!a||typeof a!="object")return;let r,o="";for(let l=i;l<s.length;++l)if(l!==i&&(o+=t),o+=s[l],r=a[o],r!==void 0){if(["string","number","boolean"].indexOf(typeof r)>-1&&l<s.length-1)continue;i+=l-i+1;break}a=r}return a},J=n=>n==null?void 0:n.replace("_","-"),Ze={type:"logger",log(n){this.output("log",n)},warn(n){this.output("warn",n)},error(n){this.output("error",n)},output(n,e){var t,s;(s=(t=console==null?void 0:console[n])==null?void 0:t.apply)==null||s.call(t,console,e)}};class Q{constructor(e,t={}){this.init(e,t)}init(e,t={}){this.prefix=t.prefix||"i18next:",this.logger=e||Ze,this.options=t,this.debug=t.debug}log(...e){return this.forward(e,"log","",!0)}warn(...e){return this.forward(e,"warn","",!0)}error(...e){return this.forward(e,"error","")}deprecate(...e){return this.forward(e,"warn","WARNING DEPRECATED: ",!0)}forward(e,t,s,a){return a&&!this.debug?null:(y(e[0])&&(e[0]=`${s}${this.prefix} ${e[0]}`),this.logger[t](e))}create(e){return new Q(this.logger,{prefix:`${this.prefix}:${e}:`,...this.options})}clone(e){return e=e||this.options,e.prefix=e.prefix||this.prefix,new Q(this.logger,e)}}var H=new Q;class te{constructor(){this.observers={}}on(e,t){return e.split(" ").forEach(s=>{this.observers[s]||(this.observers[s]=new Map);const a=this.observers[s].get(t)||0;this.observers[s].set(t,a+1)}),this}off(e,t){if(this.observers[e]){if(!t){delete this.observers[e];return}this.observers[e].delete(t)}}emit(e,...t){this.observers[e]&&Array.from(this.observers[e].entries()).forEach(([a,i])=>{for(let r=0;r<i;r++)a(...t)}),this.observers["*"]&&Array.from(this.observers["*"].entries()).forEach(([a,i])=>{for(let r=0;r<i;r++)a.apply(a,[e,...t])})}}class me extends te{constructor(e,t={ns:["translation"],defaultNS:"translation"}){super(),this.data=e||{},this.options=t,this.options.keySeparator===void 0&&(this.options.keySeparator="."),this.options.ignoreJSONStructure===void 0&&(this.options.ignoreJSONStructure=!0)}addNamespaces(e){this.options.ns.indexOf(e)<0&&this.options.ns.push(e)}removeNamespaces(e){const t=this.options.ns.indexOf(e);t>-1&&this.options.ns.splice(t,1)}getResource(e,t,s,a={}){var c,u;const i=a.keySeparator!==void 0?a.keySeparator:this.options.keySeparator,r=a.ignoreJSONStructure!==void 0?a.ignoreJSONStructure:this.options.ignoreJSONStructure;let o;e.indexOf(".")>-1?o=e.split("."):(o=[e,t],s&&(Array.isArray(s)?o.push(...s):y(s)&&i?o.push(...s.split(i)):o.push(s)));const l=X(this.data,o);return!l&&!t&&!s&&e.indexOf(".")>-1&&(e=o[0],t=o[1],s=o.slice(2).join(".")),l||!r||!y(s)?l:re((u=(c=this.data)==null?void 0:c[e])==null?void 0:u[t],s,i)}addResource(e,t,s,a,i={silent:!1}){const r=i.keySeparator!==void 0?i.keySeparator:this.options.keySeparator;let o=[e,t];s&&(o=o.concat(r?s.split(r):s)),e.indexOf(".")>-1&&(o=e.split("."),a=t,t=o[1]),this.addNamespaces(t),ye(this.data,o,a),i.silent||this.emit("added",e,t,s,a)}addResources(e,t,s,a={silent:!1}){for(const i in s)(y(s[i])||Array.isArray(s[i]))&&this.addResource(e,t,i,s[i],{silent:!0});a.silent||this.emit("added",e,t,s)}addResourceBundle(e,t,s,a,i,r={silent:!1,skipCopy:!1}){let o=[e,t];e.indexOf(".")>-1&&(o=e.split("."),a=s,s=t,t=o[1]),this.addNamespaces(t);let l=X(this.data,o)||{};r.skipCopy||(s=JSON.parse(JSON.stringify(s))),a?Pe(l,s,i):l={...l,...s},ye(this.data,o,l),r.silent||this.emit("added",e,t,s)}removeResourceBundle(e,t){this.hasResourceBundle(e,t)&&delete this.data[e][t],this.removeNamespaces(t),this.emit("removed",e,t)}hasResourceBundle(e,t){return this.getResource(e,t)!==void 0}getResourceBundle(e,t){return t||(t=this.options.defaultNS),this.getResource(e,t)}getDataByLanguage(e){return this.data[e]}hasLanguageSomeTranslations(e){const t=this.getDataByLanguage(e);return!!(t&&Object.keys(t)||[]).find(a=>t[a]&&Object.keys(t[a]).length>0)}toJSON(){return this.data}}var je={processors:{},addPostProcessor(n){this.processors[n.name]=n},handle(n,e,t,s,a){return n.forEach(i=>{var r;e=((r=this.processors[i])==null?void 0:r.process(e,t,s,a))??e}),e}};const Ne=Symbol("i18next/PATH_KEY");function Je(){const n=[],e=Object.create(null);let t;return e.get=(s,a)=>{var i;return(i=t==null?void 0:t.revoke)==null||i.call(t),a===Ne?n:(n.push(a),t=Proxy.revocable(s,e),t.proxy)},Proxy.revocable(Object.create(null),e).proxy}function oe(n,e){const{[Ne]:t}=n(Je());return t.join((e==null?void 0:e.keySeparator)??".")}const ke={},ae=n=>!y(n)&&typeof n!="boolean"&&typeof n!="number";class ee extends te{constructor(e,t={}){super(),Ve(["resourceStore","languageUtils","pluralResolver","interpolator","backendConnector","i18nFormat","utils"],e,this),this.options=t,this.options.keySeparator===void 0&&(this.options.keySeparator="."),this.logger=H.create("translator")}changeLanguage(e){e&&(this.language=e)}exists(e,t={interpolation:{}}){const s={...t};if(e==null)return!1;const a=this.resolve(e,s);if((a==null?void 0:a.res)===void 0)return!1;const i=ae(a.res);return!(s.returnObjects===!1&&i)}extractFromKey(e,t){let s=t.nsSeparator!==void 0?t.nsSeparator:this.options.nsSeparator;s===void 0&&(s=":");const a=t.keySeparator!==void 0?t.keySeparator:this.options.keySeparator;let i=t.ns||this.options.defaultNS||[];const r=s&&e.indexOf(s)>-1,o=!this.options.userDefinedKeySeparator&&!t.keySeparator&&!this.options.userDefinedNsSeparator&&!t.nsSeparator&&!_e(e,s,a);if(r&&!o){const l=e.match(this.interpolator.nestingRegexp);if(l&&l.length>0)return{key:e,namespaces:y(i)?[i]:i};const c=e.split(s);(s!==a||s===a&&this.options.ns.indexOf(c[0])>-1)&&(i=c.shift()),e=c.join(a)}return{key:e,namespaces:y(i)?[i]:i}}translate(e,t,s){let a=typeof t=="object"?{...t}:t;if(typeof a!="object"&&this.options.overloadTranslationOptionHandler&&(a=this.options.overloadTranslationOptionHandler(arguments)),typeof a=="object"&&(a={...a}),a||(a={}),e==null)return"";typeof e=="function"&&(e=oe(e,{...this.options,...a})),Array.isArray(e)||(e=[String(e)]);const i=a.returnDetails!==void 0?a.returnDetails:this.options.returnDetails,r=a.keySeparator!==void 0?a.keySeparator:this.options.keySeparator,{key:o,namespaces:l}=this.extractFromKey(e[e.length-1],a),c=l[l.length-1];let u=a.nsSeparator!==void 0?a.nsSeparator:this.options.nsSeparator;u===void 0&&(u=":");const d=a.lng||this.language,g=a.appendNamespaceToCIMode||this.options.appendNamespaceToCIMode;if((d==null?void 0:d.toLowerCase())==="cimode")return g?i?{res:`${c}${u}${o}`,usedKey:o,exactUsedKey:o,usedLng:d,usedNS:c,usedParams:this.getUsedParamsDetails(a)}:`${c}${u}${o}`:i?{res:o,usedKey:o,exactUsedKey:o,usedLng:d,usedNS:c,usedParams:this.getUsedParamsDetails(a)}:o;const p=this.resolve(e,a);let f=p==null?void 0:p.res;const x=(p==null?void 0:p.usedKey)||o,L=(p==null?void 0:p.exactUsedKey)||o,$=["[object Number]","[object Function]","[object RegExp]"],C=a.joinArrays!==void 0?a.joinArrays:this.options.joinArrays,R=!this.i18nFormat||this.i18nFormat.handleAsObject,S=a.count!==void 0&&!y(a.count),P=ee.hasDefaultValue(a),V=S?this.pluralResolver.getSuffix(d,a.count,a):"",z=a.ordinal&&S?this.pluralResolver.getSuffix(d,a.count,{ordinal:!1}):"",A=S&&!a.ordinal&&a.count===0,O=A&&a[`defaultValue${this.options.pluralSeparator}zero`]||a[`defaultValue${V}`]||a[`defaultValue${z}`]||a.defaultValue;let M=f;R&&!f&&P&&(M=O);const G=ae(M),v=Object.prototype.toString.apply(M);if(R&&M&&G&&$.indexOf(v)<0&&!(y(C)&&Array.isArray(M))){if(!a.returnObjects&&!this.options.returnObjects){this.options.returnedObjectHandler||this.logger.warn("accessing an object - but returnObjects options is not enabled!");const m=this.options.returnedObjectHandler?this.options.returnedObjectHandler(x,M,{...a,ns:l}):`key '${o} (${this.language})' returned an object instead of string.`;return i?(p.res=m,p.usedParams=this.getUsedParamsDetails(a),p):m}if(r){const m=Array.isArray(M),k=m?[]:{},b=m?L:x;for(const j in M)if(Object.prototype.hasOwnProperty.call(M,j)){const F=`${b}${r}${j}`;P&&!f?k[j]=this.translate(F,{...a,defaultValue:ae(O)?O[j]:void 0,joinArrays:!1,ns:l}):k[j]=this.translate(F,{...a,joinArrays:!1,ns:l}),k[j]===F&&(k[j]=M[j])}f=k}}else if(R&&y(C)&&Array.isArray(f))f=f.join(C),f&&(f=this.extendTranslation(f,e,a,s));else{let m=!1,k=!1;!this.isValidLookup(f)&&P&&(m=!0,f=O),this.isValidLookup(f)||(k=!0,f=o);const j=(a.missingKeyNoValueFallbackToKey||this.options.missingKeyNoValueFallbackToKey)&&k?void 0:f,F=P&&O!==f&&this.options.updateMissing;if(k||m||F){if(this.logger.log(F?"updateKey":"missingKey",d,c,o,F?O:f),r){const E=this.resolve(o,{...a,keySeparator:!1});E&&E.res&&this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.")}let I=[];const W=this.languageUtils.getFallbackCodes(this.options.fallbackLng,a.lng||this.language);if(this.options.saveMissingTo==="fallback"&&W&&W[0])for(let E=0;E<W.length;E++)I.push(W[E]);else this.options.saveMissingTo==="all"?I=this.languageUtils.toResolveHierarchy(a.lng||this.language):I.push(a.lng||this.language);const he=(E,T,K)=>{var ue;const de=P&&K!==f?K:j;this.options.missingKeyHandler?this.options.missingKeyHandler(E,c,T,de,F,a):(ue=this.backendConnector)!=null&&ue.saveMissing&&this.backendConnector.saveMissing(E,c,T,de,F,a),this.emit("missingKey",E,c,T,f)};this.options.saveMissing&&(this.options.saveMissingPlurals&&S?I.forEach(E=>{const T=this.pluralResolver.getSuffixes(E,a);A&&a[`defaultValue${this.options.pluralSeparator}zero`]&&T.indexOf(`${this.options.pluralSeparator}zero`)<0&&T.push(`${this.options.pluralSeparator}zero`),T.forEach(K=>{he([E],o+K,a[`defaultValue${K}`]||O)})}):he(I,o,O))}f=this.extendTranslation(f,e,a,p,s),k&&f===o&&this.options.appendNamespaceToMissingKey&&(f=`${c}${u}${o}`),(k||m)&&this.options.parseMissingKeyHandler&&(f=this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey?`${c}${u}${o}`:o,m?f:void 0,a))}return i?(p.res=f,p.usedParams=this.getUsedParamsDetails(a),p):f}extendTranslation(e,t,s,a,i){var l,c;if((l=this.i18nFormat)!=null&&l.parse)e=this.i18nFormat.parse(e,{...this.options.interpolation.defaultVariables,...s},s.lng||this.language||a.usedLng,a.usedNS,a.usedKey,{resolved:a});else if(!s.skipInterpolation){s.interpolation&&this.interpolator.init({...s,interpolation:{...this.options.interpolation,...s.interpolation}});const u=y(e)&&(((c=s==null?void 0:s.interpolation)==null?void 0:c.skipOnVariables)!==void 0?s.interpolation.skipOnVariables:this.options.interpolation.skipOnVariables);let d;if(u){const p=e.match(this.interpolator.nestingRegexp);d=p&&p.length}let g=s.replace&&!y(s.replace)?s.replace:s;if(this.options.interpolation.defaultVariables&&(g={...this.options.interpolation.defaultVariables,...g}),e=this.interpolator.interpolate(e,g,s.lng||this.language||a.usedLng,s),u){const p=e.match(this.interpolator.nestingRegexp),f=p&&p.length;d<f&&(s.nest=!1)}!s.lng&&a&&a.res&&(s.lng=this.language||a.usedLng),s.nest!==!1&&(e=this.interpolator.nest(e,(...p)=>(i==null?void 0:i[0])===p[0]&&!s.context?(this.logger.warn(`It seems you are nesting recursively key: ${p[0]} in key: ${t[0]}`),null):this.translate(...p,t),s)),s.interpolation&&this.interpolator.reset()}const r=s.postProcess||this.options.postProcess,o=y(r)?[r]:r;return e!=null&&(o!=null&&o.length)&&s.applyPostProcessor!==!1&&(e=je.handle(o,e,t,this.options&&this.options.postProcessPassResolved?{i18nResolved:{...a,usedParams:this.getUsedParamsDetails(s)},...s}:s,this)),e}resolve(e,t={}){let s,a,i,r,o;return y(e)&&(e=[e]),e.forEach(l=>{if(this.isValidLookup(s))return;const c=this.extractFromKey(l,t),u=c.key;a=u;let d=c.namespaces;this.options.fallbackNS&&(d=d.concat(this.options.fallbackNS));const g=t.count!==void 0&&!y(t.count),p=g&&!t.ordinal&&t.count===0,f=t.context!==void 0&&(y(t.context)||typeof t.context=="number")&&t.context!=="",x=t.lngs?t.lngs:this.languageUtils.toResolveHierarchy(t.lng||this.language,t.fallbackLng);d.forEach(L=>{var $,C;this.isValidLookup(s)||(o=L,!ke[`${x[0]}-${L}`]&&(($=this.utils)!=null&&$.hasLoadedNamespace)&&!((C=this.utils)!=null&&C.hasLoadedNamespace(o))&&(ke[`${x[0]}-${L}`]=!0,this.logger.warn(`key "${a}" for languages "${x.join(", ")}" won't get resolved as namespace "${o}" was not yet loaded`,"This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!")),x.forEach(R=>{var V;if(this.isValidLookup(s))return;r=R;const S=[u];if((V=this.i18nFormat)!=null&&V.addLookupKeys)this.i18nFormat.addLookupKeys(S,u,R,L,t);else{let z;g&&(z=this.pluralResolver.getSuffix(R,t.count,t));const A=`${this.options.pluralSeparator}zero`,O=`${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;if(g&&(t.ordinal&&z.indexOf(O)===0&&S.push(u+z.replace(O,this.options.pluralSeparator)),S.push(u+z),p&&S.push(u+A)),f){const M=`${u}${this.options.contextSeparator||"_"}${t.context}`;S.push(M),g&&(t.ordinal&&z.indexOf(O)===0&&S.push(M+z.replace(O,this.options.pluralSeparator)),S.push(M+z),p&&S.push(M+A))}}let P;for(;P=S.pop();)this.isValidLookup(s)||(i=P,s=this.getResource(R,L,P,t))}))})}),{res:s,usedKey:a,exactUsedKey:i,usedLng:r,usedNS:o}}isValidLookup(e){return e!==void 0&&!(!this.options.returnNull&&e===null)&&!(!this.options.returnEmptyString&&e==="")}getResource(e,t,s,a={}){var i;return(i=this.i18nFormat)!=null&&i.getResource?this.i18nFormat.getResource(e,t,s,a):this.resourceStore.getResource(e,t,s,a)}getUsedParamsDetails(e={}){const t=["defaultValue","ordinal","context","replace","lng","lngs","fallbackLng","ns","keySeparator","nsSeparator","returnObjects","returnDetails","joinArrays","postProcess","interpolation"],s=e.replace&&!y(e.replace);let a=s?e.replace:e;if(s&&typeof e.count<"u"&&(a.count=e.count),this.options.interpolation.defaultVariables&&(a={...this.options.interpolation.defaultVariables,...a}),!s){a={...a};for(const i of t)delete a[i]}return a}static hasDefaultValue(e){const t="defaultValue";for(const s in e)if(Object.prototype.hasOwnProperty.call(e,s)&&t===s.substring(0,t.length)&&e[s]!==void 0)return!0;return!1}}class xe{constructor(e){this.options=e,this.supportedLngs=this.options.supportedLngs||!1,this.logger=H.create("languageUtils")}getScriptPartFromCode(e){if(e=J(e),!e||e.indexOf("-")<0)return null;const t=e.split("-");return t.length===2||(t.pop(),t[t.length-1].toLowerCase()==="x")?null:this.formatLanguageCode(t.join("-"))}getLanguagePartFromCode(e){if(e=J(e),!e||e.indexOf("-")<0)return e;const t=e.split("-");return this.formatLanguageCode(t[0])}formatLanguageCode(e){if(y(e)&&e.indexOf("-")>-1){let t;try{t=Intl.getCanonicalLocales(e)[0]}catch{}return t&&this.options.lowerCaseLng&&(t=t.toLowerCase()),t||(this.options.lowerCaseLng?e.toLowerCase():e)}return this.options.cleanCode||this.options.lowerCaseLng?e.toLowerCase():e}isSupportedCode(e){return(this.options.load==="languageOnly"||this.options.nonExplicitSupportedLngs)&&(e=this.getLanguagePartFromCode(e)),!this.supportedLngs||!this.supportedLngs.length||this.supportedLngs.indexOf(e)>-1}getBestMatchFromCodes(e){if(!e)return null;let t;return e.forEach(s=>{if(t)return;const a=this.formatLanguageCode(s);(!this.options.supportedLngs||this.isSupportedCode(a))&&(t=a)}),!t&&this.options.supportedLngs&&e.forEach(s=>{if(t)return;const a=this.getScriptPartFromCode(s);if(this.isSupportedCode(a))return t=a;const i=this.getLanguagePartFromCode(s);if(this.isSupportedCode(i))return t=i;t=this.options.supportedLngs.find(r=>{if(r===i)return r;if(!(r.indexOf("-")<0&&i.indexOf("-")<0)&&(r.indexOf("-")>0&&i.indexOf("-")<0&&r.substring(0,r.indexOf("-"))===i||r.indexOf(i)===0&&i.length>1))return r})}),t||(t=this.getFallbackCodes(this.options.fallbackLng)[0]),t}getFallbackCodes(e,t){if(!e)return[];if(typeof e=="function"&&(e=e(t)),y(e)&&(e=[e]),Array.isArray(e))return e;if(!t)return e.default||[];let s=e[t];return s||(s=e[this.getScriptPartFromCode(t)]),s||(s=e[this.formatLanguageCode(t)]),s||(s=e[this.getLanguagePartFromCode(t)]),s||(s=e.default),s||[]}toResolveHierarchy(e,t){const s=this.getFallbackCodes((t===!1?[]:t)||this.options.fallbackLng||[],e),a=[],i=r=>{r&&(this.isSupportedCode(r)?a.push(r):this.logger.warn(`rejecting language code not found in supportedLngs: ${r}`))};return y(e)&&(e.indexOf("-")>-1||e.indexOf("_")>-1)?(this.options.load!=="languageOnly"&&i(this.formatLanguageCode(e)),this.options.load!=="languageOnly"&&this.options.load!=="currentOnly"&&i(this.getScriptPartFromCode(e)),this.options.load!=="currentOnly"&&i(this.getLanguagePartFromCode(e))):y(e)&&i(this.formatLanguageCode(e)),s.forEach(r=>{a.indexOf(r)<0&&i(this.formatLanguageCode(r))}),a}}const ve={zero:0,one:1,two:2,few:3,many:4,other:5},Se={select:n=>n===1?"one":"other",resolvedOptions:()=>({pluralCategories:["one","other"]})};class Ge{constructor(e,t={}){this.languageUtils=e,this.options=t,this.logger=H.create("pluralResolver"),this.pluralRulesCache={}}clearCache(){this.pluralRulesCache={}}getRule(e,t={}){const s=J(e==="dev"?"en":e),a=t.ordinal?"ordinal":"cardinal",i=JSON.stringify({cleanedCode:s,type:a});if(i in this.pluralRulesCache)return this.pluralRulesCache[i];let r;try{r=new Intl.PluralRules(s,{type:a})}catch{if(typeof Intl>"u")return this.logger.error("No Intl support, please use an Intl polyfill!"),Se;if(!e.match(/-|_/))return Se;const l=this.languageUtils.getLanguagePartFromCode(e);r=this.getRule(l,t)}return this.pluralRulesCache[i]=r,r}needsPlural(e,t={}){let s=this.getRule(e,t);return s||(s=this.getRule("dev",t)),(s==null?void 0:s.resolvedOptions().pluralCategories.length)>1}getPluralFormsOfKey(e,t,s={}){return this.getSuffixes(e,s).map(a=>`${t}${a}`)}getSuffixes(e,t={}){let s=this.getRule(e,t);return s||(s=this.getRule("dev",t)),s?s.resolvedOptions().pluralCategories.sort((a,i)=>ve[a]-ve[i]).map(a=>`${this.options.prepend}${t.ordinal?`ordinal${this.options.prepend}`:""}${a}`):[]}getSuffix(e,t,s={}){const a=this.getRule(e,s);return a?`${this.options.prepend}${s.ordinal?`ordinal${this.options.prepend}`:""}${a.select(t)}`:(this.logger.warn(`no plural rule found for: ${e}`),this.getSuffix("dev",t,s))}}const Me=(n,e,t,s=".",a=!0)=>{let i=Te(n,e,t);return!i&&a&&y(t)&&(i=re(n,t,s),i===void 0&&(i=re(e,t,s))),i},se=n=>n.replace(/\$/g,"$$$$");class be{constructor(e={}){var t;this.logger=H.create("interpolator"),this.options=e,this.format=((t=e==null?void 0:e.interpolation)==null?void 0:t.format)||(s=>s),this.init(e)}init(e={}){e.interpolation||(e.interpolation={escapeValue:!0});const{escape:t,escapeValue:s,useRawValueToEscape:a,prefix:i,prefixEscaped:r,suffix:o,suffixEscaped:l,formatSeparator:c,unescapeSuffix:u,unescapePrefix:d,nestingPrefix:g,nestingPrefixEscaped:p,nestingSuffix:f,nestingSuffixEscaped:x,nestingOptionsSeparator:L,maxReplaces:$,alwaysFormat:C}=e.interpolation;this.escape=t!==void 0?t:De,this.escapeValue=s!==void 0?s:!0,this.useRawValueToEscape=a!==void 0?a:!1,this.prefix=i?q(i):r||"{{",this.suffix=o?q(o):l||"}}",this.formatSeparator=c||",",this.unescapePrefix=u?"":d||"-",this.unescapeSuffix=this.unescapePrefix?"":u||"",this.nestingPrefix=g?q(g):p||q("$t("),this.nestingSuffix=f?q(f):x||q(")"),this.nestingOptionsSeparator=L||",",this.maxReplaces=$||1e3,this.alwaysFormat=C!==void 0?C:!1,this.resetRegExp()}reset(){this.options&&this.init(this.options)}resetRegExp(){const e=(t,s)=>(t==null?void 0:t.source)===s?(t.lastIndex=0,t):new RegExp(s,"g");this.regexp=e(this.regexp,`${this.prefix}(.+?)${this.suffix}`),this.regexpUnescape=e(this.regexpUnescape,`${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`),this.nestingRegexp=e(this.nestingRegexp,`${this.nestingPrefix}((?:[^()"']+|"[^"]*"|'[^']*'|\\((?:[^()]|"[^"]*"|'[^']*')*\\))*?)${this.nestingSuffix}`)}interpolate(e,t,s,a){var p;let i,r,o;const l=this.options&&this.options.interpolation&&this.options.interpolation.defaultVariables||{},c=f=>{if(f.indexOf(this.formatSeparator)<0){const C=Me(t,l,f,this.options.keySeparator,this.options.ignoreJSONStructure);return this.alwaysFormat?this.format(C,void 0,s,{...a,...t,interpolationkey:f}):C}const x=f.split(this.formatSeparator),L=x.shift().trim(),$=x.join(this.formatSeparator).trim();return this.format(Me(t,l,L,this.options.keySeparator,this.options.ignoreJSONStructure),$,s,{...a,...t,interpolationkey:L})};this.resetRegExp();const u=(a==null?void 0:a.missingInterpolationHandler)||this.options.missingInterpolationHandler,d=((p=a==null?void 0:a.interpolation)==null?void 0:p.skipOnVariables)!==void 0?a.interpolation.skipOnVariables:this.options.interpolation.skipOnVariables;return[{regex:this.regexpUnescape,safeValue:f=>se(f)},{regex:this.regexp,safeValue:f=>this.escapeValue?se(this.escape(f)):se(f)}].forEach(f=>{for(o=0;i=f.regex.exec(e);){const x=i[1].trim();if(r=c(x),r===void 0)if(typeof u=="function"){const $=u(e,i,a);r=y($)?$:""}else if(a&&Object.prototype.hasOwnProperty.call(a,x))r="";else if(d){r=i[0];continue}else this.logger.warn(`missed to pass in variable ${x} for interpolating ${e}`),r="";else!y(r)&&!this.useRawValueToEscape&&(r=fe(r));const L=f.safeValue(r);if(e=e.replace(i[0],L),d?(f.regex.lastIndex+=r.length,f.regex.lastIndex-=i[0].length):f.regex.lastIndex=0,o++,o>=this.maxReplaces)break}}),e}nest(e,t,s={}){let a,i,r;const o=(l,c)=>{const u=this.nestingOptionsSeparator;if(l.indexOf(u)<0)return l;const d=l.split(new RegExp(`${q(u)}[ ]*{`));let g=`{${d[1]}`;l=d[0],g=this.interpolate(g,r);const p=g.match(/'/g),f=g.match(/"/g);(((p==null?void 0:p.length)??0)%2===0&&!f||((f==null?void 0:f.length)??0)%2!==0)&&(g=g.replace(/'/g,'"'));try{r=JSON.parse(g),c&&(r={...c,...r})}catch(x){return this.logger.warn(`failed parsing options string in nesting for key ${l}`,x),`${l}${u}${g}`}return r.defaultValue&&r.defaultValue.indexOf(this.prefix)>-1&&delete r.defaultValue,l};for(;a=this.nestingRegexp.exec(e);){let l=[];r={...s},r=r.replace&&!y(r.replace)?r.replace:r,r.applyPostProcessor=!1,delete r.defaultValue;const c=/{.*}/.test(a[1])?a[1].lastIndexOf("}")+1:a[1].indexOf(this.formatSeparator);if(c!==-1&&(l=a[1].slice(c).split(this.formatSeparator).map(u=>u.trim()).filter(Boolean),a[1]=a[1].slice(0,c)),i=t(o.call(this,a[1].trim(),r),r),i&&a[0]===e&&!y(i))return i;y(i)||(i=fe(i)),i||(this.logger.warn(`missed to resolve ${a[1]} for nesting ${e}`),i=""),l.length&&(i=l.reduce((u,d)=>this.format(u,d,s.lng,{...s,interpolationkey:a[1].trim()}),i.trim())),e=e.replace(a[0],i),this.regexp.lastIndex=0}return e}}const We=n=>{let e=n.toLowerCase().trim();const t={};if(n.indexOf("(")>-1){const s=n.split("(");e=s[0].toLowerCase().trim();const a=s[1].substring(0,s[1].length-1);e==="currency"&&a.indexOf(":")<0?t.currency||(t.currency=a.trim()):e==="relativetime"&&a.indexOf(":")<0?t.range||(t.range=a.trim()):a.split(";").forEach(r=>{if(r){const[o,...l]=r.split(":"),c=l.join(":").trim().replace(/^'+|'+$/g,""),u=o.trim();t[u]||(t[u]=c),c==="false"&&(t[u]=!1),c==="true"&&(t[u]=!0),isNaN(c)||(t[u]=parseInt(c,10))}})}return{formatName:e,formatOptions:t}},Le=n=>{const e={};return(t,s,a)=>{let i=a;a&&a.interpolationkey&&a.formatParams&&a.formatParams[a.interpolationkey]&&a[a.interpolationkey]&&(i={...i,[a.interpolationkey]:void 0});const r=s+JSON.stringify(i);let o=e[r];return o||(o=n(J(s),a),e[r]=o),o(t)}},Ye=n=>(e,t,s)=>n(J(t),s)(e);class Xe{constructor(e={}){this.logger=H.create("formatter"),this.options=e,this.init(e)}init(e,t={interpolation:{}}){this.formatSeparator=t.interpolation.formatSeparator||",";const s=t.cacheInBuiltFormats?Le:Ye;this.formats={number:s((a,i)=>{const r=new Intl.NumberFormat(a,{...i});return o=>r.format(o)}),currency:s((a,i)=>{const r=new Intl.NumberFormat(a,{...i,style:"currency"});return o=>r.format(o)}),datetime:s((a,i)=>{const r=new Intl.DateTimeFormat(a,{...i});return o=>r.format(o)}),relativetime:s((a,i)=>{const r=new Intl.RelativeTimeFormat(a,{...i});return o=>r.format(o,i.range||"day")}),list:s((a,i)=>{const r=new Intl.ListFormat(a,{...i});return o=>r.format(o)})}}add(e,t){this.formats[e.toLowerCase().trim()]=t}addCached(e,t){this.formats[e.toLowerCase().trim()]=Le(t)}format(e,t,s,a={}){const i=t.split(this.formatSeparator);if(i.length>1&&i[0].indexOf("(")>1&&i[0].indexOf(")")<0&&i.find(o=>o.indexOf(")")>-1)){const o=i.findIndex(l=>l.indexOf(")")>-1);i[0]=[i[0],...i.splice(1,o)].join(this.formatSeparator)}return i.reduce((o,l)=>{var d;const{formatName:c,formatOptions:u}=We(l);if(this.formats[c]){let g=o;try{const p=((d=a==null?void 0:a.formatParams)==null?void 0:d[a.interpolationkey])||{},f=p.locale||p.lng||a.locale||a.lng||s;g=this.formats[c](o,f,{...u,...a,...p})}catch(p){this.logger.warn(p)}return g}else this.logger.warn(`there was no format function for ${c}`);return o},e)}}const Qe=(n,e)=>{n.pending[e]!==void 0&&(delete n.pending[e],n.pendingCount--)};class et extends te{constructor(e,t,s,a={}){var i,r;super(),this.backend=e,this.store=t,this.services=s,this.languageUtils=s.languageUtils,this.options=a,this.logger=H.create("backendConnector"),this.waitingReads=[],this.maxParallelReads=a.maxParallelReads||10,this.readingCalls=0,this.maxRetries=a.maxRetries>=0?a.maxRetries:5,this.retryTimeout=a.retryTimeout>=1?a.retryTimeout:350,this.state={},this.queue=[],(r=(i=this.backend)==null?void 0:i.init)==null||r.call(i,s,a.backend,a)}queueLoad(e,t,s,a){const i={},r={},o={},l={};return e.forEach(c=>{let u=!0;t.forEach(d=>{const g=`${c}|${d}`;!s.reload&&this.store.hasResourceBundle(c,d)?this.state[g]=2:this.state[g]<0||(this.state[g]===1?r[g]===void 0&&(r[g]=!0):(this.state[g]=1,u=!1,r[g]===void 0&&(r[g]=!0),i[g]===void 0&&(i[g]=!0),l[d]===void 0&&(l[d]=!0)))}),u||(o[c]=!0)}),(Object.keys(i).length||Object.keys(r).length)&&this.queue.push({pending:r,pendingCount:Object.keys(r).length,loaded:{},errors:[],callback:a}),{toLoad:Object.keys(i),pending:Object.keys(r),toLoadLanguages:Object.keys(o),toLoadNamespaces:Object.keys(l)}}loaded(e,t,s){const a=e.split("|"),i=a[0],r=a[1];t&&this.emit("failedLoading",i,r,t),!t&&s&&this.store.addResourceBundle(i,r,s,void 0,void 0,{skipCopy:!0}),this.state[e]=t?-1:2,t&&s&&(this.state[e]=0);const o={};this.queue.forEach(l=>{Ie(l.loaded,[i],r),Qe(l,e),t&&l.errors.push(t),l.pendingCount===0&&!l.done&&(Object.keys(l.loaded).forEach(c=>{o[c]||(o[c]={});const u=l.loaded[c];u.length&&u.forEach(d=>{o[c][d]===void 0&&(o[c][d]=!0)})}),l.done=!0,l.errors.length?l.callback(l.errors):l.callback())}),this.emit("loaded",o),this.queue=this.queue.filter(l=>!l.done)}read(e,t,s,a=0,i=this.retryTimeout,r){if(!e.length)return r(null,{});if(this.readingCalls>=this.maxParallelReads){this.waitingReads.push({lng:e,ns:t,fcName:s,tried:a,wait:i,callback:r});return}this.readingCalls++;const o=(c,u)=>{if(this.readingCalls--,this.waitingReads.length>0){const d=this.waitingReads.shift();this.read(d.lng,d.ns,d.fcName,d.tried,d.wait,d.callback)}if(c&&u&&a<this.maxRetries){setTimeout(()=>{this.read.call(this,e,t,s,a+1,i*2,r)},i);return}r(c,u)},l=this.backend[s].bind(this.backend);if(l.length===2){try{const c=l(e,t);c&&typeof c.then=="function"?c.then(u=>o(null,u)).catch(o):o(null,c)}catch(c){o(c)}return}return l(e,t,o)}prepareLoading(e,t,s={},a){if(!this.backend)return this.logger.warn("No backend was added via i18next.use. Will not load resources."),a&&a();y(e)&&(e=this.languageUtils.toResolveHierarchy(e)),y(t)&&(t=[t]);const i=this.queueLoad(e,t,s,a);if(!i.toLoad.length)return i.pending.length||a(),null;i.toLoad.forEach(r=>{this.loadOne(r)})}load(e,t,s){this.prepareLoading(e,t,{},s)}reload(e,t,s){this.prepareLoading(e,t,{reload:!0},s)}loadOne(e,t=""){const s=e.split("|"),a=s[0],i=s[1];this.read(a,i,"read",void 0,void 0,(r,o)=>{r&&this.logger.warn(`${t}loading namespace ${i} for language ${a} failed`,r),!r&&o&&this.logger.log(`${t}loaded namespace ${i} for language ${a}`,o),this.loaded(e,r,o)})}saveMissing(e,t,s,a,i,r={},o=()=>{}){var l,c,u,d,g;if((c=(l=this.services)==null?void 0:l.utils)!=null&&c.hasLoadedNamespace&&!((d=(u=this.services)==null?void 0:u.utils)!=null&&d.hasLoadedNamespace(t))){this.logger.warn(`did not save key "${s}" as the namespace "${t}" was not yet loaded`,"This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");return}if(!(s==null||s==="")){if((g=this.backend)!=null&&g.create){const p={...r,isUpdate:i},f=this.backend.create.bind(this.backend);if(f.length<6)try{let x;f.length===5?x=f(e,t,s,a,p):x=f(e,t,s,a),x&&typeof x.then=="function"?x.then(L=>o(null,L)).catch(o):o(null,x)}catch(x){o(x)}else f(e,t,s,a,o,p)}!e||!e[0]||this.store.addResource(e[0],t,s,a)}}}const ie=()=>({debug:!1,initAsync:!0,ns:["translation"],defaultNS:["translation"],fallbackLng:["dev"],fallbackNS:!1,supportedLngs:!1,nonExplicitSupportedLngs:!1,load:"all",preload:!1,simplifyPluralSuffix:!0,keySeparator:".",nsSeparator:":",pluralSeparator:"_",contextSeparator:"_",partialBundledLanguages:!1,saveMissing:!1,updateMissing:!1,saveMissingTo:"fallback",saveMissingPlurals:!0,missingKeyHandler:!1,missingInterpolationHandler:!1,postProcess:!1,postProcessPassResolved:!1,returnNull:!1,returnEmptyString:!0,returnObjects:!1,joinArrays:!1,returnedObjectHandler:!1,parseMissingKeyHandler:!1,appendNamespaceToMissingKey:!1,appendNamespaceToCIMode:!1,overloadTranslationOptionHandler:n=>{let e={};if(typeof n[1]=="object"&&(e=n[1]),y(n[1])&&(e.defaultValue=n[1]),y(n[2])&&(e.tDescription=n[2]),typeof n[2]=="object"||typeof n[3]=="object"){const t=n[3]||n[2];Object.keys(t).forEach(s=>{e[s]=t[s]})}return e},interpolation:{escapeValue:!0,format:n=>n,prefix:"{{",suffix:"}}",formatSeparator:",",unescapePrefix:"-",nestingPrefix:"$t(",nestingSuffix:")",nestingOptionsSeparator:",",maxReplaces:1e3,skipOnVariables:!0},cacheInBuiltFormats:!0}),we=n=>{var e,t;return y(n.ns)&&(n.ns=[n.ns]),y(n.fallbackLng)&&(n.fallbackLng=[n.fallbackLng]),y(n.fallbackNS)&&(n.fallbackNS=[n.fallbackNS]),((t=(e=n.supportedLngs)==null?void 0:e.indexOf)==null?void 0:t.call(e,"cimode"))<0&&(n.supportedLngs=n.supportedLngs.concat(["cimode"])),typeof n.initImmediate=="boolean"&&(n.initAsync=n.initImmediate),n},Y=()=>{},tt=n=>{Object.getOwnPropertyNames(Object.getPrototypeOf(n)).forEach(t=>{typeof n[t]=="function"&&(n[t]=n[t].bind(n))})};let Ce=!1;const at=n=>{var e,t,s,a,i,r,o,l,c;return!!(((s=(t=(e=n==null?void 0:n.modules)==null?void 0:e.backend)==null?void 0:t.name)==null?void 0:s.indexOf("Locize"))>0||((o=(r=(i=(a=n==null?void 0:n.modules)==null?void 0:a.backend)==null?void 0:i.constructor)==null?void 0:r.name)==null?void 0:o.indexOf("Locize"))>0||(c=(l=n==null?void 0:n.options)==null?void 0:l.backend)!=null&&c.backends&&n.options.backend.backends.some(u=>{var d,g,p;return((d=u==null?void 0:u.name)==null?void 0:d.indexOf("Locize"))>0||((p=(g=u==null?void 0:u.constructor)==null?void 0:g.name)==null?void 0:p.indexOf("Locize"))>0}))};class Z extends te{constructor(e={},t){if(super(),this.options=we(e),this.services={},this.logger=H,this.modules={external:[]},tt(this),t&&!this.isInitialized&&!e.isClone){if(!this.options.initAsync)return this.init(e,t),this;setTimeout(()=>{this.init(e,t)},0)}}init(e={},t){this.isInitializing=!0,typeof e=="function"&&(t=e,e={}),e.defaultNS==null&&e.ns&&(y(e.ns)?e.defaultNS=e.ns:e.ns.indexOf("translation")<0&&(e.defaultNS=e.ns[0]));const s=ie();this.options={...s,...this.options,...we(e)},this.options.interpolation={...s.interpolation,...this.options.interpolation},e.keySeparator!==void 0&&(this.options.userDefinedKeySeparator=e.keySeparator),e.nsSeparator!==void 0&&(this.options.userDefinedNsSeparator=e.nsSeparator),typeof this.options.overloadTranslationOptionHandler!="function"&&(this.options.overloadTranslationOptionHandler=s.overloadTranslationOptionHandler),this.options.showSupportNotice!==!1&&!at(this)&&!Ce&&(typeof console<"u"&&typeof console.info<"u"&&console.info("🌐 i18next is maintained with support from Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙"),Ce=!0);const a=c=>c?typeof c=="function"?new c:c:null;if(!this.options.isClone){this.modules.logger?H.init(a(this.modules.logger),this.options):H.init(null,this.options);let c;this.modules.formatter?c=this.modules.formatter:c=Xe;const u=new xe(this.options);this.store=new me(this.options.resources,this.options);const d=this.services;d.logger=H,d.resourceStore=this.store,d.languageUtils=u,d.pluralResolver=new Ge(u,{prepend:this.options.pluralSeparator,simplifyPluralSuffix:this.options.simplifyPluralSuffix}),this.options.interpolation.format&&this.options.interpolation.format!==s.interpolation.format&&this.logger.deprecate("init: you are still using the legacy format function, please use the new approach: https://www.i18next.com/translation-function/formatting"),c&&(!this.options.interpolation.format||this.options.interpolation.format===s.interpolation.format)&&(d.formatter=a(c),d.formatter.init&&d.formatter.init(d,this.options),this.options.interpolation.format=d.formatter.format.bind(d.formatter)),d.interpolator=new be(this.options),d.utils={hasLoadedNamespace:this.hasLoadedNamespace.bind(this)},d.backendConnector=new et(a(this.modules.backend),d.resourceStore,d,this.options),d.backendConnector.on("*",(p,...f)=>{this.emit(p,...f)}),this.modules.languageDetector&&(d.languageDetector=a(this.modules.languageDetector),d.languageDetector.init&&d.languageDetector.init(d,this.options.detection,this.options)),this.modules.i18nFormat&&(d.i18nFormat=a(this.modules.i18nFormat),d.i18nFormat.init&&d.i18nFormat.init(this)),this.translator=new ee(this.services,this.options),this.translator.on("*",(p,...f)=>{this.emit(p,...f)}),this.modules.external.forEach(p=>{p.init&&p.init(this)})}if(this.format=this.options.interpolation.format,t||(t=Y),this.options.fallbackLng&&!this.services.languageDetector&&!this.options.lng){const c=this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);c.length>0&&c[0]!=="dev"&&(this.options.lng=c[0])}!this.services.languageDetector&&!this.options.lng&&this.logger.warn("init: no languageDetector is used and no lng is defined"),["getResource","hasResourceBundle","getResourceBundle","getDataByLanguage"].forEach(c=>{this[c]=(...u)=>this.store[c](...u)}),["addResource","addResources","addResourceBundle","removeResourceBundle"].forEach(c=>{this[c]=(...u)=>(this.store[c](...u),this)});const o=B(),l=()=>{const c=(u,d)=>{this.isInitializing=!1,this.isInitialized&&!this.initializedStoreOnce&&this.logger.warn("init: i18next is already initialized. You should call init just once!"),this.isInitialized=!0,this.options.isClone||this.logger.log("initialized",this.options),this.emit("initialized",this.options),o.resolve(d),t(u,d)};if(this.languages&&!this.isInitialized)return c(null,this.t.bind(this));this.changeLanguage(this.options.lng,c)};return this.options.resources||!this.options.initAsync?l():setTimeout(l,0),o}loadResources(e,t=Y){var i,r;let s=t;const a=y(e)?e:this.language;if(typeof e=="function"&&(s=e),!this.options.resources||this.options.partialBundledLanguages){if((a==null?void 0:a.toLowerCase())==="cimode"&&(!this.options.preload||this.options.preload.length===0))return s();const o=[],l=c=>{if(!c||c==="cimode")return;this.services.languageUtils.toResolveHierarchy(c).forEach(d=>{d!=="cimode"&&o.indexOf(d)<0&&o.push(d)})};a?l(a):this.services.languageUtils.getFallbackCodes(this.options.fallbackLng).forEach(u=>l(u)),(r=(i=this.options.preload)==null?void 0:i.forEach)==null||r.call(i,c=>l(c)),this.services.backendConnector.load(o,this.options.ns,c=>{!c&&!this.resolvedLanguage&&this.language&&this.setResolvedLanguage(this.language),s(c)})}else s(null)}reloadResources(e,t,s){const a=B();return typeof e=="function"&&(s=e,e=void 0),typeof t=="function"&&(s=t,t=void 0),e||(e=this.languages),t||(t=this.options.ns),s||(s=Y),this.services.backendConnector.reload(e,t,i=>{a.resolve(),s(i)}),a}use(e){if(!e)throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");if(!e.type)throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");return e.type==="backend"&&(this.modules.backend=e),(e.type==="logger"||e.log&&e.warn&&e.error)&&(this.modules.logger=e),e.type==="languageDetector"&&(this.modules.languageDetector=e),e.type==="i18nFormat"&&(this.modules.i18nFormat=e),e.type==="postProcessor"&&je.addPostProcessor(e),e.type==="formatter"&&(this.modules.formatter=e),e.type==="3rdParty"&&this.modules.external.push(e),this}setResolvedLanguage(e){if(!(!e||!this.languages)&&!(["cimode","dev"].indexOf(e)>-1)){for(let t=0;t<this.languages.length;t++){const s=this.languages[t];if(!(["cimode","dev"].indexOf(s)>-1)&&this.store.hasLanguageSomeTranslations(s)){this.resolvedLanguage=s;break}}!this.resolvedLanguage&&this.languages.indexOf(e)<0&&this.store.hasLanguageSomeTranslations(e)&&(this.resolvedLanguage=e,this.languages.unshift(e))}}changeLanguage(e,t){this.isLanguageChangingTo=e;const s=B();this.emit("languageChanging",e);const a=o=>{this.language=o,this.languages=this.services.languageUtils.toResolveHierarchy(o),this.resolvedLanguage=void 0,this.setResolvedLanguage(o)},i=(o,l)=>{l?this.isLanguageChangingTo===e&&(a(l),this.translator.changeLanguage(l),this.isLanguageChangingTo=void 0,this.emit("languageChanged",l),this.logger.log("languageChanged",l)):this.isLanguageChangingTo=void 0,s.resolve((...c)=>this.t(...c)),t&&t(o,(...c)=>this.t(...c))},r=o=>{var u,d;!e&&!o&&this.services.languageDetector&&(o=[]);const l=y(o)?o:o&&o[0],c=this.store.hasLanguageSomeTranslations(l)?l:this.services.languageUtils.getBestMatchFromCodes(y(o)?[o]:o);c&&(this.language||a(c),this.translator.language||this.translator.changeLanguage(c),(d=(u=this.services.languageDetector)==null?void 0:u.cacheUserLanguage)==null||d.call(u,c)),this.loadResources(c,g=>{i(g,c)})};return!e&&this.services.languageDetector&&!this.services.languageDetector.async?r(this.services.languageDetector.detect()):!e&&this.services.languageDetector&&this.services.languageDetector.async?this.services.languageDetector.detect.length===0?this.services.languageDetector.detect().then(r):this.services.languageDetector.detect(r):r(e),s}getFixedT(e,t,s){const a=(i,r,...o)=>{let l;typeof r!="object"?l=this.options.overloadTranslationOptionHandler([i,r].concat(o)):l={...r},l.lng=l.lng||a.lng,l.lngs=l.lngs||a.lngs,l.ns=l.ns||a.ns,l.keyPrefix!==""&&(l.keyPrefix=l.keyPrefix||s||a.keyPrefix);const c=this.options.keySeparator||".";let u;return l.keyPrefix&&Array.isArray(i)?u=i.map(d=>(typeof d=="function"&&(d=oe(d,{...this.options,...r})),`${l.keyPrefix}${c}${d}`)):(typeof i=="function"&&(i=oe(i,{...this.options,...r})),u=l.keyPrefix?`${l.keyPrefix}${c}${i}`:i),this.t(u,l)};return y(e)?a.lng=e:a.lngs=e,a.ns=t,a.keyPrefix=s,a}t(...e){var t;return(t=this.translator)==null?void 0:t.translate(...e)}exists(...e){var t;return(t=this.translator)==null?void 0:t.exists(...e)}setDefaultNamespace(e){this.options.defaultNS=e}hasLoadedNamespace(e,t={}){if(!this.isInitialized)return this.logger.warn("hasLoadedNamespace: i18next was not initialized",this.languages),!1;if(!this.languages||!this.languages.length)return this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty",this.languages),!1;const s=t.lng||this.resolvedLanguage||this.languages[0],a=this.options?this.options.fallbackLng:!1,i=this.languages[this.languages.length-1];if(s.toLowerCase()==="cimode")return!0;const r=(o,l)=>{const c=this.services.backendConnector.state[`${o}|${l}`];return c===-1||c===0||c===2};if(t.precheck){const o=t.precheck(this,r);if(o!==void 0)return o}return!!(this.hasResourceBundle(s,e)||!this.services.backendConnector.backend||this.options.resources&&!this.options.partialBundledLanguages||r(s,e)&&(!a||r(i,e)))}loadNamespaces(e,t){const s=B();return this.options.ns?(y(e)&&(e=[e]),e.forEach(a=>{this.options.ns.indexOf(a)<0&&this.options.ns.push(a)}),this.loadResources(a=>{s.resolve(),t&&t(a)}),s):(t&&t(),Promise.resolve())}loadLanguages(e,t){const s=B();y(e)&&(e=[e]);const a=this.options.preload||[],i=e.filter(r=>a.indexOf(r)<0&&this.services.languageUtils.isSupportedCode(r));return i.length?(this.options.preload=a.concat(i),this.loadResources(r=>{s.resolve(),t&&t(r)}),s):(t&&t(),Promise.resolve())}dir(e){var a,i;if(e||(e=this.resolvedLanguage||(((a=this.languages)==null?void 0:a.length)>0?this.languages[0]:this.language)),!e)return"rtl";try{const r=new Intl.Locale(e);if(r&&r.getTextInfo){const o=r.getTextInfo();if(o&&o.direction)return o.direction}}catch{}const t=["ar","shu","sqr","ssh","xaa","yhd","yud","aao","abh","abv","acm","acq","acw","acx","acy","adf","ads","aeb","aec","afb","ajp","apc","apd","arb","arq","ars","ary","arz","auz","avl","ayh","ayl","ayn","ayp","bbz","pga","he","iw","ps","pbt","pbu","pst","prp","prd","ug","ur","ydd","yds","yih","ji","yi","hbo","men","xmn","fa","jpr","peo","pes","prs","dv","sam","ckb"],s=((i=this.services)==null?void 0:i.languageUtils)||new xe(ie());return e.toLowerCase().indexOf("-latn")>1?"ltr":t.indexOf(s.getLanguagePartFromCode(e))>-1||e.toLowerCase().indexOf("-arab")>1?"rtl":"ltr"}static createInstance(e={},t){const s=new Z(e,t);return s.createInstance=Z.createInstance,s}cloneInstance(e={},t=Y){const s=e.forkResourceStore;s&&delete e.forkResourceStore;const a={...this.options,...e,isClone:!0},i=new Z(a);if((e.debug!==void 0||e.prefix!==void 0)&&(i.logger=i.logger.clone(e)),["store","services","language"].forEach(o=>{i[o]=this[o]}),i.services={...this.services},i.services.utils={hasLoadedNamespace:i.hasLoadedNamespace.bind(i)},s){const o=Object.keys(this.store.data).reduce((l,c)=>(l[c]={...this.store.data[c]},l[c]=Object.keys(l[c]).reduce((u,d)=>(u[d]={...l[c][d]},u),l[c]),l),{});i.store=new me(o,a),i.services.resourceStore=i.store}if(e.interpolation){const l={...ie().interpolation,...this.options.interpolation,...e.interpolation},c={...a,interpolation:l};i.services.interpolator=new be(c)}return i.translator=new ee(i.services,a),i.translator.on("*",(o,...l)=>{i.emit(o,...l)}),i.init(a,t),i.translator.options=a,i.translator.backendConnector.services.utils={hasLoadedNamespace:i.hasLoadedNamespace.bind(i)},i}toJSON(){return{options:this.options,store:this.store,language:this.language,languages:this.languages,resolvedLanguage:this.resolvedLanguage}}}const N=Z.createInstance();N.createInstance;N.dir;N.init;N.loadResources;N.reloadResources;N.use;N.changeLanguage;N.getFixedT;N.t;N.exists;N.setDefaultNamespace;N.hasLoadedNamespace;N.loadNamespaces;N.loadLanguages;const st=(n,e,t,s)=>{var i,r,o,l;const a=[t,{code:e,...s||{}}];if((r=(i=n==null?void 0:n.services)==null?void 0:i.logger)!=null&&r.forward)return n.services.logger.forward(a,"warn","react-i18next::",!0);D(a[0])&&(a[0]=`react-i18next:: ${a[0]}`),(l=(o=n==null?void 0:n.services)==null?void 0:o.logger)!=null&&l.warn?n.services.logger.warn(...a):console!=null&&console.warn&&console.warn(...a)},Oe={},$e=(n,e,t,s)=>{D(t)&&Oe[t]||(D(t)&&(Oe[t]=new Date),st(n,e,t,s))},Ee=(n,e)=>()=>{if(n.isInitialized)e();else{const t=()=>{setTimeout(()=>{n.off("initialized",t)},0),e()};n.on("initialized",t)}},le=(n,e,t)=>{n.loadNamespaces(e,Ee(n,t))},Re=(n,e,t,s)=>{if(D(t)&&(t=[t]),n.options.preload&&n.options.preload.indexOf(e)>-1)return le(n,t,s);t.forEach(a=>{n.options.ns.indexOf(a)<0&&n.options.ns.push(a)}),n.loadLanguages(e,Ee(n,s))},it=(n,e,t={})=>!e.languages||!e.languages.length?($e(e,"NO_LANGUAGES","i18n.languages were undefined or empty",{languages:e.languages}),!0):e.hasLoadedNamespace(n,{lng:t.lng,precheck:(s,a)=>{if(t.bindI18n&&t.bindI18n.indexOf("languageChanging")>-1&&s.services.backendConnector.backend&&s.isLanguageChangingTo&&!a(s.isLanguageChangingTo,n))return!1}}),D=n=>typeof n=="string",nt=n=>typeof n=="object"&&n!==null,rt=/&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g,ot={"&amp;":"&","&#38;":"&","&lt;":"<","&#60;":"<","&gt;":">","&#62;":">","&apos;":"'","&#39;":"'","&quot;":'"',"&#34;":'"',"&nbsp;":" ","&#160;":" ","&copy;":"©","&#169;":"©","&reg;":"®","&#174;":"®","&hellip;":"…","&#8230;":"…","&#x2F;":"/","&#47;":"/"},lt=n=>ot[n],ct=n=>n.replace(rt,lt);let ce={bindI18n:"languageChanged",bindI18nStore:"",transEmptyNodeValue:"",transSupportBasicHtmlNodes:!0,transWrapTextNodes:"",transKeepBasicHtmlNodesFor:["br","strong","i","p"],useSuspense:!0,unescape:ct,transDefaultProps:void 0};const ht=(n={})=>{ce={...ce,...n}},dt=()=>ce;let ze;const ut=n=>{ze=n},ft=()=>ze,$t={type:"3rdParty",init(n){ht(n.options.react),ut(n)}},pt=w.createContext();class gt{constructor(){this.usedNamespaces={}}addUsedNamespaces(e){e.forEach(t=>{this.usedNamespaces[t]||(this.usedNamespaces[t]=!0)})}getUsedNamespaces(){return Object.keys(this.usedNamespaces)}}var Fe={exports:{}},He={};/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var U=w;function yt(n,e){return n===e&&(n!==0||1/n===1/e)||n!==n&&e!==e}var mt=typeof Object.is=="function"?Object.is:yt,kt=U.useState,xt=U.useEffect,vt=U.useLayoutEffect,St=U.useDebugValue;function Mt(n,e){var t=e(),s=kt({inst:{value:t,getSnapshot:e}}),a=s[0].inst,i=s[1];return vt(function(){a.value=t,a.getSnapshot=e,ne(a)&&i({inst:a})},[n,t,e]),xt(function(){return ne(a)&&i({inst:a}),n(function(){ne(a)&&i({inst:a})})},[n]),St(t),t}function ne(n){var e=n.getSnapshot;n=n.value;try{var t=e();return!mt(n,t)}catch{return!0}}function bt(n,e){return e()}var Lt=typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"?bt:Mt;He.useSyncExternalStore=U.useSyncExternalStore!==void 0?U.useSyncExternalStore:Lt;Fe.exports=He;var wt=Fe.exports;const Ct=(n,e)=>D(e)?e:nt(e)&&D(e.defaultValue)?e.defaultValue:Array.isArray(n)?n[n.length-1]:n,Ot={t:Ct,ready:!1},Rt=()=>()=>{},Et=(n,e={})=>{var O,M,G;const{i18n:t}=e,{i18n:s,defaultNS:a}=w.useContext(pt)||{},i=t||s||ft();i&&!i.reportNamespaces&&(i.reportNamespaces=new gt),i||$e(i,"NO_I18NEXT_INSTANCE","useTranslation: You will need to pass in an i18next instance by using initReactI18next");const r=w.useMemo(()=>{var v;return{...dt(),...(v=i==null?void 0:i.options)==null?void 0:v.react,...e}},[i,e]),{useSuspense:o,keyPrefix:l}=r,c=a||((O=i==null?void 0:i.options)==null?void 0:O.defaultNS),u=D(c)?[c]:c||["translation"],d=w.useMemo(()=>u,u);(G=(M=i==null?void 0:i.reportNamespaces)==null?void 0:M.addUsedNamespaces)==null||G.call(M,d);const g=w.useRef(0),p=w.useCallback(v=>{if(!i)return Rt;const{bindI18n:m,bindI18nStore:k}=r,b=()=>{g.current+=1,v()};return m&&i.on(m,b),k&&i.store.on(k,b),()=>{m&&m.split(" ").forEach(j=>i.off(j,b)),k&&k.split(" ").forEach(j=>i.store.off(j,b))}},[i,r]),f=w.useRef(),x=w.useCallback(()=>{if(!i)return Ot;const v=!!(i.isInitialized||i.initializedStoreOnce)&&d.every(I=>it(I,i,r)),m=e.lng||i.language,k=g.current,b=f.current;if(b&&b.ready===v&&b.lng===m&&b.keyPrefix===l&&b.revision===k)return b;const F={t:i.getFixedT(m,r.nsMode==="fallback"?d:d[0],l),ready:v,lng:m,keyPrefix:l,revision:k};return f.current=F,F},[i,d,l,r,e.lng]),[L,$]=w.useState(0),{t:C,ready:R}=wt.useSyncExternalStore(p,x,x);w.useEffect(()=>{if(i&&!R&&!o){const v=()=>$(m=>m+1);e.lng?Re(i,e.lng,d,v):le(i,d,v)}},[i,e.lng,d,R,o,L]);const S=i||{},P=w.useRef(null),V=w.useRef(),z=v=>{const m=Object.getOwnPropertyDescriptors(v);m.__original&&delete m.__original;const k=Object.create(Object.getPrototypeOf(v),m);if(!Object.prototype.hasOwnProperty.call(k,"__original"))try{Object.defineProperty(k,"__original",{value:v,writable:!1,enumerable:!1,configurable:!1})}catch{}return k},A=w.useMemo(()=>{const v=S,m=v==null?void 0:v.language;let k=v;v&&(P.current&&P.current.__original===v?V.current!==m?(k=z(v),P.current=k,V.current=m):k=P.current:(k=z(v),P.current=k,V.current=m));const b=[C,k,R];return b.t=C,b.i18n=k,b.ready=R,b},[C,S,R,S.resolvedLanguage,S.language,S.languages]);if(i&&o&&!R)throw new Promise(v=>{const m=()=>v();e.lng?Re(i,e.lng,d,m):le(i,d,m)});return A};/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var Pt={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jt=n=>n.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),h=(n,e)=>{const t=w.forwardRef(({color:s="currentColor",size:a=24,strokeWidth:i=2,absoluteStrokeWidth:r,className:o="",children:l,...c},u)=>w.createElement("svg",{ref:u,...Pt,width:a,height:a,stroke:s,strokeWidth:r?Number(i)*24/Number(a):i,className:["lucide",`lucide-${jt(n)}`,o].join(" "),...c},[...e.map(([d,g])=>w.createElement(d,g)),...Array.isArray(l)?l:[l]]));return t.displayName=`${n}`,t};/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zt=h("AlertCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ft=h("AlertTriangle",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",key:"c3ski4"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ht=h("AlignCenter",[["line",{x1:"21",x2:"3",y1:"6",y2:"6",key:"1fp77t"}],["line",{x1:"17",x2:"7",y1:"12",y2:"12",key:"rsh8ii"}],["line",{x1:"19",x2:"5",y1:"18",y2:"18",key:"1t0tuv"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vt=h("AlignLeft",[["line",{x1:"21",x2:"3",y1:"6",y2:"6",key:"1fp77t"}],["line",{x1:"15",x2:"3",y1:"12",y2:"12",key:"v6grx8"}],["line",{x1:"17",x2:"3",y1:"18",y2:"18",key:"1awlsn"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const At=h("AlignRight",[["line",{x1:"21",x2:"3",y1:"6",y2:"6",key:"1fp77t"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}],["line",{x1:"21",x2:"7",y1:"18",y2:"18",key:"1g9eri"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const It=h("ArrowLeftRight",[["path",{d:"M8 3 4 7l4 4",key:"9rb6wj"}],["path",{d:"M4 7h16",key:"6tx8e3"}],["path",{d:"m16 21 4-4-4-4",key:"siv7j2"}],["path",{d:"M20 17H4",key:"h6l3hr"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tt=h("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qt=h("ArrowRightLeft",[["path",{d:"m16 3 4 4-4 4",key:"1x1c3m"}],["path",{d:"M20 7H4",key:"zbl0bi"}],["path",{d:"m8 21-4-4 4-4",key:"h9nckh"}],["path",{d:"M4 17h16",key:"g4d7ey"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dt=h("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ut=h("Atom",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["path",{d:"M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z",key:"1l2ple"}],["path",{d:"M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z",key:"1wam0m"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kt=h("Award",[["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}],["path",{d:"M15.477 12.89 17 22l-5-3-5 3 1.523-9.11",key:"em7aur"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bt=h("BarChart3",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _t=h("Beaker",[["path",{d:"M4.5 3h15",key:"c7n0jr"}],["path",{d:"M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3",key:"m1uhx7"}],["path",{d:"M6 14h12",key:"4cwo0f"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zt=h("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jt=h("Bold",[["path",{d:"M14 12a4 4 0 0 0 0-8H6v8",key:"v2sylx"}],["path",{d:"M15 20a4 4 0 0 0 0-8H6v8Z",key:"1ef5ya"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gt=h("BookOpen",[["path",{d:"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z",key:"vv98re"}],["path",{d:"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",key:"1cyq3y"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wt=h("Book",[["path",{d:"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20",key:"t4utmx"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yt=h("Brain",[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",key:"ep3f8r"}],["path",{d:"M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4",key:"1p4c4q"}],["path",{d:"M17.599 6.5a3 3 0 0 0 .399-1.375",key:"tmeiqw"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M19.938 10.5a4 4 0 0 1 .585.396",key:"1qfode"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M19.967 17.484A4 4 0 0 1 18 18",key:"159ez6"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xt=h("Building",[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",ry:"2",key:"76otgf"}],["path",{d:"M9 22v-4h6v4",key:"r93iot"}],["path",{d:"M8 6h.01",key:"1dz90k"}],["path",{d:"M16 6h.01",key:"1x0f13"}],["path",{d:"M12 6h.01",key:"1vi96p"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M8 14h.01",key:"6423bh"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qt=h("Calculator",[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ea=h("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ta=h("CheckCircle2",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const aa=h("CheckCircle",[["path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14",key:"g774vq"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sa=h("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ia=h("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const na=h("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ra=h("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oa=h("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const la=h("ClipboardCheck",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"m9 14 2 2 4-4",key:"df797q"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ca=h("ClipboardList",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"M12 11h4",key:"1jrz19"}],["path",{d:"M12 16h4",key:"n85exb"}],["path",{d:"M8 11h.01",key:"1dfujw"}],["path",{d:"M8 16h.01",key:"18s6g9"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ha=h("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const da=h("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ua=h("Crown",[["path",{d:"m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14",key:"zkxr6b"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fa=h("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pa=h("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ga=h("EyeOff",[["path",{d:"M9.88 9.88a3 3 0 1 0 4.24 4.24",key:"1jxqfv"}],["path",{d:"M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68",key:"9wicm4"}],["path",{d:"M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61",key:"1jreej"}],["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ya=h("Eye",[["path",{d:"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",key:"rwhkz3"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ma=h("FileSpreadsheet",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 17h2",key:"10kma7"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ka=h("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xa=h("Filter",[["polygon",{points:"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3",key:"1yg77f"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const va=h("Flame",[["path",{d:"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",key:"96xj49"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sa=h("FolderPlus",[["path",{d:"M12 10v6",key:"1bos4e"}],["path",{d:"M9 13h6",key:"1uhe8q"}],["path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",key:"1kt360"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ma=h("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ba=h("GraduationCap",[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const La=h("GripVertical",[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wa=h("Hash",[["line",{x1:"4",x2:"20",y1:"9",y2:"9",key:"4lhtct"}],["line",{x1:"4",x2:"20",y1:"15",y2:"15",key:"vyu0kd"}],["line",{x1:"10",x2:"8",y1:"3",y2:"21",key:"1ggp8o"}],["line",{x1:"16",x2:"14",y1:"3",y2:"21",key:"weycgp"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ca=h("Heading1",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"m17 12 3-2v8",key:"1hhhft"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oa=h("Heading2",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1",key:"9jr5yi"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ra=h("Heading3",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2",key:"68ncm8"}],["path",{d:"M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2",key:"1ejuhz"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pa=h("HelpCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ja=h("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Na=h("Home",[["path",{d:"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"y5dka4"}],["polyline",{points:"9 22 9 12 15 12 15 22",key:"e2us08"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $a=h("Image",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ea=h("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const za=h("Italic",[["line",{x1:"19",x2:"10",y1:"4",y2:"4",key:"15jd3p"}],["line",{x1:"14",x2:"5",y1:"20",y2:"20",key:"bu0au3"}],["line",{x1:"15",x2:"9",y1:"4",y2:"20",key:"uljnxc"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fa=h("Languages",[["path",{d:"m5 8 6 6",key:"1wu5hv"}],["path",{d:"m4 14 6-6 2-3",key:"1k1g8d"}],["path",{d:"M2 5h12",key:"or177f"}],["path",{d:"M7 2h1",key:"1t2jsx"}],["path",{d:"m22 22-5-10-5 10",key:"don7ne"}],["path",{d:"M14 18h6",key:"1m8k6r"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ha=h("Layers",[["path",{d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",key:"8b97xw"}],["path",{d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",key:"dd6zsq"}],["path",{d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",key:"ep9fru"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Va=h("LayoutGrid",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Aa=h("Leaf",[["path",{d:"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z",key:"nnexq3"}],["path",{d:"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",key:"mt58a7"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ia=h("Link",[["path",{d:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",key:"1cjeqo"}],["path",{d:"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",key:"19qd67"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ta=h("ListOrdered",[["line",{x1:"10",x2:"21",y1:"6",y2:"6",key:"76qw6h"}],["line",{x1:"10",x2:"21",y1:"12",y2:"12",key:"16nom4"}],["line",{x1:"10",x2:"21",y1:"18",y2:"18",key:"u3jurt"}],["path",{d:"M4 6h1v4",key:"cnovpq"}],["path",{d:"M4 10h2",key:"16xx2s"}],["path",{d:"M6 18H4c0-1 2-2 2-3s-1-1.5-2-1",key:"m9a95d"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qa=h("List",[["line",{x1:"8",x2:"21",y1:"6",y2:"6",key:"7ey8pc"}],["line",{x1:"8",x2:"21",y1:"12",y2:"12",key:"rjfblc"}],["line",{x1:"8",x2:"21",y1:"18",y2:"18",key:"c3b1m8"}],["line",{x1:"3",x2:"3.01",y1:"6",y2:"6",key:"1g7gq3"}],["line",{x1:"3",x2:"3.01",y1:"12",y2:"12",key:"1pjlvk"}],["line",{x1:"3",x2:"3.01",y1:"18",y2:"18",key:"28t2mc"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Da=h("Loader2",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ua=h("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ka=h("LogIn",[["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}],["polyline",{points:"10 17 15 12 10 7",key:"1ail0h"}],["line",{x1:"15",x2:"3",y1:"12",y2:"12",key:"v6grx8"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ba=h("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _a=h("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Za=h("MapPin",[["path",{d:"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z",key:"2oe9fu"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ja=h("Maximize2",[["polyline",{points:"15 3 21 3 21 9",key:"mznyad"}],["polyline",{points:"9 21 3 21 3 15",key:"1avn1i"}],["line",{x1:"21",x2:"14",y1:"3",y2:"10",key:"ota7mn"}],["line",{x1:"3",x2:"10",y1:"21",y2:"14",key:"1atl0r"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ga=h("Medal",[["path",{d:"M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15",key:"143lza"}],["path",{d:"M11 12 5.12 2.2",key:"qhuxz6"}],["path",{d:"m13 12 5.88-9.8",key:"hbye0f"}],["path",{d:"M8 7h8",key:"i86dvs"}],["circle",{cx:"12",cy:"17",r:"5",key:"qbz8iq"}],["path",{d:"M12 18v-2h-.5",key:"fawc4q"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wa=h("Megaphone",[["path",{d:"m3 11 18-5v12L3 14v-3z",key:"n962bs"}],["path",{d:"M11.6 16.8a3 3 0 1 1-5.8-1.6",key:"1yl0tm"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ya=h("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xa=h("Palette",[["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor",key:"1okk4w"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor",key:"f64h9f"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor",key:"fotxhn"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor",key:"qy21gx"}],["path",{d:"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",key:"12rzf8"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qa=h("PenLine",[["path",{d:"M12 20h9",key:"t2du7b"}],["path",{d:"M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z",key:"ymcmye"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const es=h("Phone",[["path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",key:"foiqr5"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ts=h("PlayCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polygon",{points:"10 8 16 12 10 16 10 8",key:"1cimsy"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const as=h("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ss=h("Presentation",[["path",{d:"M2 3h20",key:"91anmk"}],["path",{d:"M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3",key:"2k9sn8"}],["path",{d:"m7 21 5-5 5 5",key:"bip4we"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const is=h("Redo",[["path",{d:"M21 7v6h-6",key:"3ptur4"}],["path",{d:"M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7",key:"1kgawr"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ns=h("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rs=h("RotateCcw",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const os=h("Save",[["path",{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",key:"1owoqh"}],["polyline",{points:"17 21 17 13 7 13 7 21",key:"1md35c"}],["polyline",{points:"7 3 7 8 15 8",key:"8nz8an"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ls=h("School",[["path",{d:"M14 22v-4a2 2 0 1 0-4 0v4",key:"hhkicm"}],["path",{d:"m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2",key:"1vwozw"}],["path",{d:"M18 5v17",key:"1sw6gf"}],["path",{d:"m4 6 8-4 8 4",key:"1q0ilc"}],["path",{d:"M6 5v17",key:"1xfsm0"}],["circle",{cx:"12",cy:"9",r:"2",key:"1092wv"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cs=h("ScrollText",[["path",{d:"M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4",key:"13a6an"}],["path",{d:"M19 17V5a2 2 0 0 0-2-2H4",key:"zz82l3"}],["path",{d:"M15 8h-5",key:"1khuty"}],["path",{d:"M15 12h-5",key:"r7krc0"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hs=h("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ds=h("Send",[["path",{d:"m22 2-7 20-4-9-9-4Z",key:"1q3vgg"}],["path",{d:"M22 2 11 13",key:"nzbqef"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const us=h("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fs=h("ShieldAlert",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ps=h("ShieldCheck",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gs=h("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ys=h("Sigma",[["path",{d:"M18 7V4H6l6 8-6 8h12v-3",key:"zis8ev"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ms=h("Sparkles",[["path",{d:"m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",key:"17u4zn"}],["path",{d:"M5 3v4",key:"bklmnn"}],["path",{d:"M19 17v4",key:"iiml17"}],["path",{d:"M3 5h4",key:"nem4j1"}],["path",{d:"M17 19h4",key:"lbex7p"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ks=h("SquarePen",[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z",key:"1lpok0"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xs=h("Strikethrough",[["path",{d:"M16 4H9a3 3 0 0 0-2.83 4",key:"43sutm"}],["path",{d:"M14 12a4 4 0 0 1 0 8H6",key:"nlfj13"}],["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vs=h("Subscript",[["path",{d:"m4 5 8 8",key:"1eunvl"}],["path",{d:"m12 5-8 8",key:"1ah0jp"}],["path",{d:"M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07",key:"e8ta8j"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ss=h("Superscript",[["path",{d:"m4 19 8-8",key:"hr47gm"}],["path",{d:"m12 19-8-8",key:"1dhhmo"}],["path",{d:"M20 12h-4c0-1.5.442-2 1.5-2.5S20 8.334 20 7.002c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06",key:"1dfcux"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ms=h("Target",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bs=h("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ls=h("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ws=h("Trophy",[["path",{d:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6",key:"17hqa7"}],["path",{d:"M18 9h1.5a2.5 2.5 0 0 0 0-5H18",key:"lmptdp"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",key:"1nw9bq"}],["path",{d:"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",key:"1np0yb"}],["path",{d:"M18 2H6v7a6 6 0 0 0 12 0V2Z",key:"u46fv3"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cs=h("Underline",[["path",{d:"M6 4v6a6 6 0 0 0 12 0V4",key:"9kb039"}],["line",{x1:"4",x2:"20",y1:"20",y2:"20",key:"nun2al"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Os=h("Undo",[["path",{d:"M3 7v6h6",key:"1v2h90"}],["path",{d:"M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13",key:"1r6uu6"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rs=h("UserCheck",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["polyline",{points:"16 11 18 13 22 9",key:"1pwet4"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ps=h("UserMinus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const js=h("UserPlus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ns=h("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $s=h("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Es=h("Video",[["path",{d:"m22 8-6 4 6 4V8Z",key:"50v9me"}],["rect",{width:"14",height:"12",x:"2",y:"6",rx:"2",ry:"2",key:"1rqjg6"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zs=h("XCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fs=h("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);export{as as $,Ut as A,_t as B,Qt as C,ca as D,pa as E,va as F,Ma as G,zt as H,Ea as I,Na as J,La as K,Fa as L,Wa as M,Qa as N,qt as O,ts as P,bs as Q,rs as R,cs as S,ws as T,Ns as U,Es as V,ba as W,Fs as X,Ha as Y,Sa as Z,os as _,Aa as a,hs as a0,js as a1,ks as a2,us as a3,ga as a4,ps as a5,fs as a6,gs as a7,Za as a8,Xt as a9,Ja as aA,Os as aB,is as aC,Jt as aD,za as aE,Cs as aF,xs as aG,vs as aH,Ss as aI,Ca as aJ,Oa as aK,Ra as aL,qa as aM,Ta as aN,Vt as aO,Ht as aP,At as aQ,ys as aR,Xa as aS,wa as aT,It as aU,$a as aV,la as aW,oa as aX,$s as aa,ls as ab,ea as ac,ds as ad,Ua as ae,_a as af,Ka as ag,Ia as ah,Ps as ai,Ls as aj,Ga as ak,Yt as al,Rs as am,Kt as an,ns as ao,da as ap,fa as aq,ma as ar,xa as as,Ms as at,Pa as au,zs as av,es as aw,ja as ax,ua as ay,Ft as az,Gt as b,Zt as c,sa as d,na as e,ra as f,ms as g,ia as h,Bt as i,Ba as j,Ya as k,Dt as l,Va as m,ta as n,Da as o,N as p,$t as q,Tt as r,wt as s,Wt as t,Et as u,ka as v,ya as w,ss as x,aa as y,ha as z};
