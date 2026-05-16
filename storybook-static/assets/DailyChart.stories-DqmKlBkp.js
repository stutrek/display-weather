import{u as p}from"./hooks.module-CluIM-2o.js";import{D as V}from"./index-CW9pz3-L.js";import{c as A}from"./colors-9XBv5i1n.js";import"./iframe-D33IsqwD.js";import"./preload-helper-PPVm8Dsz.js";const e={sunrise:new Date("2026-01-24T06:00:00"),sunset:new Date("2026-01-24T18:00:00"),dawn:new Date("2026-01-24T05:30:00"),dusk:new Date("2026-01-24T18:30:00")};function s(u,n,r,l,o,M){const H=[];for(let a=0;a<n;a++){const F=new Date(u);F.setDate(F.getDate()+a),H.push({datetime:F.toISOString(),condition:r[a%r.length],temperature:l[a%l.length],templow:o[a%o.length],precipitation:M[a%M.length],cloud_coverage:r[a%r.length].includes("cloudy")?80:20})}return H}const c=new Date("2026-01-25T12:00:00"),w=s(c,7,["sunny","sunny","sunny","partlycloudy","sunny","sunny","sunny"],[95,98,100,96,94,92,90],[72,75,78,74,70,68,66],[0,0,0,0,0,0,0]),i=s(c,7,["sunny","partlycloudy","cloudy","rainy","rainy","partlycloudy","sunny"],[75,72,68,65,66,70,74],[58,56,54,52,53,55,58],[0,0,0,.5,.8,.2,0]),m=s(c,7,["rainy","pouring","rainy","rainy","cloudy","rainy","rainy"],[62,60,58,59,62,61,60],[48,46,44,45,48,47,46],[.1,3,.5,1.2,.05,.8,.3]),U=s(c,7,["snowy","snowy","snowy","snowy-rainy","cloudy","snowy","partlycloudy"],[32,28,26,30,35,30,34],[18,15,12,16,20,18,22],[.1,3,8,.5,.05,2,0]),x=s(c,7,["sunny","cloudy","rainy","snowy","partlycloudy","sunny","clear"],[85,72,55,32,48,78,88],[65,58,42,18,30,56,68],[0,0,.6,.4,.1,0,0]),v=s(c,3,["sunny","partlycloudy","rainy"],[78,75,70],[60,58,55],[0,0,.5]),b=s(c,14,["sunny","partlycloudy","cloudy","rainy","rainy","partlycloudy","sunny"],[80,78,75,72,70,73,77,80,82,85,87,86,84,82],[62,60,58,56,54,57,60,63,65,68,70,69,67,65],[0,0,0,.3,.6,.2,0,0,0,0,0,.1,.2,0]);function t(u){const n=[];u.forEach(o=>{o.temperature!==void 0&&n.push(o.temperature),o.templow!==void 0&&n.push(o.templow)});const r=Math.min(...n),l=Math.max(...n);return A(r,l,10)}const I={title:"Weather/DailyChart",component:V,parameters:{layout:"padded",backgrounds:{default:"dark",values:[{name:"dark",value:"#1a1a2e"},{name:"light",value:"#f5f5f5"}]}},argTypes:{height:{control:{type:"range",min:80,max:200,step:10},defaultValue:120},minColumnWidth:{control:{type:"range",min:40,max:100,step:5},defaultValue:50},precipitationUnit:{control:{type:"select"},options:["in","mm"],defaultValue:"in"}}},d={args:{forecast:w,sunTimes:e,height:120,minColumnWidth:50,precipitationUnit:"in",getTemperatureColor:t(w)}},y={args:{forecast:i,sunTimes:e,height:120,minColumnWidth:50,precipitationUnit:"in",getTemperatureColor:t(i)}},g={args:{forecast:m,sunTimes:e,height:120,minColumnWidth:50,precipitationUnit:"in",getTemperatureColor:t(m)}},h={args:{forecast:U,sunTimes:e,height:120,minColumnWidth:50,precipitationUnit:"in",getTemperatureColor:t(U)}},T={args:{forecast:x,sunTimes:e,height:120,minColumnWidth:50,precipitationUnit:"in",getTemperatureColor:t(x)}},W={args:{forecast:v,sunTimes:e,height:120,minColumnWidth:50,precipitationUnit:"in",getTemperatureColor:t(v)}},f={args:{forecast:b,sunTimes:e,height:120,minColumnWidth:50,precipitationUnit:"in",getTemperatureColor:t(b)}},C={args:{forecast:i,sunTimes:e,height:180,minColumnWidth:50,precipitationUnit:"in",getTemperatureColor:t(i)}},k={args:{forecast:i,sunTimes:e,height:80,minColumnWidth:50,precipitationUnit:"in",getTemperatureColor:t(i)}},S={args:{forecast:m,sunTimes:e,height:120,minColumnWidth:50,precipitationUnit:"mm",getTemperatureColor:t(m)}},R=()=>p("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(400px, 1fr))",gap:"2rem",padding:"2rem",background:"#0f0f1e"},children:[{title:"Sunny Week (Hot)",data:w},{title:"Mixed Weather",data:i},{title:"Rainy Week",data:m},{title:"Snowy Week",data:U},{title:"Variable Week",data:x},{title:"Three Days",data:v},{title:"Two Weeks",data:b}].map((n,r)=>p("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:[p("h4",{style:{color:"#fff",fontSize:"14px",fontWeight:"600",margin:0,fontFamily:"system-ui, -apple-system, sans-serif"},children:n.title}),p(V,{forecast:n.data,sunTimes:e,height:120,minColumnWidth:50,precipitationUnit:"in",getTemperatureColor:t(n.data)})]},r))}),D={render:R};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    forecast: sunnyWeekHot,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(sunnyWeekHot)
  }
}`,...d.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    forecast: mixedWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(mixedWeek)
  }
}`,...y.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    forecast: rainyWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(rainyWeek)
  }
}`,...g.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    forecast: snowyWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(snowyWeek)
  }
}`,...h.parameters?.docs?.source}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    forecast: variableWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(variableWeek)
  }
}`,...T.parameters?.docs?.source}}};W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    forecast: threeDayForecast,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(threeDayForecast)
  }
}`,...W.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    forecast: twoWeekForecast,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(twoWeekForecast)
  }
}`,...f.parameters?.docs?.source}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    forecast: mixedWeek,
    sunTimes: defaultSunTimes,
    height: 180,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(mixedWeek)
  }
}`,...C.parameters?.docs?.source}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    forecast: mixedWeek,
    sunTimes: defaultSunTimes,
    height: 80,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(mixedWeek)
  }
}`,...k.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    forecast: rainyWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'mm',
    getTemperatureColor: createColorFnForDaily(rainyWeek)
  }
}`,...S.parameters?.docs?.source}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: AllScenariosGrid
}`,...D.parameters?.docs?.source}}};const j=["SunnyWeekHot","MixedWeather","RainyWeek","SnowyWeek","VariableWeek","ThreeDays","TwoWeeks","TallCanvas","ShortCanvas","MetricUnits","AllScenarios"];export{D as AllScenarios,S as MetricUnits,y as MixedWeather,g as RainyWeek,k as ShortCanvas,h as SnowyWeek,d as SunnyWeekHot,C as TallCanvas,W as ThreeDays,f as TwoWeeks,T as VariableWeek,j as __namedExportsOrder,I as default};
