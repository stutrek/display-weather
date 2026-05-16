import{A as G,y as K,u as N}from"./hooks.module-CluIM-2o.js";import{a as L,g as _,b as U,d as J,j as Q,e as V}from"./colors-9XBv5i1n.js";import"./iframe-D33IsqwD.js";function Z(r){return r?["rainy","pouring","lightning-rainy","snowy-rainy"].some(i=>r.includes(i)):!1}function tt(r){return r?["snowy","snowy-rainy"].some(i=>r.includes(i)):!1}function et(r,e,i){if(r<=0)return 0;const n=e/1e4;return i?Math.max(1,Math.round(r*60*n)):Math.max(1,Math.round(r*15*n))}function nt(r,e,i,n,l){r.save(),r.font=`${l}px sans-serif`,r.textAlign="center",r.textBaseline="middle",r.fillStyle="white",r.fillText(e,i,n),r.restore()}function ot(r,e){const i=r.getContext("2d");if(!i||!e||e.length===0)return;const n=window.devicePixelRatio||1,l=r.width/n,s=r.height/n,w=l/e.length;e.forEach((v,u)=>{const c=v.precipitation??0;if(c<=0)return;const f=Z(v.condition),o=tt(v.condition);if(!f&&!o)return;const a=L(`${v.datetime}-precip`),d={x:u*w,y:0,width:w,height:s},t=w*s,p=et(c,t,o);if(p===0)return;const y=t/p,h=Math.sqrt(y)*.9,g=Math.max(8,Math.min(20,h)),x=_(p,d,g,30,a),b=()=>f&&o?a()<.5?"💧":"❄️":o?"❄️":"💧";x.forEach(R=>{const P=b();nt(i,P,R.x,R.y,10)})})}const rt=(()=>{if(typeof document>"u")return!1;try{const r=document.createElement("canvas");r.width=10,r.height=10;const e=r.getContext("2d");if(!e||(e.filter="blur(2px)",e.filter!=="blur(2px)"))return!1;const i=document.createElement("canvas");i.width=10,i.height=10;const n=i.getContext("2d");return n?(n.fillStyle="white",n.fillRect(5,5,1,1),e.filter="blur(2px)",e.drawImage(i,0,0),e.getImageData(4,5,1,1).data[3]>0):!1}catch{return!1}})();function it(r,e,i,n){n<1||ct(r,e,i,Math.min(n,254))}const st=[512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,289,287,285,282,280,278,275,273,271,269,267,265,263,261,259],at=[9,11,12,13,13,14,14,15,15,15,15,16,16,16,16,17,17,17,17,17,17,17,18,18,18,18,18,18,18,18,18,19,19,19,19,19,19,19,19,19,19,19,19,19,19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24];function ct(r,e,i,n){const l=r.getImageData(0,0,e,i),s=l.data,w=e-1,v=i-1,u=n+n+1,c=st[n],f=at[n],o=new Int32Array(u*4);let a,d,t,p,y,h,g,x,b,R,P,$,H,k,A,S,M,I,E,D=0,Y=0;for(let O=0;O<i;O++){p=y=h=g=0,x=b=R=P=0,$=H=k=A=0,S=s[D],M=s[D+1],I=s[D+2],E=s[D+3];for(let m=0;m<=n;m++){t=m*4,o[t]=S,o[t+1]=M,o[t+2]=I,o[t+3]=E;const C=n+1-m;p+=S*C,y+=M*C,h+=I*C,g+=E*C,x+=S,b+=M,R+=I,P+=E}for(let m=1;m<=n;m++){const C=D+((m>w?w:m)<<2);S=s[C],M=s[C+1],I=s[C+2],E=s[C+3],t=(n+m)*4,o[t]=S,o[t+1]=M,o[t+2]=I,o[t+3]=E,p+=S*(n+1-m),y+=M*(n+1-m),h+=I*(n+1-m),g+=E*(n+1-m),$+=S,H+=M,k+=I,A+=E}a=n;for(let m=0;m<e;m++){s[D]=p*c>>>f,s[D+1]=y*c>>>f,s[D+2]=h*c>>>f,s[D+3]=g*c>>>f,p-=x,y-=b,h-=R,g-=P,d=(a+u-n)%u,t=d*4,x-=o[t],b-=o[t+1],R-=o[t+2],P-=o[t+3];const C=m+n+1,T=Y+(C>w?w:C)*4;S=s[T],M=s[T+1],I=s[T+2],E=s[T+3],o[t]=S,o[t+1]=M,o[t+2]=I,o[t+3]=E,$+=S,H+=M,k+=I,A+=E,p+=$,y+=H,h+=k,g+=A,a=(a+1)%u,t=a*4,x+=o[t],b+=o[t+1],R+=o[t+2],P+=o[t+3],$-=o[t],H-=o[t+1],k-=o[t+2],A-=o[t+3],D+=4}Y+=e*4}for(let O=0;O<e;O++){D=O*4,p=y=h=g=0,x=b=R=P=0,$=H=k=A=0,S=s[D],M=s[D+1],I=s[D+2],E=s[D+3];for(let m=0;m<=n;m++){t=m*4,o[t]=S,o[t+1]=M,o[t+2]=I,o[t+3]=E;const C=n+1-m;p+=S*C,y+=M*C,h+=I*C,g+=E*C,x+=S,b+=M,R+=I,P+=E}for(let m=1;m<=n;m++){const C=D+(m>v?v:m)*e*4;S=s[C],M=s[C+1],I=s[C+2],E=s[C+3],t=(n+m)*4,o[t]=S,o[t+1]=M,o[t+2]=I,o[t+3]=E,p+=S*(n+1-m),y+=M*(n+1-m),h+=I*(n+1-m),g+=E*(n+1-m),$+=S,H+=M,k+=I,A+=E}a=n;for(let m=0;m<i;m++){const C=O*4+m*e*4;s[C]=p*c>>>f,s[C+1]=y*c>>>f,s[C+2]=h*c>>>f,s[C+3]=g*c>>>f,p-=x,y-=b,h-=R,g-=P,d=(a+u-n)%u,t=d*4,x-=o[t],b-=o[t+1],R-=o[t+2],P-=o[t+3];const T=m+n+1,X=O*4+(T>v?v:T)*e*4;S=s[X],M=s[X+1],I=s[X+2],E=s[X+3],o[t]=S,o[t+1]=M,o[t+2]=I,o[t+3]=E,$+=S,H+=M,k+=I,A+=E,p+=$,y+=H,h+=k,g+=A,a=(a+1)%u,t=a*4,x+=o[t],b+=o[t+1],R+=o[t+2],P+=o[t+3],$-=o[t],H-=o[t+1],k-=o[t+2],A-=o[t+3]}}r.putImageData(l,0,0)}const z={dayClear:"#44DAFF",dayCloudy:"#8A97A8",nightClear:"#2D1B4E",nightCloudy:"#2D1B4E"},B=12;function j(r,e){const i=new Date(r);if(!e.sunrise||!e.sunset){const w=i.getHours();return w>=6&&w<18}const n=i.getHours()*36e5+i.getMinutes()*6e4+i.getSeconds()*1e3+i.getMilliseconds(),l=e.sunrise.getHours()*36e5+e.sunrise.getMinutes()*6e4+e.sunrise.getSeconds()*1e3+e.sunrise.getMilliseconds(),s=e.sunset.getHours()*36e5+e.sunset.getMinutes()*6e4+e.sunset.getSeconds()*1e3+e.sunset.getMilliseconds();return n>=l&&n<s}function W(r,e,i){const n=F(r),l=F(e),s=Math.round(n.r+(l.r-n.r)*i),w=Math.round(n.g+(l.g-n.g)*i),v=Math.round(n.b+(l.b-n.b)*i);return lt(s,w,v)}function F(r){const e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return e?{r:Number.parseInt(e[1],16),g:Number.parseInt(e[2],16),b:Number.parseInt(e[3],16)}:{r:0,g:0,b:0}}function lt(r,e,i){return`#${[r,e,i].map(n=>n.toString(16).padStart(2,"0")).join("")}`}function ut(r,e,i){const n=j(r,i),l=(e??50)/100;return n?W(z.dayClear,z.dayCloudy,l):W(z.nightClear,z.nightCloudy,l)}function dt(r,e,i,n,l){r.save(),r.fillStyle="white",r.font=`${l}px sans-serif`,r.textAlign="center",r.textBaseline="middle",r.fillText(e,i,n),r.restore()}function q(r,e,i=2.5){return r.map(n=>{const s=((n.y-e.y)/e.height)**i;return{x:n.x,y:e.y+s*e.height}})}function ht(r,e,i){const n=r.getContext("2d");if(!n||!e||e.length===0)return;const l=window.devicePixelRatio||1,s=r.width/l,w=r.height/l;n.clearRect(0,0,s,w);const v=n.createLinearGradient(0,0,s,0),u=new Date(e[0].datetime).getTime(),c=new Date(e[e.length-1].datetime).getTime(),f=c-u,o=d=>f===0?0:(d-u)/f,a=[];if(e.forEach((d,t)=>{const p=t/(e.length-1),y=ut(d.datetime,d.cloud_coverage,i);a.push({position:p,color:y})}),i.sunrise){let d=i.sunrise.getTime();if(d<u&&(d+=1440*60*1e3),d>=u&&d<=c){const t=o(d),p=.001,y=e.reduce((x,b)=>x+(b.cloud_coverage??50),0)/e.length,h=W(z.nightClear,z.nightCloudy,y/100);a.push({position:Math.max(0,t-p),color:h,isSunEvent:!0});const g=W(z.dayClear,z.dayCloudy,y/100);a.push({position:Math.min(1,t+p),color:g,isSunEvent:!0,isAfterSun:!0})}}if(i.sunset){let d=i.sunset.getTime();if(d<u&&(d+=1440*60*1e3),d>=u&&d<=c){const t=o(d),p=.001,y=e.reduce((x,b)=>x+(b.cloud_coverage??50),0)/e.length,h=W(z.dayClear,z.dayCloudy,y/100);a.push({position:Math.max(0,t-p),color:h,isSunEvent:!0});const g=W(z.nightClear,z.nightCloudy,y/100);a.push({position:Math.min(1,t+p),color:g,isSunEvent:!0,isAfterSun:!0})}}a.sort((d,t)=>d.position-t.position),a.forEach(d=>{v.addColorStop(d.position,d.color)}),n.fillStyle=v,n.fillRect(0,0,s,w)}function mt(r,e,i){const n=r.getContext("2d");if(!n||!e||e.length===0)return;const l=window.devicePixelRatio||1,s=r.width/l,w=r.height/l,{getTempY:v}=U(e,w,i),u=y=>y/(e.length-1)*s,c=document.createElement("canvas"),f=(s+B*2)*l,o=w*l;c.width=f,c.height=o;const a=c.getContext("2d");if(!a)return;a.beginPath(),a.moveTo(0,w*l),e.forEach((y,h)=>{let g=(u(h)+B)*l;const x=v(y.temperature??0)*l;h===0&&(g-=B*l),h===e.length-1&&(g+=B*l),a.lineTo(g,x)}),a.lineTo(f,w*l),a.closePath(),a.fillStyle="white",a.fill();const d=document.createElement("canvas");d.width=s*l,d.height=w*l;const t=d.getContext("2d");if(!t)return;const p=Math.round(B*l);rt?(t.filter=`blur(${p}px)`,t.drawImage(c,-B*l,0),t.drawImage(c,-B*l,0),t.drawImage(c,-B*l,0),t.filter="none"):(it(a,c.width,c.height,p*l),t.drawImage(c,-B*l,0),t.drawImage(c,-B*l,0)),n.save(),n.globalCompositeOperation="destination-out",n.drawImage(d,0,0,s,w),n.restore()}function gt(r,e,i){const n=r.getContext("2d");if(!n||!e||e.length===0)return;const l=window.devicePixelRatio||1,s=r.width/l,w=r.height/l,v=s/e.length,u=w;e.forEach((c,f)=>{if(j(c.datetime,i))return;const o=L(`${c.datetime}-stars`),d=1-(c.cloud_coverage??50)/100,t={x:f*v,y:0,width:v,height:u},p=v*u,h=Math.max(1,Math.round(p*.03*d));if(h===0)return;const g=_(h,t,void 0,30,o),x=q(g,t,4);n.save(),n.fillStyle="white",x.forEach(b=>{const R=.25+o()/2,P=.4+o()*.6;n.globalAlpha=P-.5+d*.5,n.beginPath(),n.arc(b.x,b.y,R,0,Math.PI*2),n.fill()}),n.restore()})}function ft(r,e,i){const n=r.getContext("2d");if(!n||!e||e.length===0)return;const l=window.devicePixelRatio||1,s=r.width/l,w=r.height/l,v=s/e.length,u=w*.5;e.forEach((c,f)=>{if(!j(c.datetime,i))return;const o=L(`${c.datetime}-clouds`),a=c.cloud_coverage??0;if(a<=5)return;const d={x:f*v,y:0,width:v,height:u},t=v*u,y=Math.max(0,Math.round(t*.008*(a/100)));if(y===0)return;const h=t/y,g=Math.sqrt(h)*.8,x=_(y,d,g,30,o);q(x,d,1.5).forEach(R=>{const P=15+o()*5;dt(n,"☁️",R.x,R.y,P)})})}J`
/* Hourly Chart Container */
.hourly-chart-container {
  position: relative;
  width: 100%;
}

/* Weather Icons Row */
.hourly-icons-row {
  position: relative;
  width: 100%;
  height: 0.750em;
  margin-bottom: 0.125em;
}

.hourly-condition-line {
  position: absolute;
  bottom: 0;
  height: 0.0625em;
  background-color: var(--primary-text-color, #fff);
  opacity: 0.3;
}

.hourly-condition-tick {
  position: absolute;
  bottom: 0;
  width: 0.0625em;
  height: 0.375em;
  background-color: var(--primary-text-color, #fff);
  opacity: 0.3;
}

.hourly-condition-icon {
  position: absolute;
  bottom: -0.125em;
  color: var(--primary-text-color, #fff);
  transform: translateX(-50%);
}

/* Canvas Container */
.hourly-canvas-wrapper {
  position: relative;
}

.hourly-canvas {
  width: 100%;
  border-radius: 8px;
  display: block;
}

/* Temperature Labels Overlay */
.hourly-temp-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}

.hourly-temp-label {
  position: absolute;
  font-size: 0.75em;
  font-weight: 600;
  text-shadow: 0 0 0.2em var(--card-background-color, rgba(255,255,255,0.8)), 0 0 0.4em var(--card-background-color, rgba(255,255,255,0.6));
  white-space: nowrap;
  transform: translate(-50%, -50%);
}

/* Hour Timeline */
.hourly-timeline {
  position: relative;
  width: 100%;
  height: 1em;
  margin-top: 0.0625em;
}

.hourly-hour-label {
  position: absolute;
  font-size: 0.75em;
  font-weight: 500;
  color: var(--primary-text-color, #fff);
  transform: translateX(-50%);
}

.hourly-hour-tick {
  position: absolute;
  top: 0.3125em;
  width: 0.0625em;
  height: 0.375em;
  background-color: var(--primary-text-color, #fff);
  transform: translateX(-50%);
}

/* No Data State */
.hourly-no-data {
  padding: 1rem;
  text-align: center;
  color: #888;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .hourly-chart-container *,
  .hourly-canvas-wrapper * {
    animation: none !important;
    transition: none !important;
  }
}
`;function vt({forecast:r,sunTimes:e,height:i=120,pixelsPerDegree:n=3,maxItems:l=12,getTemperatureColor:s}){console.log("[HourlyChart] RENDER",{forecastCount:r.length});const w=G(null),v=G(null),u=r.slice(0,l);return K(()=>{const c=w.current,f=v.current;if(!c||!f||!u||u.length===0)return;const o=()=>{const d=f.offsetWidth,t=window.devicePixelRatio||1;c.style.width=`${d}px`,c.style.height=`${i}px`,c.width=d*t,c.height=i*t;const p=c.getContext("2d");p&&p.scale(t,t),ht(c,u,e),mt(c,u,n),gt(c,u,e),ft(c,u,e),V(c,u,n,s),ot(c,u)};o();const a=new ResizeObserver(o);return a.observe(f),()=>{a.disconnect()}},[u,e,i,n,s]),!u||u.length===0?N("div",{className:"hourly-no-data",children:"No forecast data available"}):N("div",{ref:v,className:"hourly-chart-container",children:N("div",{children:[N("div",{className:"hourly-icons-row",children:(()=>{const f=v.current?.offsetWidth||400,o=[];let a=null;u.forEach((h,g)=>{g===0||g===u.length-1||(!a||a.condition!==h.condition?(a&&o.push(a),a={startIndex:g,endIndex:g,condition:h.condition}):a.endIndex=g)}),a&&o.push(a);const d=Math.min(...o.map(h=>{const g=h.startIndex/(u.length-1);return(h.endIndex/(u.length-1)+1-g)*(f/u.length)})),y=Math.max(.5,Math.min(1.125,d/24));return o.map((h,g)=>{const x=Math.floor((h.startIndex+h.endIndex)/2),b=u[x],R=Q(h.condition,b.datetime,e),P=h.startIndex/(u.length-1)*100,$=h.endIndex/(u.length-1)*100,H=(P+$)/2,k=h.startIndex!==h.endIndex,A=g<o.length-1&&k;return N("div",{children:[k&&N("div",{className:"hourly-condition-line",style:{left:`${P}%`,right:`${100-$}%`}}),k&&N("div",{className:"hourly-condition-tick",style:{left:`${P}%`}}),A&&N("div",{className:"hourly-condition-tick",style:{left:`${$}%`}}),N("ha-icon",{icon:R,className:"hourly-condition-icon",style:{left:`${H}%`,"--mdc-icon-size":`${y}em`}})]},g)})})()}),N("div",{className:"hourly-canvas-wrapper",children:[N("canvas",{ref:w,className:"hourly-canvas",style:{height:`${i}px`}}),N("div",{className:"hourly-temp-overlay",style:{height:`${i}px`},children:(()=>{const{getTempY:c}=U(u,i,n);return u.map((f,o)=>{if(o===0||o===u.length-1)return null;const d=new Date(f.datetime).getHours();if(o===0||d%3!==0)return null;const t=f.temperature??0,p=o/(u.length-1)*100,y=c(t);return N("div",{className:"hourly-temp-label",style:{left:`${p}%`,top:`${y}px`},children:[Math.round(t),"°"]},o)})})()})]}),N("div",{className:"hourly-timeline",children:u.map((c,f)=>{if(f===0||f===u.length-1)return null;const a=new Date(c.datetime).getHours(),d=a===0?12:a>12?a-12:a,t=f/(u.length-1)*100;return a%3===0?N("div",{className:"hourly-hour-label",style:{left:`${t}%`},children:d},f):N("div",{className:"hourly-hour-tick",style:{left:`${t}%`}},f)})})]})})}export{vt as H};
