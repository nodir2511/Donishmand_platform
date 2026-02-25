import{r as M}from"./vendor-DfgOC3sD.js";const y=n=>typeof n=="string",B=()=>{let n,e;const t=new Promise((a,s)=>{n=a,e=s});return t.resolve=n,t.reject=e,t},fe=n=>n==null?"":""+n,He=(n,e,t)=>{n.forEach(a=>{e[a]&&(t[a]=e[a])})},Ae=/###/g,pe=n=>n&&n.indexOf("###")>-1?n.replace(Ae,"."):n,ge=n=>!n||y(n),_=(n,e,t)=>{const a=y(e)?e.split("."):e;let s=0;for(;s<a.length-1;){if(ge(n))return{};const i=pe(a[s]);!n[i]&&t&&(n[i]=new t),Object.prototype.hasOwnProperty.call(n,i)?n=n[i]:n={},++s}return ge(n)?{}:{obj:n,k:pe(a[s])}},ye=(n,e,t)=>{const{obj:a,k:s}=_(n,e,Object);if(a!==void 0||e.length===1){a[s]=t;return}let i=e[e.length-1],r=e.slice(0,e.length-1),o=_(n,r,Object);for(;o.obj===void 0&&r.length;)i=`${r[r.length-1]}.${i}`,r=r.slice(0,r.length-1),o=_(n,r,Object),o!=null&&o.obj&&typeof o.obj[`${o.k}.${i}`]<"u"&&(o.obj=void 0);o.obj[`${o.k}.${i}`]=t},Ie=(n,e,t,a)=>{const{obj:s,k:i}=_(n,e,Object);s[i]=s[i]||[],s[i].push(t)},X=(n,e)=>{const{obj:t,k:a}=_(n,e);if(t&&Object.prototype.hasOwnProperty.call(t,a))return t[a]},Te=(n,e,t)=>{const a=X(n,t);return a!==void 0?a:X(e,t)},Pe=(n,e,t)=>{for(const a in e)a!=="__proto__"&&a!=="constructor"&&(a in n?y(n[a])||n[a]instanceof String||y(e[a])||e[a]instanceof String?t&&(n[a]=e[a]):Pe(n[a],e[a],t):n[a]=e[a]);return n},D=n=>n.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&");var De={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;"};const Ue=n=>y(n)?n.replace(/[&<>"'\/]/g,e=>De[e]):n;class Ke{constructor(e){this.capacity=e,this.regExpMap=new Map,this.regExpQueue=[]}getRegExp(e){const t=this.regExpMap.get(e);if(t!==void 0)return t;const a=new RegExp(e);return this.regExpQueue.length===this.capacity&&this.regExpMap.delete(this.regExpQueue.shift()),this.regExpMap.set(e,a),this.regExpQueue.push(e),a}}const qe=[" ",",","?","!",";"],Be=new Ke(20),_e=(n,e,t)=>{e=e||"",t=t||"";const a=qe.filter(r=>e.indexOf(r)<0&&t.indexOf(r)<0);if(a.length===0)return!0;const s=Be.getRegExp(`(${a.map(r=>r==="?"?"\\?":r).join("|")})`);let i=!s.test(n);if(!i){const r=n.indexOf(t);r>0&&!s.test(n.substring(0,r))&&(i=!0)}return i},re=(n,e,t=".")=>{if(!n)return;if(n[e])return Object.prototype.hasOwnProperty.call(n,e)?n[e]:void 0;const a=e.split(t);let s=n;for(let i=0;i<a.length;){if(!s||typeof s!="object")return;let r,o="";for(let l=i;l<a.length;++l)if(l!==i&&(o+=t),o+=a[l],r=s[o],r!==void 0){if(["string","number","boolean"].indexOf(typeof r)>-1&&l<a.length-1)continue;i+=l-i+1;break}s=r}return s},J=n=>n==null?void 0:n.replace("_","-"),Ze={type:"logger",log(n){this.output("log",n)},warn(n){this.output("warn",n)},error(n){this.output("error",n)},output(n,e){var t,a;(a=(t=console==null?void 0:console[n])==null?void 0:t.apply)==null||a.call(t,console,e)}};class Q{constructor(e,t={}){this.init(e,t)}init(e,t={}){this.prefix=t.prefix||"i18next:",this.logger=e||Ze,this.options=t,this.debug=t.debug}log(...e){return this.forward(e,"log","",!0)}warn(...e){return this.forward(e,"warn","",!0)}error(...e){return this.forward(e,"error","")}deprecate(...e){return this.forward(e,"warn","WARNING DEPRECATED: ",!0)}forward(e,t,a,s){return s&&!this.debug?null:(y(e[0])&&(e[0]=`${a}${this.prefix} ${e[0]}`),this.logger[t](e))}create(e){return new Q(this.logger,{prefix:`${this.prefix}:${e}:`,...this.options})}clone(e){return e=e||this.options,e.prefix=e.prefix||this.prefix,new Q(this.logger,e)}}var V=new Q;class te{constructor(){this.observers={}}on(e,t){return e.split(" ").forEach(a=>{this.observers[a]||(this.observers[a]=new Map);const s=this.observers[a].get(t)||0;this.observers[a].set(t,s+1)}),this}off(e,t){if(this.observers[e]){if(!t){delete this.observers[e];return}this.observers[e].delete(t)}}emit(e,...t){this.observers[e]&&Array.from(this.observers[e].entries()).forEach(([s,i])=>{for(let r=0;r<i;r++)s(...t)}),this.observers["*"]&&Array.from(this.observers["*"].entries()).forEach(([s,i])=>{for(let r=0;r<i;r++)s.apply(s,[e,...t])})}}class me extends te{constructor(e,t={ns:["translation"],defaultNS:"translation"}){super(),this.data=e||{},this.options=t,this.options.keySeparator===void 0&&(this.options.keySeparator="."),this.options.ignoreJSONStructure===void 0&&(this.options.ignoreJSONStructure=!0)}addNamespaces(e){this.options.ns.indexOf(e)<0&&this.options.ns.push(e)}removeNamespaces(e){const t=this.options.ns.indexOf(e);t>-1&&this.options.ns.splice(t,1)}getResource(e,t,a,s={}){var c,d;const i=s.keySeparator!==void 0?s.keySeparator:this.options.keySeparator,r=s.ignoreJSONStructure!==void 0?s.ignoreJSONStructure:this.options.ignoreJSONStructure;let o;e.indexOf(".")>-1?o=e.split("."):(o=[e,t],a&&(Array.isArray(a)?o.push(...a):y(a)&&i?o.push(...a.split(i)):o.push(a)));const l=X(this.data,o);return!l&&!t&&!a&&e.indexOf(".")>-1&&(e=o[0],t=o[1],a=o.slice(2).join(".")),l||!r||!y(a)?l:re((d=(c=this.data)==null?void 0:c[e])==null?void 0:d[t],a,i)}addResource(e,t,a,s,i={silent:!1}){const r=i.keySeparator!==void 0?i.keySeparator:this.options.keySeparator;let o=[e,t];a&&(o=o.concat(r?a.split(r):a)),e.indexOf(".")>-1&&(o=e.split("."),s=t,t=o[1]),this.addNamespaces(t),ye(this.data,o,s),i.silent||this.emit("added",e,t,a,s)}addResources(e,t,a,s={silent:!1}){for(const i in a)(y(a[i])||Array.isArray(a[i]))&&this.addResource(e,t,i,a[i],{silent:!0});s.silent||this.emit("added",e,t,a)}addResourceBundle(e,t,a,s,i,r={silent:!1,skipCopy:!1}){let o=[e,t];e.indexOf(".")>-1&&(o=e.split("."),s=a,a=t,t=o[1]),this.addNamespaces(t);let l=X(this.data,o)||{};r.skipCopy||(a=JSON.parse(JSON.stringify(a))),s?Pe(l,a,i):l={...l,...a},ye(this.data,o,l),r.silent||this.emit("added",e,t,a)}removeResourceBundle(e,t){this.hasResourceBundle(e,t)&&delete this.data[e][t],this.removeNamespaces(t),this.emit("removed",e,t)}hasResourceBundle(e,t){return this.getResource(e,t)!==void 0}getResourceBundle(e,t){return t||(t=this.options.defaultNS),this.getResource(e,t)}getDataByLanguage(e){return this.data[e]}hasLanguageSomeTranslations(e){const t=this.getDataByLanguage(e);return!!(t&&Object.keys(t)||[]).find(s=>t[s]&&Object.keys(t[s]).length>0)}toJSON(){return this.data}}var je={processors:{},addPostProcessor(n){this.processors[n.name]=n},handle(n,e,t,a,s){return n.forEach(i=>{var r;e=((r=this.processors[i])==null?void 0:r.process(e,t,a,s))??e}),e}};const Ne=Symbol("i18next/PATH_KEY");function Je(){const n=[],e=Object.create(null);let t;return e.get=(a,s)=>{var i;return(i=t==null?void 0:t.revoke)==null||i.call(t),s===Ne?n:(n.push(s),t=Proxy.revocable(a,e),t.proxy)},Proxy.revocable(Object.create(null),e).proxy}function oe(n,e){const{[Ne]:t}=n(Je());return t.join((e==null?void 0:e.keySeparator)??".")}const xe={},se=n=>!y(n)&&typeof n!="boolean"&&typeof n!="number";class ee extends te{constructor(e,t={}){super(),He(["resourceStore","languageUtils","pluralResolver","interpolator","backendConnector","i18nFormat","utils"],e,this),this.options=t,this.options.keySeparator===void 0&&(this.options.keySeparator="."),this.logger=V.create("translator")}changeLanguage(e){e&&(this.language=e)}exists(e,t={interpolation:{}}){const a={...t};if(e==null)return!1;const s=this.resolve(e,a);if((s==null?void 0:s.res)===void 0)return!1;const i=se(s.res);return!(a.returnObjects===!1&&i)}extractFromKey(e,t){let a=t.nsSeparator!==void 0?t.nsSeparator:this.options.nsSeparator;a===void 0&&(a=":");const s=t.keySeparator!==void 0?t.keySeparator:this.options.keySeparator;let i=t.ns||this.options.defaultNS||[];const r=a&&e.indexOf(a)>-1,o=!this.options.userDefinedKeySeparator&&!t.keySeparator&&!this.options.userDefinedNsSeparator&&!t.nsSeparator&&!_e(e,a,s);if(r&&!o){const l=e.match(this.interpolator.nestingRegexp);if(l&&l.length>0)return{key:e,namespaces:y(i)?[i]:i};const c=e.split(a);(a!==s||a===s&&this.options.ns.indexOf(c[0])>-1)&&(i=c.shift()),e=c.join(s)}return{key:e,namespaces:y(i)?[i]:i}}translate(e,t,a){let s=typeof t=="object"?{...t}:t;if(typeof s!="object"&&this.options.overloadTranslationOptionHandler&&(s=this.options.overloadTranslationOptionHandler(arguments)),typeof s=="object"&&(s={...s}),s||(s={}),e==null)return"";typeof e=="function"&&(e=oe(e,{...this.options,...s})),Array.isArray(e)||(e=[String(e)]);const i=s.returnDetails!==void 0?s.returnDetails:this.options.returnDetails,r=s.keySeparator!==void 0?s.keySeparator:this.options.keySeparator,{key:o,namespaces:l}=this.extractFromKey(e[e.length-1],s),c=l[l.length-1];let d=s.nsSeparator!==void 0?s.nsSeparator:this.options.nsSeparator;d===void 0&&(d=":");const h=s.lng||this.language,g=s.appendNamespaceToCIMode||this.options.appendNamespaceToCIMode;if((h==null?void 0:h.toLowerCase())==="cimode")return g?i?{res:`${c}${d}${o}`,usedKey:o,exactUsedKey:o,usedLng:h,usedNS:c,usedParams:this.getUsedParamsDetails(s)}:`${c}${d}${o}`:i?{res:o,usedKey:o,exactUsedKey:o,usedLng:h,usedNS:c,usedParams:this.getUsedParamsDetails(s)}:o;const p=this.resolve(e,s);let f=p==null?void 0:p.res;const k=(p==null?void 0:p.usedKey)||o,w=(p==null?void 0:p.exactUsedKey)||o,$=["[object Number]","[object Function]","[object RegExp]"],C=s.joinArrays!==void 0?s.joinArrays:this.options.joinArrays,R=!this.i18nFormat||this.i18nFormat.handleAsObject,S=s.count!==void 0&&!y(s.count),P=ee.hasDefaultValue(s),H=S?this.pluralResolver.getSuffix(h,s.count,s):"",F=s.ordinal&&S?this.pluralResolver.getSuffix(h,s.count,{ordinal:!1}):"",A=S&&!s.ordinal&&s.count===0,O=A&&s[`defaultValue${this.options.pluralSeparator}zero`]||s[`defaultValue${H}`]||s[`defaultValue${F}`]||s.defaultValue;let L=f;R&&!f&&P&&(L=O);const G=se(L),v=Object.prototype.toString.apply(L);if(R&&L&&G&&$.indexOf(v)<0&&!(y(C)&&Array.isArray(L))){if(!s.returnObjects&&!this.options.returnObjects){this.options.returnedObjectHandler||this.logger.warn("accessing an object - but returnObjects options is not enabled!");const m=this.options.returnedObjectHandler?this.options.returnedObjectHandler(k,L,{...s,ns:l}):`key '${o} (${this.language})' returned an object instead of string.`;return i?(p.res=m,p.usedParams=this.getUsedParamsDetails(s),p):m}if(r){const m=Array.isArray(L),x=m?[]:{},b=m?w:k;for(const j in L)if(Object.prototype.hasOwnProperty.call(L,j)){const z=`${b}${r}${j}`;P&&!f?x[j]=this.translate(z,{...s,defaultValue:se(O)?O[j]:void 0,joinArrays:!1,ns:l}):x[j]=this.translate(z,{...s,joinArrays:!1,ns:l}),x[j]===z&&(x[j]=L[j])}f=x}}else if(R&&y(C)&&Array.isArray(f))f=f.join(C),f&&(f=this.extendTranslation(f,e,s,a));else{let m=!1,x=!1;!this.isValidLookup(f)&&P&&(m=!0,f=O),this.isValidLookup(f)||(x=!0,f=o);const j=(s.missingKeyNoValueFallbackToKey||this.options.missingKeyNoValueFallbackToKey)&&x?void 0:f,z=P&&O!==f&&this.options.updateMissing;if(x||m||z){if(this.logger.log(z?"updateKey":"missingKey",h,c,o,z?O:f),r){const E=this.resolve(o,{...s,keySeparator:!1});E&&E.res&&this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.")}let I=[];const W=this.languageUtils.getFallbackCodes(this.options.fallbackLng,s.lng||this.language);if(this.options.saveMissingTo==="fallback"&&W&&W[0])for(let E=0;E<W.length;E++)I.push(W[E]);else this.options.saveMissingTo==="all"?I=this.languageUtils.toResolveHierarchy(s.lng||this.language):I.push(s.lng||this.language);const he=(E,T,q)=>{var de;const ue=P&&q!==f?q:j;this.options.missingKeyHandler?this.options.missingKeyHandler(E,c,T,ue,z,s):(de=this.backendConnector)!=null&&de.saveMissing&&this.backendConnector.saveMissing(E,c,T,ue,z,s),this.emit("missingKey",E,c,T,f)};this.options.saveMissing&&(this.options.saveMissingPlurals&&S?I.forEach(E=>{const T=this.pluralResolver.getSuffixes(E,s);A&&s[`defaultValue${this.options.pluralSeparator}zero`]&&T.indexOf(`${this.options.pluralSeparator}zero`)<0&&T.push(`${this.options.pluralSeparator}zero`),T.forEach(q=>{he([E],o+q,s[`defaultValue${q}`]||O)})}):he(I,o,O))}f=this.extendTranslation(f,e,s,p,a),x&&f===o&&this.options.appendNamespaceToMissingKey&&(f=`${c}${d}${o}`),(x||m)&&this.options.parseMissingKeyHandler&&(f=this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey?`${c}${d}${o}`:o,m?f:void 0,s))}return i?(p.res=f,p.usedParams=this.getUsedParamsDetails(s),p):f}extendTranslation(e,t,a,s,i){var l,c;if((l=this.i18nFormat)!=null&&l.parse)e=this.i18nFormat.parse(e,{...this.options.interpolation.defaultVariables,...a},a.lng||this.language||s.usedLng,s.usedNS,s.usedKey,{resolved:s});else if(!a.skipInterpolation){a.interpolation&&this.interpolator.init({...a,interpolation:{...this.options.interpolation,...a.interpolation}});const d=y(e)&&(((c=a==null?void 0:a.interpolation)==null?void 0:c.skipOnVariables)!==void 0?a.interpolation.skipOnVariables:this.options.interpolation.skipOnVariables);let h;if(d){const p=e.match(this.interpolator.nestingRegexp);h=p&&p.length}let g=a.replace&&!y(a.replace)?a.replace:a;if(this.options.interpolation.defaultVariables&&(g={...this.options.interpolation.defaultVariables,...g}),e=this.interpolator.interpolate(e,g,a.lng||this.language||s.usedLng,a),d){const p=e.match(this.interpolator.nestingRegexp),f=p&&p.length;h<f&&(a.nest=!1)}!a.lng&&s&&s.res&&(a.lng=this.language||s.usedLng),a.nest!==!1&&(e=this.interpolator.nest(e,(...p)=>(i==null?void 0:i[0])===p[0]&&!a.context?(this.logger.warn(`It seems you are nesting recursively key: ${p[0]} in key: ${t[0]}`),null):this.translate(...p,t),a)),a.interpolation&&this.interpolator.reset()}const r=a.postProcess||this.options.postProcess,o=y(r)?[r]:r;return e!=null&&(o!=null&&o.length)&&a.applyPostProcessor!==!1&&(e=je.handle(o,e,t,this.options&&this.options.postProcessPassResolved?{i18nResolved:{...s,usedParams:this.getUsedParamsDetails(a)},...a}:a,this)),e}resolve(e,t={}){let a,s,i,r,o;return y(e)&&(e=[e]),e.forEach(l=>{if(this.isValidLookup(a))return;const c=this.extractFromKey(l,t),d=c.key;s=d;let h=c.namespaces;this.options.fallbackNS&&(h=h.concat(this.options.fallbackNS));const g=t.count!==void 0&&!y(t.count),p=g&&!t.ordinal&&t.count===0,f=t.context!==void 0&&(y(t.context)||typeof t.context=="number")&&t.context!=="",k=t.lngs?t.lngs:this.languageUtils.toResolveHierarchy(t.lng||this.language,t.fallbackLng);h.forEach(w=>{var $,C;this.isValidLookup(a)||(o=w,!xe[`${k[0]}-${w}`]&&(($=this.utils)!=null&&$.hasLoadedNamespace)&&!((C=this.utils)!=null&&C.hasLoadedNamespace(o))&&(xe[`${k[0]}-${w}`]=!0,this.logger.warn(`key "${s}" for languages "${k.join(", ")}" won't get resolved as namespace "${o}" was not yet loaded`,"This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!")),k.forEach(R=>{var H;if(this.isValidLookup(a))return;r=R;const S=[d];if((H=this.i18nFormat)!=null&&H.addLookupKeys)this.i18nFormat.addLookupKeys(S,d,R,w,t);else{let F;g&&(F=this.pluralResolver.getSuffix(R,t.count,t));const A=`${this.options.pluralSeparator}zero`,O=`${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;if(g&&(t.ordinal&&F.indexOf(O)===0&&S.push(d+F.replace(O,this.options.pluralSeparator)),S.push(d+F),p&&S.push(d+A)),f){const L=`${d}${this.options.contextSeparator||"_"}${t.context}`;S.push(L),g&&(t.ordinal&&F.indexOf(O)===0&&S.push(L+F.replace(O,this.options.pluralSeparator)),S.push(L+F),p&&S.push(L+A))}}let P;for(;P=S.pop();)this.isValidLookup(a)||(i=P,a=this.getResource(R,w,P,t))}))})}),{res:a,usedKey:s,exactUsedKey:i,usedLng:r,usedNS:o}}isValidLookup(e){return e!==void 0&&!(!this.options.returnNull&&e===null)&&!(!this.options.returnEmptyString&&e==="")}getResource(e,t,a,s={}){var i;return(i=this.i18nFormat)!=null&&i.getResource?this.i18nFormat.getResource(e,t,a,s):this.resourceStore.getResource(e,t,a,s)}getUsedParamsDetails(e={}){const t=["defaultValue","ordinal","context","replace","lng","lngs","fallbackLng","ns","keySeparator","nsSeparator","returnObjects","returnDetails","joinArrays","postProcess","interpolation"],a=e.replace&&!y(e.replace);let s=a?e.replace:e;if(a&&typeof e.count<"u"&&(s.count=e.count),this.options.interpolation.defaultVariables&&(s={...this.options.interpolation.defaultVariables,...s}),!a){s={...s};for(const i of t)delete s[i]}return s}static hasDefaultValue(e){const t="defaultValue";for(const a in e)if(Object.prototype.hasOwnProperty.call(e,a)&&t===a.substring(0,t.length)&&e[a]!==void 0)return!0;return!1}}class ke{constructor(e){this.options=e,this.supportedLngs=this.options.supportedLngs||!1,this.logger=V.create("languageUtils")}getScriptPartFromCode(e){if(e=J(e),!e||e.indexOf("-")<0)return null;const t=e.split("-");return t.length===2||(t.pop(),t[t.length-1].toLowerCase()==="x")?null:this.formatLanguageCode(t.join("-"))}getLanguagePartFromCode(e){if(e=J(e),!e||e.indexOf("-")<0)return e;const t=e.split("-");return this.formatLanguageCode(t[0])}formatLanguageCode(e){if(y(e)&&e.indexOf("-")>-1){let t;try{t=Intl.getCanonicalLocales(e)[0]}catch{}return t&&this.options.lowerCaseLng&&(t=t.toLowerCase()),t||(this.options.lowerCaseLng?e.toLowerCase():e)}return this.options.cleanCode||this.options.lowerCaseLng?e.toLowerCase():e}isSupportedCode(e){return(this.options.load==="languageOnly"||this.options.nonExplicitSupportedLngs)&&(e=this.getLanguagePartFromCode(e)),!this.supportedLngs||!this.supportedLngs.length||this.supportedLngs.indexOf(e)>-1}getBestMatchFromCodes(e){if(!e)return null;let t;return e.forEach(a=>{if(t)return;const s=this.formatLanguageCode(a);(!this.options.supportedLngs||this.isSupportedCode(s))&&(t=s)}),!t&&this.options.supportedLngs&&e.forEach(a=>{if(t)return;const s=this.getScriptPartFromCode(a);if(this.isSupportedCode(s))return t=s;const i=this.getLanguagePartFromCode(a);if(this.isSupportedCode(i))return t=i;t=this.options.supportedLngs.find(r=>{if(r===i)return r;if(!(r.indexOf("-")<0&&i.indexOf("-")<0)&&(r.indexOf("-")>0&&i.indexOf("-")<0&&r.substring(0,r.indexOf("-"))===i||r.indexOf(i)===0&&i.length>1))return r})}),t||(t=this.getFallbackCodes(this.options.fallbackLng)[0]),t}getFallbackCodes(e,t){if(!e)return[];if(typeof e=="function"&&(e=e(t)),y(e)&&(e=[e]),Array.isArray(e))return e;if(!t)return e.default||[];let a=e[t];return a||(a=e[this.getScriptPartFromCode(t)]),a||(a=e[this.formatLanguageCode(t)]),a||(a=e[this.getLanguagePartFromCode(t)]),a||(a=e.default),a||[]}toResolveHierarchy(e,t){const a=this.getFallbackCodes((t===!1?[]:t)||this.options.fallbackLng||[],e),s=[],i=r=>{r&&(this.isSupportedCode(r)?s.push(r):this.logger.warn(`rejecting language code not found in supportedLngs: ${r}`))};return y(e)&&(e.indexOf("-")>-1||e.indexOf("_")>-1)?(this.options.load!=="languageOnly"&&i(this.formatLanguageCode(e)),this.options.load!=="languageOnly"&&this.options.load!=="currentOnly"&&i(this.getScriptPartFromCode(e)),this.options.load!=="currentOnly"&&i(this.getLanguagePartFromCode(e))):y(e)&&i(this.formatLanguageCode(e)),a.forEach(r=>{s.indexOf(r)<0&&i(this.formatLanguageCode(r))}),s}}const ve={zero:0,one:1,two:2,few:3,many:4,other:5},Se={select:n=>n===1?"one":"other",resolvedOptions:()=>({pluralCategories:["one","other"]})};class Ge{constructor(e,t={}){this.languageUtils=e,this.options=t,this.logger=V.create("pluralResolver"),this.pluralRulesCache={}}clearCache(){this.pluralRulesCache={}}getRule(e,t={}){const a=J(e==="dev"?"en":e),s=t.ordinal?"ordinal":"cardinal",i=JSON.stringify({cleanedCode:a,type:s});if(i in this.pluralRulesCache)return this.pluralRulesCache[i];let r;try{r=new Intl.PluralRules(a,{type:s})}catch{if(typeof Intl>"u")return this.logger.error("No Intl support, please use an Intl polyfill!"),Se;if(!e.match(/-|_/))return Se;const l=this.languageUtils.getLanguagePartFromCode(e);r=this.getRule(l,t)}return this.pluralRulesCache[i]=r,r}needsPlural(e,t={}){let a=this.getRule(e,t);return a||(a=this.getRule("dev",t)),(a==null?void 0:a.resolvedOptions().pluralCategories.length)>1}getPluralFormsOfKey(e,t,a={}){return this.getSuffixes(e,a).map(s=>`${t}${s}`)}getSuffixes(e,t={}){let a=this.getRule(e,t);return a||(a=this.getRule("dev",t)),a?a.resolvedOptions().pluralCategories.sort((s,i)=>ve[s]-ve[i]).map(s=>`${this.options.prepend}${t.ordinal?`ordinal${this.options.prepend}`:""}${s}`):[]}getSuffix(e,t,a={}){const s=this.getRule(e,a);return s?`${this.options.prepend}${a.ordinal?`ordinal${this.options.prepend}`:""}${s.select(t)}`:(this.logger.warn(`no plural rule found for: ${e}`),this.getSuffix("dev",t,a))}}const Le=(n,e,t,a=".",s=!0)=>{let i=Te(n,e,t);return!i&&s&&y(t)&&(i=re(n,t,a),i===void 0&&(i=re(e,t,a))),i},ae=n=>n.replace(/\$/g,"$$$$");class be{constructor(e={}){var t;this.logger=V.create("interpolator"),this.options=e,this.format=((t=e==null?void 0:e.interpolation)==null?void 0:t.format)||(a=>a),this.init(e)}init(e={}){e.interpolation||(e.interpolation={escapeValue:!0});const{escape:t,escapeValue:a,useRawValueToEscape:s,prefix:i,prefixEscaped:r,suffix:o,suffixEscaped:l,formatSeparator:c,unescapeSuffix:d,unescapePrefix:h,nestingPrefix:g,nestingPrefixEscaped:p,nestingSuffix:f,nestingSuffixEscaped:k,nestingOptionsSeparator:w,maxReplaces:$,alwaysFormat:C}=e.interpolation;this.escape=t!==void 0?t:Ue,this.escapeValue=a!==void 0?a:!0,this.useRawValueToEscape=s!==void 0?s:!1,this.prefix=i?D(i):r||"{{",this.suffix=o?D(o):l||"}}",this.formatSeparator=c||",",this.unescapePrefix=d?"":h||"-",this.unescapeSuffix=this.unescapePrefix?"":d||"",this.nestingPrefix=g?D(g):p||D("$t("),this.nestingSuffix=f?D(f):k||D(")"),this.nestingOptionsSeparator=w||",",this.maxReplaces=$||1e3,this.alwaysFormat=C!==void 0?C:!1,this.resetRegExp()}reset(){this.options&&this.init(this.options)}resetRegExp(){const e=(t,a)=>(t==null?void 0:t.source)===a?(t.lastIndex=0,t):new RegExp(a,"g");this.regexp=e(this.regexp,`${this.prefix}(.+?)${this.suffix}`),this.regexpUnescape=e(this.regexpUnescape,`${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`),this.nestingRegexp=e(this.nestingRegexp,`${this.nestingPrefix}((?:[^()"']+|"[^"]*"|'[^']*'|\\((?:[^()]|"[^"]*"|'[^']*')*\\))*?)${this.nestingSuffix}`)}interpolate(e,t,a,s){var p;let i,r,o;const l=this.options&&this.options.interpolation&&this.options.interpolation.defaultVariables||{},c=f=>{if(f.indexOf(this.formatSeparator)<0){const C=Le(t,l,f,this.options.keySeparator,this.options.ignoreJSONStructure);return this.alwaysFormat?this.format(C,void 0,a,{...s,...t,interpolationkey:f}):C}const k=f.split(this.formatSeparator),w=k.shift().trim(),$=k.join(this.formatSeparator).trim();return this.format(Le(t,l,w,this.options.keySeparator,this.options.ignoreJSONStructure),$,a,{...s,...t,interpolationkey:w})};this.resetRegExp();const d=(s==null?void 0:s.missingInterpolationHandler)||this.options.missingInterpolationHandler,h=((p=s==null?void 0:s.interpolation)==null?void 0:p.skipOnVariables)!==void 0?s.interpolation.skipOnVariables:this.options.interpolation.skipOnVariables;return[{regex:this.regexpUnescape,safeValue:f=>ae(f)},{regex:this.regexp,safeValue:f=>this.escapeValue?ae(this.escape(f)):ae(f)}].forEach(f=>{for(o=0;i=f.regex.exec(e);){const k=i[1].trim();if(r=c(k),r===void 0)if(typeof d=="function"){const $=d(e,i,s);r=y($)?$:""}else if(s&&Object.prototype.hasOwnProperty.call(s,k))r="";else if(h){r=i[0];continue}else this.logger.warn(`missed to pass in variable ${k} for interpolating ${e}`),r="";else!y(r)&&!this.useRawValueToEscape&&(r=fe(r));const w=f.safeValue(r);if(e=e.replace(i[0],w),h?(f.regex.lastIndex+=r.length,f.regex.lastIndex-=i[0].length):f.regex.lastIndex=0,o++,o>=this.maxReplaces)break}}),e}nest(e,t,a={}){let s,i,r;const o=(l,c)=>{const d=this.nestingOptionsSeparator;if(l.indexOf(d)<0)return l;const h=l.split(new RegExp(`${D(d)}[ ]*{`));let g=`{${h[1]}`;l=h[0],g=this.interpolate(g,r);const p=g.match(/'/g),f=g.match(/"/g);(((p==null?void 0:p.length)??0)%2===0&&!f||((f==null?void 0:f.length)??0)%2!==0)&&(g=g.replace(/'/g,'"'));try{r=JSON.parse(g),c&&(r={...c,...r})}catch(k){return this.logger.warn(`failed parsing options string in nesting for key ${l}`,k),`${l}${d}${g}`}return r.defaultValue&&r.defaultValue.indexOf(this.prefix)>-1&&delete r.defaultValue,l};for(;s=this.nestingRegexp.exec(e);){let l=[];r={...a},r=r.replace&&!y(r.replace)?r.replace:r,r.applyPostProcessor=!1,delete r.defaultValue;const c=/{.*}/.test(s[1])?s[1].lastIndexOf("}")+1:s[1].indexOf(this.formatSeparator);if(c!==-1&&(l=s[1].slice(c).split(this.formatSeparator).map(d=>d.trim()).filter(Boolean),s[1]=s[1].slice(0,c)),i=t(o.call(this,s[1].trim(),r),r),i&&s[0]===e&&!y(i))return i;y(i)||(i=fe(i)),i||(this.logger.warn(`missed to resolve ${s[1]} for nesting ${e}`),i=""),l.length&&(i=l.reduce((d,h)=>this.format(d,h,a.lng,{...a,interpolationkey:s[1].trim()}),i.trim())),e=e.replace(s[0],i),this.regexp.lastIndex=0}return e}}const We=n=>{let e=n.toLowerCase().trim();const t={};if(n.indexOf("(")>-1){const a=n.split("(");e=a[0].toLowerCase().trim();const s=a[1].substring(0,a[1].length-1);e==="currency"&&s.indexOf(":")<0?t.currency||(t.currency=s.trim()):e==="relativetime"&&s.indexOf(":")<0?t.range||(t.range=s.trim()):s.split(";").forEach(r=>{if(r){const[o,...l]=r.split(":"),c=l.join(":").trim().replace(/^'+|'+$/g,""),d=o.trim();t[d]||(t[d]=c),c==="false"&&(t[d]=!1),c==="true"&&(t[d]=!0),isNaN(c)||(t[d]=parseInt(c,10))}})}return{formatName:e,formatOptions:t}},we=n=>{const e={};return(t,a,s)=>{let i=s;s&&s.interpolationkey&&s.formatParams&&s.formatParams[s.interpolationkey]&&s[s.interpolationkey]&&(i={...i,[s.interpolationkey]:void 0});const r=a+JSON.stringify(i);let o=e[r];return o||(o=n(J(a),s),e[r]=o),o(t)}},Ye=n=>(e,t,a)=>n(J(t),a)(e);class Xe{constructor(e={}){this.logger=V.create("formatter"),this.options=e,this.init(e)}init(e,t={interpolation:{}}){this.formatSeparator=t.interpolation.formatSeparator||",";const a=t.cacheInBuiltFormats?we:Ye;this.formats={number:a((s,i)=>{const r=new Intl.NumberFormat(s,{...i});return o=>r.format(o)}),currency:a((s,i)=>{const r=new Intl.NumberFormat(s,{...i,style:"currency"});return o=>r.format(o)}),datetime:a((s,i)=>{const r=new Intl.DateTimeFormat(s,{...i});return o=>r.format(o)}),relativetime:a((s,i)=>{const r=new Intl.RelativeTimeFormat(s,{...i});return o=>r.format(o,i.range||"day")}),list:a((s,i)=>{const r=new Intl.ListFormat(s,{...i});return o=>r.format(o)})}}add(e,t){this.formats[e.toLowerCase().trim()]=t}addCached(e,t){this.formats[e.toLowerCase().trim()]=we(t)}format(e,t,a,s={}){const i=t.split(this.formatSeparator);if(i.length>1&&i[0].indexOf("(")>1&&i[0].indexOf(")")<0&&i.find(o=>o.indexOf(")")>-1)){const o=i.findIndex(l=>l.indexOf(")")>-1);i[0]=[i[0],...i.splice(1,o)].join(this.formatSeparator)}return i.reduce((o,l)=>{var h;const{formatName:c,formatOptions:d}=We(l);if(this.formats[c]){let g=o;try{const p=((h=s==null?void 0:s.formatParams)==null?void 0:h[s.interpolationkey])||{},f=p.locale||p.lng||s.locale||s.lng||a;g=this.formats[c](o,f,{...d,...s,...p})}catch(p){this.logger.warn(p)}return g}else this.logger.warn(`there was no format function for ${c}`);return o},e)}}const Qe=(n,e)=>{n.pending[e]!==void 0&&(delete n.pending[e],n.pendingCount--)};class et extends te{constructor(e,t,a,s={}){var i,r;super(),this.backend=e,this.store=t,this.services=a,this.languageUtils=a.languageUtils,this.options=s,this.logger=V.create("backendConnector"),this.waitingReads=[],this.maxParallelReads=s.maxParallelReads||10,this.readingCalls=0,this.maxRetries=s.maxRetries>=0?s.maxRetries:5,this.retryTimeout=s.retryTimeout>=1?s.retryTimeout:350,this.state={},this.queue=[],(r=(i=this.backend)==null?void 0:i.init)==null||r.call(i,a,s.backend,s)}queueLoad(e,t,a,s){const i={},r={},o={},l={};return e.forEach(c=>{let d=!0;t.forEach(h=>{const g=`${c}|${h}`;!a.reload&&this.store.hasResourceBundle(c,h)?this.state[g]=2:this.state[g]<0||(this.state[g]===1?r[g]===void 0&&(r[g]=!0):(this.state[g]=1,d=!1,r[g]===void 0&&(r[g]=!0),i[g]===void 0&&(i[g]=!0),l[h]===void 0&&(l[h]=!0)))}),d||(o[c]=!0)}),(Object.keys(i).length||Object.keys(r).length)&&this.queue.push({pending:r,pendingCount:Object.keys(r).length,loaded:{},errors:[],callback:s}),{toLoad:Object.keys(i),pending:Object.keys(r),toLoadLanguages:Object.keys(o),toLoadNamespaces:Object.keys(l)}}loaded(e,t,a){const s=e.split("|"),i=s[0],r=s[1];t&&this.emit("failedLoading",i,r,t),!t&&a&&this.store.addResourceBundle(i,r,a,void 0,void 0,{skipCopy:!0}),this.state[e]=t?-1:2,t&&a&&(this.state[e]=0);const o={};this.queue.forEach(l=>{Ie(l.loaded,[i],r),Qe(l,e),t&&l.errors.push(t),l.pendingCount===0&&!l.done&&(Object.keys(l.loaded).forEach(c=>{o[c]||(o[c]={});const d=l.loaded[c];d.length&&d.forEach(h=>{o[c][h]===void 0&&(o[c][h]=!0)})}),l.done=!0,l.errors.length?l.callback(l.errors):l.callback())}),this.emit("loaded",o),this.queue=this.queue.filter(l=>!l.done)}read(e,t,a,s=0,i=this.retryTimeout,r){if(!e.length)return r(null,{});if(this.readingCalls>=this.maxParallelReads){this.waitingReads.push({lng:e,ns:t,fcName:a,tried:s,wait:i,callback:r});return}this.readingCalls++;const o=(c,d)=>{if(this.readingCalls--,this.waitingReads.length>0){const h=this.waitingReads.shift();this.read(h.lng,h.ns,h.fcName,h.tried,h.wait,h.callback)}if(c&&d&&s<this.maxRetries){setTimeout(()=>{this.read.call(this,e,t,a,s+1,i*2,r)},i);return}r(c,d)},l=this.backend[a].bind(this.backend);if(l.length===2){try{const c=l(e,t);c&&typeof c.then=="function"?c.then(d=>o(null,d)).catch(o):o(null,c)}catch(c){o(c)}return}return l(e,t,o)}prepareLoading(e,t,a={},s){if(!this.backend)return this.logger.warn("No backend was added via i18next.use. Will not load resources."),s&&s();y(e)&&(e=this.languageUtils.toResolveHierarchy(e)),y(t)&&(t=[t]);const i=this.queueLoad(e,t,a,s);if(!i.toLoad.length)return i.pending.length||s(),null;i.toLoad.forEach(r=>{this.loadOne(r)})}load(e,t,a){this.prepareLoading(e,t,{},a)}reload(e,t,a){this.prepareLoading(e,t,{reload:!0},a)}loadOne(e,t=""){const a=e.split("|"),s=a[0],i=a[1];this.read(s,i,"read",void 0,void 0,(r,o)=>{r&&this.logger.warn(`${t}loading namespace ${i} for language ${s} failed`,r),!r&&o&&this.logger.log(`${t}loaded namespace ${i} for language ${s}`,o),this.loaded(e,r,o)})}saveMissing(e,t,a,s,i,r={},o=()=>{}){var l,c,d,h,g;if((c=(l=this.services)==null?void 0:l.utils)!=null&&c.hasLoadedNamespace&&!((h=(d=this.services)==null?void 0:d.utils)!=null&&h.hasLoadedNamespace(t))){this.logger.warn(`did not save key "${a}" as the namespace "${t}" was not yet loaded`,"This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");return}if(!(a==null||a==="")){if((g=this.backend)!=null&&g.create){const p={...r,isUpdate:i},f=this.backend.create.bind(this.backend);if(f.length<6)try{let k;f.length===5?k=f(e,t,a,s,p):k=f(e,t,a,s),k&&typeof k.then=="function"?k.then(w=>o(null,w)).catch(o):o(null,k)}catch(k){o(k)}else f(e,t,a,s,o,p)}!e||!e[0]||this.store.addResource(e[0],t,a,s)}}}const ie=()=>({debug:!1,initAsync:!0,ns:["translation"],defaultNS:["translation"],fallbackLng:["dev"],fallbackNS:!1,supportedLngs:!1,nonExplicitSupportedLngs:!1,load:"all",preload:!1,simplifyPluralSuffix:!0,keySeparator:".",nsSeparator:":",pluralSeparator:"_",contextSeparator:"_",partialBundledLanguages:!1,saveMissing:!1,updateMissing:!1,saveMissingTo:"fallback",saveMissingPlurals:!0,missingKeyHandler:!1,missingInterpolationHandler:!1,postProcess:!1,postProcessPassResolved:!1,returnNull:!1,returnEmptyString:!0,returnObjects:!1,joinArrays:!1,returnedObjectHandler:!1,parseMissingKeyHandler:!1,appendNamespaceToMissingKey:!1,appendNamespaceToCIMode:!1,overloadTranslationOptionHandler:n=>{let e={};if(typeof n[1]=="object"&&(e=n[1]),y(n[1])&&(e.defaultValue=n[1]),y(n[2])&&(e.tDescription=n[2]),typeof n[2]=="object"||typeof n[3]=="object"){const t=n[3]||n[2];Object.keys(t).forEach(a=>{e[a]=t[a]})}return e},interpolation:{escapeValue:!0,format:n=>n,prefix:"{{",suffix:"}}",formatSeparator:",",unescapePrefix:"-",nestingPrefix:"$t(",nestingSuffix:")",nestingOptionsSeparator:",",maxReplaces:1e3,skipOnVariables:!0},cacheInBuiltFormats:!0}),Me=n=>{var e,t;return y(n.ns)&&(n.ns=[n.ns]),y(n.fallbackLng)&&(n.fallbackLng=[n.fallbackLng]),y(n.fallbackNS)&&(n.fallbackNS=[n.fallbackNS]),((t=(e=n.supportedLngs)==null?void 0:e.indexOf)==null?void 0:t.call(e,"cimode"))<0&&(n.supportedLngs=n.supportedLngs.concat(["cimode"])),typeof n.initImmediate=="boolean"&&(n.initAsync=n.initImmediate),n},Y=()=>{},tt=n=>{Object.getOwnPropertyNames(Object.getPrototypeOf(n)).forEach(t=>{typeof n[t]=="function"&&(n[t]=n[t].bind(n))})};let Ce=!1;const st=n=>{var e,t,a,s,i,r,o,l,c;return!!(((a=(t=(e=n==null?void 0:n.modules)==null?void 0:e.backend)==null?void 0:t.name)==null?void 0:a.indexOf("Locize"))>0||((o=(r=(i=(s=n==null?void 0:n.modules)==null?void 0:s.backend)==null?void 0:i.constructor)==null?void 0:r.name)==null?void 0:o.indexOf("Locize"))>0||(c=(l=n==null?void 0:n.options)==null?void 0:l.backend)!=null&&c.backends&&n.options.backend.backends.some(d=>{var h,g,p;return((h=d==null?void 0:d.name)==null?void 0:h.indexOf("Locize"))>0||((p=(g=d==null?void 0:d.constructor)==null?void 0:g.name)==null?void 0:p.indexOf("Locize"))>0}))};class Z extends te{constructor(e={},t){if(super(),this.options=Me(e),this.services={},this.logger=V,this.modules={external:[]},tt(this),t&&!this.isInitialized&&!e.isClone){if(!this.options.initAsync)return this.init(e,t),this;setTimeout(()=>{this.init(e,t)},0)}}init(e={},t){this.isInitializing=!0,typeof e=="function"&&(t=e,e={}),e.defaultNS==null&&e.ns&&(y(e.ns)?e.defaultNS=e.ns:e.ns.indexOf("translation")<0&&(e.defaultNS=e.ns[0]));const a=ie();this.options={...a,...this.options,...Me(e)},this.options.interpolation={...a.interpolation,...this.options.interpolation},e.keySeparator!==void 0&&(this.options.userDefinedKeySeparator=e.keySeparator),e.nsSeparator!==void 0&&(this.options.userDefinedNsSeparator=e.nsSeparator),typeof this.options.overloadTranslationOptionHandler!="function"&&(this.options.overloadTranslationOptionHandler=a.overloadTranslationOptionHandler),this.options.showSupportNotice!==!1&&!st(this)&&!Ce&&(typeof console<"u"&&typeof console.info<"u"&&console.info("🌐 i18next is maintained with support from Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙"),Ce=!0);const s=c=>c?typeof c=="function"?new c:c:null;if(!this.options.isClone){this.modules.logger?V.init(s(this.modules.logger),this.options):V.init(null,this.options);let c;this.modules.formatter?c=this.modules.formatter:c=Xe;const d=new ke(this.options);this.store=new me(this.options.resources,this.options);const h=this.services;h.logger=V,h.resourceStore=this.store,h.languageUtils=d,h.pluralResolver=new Ge(d,{prepend:this.options.pluralSeparator,simplifyPluralSuffix:this.options.simplifyPluralSuffix}),this.options.interpolation.format&&this.options.interpolation.format!==a.interpolation.format&&this.logger.deprecate("init: you are still using the legacy format function, please use the new approach: https://www.i18next.com/translation-function/formatting"),c&&(!this.options.interpolation.format||this.options.interpolation.format===a.interpolation.format)&&(h.formatter=s(c),h.formatter.init&&h.formatter.init(h,this.options),this.options.interpolation.format=h.formatter.format.bind(h.formatter)),h.interpolator=new be(this.options),h.utils={hasLoadedNamespace:this.hasLoadedNamespace.bind(this)},h.backendConnector=new et(s(this.modules.backend),h.resourceStore,h,this.options),h.backendConnector.on("*",(p,...f)=>{this.emit(p,...f)}),this.modules.languageDetector&&(h.languageDetector=s(this.modules.languageDetector),h.languageDetector.init&&h.languageDetector.init(h,this.options.detection,this.options)),this.modules.i18nFormat&&(h.i18nFormat=s(this.modules.i18nFormat),h.i18nFormat.init&&h.i18nFormat.init(this)),this.translator=new ee(this.services,this.options),this.translator.on("*",(p,...f)=>{this.emit(p,...f)}),this.modules.external.forEach(p=>{p.init&&p.init(this)})}if(this.format=this.options.interpolation.format,t||(t=Y),this.options.fallbackLng&&!this.services.languageDetector&&!this.options.lng){const c=this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);c.length>0&&c[0]!=="dev"&&(this.options.lng=c[0])}!this.services.languageDetector&&!this.options.lng&&this.logger.warn("init: no languageDetector is used and no lng is defined"),["getResource","hasResourceBundle","getResourceBundle","getDataByLanguage"].forEach(c=>{this[c]=(...d)=>this.store[c](...d)}),["addResource","addResources","addResourceBundle","removeResourceBundle"].forEach(c=>{this[c]=(...d)=>(this.store[c](...d),this)});const o=B(),l=()=>{const c=(d,h)=>{this.isInitializing=!1,this.isInitialized&&!this.initializedStoreOnce&&this.logger.warn("init: i18next is already initialized. You should call init just once!"),this.isInitialized=!0,this.options.isClone||this.logger.log("initialized",this.options),this.emit("initialized",this.options),o.resolve(h),t(d,h)};if(this.languages&&!this.isInitialized)return c(null,this.t.bind(this));this.changeLanguage(this.options.lng,c)};return this.options.resources||!this.options.initAsync?l():setTimeout(l,0),o}loadResources(e,t=Y){var i,r;let a=t;const s=y(e)?e:this.language;if(typeof e=="function"&&(a=e),!this.options.resources||this.options.partialBundledLanguages){if((s==null?void 0:s.toLowerCase())==="cimode"&&(!this.options.preload||this.options.preload.length===0))return a();const o=[],l=c=>{if(!c||c==="cimode")return;this.services.languageUtils.toResolveHierarchy(c).forEach(h=>{h!=="cimode"&&o.indexOf(h)<0&&o.push(h)})};s?l(s):this.services.languageUtils.getFallbackCodes(this.options.fallbackLng).forEach(d=>l(d)),(r=(i=this.options.preload)==null?void 0:i.forEach)==null||r.call(i,c=>l(c)),this.services.backendConnector.load(o,this.options.ns,c=>{!c&&!this.resolvedLanguage&&this.language&&this.setResolvedLanguage(this.language),a(c)})}else a(null)}reloadResources(e,t,a){const s=B();return typeof e=="function"&&(a=e,e=void 0),typeof t=="function"&&(a=t,t=void 0),e||(e=this.languages),t||(t=this.options.ns),a||(a=Y),this.services.backendConnector.reload(e,t,i=>{s.resolve(),a(i)}),s}use(e){if(!e)throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");if(!e.type)throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");return e.type==="backend"&&(this.modules.backend=e),(e.type==="logger"||e.log&&e.warn&&e.error)&&(this.modules.logger=e),e.type==="languageDetector"&&(this.modules.languageDetector=e),e.type==="i18nFormat"&&(this.modules.i18nFormat=e),e.type==="postProcessor"&&je.addPostProcessor(e),e.type==="formatter"&&(this.modules.formatter=e),e.type==="3rdParty"&&this.modules.external.push(e),this}setResolvedLanguage(e){if(!(!e||!this.languages)&&!(["cimode","dev"].indexOf(e)>-1)){for(let t=0;t<this.languages.length;t++){const a=this.languages[t];if(!(["cimode","dev"].indexOf(a)>-1)&&this.store.hasLanguageSomeTranslations(a)){this.resolvedLanguage=a;break}}!this.resolvedLanguage&&this.languages.indexOf(e)<0&&this.store.hasLanguageSomeTranslations(e)&&(this.resolvedLanguage=e,this.languages.unshift(e))}}changeLanguage(e,t){this.isLanguageChangingTo=e;const a=B();this.emit("languageChanging",e);const s=o=>{this.language=o,this.languages=this.services.languageUtils.toResolveHierarchy(o),this.resolvedLanguage=void 0,this.setResolvedLanguage(o)},i=(o,l)=>{l?this.isLanguageChangingTo===e&&(s(l),this.translator.changeLanguage(l),this.isLanguageChangingTo=void 0,this.emit("languageChanged",l),this.logger.log("languageChanged",l)):this.isLanguageChangingTo=void 0,a.resolve((...c)=>this.t(...c)),t&&t(o,(...c)=>this.t(...c))},r=o=>{var d,h;!e&&!o&&this.services.languageDetector&&(o=[]);const l=y(o)?o:o&&o[0],c=this.store.hasLanguageSomeTranslations(l)?l:this.services.languageUtils.getBestMatchFromCodes(y(o)?[o]:o);c&&(this.language||s(c),this.translator.language||this.translator.changeLanguage(c),(h=(d=this.services.languageDetector)==null?void 0:d.cacheUserLanguage)==null||h.call(d,c)),this.loadResources(c,g=>{i(g,c)})};return!e&&this.services.languageDetector&&!this.services.languageDetector.async?r(this.services.languageDetector.detect()):!e&&this.services.languageDetector&&this.services.languageDetector.async?this.services.languageDetector.detect.length===0?this.services.languageDetector.detect().then(r):this.services.languageDetector.detect(r):r(e),a}getFixedT(e,t,a){const s=(i,r,...o)=>{let l;typeof r!="object"?l=this.options.overloadTranslationOptionHandler([i,r].concat(o)):l={...r},l.lng=l.lng||s.lng,l.lngs=l.lngs||s.lngs,l.ns=l.ns||s.ns,l.keyPrefix!==""&&(l.keyPrefix=l.keyPrefix||a||s.keyPrefix);const c=this.options.keySeparator||".";let d;return l.keyPrefix&&Array.isArray(i)?d=i.map(h=>(typeof h=="function"&&(h=oe(h,{...this.options,...r})),`${l.keyPrefix}${c}${h}`)):(typeof i=="function"&&(i=oe(i,{...this.options,...r})),d=l.keyPrefix?`${l.keyPrefix}${c}${i}`:i),this.t(d,l)};return y(e)?s.lng=e:s.lngs=e,s.ns=t,s.keyPrefix=a,s}t(...e){var t;return(t=this.translator)==null?void 0:t.translate(...e)}exists(...e){var t;return(t=this.translator)==null?void 0:t.exists(...e)}setDefaultNamespace(e){this.options.defaultNS=e}hasLoadedNamespace(e,t={}){if(!this.isInitialized)return this.logger.warn("hasLoadedNamespace: i18next was not initialized",this.languages),!1;if(!this.languages||!this.languages.length)return this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty",this.languages),!1;const a=t.lng||this.resolvedLanguage||this.languages[0],s=this.options?this.options.fallbackLng:!1,i=this.languages[this.languages.length-1];if(a.toLowerCase()==="cimode")return!0;const r=(o,l)=>{const c=this.services.backendConnector.state[`${o}|${l}`];return c===-1||c===0||c===2};if(t.precheck){const o=t.precheck(this,r);if(o!==void 0)return o}return!!(this.hasResourceBundle(a,e)||!this.services.backendConnector.backend||this.options.resources&&!this.options.partialBundledLanguages||r(a,e)&&(!s||r(i,e)))}loadNamespaces(e,t){const a=B();return this.options.ns?(y(e)&&(e=[e]),e.forEach(s=>{this.options.ns.indexOf(s)<0&&this.options.ns.push(s)}),this.loadResources(s=>{a.resolve(),t&&t(s)}),a):(t&&t(),Promise.resolve())}loadLanguages(e,t){const a=B();y(e)&&(e=[e]);const s=this.options.preload||[],i=e.filter(r=>s.indexOf(r)<0&&this.services.languageUtils.isSupportedCode(r));return i.length?(this.options.preload=s.concat(i),this.loadResources(r=>{a.resolve(),t&&t(r)}),a):(t&&t(),Promise.resolve())}dir(e){var s,i;if(e||(e=this.resolvedLanguage||(((s=this.languages)==null?void 0:s.length)>0?this.languages[0]:this.language)),!e)return"rtl";try{const r=new Intl.Locale(e);if(r&&r.getTextInfo){const o=r.getTextInfo();if(o&&o.direction)return o.direction}}catch{}const t=["ar","shu","sqr","ssh","xaa","yhd","yud","aao","abh","abv","acm","acq","acw","acx","acy","adf","ads","aeb","aec","afb","ajp","apc","apd","arb","arq","ars","ary","arz","auz","avl","ayh","ayl","ayn","ayp","bbz","pga","he","iw","ps","pbt","pbu","pst","prp","prd","ug","ur","ydd","yds","yih","ji","yi","hbo","men","xmn","fa","jpr","peo","pes","prs","dv","sam","ckb"],a=((i=this.services)==null?void 0:i.languageUtils)||new ke(ie());return e.toLowerCase().indexOf("-latn")>1?"ltr":t.indexOf(a.getLanguagePartFromCode(e))>-1||e.toLowerCase().indexOf("-arab")>1?"rtl":"ltr"}static createInstance(e={},t){const a=new Z(e,t);return a.createInstance=Z.createInstance,a}cloneInstance(e={},t=Y){const a=e.forkResourceStore;a&&delete e.forkResourceStore;const s={...this.options,...e,isClone:!0},i=new Z(s);if((e.debug!==void 0||e.prefix!==void 0)&&(i.logger=i.logger.clone(e)),["store","services","language"].forEach(o=>{i[o]=this[o]}),i.services={...this.services},i.services.utils={hasLoadedNamespace:i.hasLoadedNamespace.bind(i)},a){const o=Object.keys(this.store.data).reduce((l,c)=>(l[c]={...this.store.data[c]},l[c]=Object.keys(l[c]).reduce((d,h)=>(d[h]={...l[c][h]},d),l[c]),l),{});i.store=new me(o,s),i.services.resourceStore=i.store}if(e.interpolation){const l={...ie().interpolation,...this.options.interpolation,...e.interpolation},c={...s,interpolation:l};i.services.interpolator=new be(c)}return i.translator=new ee(i.services,s),i.translator.on("*",(o,...l)=>{i.emit(o,...l)}),i.init(s,t),i.translator.options=s,i.translator.backendConnector.services.utils={hasLoadedNamespace:i.hasLoadedNamespace.bind(i)},i}toJSON(){return{options:this.options,store:this.store,language:this.language,languages:this.languages,resolvedLanguage:this.resolvedLanguage}}}const N=Z.createInstance();N.createInstance;N.dir;N.init;N.loadResources;N.reloadResources;N.use;N.changeLanguage;N.getFixedT;N.t;N.exists;N.setDefaultNamespace;N.hasLoadedNamespace;N.loadNamespaces;N.loadLanguages;const at=(n,e,t,a)=>{var i,r,o,l;const s=[t,{code:e,...a||{}}];if((r=(i=n==null?void 0:n.services)==null?void 0:i.logger)!=null&&r.forward)return n.services.logger.forward(s,"warn","react-i18next::",!0);U(s[0])&&(s[0]=`react-i18next:: ${s[0]}`),(l=(o=n==null?void 0:n.services)==null?void 0:o.logger)!=null&&l.warn?n.services.logger.warn(...s):console!=null&&console.warn&&console.warn(...s)},Oe={},$e=(n,e,t,a)=>{U(t)&&Oe[t]||(U(t)&&(Oe[t]=new Date),at(n,e,t,a))},Ee=(n,e)=>()=>{if(n.isInitialized)e();else{const t=()=>{setTimeout(()=>{n.off("initialized",t)},0),e()};n.on("initialized",t)}},le=(n,e,t)=>{n.loadNamespaces(e,Ee(n,t))},Re=(n,e,t,a)=>{if(U(t)&&(t=[t]),n.options.preload&&n.options.preload.indexOf(e)>-1)return le(n,t,a);t.forEach(s=>{n.options.ns.indexOf(s)<0&&n.options.ns.push(s)}),n.loadLanguages(e,Ee(n,a))},it=(n,e,t={})=>!e.languages||!e.languages.length?($e(e,"NO_LANGUAGES","i18n.languages were undefined or empty",{languages:e.languages}),!0):e.hasLoadedNamespace(n,{lng:t.lng,precheck:(a,s)=>{if(t.bindI18n&&t.bindI18n.indexOf("languageChanging")>-1&&a.services.backendConnector.backend&&a.isLanguageChangingTo&&!s(a.isLanguageChangingTo,n))return!1}}),U=n=>typeof n=="string",nt=n=>typeof n=="object"&&n!==null,rt=/&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g,ot={"&amp;":"&","&#38;":"&","&lt;":"<","&#60;":"<","&gt;":">","&#62;":">","&apos;":"'","&#39;":"'","&quot;":'"',"&#34;":'"',"&nbsp;":" ","&#160;":" ","&copy;":"©","&#169;":"©","&reg;":"®","&#174;":"®","&hellip;":"…","&#8230;":"…","&#x2F;":"/","&#47;":"/"},lt=n=>ot[n],ct=n=>n.replace(rt,lt);let ce={bindI18n:"languageChanged",bindI18nStore:"",transEmptyNodeValue:"",transSupportBasicHtmlNodes:!0,transWrapTextNodes:"",transKeepBasicHtmlNodesFor:["br","strong","i","p"],useSuspense:!0,unescape:ct,transDefaultProps:void 0};const ht=(n={})=>{ce={...ce,...n}},ut=()=>ce;let Fe;const dt=n=>{Fe=n},ft=()=>Fe,$t={type:"3rdParty",init(n){ht(n.options.react),dt(n)}},pt=M.createContext();class gt{constructor(){this.usedNamespaces={}}addUsedNamespaces(e){e.forEach(t=>{this.usedNamespaces[t]||(this.usedNamespaces[t]=!0)})}getUsedNamespaces(){return Object.keys(this.usedNamespaces)}}var ze={exports:{}},Ve={};/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var K=M;function yt(n,e){return n===e&&(n!==0||1/n===1/e)||n!==n&&e!==e}var mt=typeof Object.is=="function"?Object.is:yt,xt=K.useState,kt=K.useEffect,vt=K.useLayoutEffect,St=K.useDebugValue;function Lt(n,e){var t=e(),a=xt({inst:{value:t,getSnapshot:e}}),s=a[0].inst,i=a[1];return vt(function(){s.value=t,s.getSnapshot=e,ne(s)&&i({inst:s})},[n,t,e]),kt(function(){return ne(s)&&i({inst:s}),n(function(){ne(s)&&i({inst:s})})},[n]),St(t),t}function ne(n){var e=n.getSnapshot;n=n.value;try{var t=e();return!mt(n,t)}catch{return!0}}function bt(n,e){return e()}var wt=typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"?bt:Lt;Ve.useSyncExternalStore=K.useSyncExternalStore!==void 0?K.useSyncExternalStore:wt;ze.exports=Ve;var Mt=ze.exports;const Ct=(n,e)=>U(e)?e:nt(e)&&U(e.defaultValue)?e.defaultValue:Array.isArray(n)?n[n.length-1]:n,Ot={t:Ct,ready:!1},Rt=()=>()=>{},Et=(n,e={})=>{var O,L,G;const{i18n:t}=e,{i18n:a,defaultNS:s}=M.useContext(pt)||{},i=t||a||ft();i&&!i.reportNamespaces&&(i.reportNamespaces=new gt),i||$e(i,"NO_I18NEXT_INSTANCE","useTranslation: You will need to pass in an i18next instance by using initReactI18next");const r=M.useMemo(()=>{var v;return{...ut(),...(v=i==null?void 0:i.options)==null?void 0:v.react,...e}},[i,e]),{useSuspense:o,keyPrefix:l}=r,c=s||((O=i==null?void 0:i.options)==null?void 0:O.defaultNS),d=U(c)?[c]:c||["translation"],h=M.useMemo(()=>d,d);(G=(L=i==null?void 0:i.reportNamespaces)==null?void 0:L.addUsedNamespaces)==null||G.call(L,h);const g=M.useRef(0),p=M.useCallback(v=>{if(!i)return Rt;const{bindI18n:m,bindI18nStore:x}=r,b=()=>{g.current+=1,v()};return m&&i.on(m,b),x&&i.store.on(x,b),()=>{m&&m.split(" ").forEach(j=>i.off(j,b)),x&&x.split(" ").forEach(j=>i.store.off(j,b))}},[i,r]),f=M.useRef(),k=M.useCallback(()=>{if(!i)return Ot;const v=!!(i.isInitialized||i.initializedStoreOnce)&&h.every(I=>it(I,i,r)),m=e.lng||i.language,x=g.current,b=f.current;if(b&&b.ready===v&&b.lng===m&&b.keyPrefix===l&&b.revision===x)return b;const z={t:i.getFixedT(m,r.nsMode==="fallback"?h:h[0],l),ready:v,lng:m,keyPrefix:l,revision:x};return f.current=z,z},[i,h,l,r,e.lng]),[w,$]=M.useState(0),{t:C,ready:R}=Mt.useSyncExternalStore(p,k,k);M.useEffect(()=>{if(i&&!R&&!o){const v=()=>$(m=>m+1);e.lng?Re(i,e.lng,h,v):le(i,h,v)}},[i,e.lng,h,R,o,w]);const S=i||{},P=M.useRef(null),H=M.useRef(),F=v=>{const m=Object.getOwnPropertyDescriptors(v);m.__original&&delete m.__original;const x=Object.create(Object.getPrototypeOf(v),m);if(!Object.prototype.hasOwnProperty.call(x,"__original"))try{Object.defineProperty(x,"__original",{value:v,writable:!1,enumerable:!1,configurable:!1})}catch{}return x},A=M.useMemo(()=>{const v=S,m=v==null?void 0:v.language;let x=v;v&&(P.current&&P.current.__original===v?H.current!==m?(x=F(v),P.current=x,H.current=m):x=P.current:(x=F(v),P.current=x,H.current=m));const b=[C,x,R];return b.t=C,b.i18n=x,b.ready=R,b},[C,S,R,S.resolvedLanguage,S.language,S.languages]);if(i&&o&&!R)throw new Promise(v=>{const m=()=>v();e.lng?Re(i,e.lng,h,m):le(i,h,m)});return A};/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var Pt={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jt=n=>n.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),u=(n,e)=>{const t=M.forwardRef(({color:a="currentColor",size:s=24,strokeWidth:i=2,absoluteStrokeWidth:r,className:o="",children:l,...c},d)=>M.createElement("svg",{ref:d,...Pt,width:s,height:s,stroke:a,strokeWidth:r?Number(i)*24/Number(s):i,className:["lucide",`lucide-${jt(n)}`,o].join(" "),...c},[...e.map(([h,g])=>M.createElement(h,g)),...Array.isArray(l)?l:[l]]));return t.displayName=`${n}`,t};/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ft=u("AlertCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zt=u("AlertTriangle",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",key:"c3ski4"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vt=u("AlignCenter",[["line",{x1:"21",x2:"3",y1:"6",y2:"6",key:"1fp77t"}],["line",{x1:"17",x2:"7",y1:"12",y2:"12",key:"rsh8ii"}],["line",{x1:"19",x2:"5",y1:"18",y2:"18",key:"1t0tuv"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ht=u("AlignLeft",[["line",{x1:"21",x2:"3",y1:"6",y2:"6",key:"1fp77t"}],["line",{x1:"15",x2:"3",y1:"12",y2:"12",key:"v6grx8"}],["line",{x1:"17",x2:"3",y1:"18",y2:"18",key:"1awlsn"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const At=u("AlignRight",[["line",{x1:"21",x2:"3",y1:"6",y2:"6",key:"1fp77t"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}],["line",{x1:"21",x2:"7",y1:"18",y2:"18",key:"1g9eri"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const It=u("ArrowLeftRight",[["path",{d:"M8 3 4 7l4 4",key:"9rb6wj"}],["path",{d:"M4 7h16",key:"6tx8e3"}],["path",{d:"m16 21 4-4-4-4",key:"siv7j2"}],["path",{d:"M20 17H4",key:"h6l3hr"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tt=u("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dt=u("ArrowRightLeft",[["path",{d:"m16 3 4 4-4 4",key:"1x1c3m"}],["path",{d:"M20 7H4",key:"zbl0bi"}],["path",{d:"m8 21-4-4 4-4",key:"h9nckh"}],["path",{d:"M4 17h16",key:"g4d7ey"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ut=u("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kt=u("Atom",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["path",{d:"M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z",key:"1l2ple"}],["path",{d:"M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z",key:"1wam0m"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qt=u("Award",[["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}],["path",{d:"M15.477 12.89 17 22l-5-3-5 3 1.523-9.11",key:"em7aur"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bt=u("BarChart3",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _t=u("Beaker",[["path",{d:"M4.5 3h15",key:"c7n0jr"}],["path",{d:"M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3",key:"m1uhx7"}],["path",{d:"M6 14h12",key:"4cwo0f"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zt=u("Bold",[["path",{d:"M14 12a4 4 0 0 0 0-8H6v8",key:"v2sylx"}],["path",{d:"M15 20a4 4 0 0 0 0-8H6v8Z",key:"1ef5ya"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jt=u("BookOpen",[["path",{d:"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z",key:"vv98re"}],["path",{d:"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",key:"1cyq3y"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gt=u("Book",[["path",{d:"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20",key:"t4utmx"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wt=u("Building",[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",ry:"2",key:"76otgf"}],["path",{d:"M9 22v-4h6v4",key:"r93iot"}],["path",{d:"M8 6h.01",key:"1dz90k"}],["path",{d:"M16 6h.01",key:"1x0f13"}],["path",{d:"M12 6h.01",key:"1vi96p"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M8 14h.01",key:"6423bh"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yt=u("Calculator",[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xt=u("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qt=u("CheckCircle2",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const es=u("CheckCircle",[["path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14",key:"g774vq"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ts=u("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ss=u("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const as=u("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const is=u("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ns=u("ClipboardList",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"M12 11h4",key:"1jrz19"}],["path",{d:"M12 16h4",key:"n85exb"}],["path",{d:"M8 11h.01",key:"1dfujw"}],["path",{d:"M8 16h.01",key:"18s6g9"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rs=u("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const os=u("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ls=u("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cs=u("EyeOff",[["path",{d:"M9.88 9.88a3 3 0 1 0 4.24 4.24",key:"1jxqfv"}],["path",{d:"M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68",key:"9wicm4"}],["path",{d:"M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61",key:"1jreej"}],["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hs=u("Eye",[["path",{d:"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",key:"rwhkz3"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const us=u("FileSpreadsheet",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 17h2",key:"10kma7"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ds=u("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fs=u("Filter",[["polygon",{points:"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3",key:"1yg77f"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ps=u("FolderPlus",[["path",{d:"M12 10v6",key:"1bos4e"}],["path",{d:"M9 13h6",key:"1uhe8q"}],["path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",key:"1kt360"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gs=u("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ys=u("GraduationCap",[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ms=u("GripVertical",[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xs=u("Hash",[["line",{x1:"4",x2:"20",y1:"9",y2:"9",key:"4lhtct"}],["line",{x1:"4",x2:"20",y1:"15",y2:"15",key:"vyu0kd"}],["line",{x1:"10",x2:"8",y1:"3",y2:"21",key:"1ggp8o"}],["line",{x1:"16",x2:"14",y1:"3",y2:"21",key:"weycgp"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ks=u("Heading1",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"m17 12 3-2v8",key:"1hhhft"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vs=u("Heading2",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1",key:"9jr5yi"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ss=u("Heading3",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2",key:"68ncm8"}],["path",{d:"M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2",key:"1ejuhz"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ls=u("HelpCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bs=u("Home",[["path",{d:"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"y5dka4"}],["polyline",{points:"9 22 9 12 15 12 15 22",key:"e2us08"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ws=u("Image",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ms=u("Italic",[["line",{x1:"19",x2:"10",y1:"4",y2:"4",key:"15jd3p"}],["line",{x1:"14",x2:"5",y1:"20",y2:"20",key:"bu0au3"}],["line",{x1:"15",x2:"9",y1:"4",y2:"20",key:"uljnxc"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cs=u("Languages",[["path",{d:"m5 8 6 6",key:"1wu5hv"}],["path",{d:"m4 14 6-6 2-3",key:"1k1g8d"}],["path",{d:"M2 5h12",key:"or177f"}],["path",{d:"M7 2h1",key:"1t2jsx"}],["path",{d:"m22 22-5-10-5 10",key:"don7ne"}],["path",{d:"M14 18h6",key:"1m8k6r"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Os=u("Layers",[["path",{d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",key:"8b97xw"}],["path",{d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",key:"dd6zsq"}],["path",{d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",key:"ep9fru"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rs=u("LayoutGrid",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ps=u("Leaf",[["path",{d:"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z",key:"nnexq3"}],["path",{d:"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",key:"mt58a7"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const js=u("Link",[["path",{d:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",key:"1cjeqo"}],["path",{d:"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",key:"19qd67"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ns=u("ListOrdered",[["line",{x1:"10",x2:"21",y1:"6",y2:"6",key:"76qw6h"}],["line",{x1:"10",x2:"21",y1:"12",y2:"12",key:"16nom4"}],["line",{x1:"10",x2:"21",y1:"18",y2:"18",key:"u3jurt"}],["path",{d:"M4 6h1v4",key:"cnovpq"}],["path",{d:"M4 10h2",key:"16xx2s"}],["path",{d:"M6 18H4c0-1 2-2 2-3s-1-1.5-2-1",key:"m9a95d"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $s=u("List",[["line",{x1:"8",x2:"21",y1:"6",y2:"6",key:"7ey8pc"}],["line",{x1:"8",x2:"21",y1:"12",y2:"12",key:"rjfblc"}],["line",{x1:"8",x2:"21",y1:"18",y2:"18",key:"c3b1m8"}],["line",{x1:"3",x2:"3.01",y1:"6",y2:"6",key:"1g7gq3"}],["line",{x1:"3",x2:"3.01",y1:"12",y2:"12",key:"1pjlvk"}],["line",{x1:"3",x2:"3.01",y1:"18",y2:"18",key:"28t2mc"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Es=u("Loader2",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fs=u("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zs=u("LogIn",[["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}],["polyline",{points:"10 17 15 12 10 7",key:"1ail0h"}],["line",{x1:"15",x2:"3",y1:"12",y2:"12",key:"v6grx8"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vs=u("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hs=u("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const As=u("MapPin",[["path",{d:"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z",key:"2oe9fu"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Is=u("Maximize2",[["polyline",{points:"15 3 21 3 21 9",key:"mznyad"}],["polyline",{points:"9 21 3 21 3 15",key:"1avn1i"}],["line",{x1:"21",x2:"14",y1:"3",y2:"10",key:"ota7mn"}],["line",{x1:"3",x2:"10",y1:"21",y2:"14",key:"1atl0r"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ts=u("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ds=u("Palette",[["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor",key:"1okk4w"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor",key:"f64h9f"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor",key:"fotxhn"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor",key:"qy21gx"}],["path",{d:"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",key:"12rzf8"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Us=u("PenLine",[["path",{d:"M12 20h9",key:"t2du7b"}],["path",{d:"M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z",key:"ymcmye"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ks=u("Phone",[["path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",key:"foiqr5"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qs=u("PlayCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polygon",{points:"10 8 16 12 10 16 10 8",key:"1cimsy"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bs=u("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _s=u("Presentation",[["path",{d:"M2 3h20",key:"91anmk"}],["path",{d:"M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3",key:"2k9sn8"}],["path",{d:"m7 21 5-5 5 5",key:"bip4we"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zs=u("Redo",[["path",{d:"M21 7v6h-6",key:"3ptur4"}],["path",{d:"M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7",key:"1kgawr"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Js=u("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gs=u("RotateCcw",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ws=u("Save",[["path",{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",key:"1owoqh"}],["polyline",{points:"17 21 17 13 7 13 7 21",key:"1md35c"}],["polyline",{points:"7 3 7 8 15 8",key:"8nz8an"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ys=u("School",[["path",{d:"M14 22v-4a2 2 0 1 0-4 0v4",key:"hhkicm"}],["path",{d:"m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2",key:"1vwozw"}],["path",{d:"M18 5v17",key:"1sw6gf"}],["path",{d:"m4 6 8-4 8 4",key:"1q0ilc"}],["path",{d:"M6 5v17",key:"1xfsm0"}],["circle",{cx:"12",cy:"9",r:"2",key:"1092wv"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xs=u("ScrollText",[["path",{d:"M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4",key:"13a6an"}],["path",{d:"M19 17V5a2 2 0 0 0-2-2H4",key:"zz82l3"}],["path",{d:"M15 8h-5",key:"1khuty"}],["path",{d:"M15 12h-5",key:"r7krc0"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qs=u("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ea=u("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ta=u("ShieldAlert",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sa=u("ShieldCheck",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const aa=u("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ia=u("Sigma",[["path",{d:"M18 7V4H6l6 8-6 8h12v-3",key:"zis8ev"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const na=u("Sparkles",[["path",{d:"m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",key:"17u4zn"}],["path",{d:"M5 3v4",key:"bklmnn"}],["path",{d:"M19 17v4",key:"iiml17"}],["path",{d:"M3 5h4",key:"nem4j1"}],["path",{d:"M17 19h4",key:"lbex7p"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ra=u("SquarePen",[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z",key:"1lpok0"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oa=u("Strikethrough",[["path",{d:"M16 4H9a3 3 0 0 0-2.83 4",key:"43sutm"}],["path",{d:"M14 12a4 4 0 0 1 0 8H6",key:"nlfj13"}],["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const la=u("Subscript",[["path",{d:"m4 5 8 8",key:"1eunvl"}],["path",{d:"m12 5-8 8",key:"1ah0jp"}],["path",{d:"M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07",key:"e8ta8j"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ca=u("Superscript",[["path",{d:"m4 19 8-8",key:"hr47gm"}],["path",{d:"m12 19-8-8",key:"1dhhmo"}],["path",{d:"M20 12h-4c0-1.5.442-2 1.5-2.5S20 8.334 20 7.002c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06",key:"1dfcux"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ha=u("Target",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ua=u("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const da=u("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fa=u("Trophy",[["path",{d:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6",key:"17hqa7"}],["path",{d:"M18 9h1.5a2.5 2.5 0 0 0 0-5H18",key:"lmptdp"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",key:"1nw9bq"}],["path",{d:"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",key:"1np0yb"}],["path",{d:"M18 2H6v7a6 6 0 0 0 12 0V2Z",key:"u46fv3"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pa=u("Underline",[["path",{d:"M6 4v6a6 6 0 0 0 12 0V4",key:"9kb039"}],["line",{x1:"4",x2:"20",y1:"20",y2:"20",key:"nun2al"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ga=u("Undo",[["path",{d:"M3 7v6h6",key:"1v2h90"}],["path",{d:"M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13",key:"1r6uu6"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ya=u("UserMinus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ma=u("UserPlus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xa=u("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ka=u("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const va=u("Video",[["path",{d:"m22 8-6 4 6 4V8Z",key:"50v9me"}],["rect",{width:"14",height:"12",x:"2",y:"6",rx:"2",ry:"2",key:"1rqjg6"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sa=u("XCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const La=u("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);export{cs as $,Ut as A,_t as B,ss as C,Ws as D,hs as E,ds as F,gs as G,bs as H,Us as I,Bs as J,Dt as K,Vs as L,Ts as M,ms as N,Wt as O,qs as P,Qs as Q,Gs as R,na as S,ua as T,xa as U,va as V,ma as W,La as X,ra as Y,ea as Z,As as _,Yt as a,sa as a0,aa as a1,ta as a2,Hs as a3,Fs as a4,zs as a5,ka as a6,js as a7,Xt as a8,ya as a9,Ss as aA,$s as aB,Ns as aC,Ht as aD,Vt as aE,At as aF,ia as aG,Ds as aH,xs as aI,It as aJ,ws as aK,fa as aa,qt as ab,os as ac,Js as ad,ls as ae,us as af,fs as ag,ha as ah,da as ai,Bt as aj,Ls as ak,Sa as al,Ks as am,Ys as an,zt as ao,Is as ap,ga as aq,Zs as ar,Zt as as,Ms as at,pa as au,oa as av,la as aw,ca as ax,ks as ay,vs as az,Kt as b,Cs as c,Xs as d,Ps as e,Jt as f,is as g,Rs as h,Qt as i,ts as j,Es as k,N as l,$t as m,Tt as n,Gt as o,_s as p,as as q,es as r,Mt as s,rs as t,Et as u,ns as v,Ft as w,ys as x,Os as y,ps as z};
