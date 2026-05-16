import{A as T,d as N,y as R,u as s}from"./hooks.module-CluIM-2o.js";import{a as $,g as P,d as D,i as S}from"./colors-9XBv5i1n.js";import"./iframe-D33IsqwD.js";function M(t,i){const e=[];t.forEach(l=>{l.temperature!==void 0&&e.push(l.temperature),l.templow!==void 0&&e.push(l.templow)});const r=Math.min(...e),d=Math.max(...e),a=d-r,m=20,u=i-m*2;return{getTempY:l=>{if(a===0)return i/2;const f=(l-r)/a;return m+(1-f)*u},minTemp:r,maxTemp:d,tempRange:a,padding:m,availableHeight:u}}function z(t,i,e,r,d){const a=t.getContext("2d");if(!a||!i||i.length===0)return;const m=M(i,r),u=e*.7;i.forEach((l,f)=>{const h=l.temperature??m.maxTemp,y=l.templow??m.minTemp,n=f*e+(e-u)/2,o=m.getTempY(h),c=m.getTempY(y),g=c-o,p=a.createLinearGradient(0,o,0,c);p.addColorStop(0,d(h)),p.addColorStop(1,d(y)),a.fillStyle=p,a.beginPath(),a.roundRect(n,o,u,g,8),a.fill()})}function E(t){return t?["rainy","pouring","lightning-rainy","snowy-rainy"].some(e=>t.includes(e)):!1}function k(t){return t?["snowy","snowy-rainy"].some(e=>t.includes(e)):!1}function B(t,i,e){if(t<=0)return 0;const r=i/1e4;return e?Math.max(1,Math.round(t*5*r)):Math.max(1,Math.round(t*15*r))}function j(t,i,e,r,d){t.save(),t.font=`${d}px sans-serif`,t.textAlign="center",t.textBaseline="middle",t.fillStyle="white",t.fillText(i,e,r),t.restore()}function Y(t,i,e,r){const d=t.getContext("2d");!d||!i||i.length===0||i.forEach((a,m)=>{const u=a.precipitation??0;if(u<=0)return;const l=E(a.condition),f=k(a.condition);if(!l&&!f)return;const h=$(`${a.datetime}-daily-precip`),y={x:m*e,y:0,width:e,height:r},b=e*r,n=B(u,b,f);if(n===0)return;const o=b/n,c=Math.sqrt(o)*.9,g=P(n,y,c,30,h),p=()=>l&&f?h()<.5?"💧":"❄️":f?"❄️":"💧";g.forEach(w=>{const v=p();j(d,v,w.x,w.y,10)})})}D`
/* Daily Chart Container */
.daily-chart-container {
  position: relative;
  width: 100%;
}

/* Day Labels Row */
.daily-labels-row {
  display: flex;
  width: 100%;
}

.daily-day-label {
  text-align: center;
  font-size: 0.75em;
  font-weight: 600;
  line-height: 1.2;
}

/* Weather Icons Row */
.daily-icons-row {
  display: flex;
  width: 100%;
  justify-content: space-around;
}

.daily-icon-cell {
  height: 1.25em;
  display: flex;
  justify-content: center;
  align-items: center;
}

.daily-weather-icon {
  --mdc-icon-size: 1em;
  color: var(--primary-text-color, #fff);
}

/* Precipitation Row */
.daily-precip-row {
  display: flex;
  width: 100%;
}

.daily-precip-cell {
  text-align: center;
  font-size: 0.625em;
  min-height: 0.625em;
}

/* Canvas Container */
.daily-canvas-container {
  position: relative;
  width: 100%;
}

.daily-canvas {
  width: 100%;
  border-radius: 8px;
  display: block;
}

/* Temperature Labels Overlay */
.daily-temp-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.daily-temp-high {
  position: absolute;
  font-size: 0.75em;
  font-weight: 600;
  text-shadow: 0 0 0.2em var(--card-background-color, rgba(255,255,255,0.8)), 0 0 0.4em var(--card-background-color, rgba(255,255,255,0.6));
  padding-bottom: 0.125em;
  transform: translate(-50%, -100%);
}

.daily-temp-low {
  position: absolute;
  font-size: 0.75em;
  font-weight: 600;
  text-shadow: 0 0 0.2em var(--card-background-color, rgba(255,255,255,0.8)), 0 0 0.4em var(--card-background-color, rgba(255,255,255,0.6));
  padding-top: 0.125em;
  transform: translateX(-50%);
}

/* No Data State */
.daily-no-data {
  padding: 1rem;
  text-align: center;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .daily-chart-container *,
  .daily-canvas-container * {
    animation: none !important;
    transition: none !important;
  }
}
`;function A(t){return new Date(t).toLocaleDateString("en-US",{weekday:"short"})}function L(t,i){return!t||t===0?"":i==="mm"?`${Math.round(t)}mm`:`${t.toFixed(1)}"`}function I({forecast:t,sunTimes:i,height:e=120,minColumnWidth:r=50,precipitationUnit:d="in",getTemperatureColor:a}){console.log("[DailyChart] RENDER",{forecastCount:t.length});const m=T(null),u=T(null),[l,f]=N(7);if(R(()=>{const n=m.current,o=u.current;if(!n||!o||!t||t.length===0)return;const c=()=>{const p=o.offsetWidth,w=window.devicePixelRatio||1,v=Math.max(1,Math.min(t.length,Math.floor(p/r))),x=p/v;n.style.width=`${p}px`,n.style.height=`${e}px`,n.width=p*w,n.height=e*w;const C=n.getContext("2d");C&&C.scale(w,w),f(v),z(n,t.slice(0,v),x,e,a),Y(n,t.slice(0,v),x,e)};c();const g=new ResizeObserver(c);return g.observe(o),()=>{g.disconnect()}},[t,i,e,r,a]),!t||t.length===0)return s("div",{className:"daily-no-data",children:"No forecast data available"});const h=t.slice(0,l),y=100/l,b=M(h,e);return s("div",{ref:u,className:"daily-chart-container",children:s("div",{children:[s("div",{className:"daily-labels-row",children:h.map((n,o)=>s("div",{className:"daily-day-label",style:{flex:`0 0 ${y}%`},children:A(n.datetime)},o))}),s("div",{className:"daily-icons-row",children:h.map((n,o)=>{const c=S(n.condition);return s("div",{className:"daily-icon-cell",style:{flex:`0 0 ${y}%`},children:s("ha-icon",{icon:c,className:"daily-weather-icon"})},o)})}),s("div",{className:"daily-precip-row",children:h.map((n,o)=>{const c=L(n.precipitation,d);return s("div",{className:"daily-precip-cell",style:{flex:`0 0 ${y}%`},children:c},o)})}),s("div",{className:"daily-canvas-container",children:[s("canvas",{ref:m,className:"daily-canvas",style:{height:`${e}px`}}),s("div",{className:"daily-temp-overlay",children:h.map((n,o)=>{const c=n.temperature??0,g=n.templow??0,p=(o+.5)*y,w=b.getTempY(c),v=b.getTempY(g);return s("div",{children:[s("div",{className:"daily-temp-high",style:{left:`${p}%`,top:`${w}px`},children:[Math.round(c),"°"]}),s("div",{className:"daily-temp-low",style:{left:`${p}%`,top:`${v}px`},children:[Math.round(g),"°"]})]},o)})})]})]})})}export{I as D};
