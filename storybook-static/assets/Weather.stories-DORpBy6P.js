import{T as z,u as a,x as pe,d as ye,y as he}from"./hooks.module-CluIM-2o.js";import{X as we}from"./iframe-D33IsqwD.js";import{k as ge,u as ue,l as ce,h as _e,c as Te,d as De,f as fe}from"./colors-9XBv5i1n.js";import{D as ve}from"./index-CW9pz3-L.js";import{H as Fe}from"./index-BHlJGgz1.js";import"./preload-helper-PPVm8Dsz.js";const me=we(null);function be({config:t,entity:u,hourlyForecast:n,dailyForecast:i,sunTimes:r,latitude:c,children:d}){console.log("[WeatherProvider] RENDER");let y,S,f,T=!1,v="mph",w="in",D={sunrise:void 0,sunset:void 0,dawn:void 0,dusk:void 0},x;const Z=t.forecast_entity??t.entity;try{const{getHass:l}=ge(),h=l();v=h?.config?.unit_system?.wind_speed??"mph",w=h?.config?.unit_system?.accumulated_precipitation??"in",x=h?.config?.latitude,y=ue(t.entity);const g=ue("sun.sun");if(g?.attributes){const _=g.attributes;D={sunrise:_.next_rising?new Date(_.next_rising):void 0,sunset:_.next_setting?new Date(_.next_setting):void 0,dawn:_.next_dawn?new Date(_.next_dawn):void 0,dusk:_.next_dusk?new Date(_.next_dusk):void 0}}const p=ce(Z,"hourly");S=p.forecast,T=p.status==="loading";const ae=ce(Z,"daily");f=ae.forecast,T=T||ae.status==="loading"}catch{}const W=u??y,te=n??S,ne=i??f,ie=u?!1:T,oe=r??D,se=c??x,F=z(()=>{if(!te)return;const l=new Date,h=new Date(l);return h.setHours(l.getHours()+1,0,0,0),te.filter(g=>new Date(g.datetime)>=h)},[te]),b=z(()=>{if(!ne)return;const l=new Date,h=new Date(l.getFullYear(),l.getMonth(),l.getDate());return ne.filter(g=>{const p=new Date(g.datetime);return new Date(p.getFullYear(),p.getMonth(),p.getDate())>=h})},[ne]),de=z(()=>{const l=[];if(F&&F.forEach(p=>{p.temperature!==void 0&&l.push(p.temperature)}),b&&b.forEach(p=>{p.temperature!==void 0&&l.push(p.temperature),p.templow!==void 0&&l.push(p.templow)}),l.length===0)return _e;const h=Math.min(...l),g=Math.max(...l);return Te(h,g,12)},[F,b]),le=z(()=>(console.log("[WeatherProvider] useMemo - creating context value"),{config:t,entity:W,hourlyForecast:F,dailyForecast:b,loading:ie,windSpeedUnit:v,precipitationUnit:w,sunTimes:oe,latitude:se,getTemperatureColor:de}),[t,W,F,b,ie,v,w,oe,se,de]);return a(me.Provider,{value:le,children:d})}function Se(){const t=pe(me);if(!t)throw new Error("useWeather must be used within a WeatherProvider");return t}const xe={sunny:"mdi:weather-sunny","clear-night":"mdi:weather-night",cloudy:"mdi:weather-cloudy",partlycloudy:"mdi:weather-partly-cloudy","partlycloudy-night":"mdi:weather-night-partly-cloudy",rainy:"mdi:weather-rainy",pouring:"mdi:weather-pouring",snowy:"mdi:weather-snowy","snowy-rainy":"mdi:weather-snowy-rainy",fog:"mdi:weather-fog",hail:"mdi:weather-hail",lightning:"mdi:weather-lightning","lightning-rainy":"mdi:weather-lightning-rainy",windy:"mdi:weather-windy","windy-variant":"mdi:weather-windy-variant",exceptional:"mdi:alert-circle-outline",clear:"mdi:weather-sunny"};function Ze(t){return t?xe[t]??"mdi:weather-cloudy":"mdi:weather-cloudy"}function We(t){return new Intl.DateTimeFormat(void 0,{hour:"numeric",minute:"2-digit"}).format(t)}function ze(t){return t===void 0?"rotate(0deg)":`rotate(${t+180}deg)`}function Ee(){const[t,u]=ye(new Date);return he(()=>{const n=setInterval(()=>u(new Date),1e3);return()=>clearInterval(n)},[]),a("span",{class:"weather-time",children:We(t)})}function He({entity:t,windSpeedUnit:u}){const n=t.attributes,i=t.state,r=Ze(i),c=n.apparent_temperature!==void 0;return a("div",{class:"weather-header",children:[a("div",{class:"weather-temp-section",children:[a("div",{children:[a("div",{class:"weather-temp-large",children:a("div",{children:n.temperature!==void 0?`${Math.round(n.temperature)}°`:"--"})}),c&&a("span",{class:"weather-feels-like",children:["Feels like ",Math.round(n.apparent_temperature),"°"]})]}),a("div",{class:"weather-icon-section",children:a("ha-icon",{icon:r,class:"weather-icon-large"})})]}),a("div",{class:"weather-time-section",children:[a(Ee,{}),a("div",{class:"weather-details",children:[a("div",{class:"weather-detail-group",children:[a("ha-icon",{icon:"mdi:water-percent"}),a("span",{class:"detail-value",children:[n.humidity??"--","%"]}),a("span",{class:"detail-separator",children:"/"}),a("span",{class:"detail-value",children:n.dew_point!==void 0?`${Math.round(n.dew_point)}°`:"--"}),a("ha-icon",{icon:"mdi:thermometer-water"})]}),a("div",{class:"weather-detail-group",children:a("div",{class:"wind-main",children:[a("ha-icon",{icon:"mdi:weather-windy"}),a("span",{children:[a("span",{class:"detail-value",children:[n.wind_speed!==void 0?Math.round(n.wind_speed):"--",n.wind_gust_speed!==void 0&&a("span",{class:"wind-gust",children:["/",Math.round(n.wind_gust_speed)]})]}),a("span",{class:"wind-unit",children:[" ",u]})]}),a("ha-icon",{icon:"mdi:arrow-up",class:"wind-arrow",style:{transform:ze(n.wind_bearing)}})]})})]})]})]})}function ke(){console.log("[WeatherDisplay] RENDER");const{entity:t,hourlyForecast:u,dailyForecast:n,loading:i,windSpeedUnit:r,precipitationUnit:c,sunTimes:d,getTemperatureColor:y}=Se();return i&&!t?a("div",{class:"weather-loading",children:"Loading weather..."}):t?a("div",{class:"weather-display",children:[a(He,{entity:t,windSpeedUnit:r}),a("hr",{}),u&&a(Fe,{forecast:u,sunTimes:d,maxItems:20,height:80,getTemperatureColor:y}),a("hr",{}),n&&a(ve,{forecast:n,sunTimes:d,precipitationUnit:c,height:100,getTemperatureColor:y})]}):a("div",{class:"weather-error",children:"Weather entity not found"})}De`
:host {
  display: block;
}

.weather-card {
  color: var(--primary-text-color, #fff);
  font-family: system-ui, -apple-system, sans-serif;
  padding: 0.5em 1em 0.5em;
}

ha-card.size-small {
  font-size: 14px;
}

ha-card.size-medium {
  font-size: 17.5px;
}

ha-card.size-large {
  font-size: 21px;
}

.weather-loading,
.weather-error {
  text-align: center;
  padding: 2rem;
  color: var(--secondary-text-color, #888);
}

.weather-display hr {
  border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.1));
  margin: 0.5em 0;
}

/* Header: absolute positioning for all elements */
.weather-header {
  position: relative;
  margin-top: 0.25em;
  min-height: 4em; /* Adjust based on your needs */
  display: flex;
  flex-direction: row;
  align-items: space-between;
}

.weather-header-top {
  position: relative;
  width: 100%;
  height: 100%;
}

.weather-temp-section {
  display: flex;
}

.weather-temp-large {
  font-size: 3em;
  font-weight: 300;
  line-height: 1;
}

.weather-feels-like {
  white-space: nowrap;
  font-size: 0.625em;
  color: var(--secondary-text-color, #aaa);
  display: flex;
  align-items: center;
  gap: 0.25em;
}

.weather-icon-section {
}

.weather-icon-large {
  --mdc-icon-size: 3em;
  color: var(--primary-color, #f59e0b);
}

.weather-condition-text {

  font-size: 0.625em;
  color: var(--secondary-text-color, #aaa);
  white-space: nowrap;
}

.weather-time-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125em;
  line-height: 1.1;
}

.weather-time {
  font-size: 1.25em;
  text-align: right;
}

/* Details: humidity and wind side by side under time */
.weather-details {
  font-size: 0.75em;
}

/* Humidity / Dewpoint group */
.weather-detail-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25em;
  margin-top: 0.25em;
}

.weather-detail-group ha-icon {
  --mdc-icon-size: 1.25em;
  color: var(--secondary-text-color, #aaa);
}

.detail-value {
  font-size: 1em;
  font-weight: 500;
}

.detail-separator {
  color: var(--secondary-text-color, #aaa);
  margin: 0 0.125em;
}

/* Wind section */
.weather-detail-wind {
  display: flex;
  align-items: center;
}

.wind-main {
  display: flex;
  align-items: center;
  gap: 0.25em;
}

.wind-main ha-icon {
  --mdc-icon-size: 1.25em;
  color: var(--secondary-text-color, #aaa);
}

.wind-arrow {
  --mdc-icon-size: 1em;
  transition: transform 0.3s ease;
}

.wind-unit {
  font-size: 0.625em;
  color: var(--secondary-text-color, #aaa);
}

.wind-gust {
  font-size: 0.875em;
  color: var(--secondary-text-color, #aaa);
}

/* Forecast sections - both horizontal, fill width */
.forecast-section {
  display: flex;
  flex-direction: column;
}

.forecast-row {
  display: flex;
  justify-content: space-between;
  gap: 0.25em;
  overflow: hidden;
}

.forecast-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125em;
  flex: 1 1 0;
  min-width: 0;
  padding: 0.375em 0.25em;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.forecast-item-daily {
  /* Daily items can be slightly taller */
}

.forecast-time {
  font-size: 0.625em;
  color: var(--secondary-text-color, #aaa);
  white-space: nowrap;
}

.forecast-icon {
  --mdc-icon-size: 1.25em;
  color: var(--primary-color, #f59e0b);
}

.forecast-temp {
  font-size: 0.875em;
  font-weight: 500;
}

.forecast-temps {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.forecast-temp-low {
  font-size: 0.75em;
  color: var(--secondary-text-color, #aaa);
}

.forecast-precip {
  font-size: 0.625em;
  color: var(--info-color, #3b82f6);
}

/* Hourly Chart */
.hourly-chart {
  border-radius: 8px;
  overflow: hidden;
  margin: 0.25em 0;
  font-size: inherit;
}

/* Daily Chart */
.daily-chart {
  border-radius: 8px;
  overflow: hidden;
  margin: 0.25em 0;
  font-size: inherit;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .hourly-chart *,
  .daily-chart * {
    animation: none !important;
    transition: none !important;
  }
}
`;const Ce="weather.forecast_home",Re="snowy",Ne={temperature:31,dew_point:30,temperature_unit:"°F",humidity:98,cloud_coverage:100,uv_index:.6,pressure:30.07,pressure_unit:"inHg",wind_bearing:355.9,wind_speed:4.04,wind_speed_unit:"mph",visibility_unit:"mi",precipitation_unit:"in",attribution:"Weather forecast from met.no, delivered by the Norwegian Meteorological Institute.",friendly_name:"Forecast Home",supported_features:3},Me={id:"01KF8T7454MJES1RYKRGYRHKCN",parent_id:null,user_id:null},Ie="2026-01-18T15:05:16.196Z",Pe="2026-01-18T15:05:16.196Z",e={entity_id:Ce,state:Re,attributes:Ne,context:Me,last_changed:Ie,last_updated:Pe},o=[{condition:"snowy",datetime:"2026-01-18T17:00:00+00:00",wind_bearing:2.8,uv_index:2.1,temperature:33,templow:31,wind_speed:6.71,precipitation:.16,humidity:97},{condition:"sunny",datetime:"2026-01-19T17:00:00+00:00",wind_bearing:228.2,uv_index:2.3,temperature:32,templow:17,wind_speed:16.78,precipitation:.04,humidity:72},{condition:"sunny",datetime:"2026-01-20T17:00:00+00:00",wind_bearing:261,uv_index:1.8,temperature:26,templow:9,wind_speed:18.77,precipitation:0,humidity:60},{condition:"cloudy",datetime:"2026-01-21T17:00:00+00:00",wind_bearing:159,uv_index:0,temperature:25,templow:6,wind_speed:12.55,precipitation:0,humidity:51},{condition:"sunny",datetime:"2026-01-22T17:00:00+00:00",wind_bearing:257.7,temperature:36,templow:32,wind_speed:9.63,precipitation:0,humidity:56},{condition:"cloudy",datetime:"2026-01-23T17:00:00+00:00",wind_bearing:201.4,temperature:28,templow:16,wind_speed:8.95,precipitation:0,humidity:54}],re=JSON.parse('[{"condition":"snowy","datetime":"2026-01-18T16:00:00+00:00","wind_bearing":3.9,"cloud_coverage":100,"uv_index":1.8,"temperature":32,"wind_speed":5.16,"precipitation":0.01,"humidity":98},{"condition":"snowy","datetime":"2026-01-18T17:00:00+00:00","wind_bearing":2.8,"cloud_coverage":100,"uv_index":2.1,"temperature":32,"wind_speed":6.03,"precipitation":0.02,"humidity":97},{"condition":"snowy-rainy","datetime":"2026-01-18T18:00:00+00:00","wind_bearing":3.8,"cloud_coverage":100,"uv_index":1.9,"temperature":33,"wind_speed":6.28,"precipitation":0.02,"humidity":96},{"condition":"snowy-rainy","datetime":"2026-01-18T19:00:00+00:00","wind_bearing":19.6,"cloud_coverage":100,"uv_index":1.3,"temperature":33,"wind_speed":6.71,"precipitation":0.01,"humidity":96},{"condition":"snowy-rainy","datetime":"2026-01-18T20:00:00+00:00","wind_bearing":20,"cloud_coverage":100,"uv_index":0.6,"temperature":33,"wind_speed":6.46,"precipitation":0.01,"humidity":97},{"condition":"snowy-rainy","datetime":"2026-01-18T21:00:00+00:00","wind_bearing":9,"cloud_coverage":100,"uv_index":0.2,"temperature":33,"wind_speed":6.28,"precipitation":0.02,"humidity":98},{"condition":"snowy-rainy","datetime":"2026-01-18T22:00:00+00:00","wind_bearing":355.9,"cloud_coverage":100,"uv_index":0,"temperature":33,"wind_speed":6.03,"precipitation":0.02,"humidity":98},{"condition":"snowy-rainy","datetime":"2026-01-18T23:00:00+00:00","wind_bearing":342.4,"cloud_coverage":100,"uv_index":0,"temperature":33,"wind_speed":5.34,"precipitation":0.02,"humidity":99},{"condition":"snowy-rainy","datetime":"2026-01-19T00:00:00+00:00","wind_bearing":329,"cloud_coverage":100,"uv_index":0,"temperature":32,"wind_speed":5.84,"precipitation":0.02,"humidity":99},{"condition":"snowy-rainy","datetime":"2026-01-19T01:00:00+00:00","wind_bearing":313.2,"cloud_coverage":100,"uv_index":0,"temperature":32,"wind_speed":5.34,"precipitation":0.02,"humidity":99},{"condition":"cloudy","datetime":"2026-01-19T02:00:00+00:00","wind_bearing":335.4,"cloud_coverage":100,"uv_index":0,"temperature":32,"wind_speed":6.46,"precipitation":0,"humidity":98},{"condition":"cloudy","datetime":"2026-01-19T03:00:00+00:00","wind_bearing":344.6,"cloud_coverage":100,"uv_index":0,"temperature":31,"wind_speed":8.26,"precipitation":0,"humidity":94},{"condition":"cloudy","datetime":"2026-01-19T04:00:00+00:00","wind_bearing":340.6,"cloud_coverage":100,"uv_index":0,"temperature":30,"wind_speed":7.83,"precipitation":0,"humidity":91},{"condition":"cloudy","datetime":"2026-01-19T05:00:00+00:00","wind_bearing":318.8,"cloud_coverage":100,"uv_index":0,"temperature":29,"wind_speed":7.58,"precipitation":0,"humidity":89},{"condition":"cloudy","datetime":"2026-01-19T06:00:00+00:00","wind_bearing":320.6,"cloud_coverage":100,"uv_index":0,"temperature":29,"wind_speed":8.26,"precipitation":0,"humidity":88},{"condition":"cloudy","datetime":"2026-01-19T07:00:00+00:00","wind_bearing":310.3,"cloud_coverage":100,"uv_index":0,"temperature":29,"wind_speed":7.83,"precipitation":0,"humidity":89},{"condition":"cloudy","datetime":"2026-01-19T08:00:00+00:00","wind_bearing":302.1,"cloud_coverage":100,"uv_index":0,"temperature":29,"wind_speed":8.08,"precipitation":0,"humidity":88},{"condition":"cloudy","datetime":"2026-01-19T09:00:00+00:00","wind_bearing":294.9,"cloud_coverage":100,"uv_index":0,"temperature":27,"wind_speed":8.51,"precipitation":0,"humidity":83},{"condition":"cloudy","datetime":"2026-01-19T10:00:00+00:00","wind_bearing":288.6,"cloud_coverage":99.2,"uv_index":0,"temperature":25,"wind_speed":11.62,"precipitation":0,"humidity":79},{"condition":"partlycloudy","datetime":"2026-01-19T11:00:00+00:00","wind_bearing":282.1,"cloud_coverage":49.2,"uv_index":0,"temperature":23,"wind_speed":11.43,"precipitation":0,"humidity":78},{"condition":"partlycloudy","datetime":"2026-01-19T12:00:00+00:00","wind_bearing":263.7,"cloud_coverage":17.2,"uv_index":0,"temperature":19,"wind_speed":10.07,"precipitation":0,"humidity":76},{"condition":"partlycloudy","datetime":"2026-01-19T13:00:00+00:00","wind_bearing":252.2,"cloud_coverage":24.2,"uv_index":0.2,"temperature":17,"wind_speed":9.63,"precipitation":0,"humidity":78},{"condition":"sunny","datetime":"2026-01-19T14:00:00+00:00","wind_bearing":247.9,"cloud_coverage":1.6,"uv_index":0.7,"temperature":18,"wind_speed":10.5,"precipitation":0,"humidity":77},{"condition":"sunny","datetime":"2026-01-19T15:00:00+00:00","wind_bearing":241.6,"cloud_coverage":0,"uv_index":1.4,"temperature":19,"wind_speed":10.5,"precipitation":0,"humidity":75},{"condition":"sunny","datetime":"2026-01-19T16:00:00+00:00","wind_bearing":240,"cloud_coverage":0.8,"uv_index":2,"temperature":21,"wind_speed":9.82,"precipitation":0,"humidity":72},{"condition":"sunny","datetime":"2026-01-19T17:00:00+00:00","wind_bearing":228.2,"cloud_coverage":0,"uv_index":2.3,"temperature":24,"wind_speed":9.2,"precipitation":0,"humidity":72},{"condition":"sunny","datetime":"2026-01-19T18:00:00+00:00","wind_bearing":209.7,"cloud_coverage":0,"uv_index":2,"temperature":26,"wind_speed":11.18,"precipitation":0,"humidity":72},{"condition":"partlycloudy","datetime":"2026-01-19T19:00:00+00:00","wind_bearing":222.7,"cloud_coverage":69.5,"uv_index":1.4,"temperature":28,"wind_speed":13.17,"precipitation":0,"humidity":70},{"condition":"partlycloudy","datetime":"2026-01-19T20:00:00+00:00","wind_bearing":231.1,"cloud_coverage":44.5,"uv_index":0.7,"temperature":29,"wind_speed":16.78,"precipitation":0,"humidity":69},{"condition":"partlycloudy","datetime":"2026-01-19T21:00:00+00:00","wind_bearing":237,"cloud_coverage":66.4,"uv_index":0.2,"temperature":28,"wind_speed":14.54,"precipitation":0,"humidity":68},{"condition":"clear-night","datetime":"2026-01-19T22:00:00+00:00","wind_bearing":230.9,"cloud_coverage":2.3,"uv_index":0,"temperature":27,"wind_speed":11.87,"precipitation":0,"humidity":70},{"condition":"clear-night","datetime":"2026-01-19T23:00:00+00:00","wind_bearing":220.1,"cloud_coverage":0,"uv_index":0,"temperature":24,"wind_speed":9.2,"precipitation":0,"humidity":73},{"condition":"clear-night","datetime":"2026-01-20T00:00:00+00:00","wind_bearing":233.6,"cloud_coverage":0,"uv_index":0,"temperature":24,"wind_speed":10.31,"precipitation":0,"humidity":75},{"condition":"clear-night","datetime":"2026-01-20T01:00:00+00:00","wind_bearing":248,"cloud_coverage":0,"uv_index":0,"temperature":24,"wind_speed":11.87,"precipitation":0,"humidity":72},{"condition":"partlycloudy","datetime":"2026-01-20T02:00:00+00:00","wind_bearing":249.7,"cloud_coverage":25.8,"uv_index":0,"temperature":26,"wind_speed":12.55,"precipitation":0,"humidity":65},{"condition":"partlycloudy","datetime":"2026-01-20T03:00:00+00:00","wind_bearing":263.5,"cloud_coverage":41.4,"uv_index":0,"temperature":25,"wind_speed":16.53,"precipitation":0,"humidity":68},{"condition":"partlycloudy","datetime":"2026-01-20T04:00:00+00:00","wind_bearing":263.7,"cloud_coverage":28.9,"uv_index":0,"temperature":22,"wind_speed":18.33,"precipitation":0,"humidity":64},{"condition":"clear-night","datetime":"2026-01-20T05:00:00+00:00","wind_bearing":269.3,"cloud_coverage":0,"uv_index":0,"temperature":18,"wind_speed":18.77,"precipitation":0,"humidity":63},{"condition":"clear-night","datetime":"2026-01-20T06:00:00+00:00","wind_bearing":269.5,"cloud_coverage":0,"uv_index":0,"temperature":15,"wind_speed":18.14,"precipitation":0,"humidity":62},{"condition":"clear-night","datetime":"2026-01-20T07:00:00+00:00","wind_bearing":267.5,"cloud_coverage":0,"uv_index":0,"temperature":13,"wind_speed":16.09,"precipitation":0,"humidity":64},{"condition":"clear-night","datetime":"2026-01-20T08:00:00+00:00","wind_bearing":264.2,"cloud_coverage":0,"uv_index":0,"temperature":12,"wind_speed":15.41,"precipitation":0,"humidity":66},{"condition":"clear-night","datetime":"2026-01-20T09:00:00+00:00","wind_bearing":260.5,"cloud_coverage":0,"uv_index":0,"temperature":11,"wind_speed":14.79,"precipitation":0,"humidity":68},{"condition":"clear-night","datetime":"2026-01-20T10:00:00+00:00","wind_bearing":257.3,"cloud_coverage":0,"uv_index":0,"temperature":10,"wind_speed":14.54,"precipitation":0,"humidity":69},{"condition":"clear-night","datetime":"2026-01-20T11:00:00+00:00","wind_bearing":256.4,"cloud_coverage":0,"uv_index":0,"temperature":10,"wind_speed":14.11,"precipitation":0,"humidity":70},{"condition":"sunny","datetime":"2026-01-20T12:00:00+00:00","wind_bearing":257.5,"cloud_coverage":0,"uv_index":0,"temperature":9,"wind_speed":13.42,"precipitation":0,"humidity":71},{"condition":"sunny","datetime":"2026-01-20T13:00:00+00:00","wind_bearing":263.7,"cloud_coverage":0,"uv_index":0.2,"temperature":9,"wind_speed":14.11,"precipitation":0,"humidity":71},{"condition":"sunny","datetime":"2026-01-20T14:00:00+00:00","wind_bearing":264.2,"cloud_coverage":0,"uv_index":0.6,"temperature":10,"wind_speed":14.54,"precipitation":0,"humidity":69},{"condition":"sunny","datetime":"2026-01-20T15:00:00+00:00","wind_bearing":252.8,"cloud_coverage":0.8,"uv_index":1.2,"temperature":12,"wind_speed":15.22,"precipitation":0,"humidity":67}]'),s={entity:"weather.forecast_home"},Le={sunrise:new Date("2026-01-18T06:00:00Z"),sunset:new Date("2026-01-18T18:00:00Z"),dawn:new Date("2026-01-18T05:30:00Z"),dusk:new Date("2026-01-18T18:30:00Z")};function m(t){const{startDate:u,hours:n,conditions:i,tempRange:r,cloudCoverage:c=50,precipitation:d=0,windSpeed:y=5,windBearing:S=180}=t,f=[],[T,v]=r;for(let w=0;w<n;w++){const D=new Date(u);D.setHours(D.getHours()+w);const x=D.getHours(),Z=Math.sin((x-6)/24*Math.PI),W=T+(v-T)*Math.max(0,Z);f.push({datetime:D.toISOString(),condition:i[w%i.length],temperature:Math.round(W),cloud_coverage:c,precipitation:d,precipitation_probability:d>0?80:10,wind_speed:y,wind_bearing:S,humidity:50+(d>0?30:0)})}return f}function Oe({config:t,entity:u,hourlyForecast:n,dailyForecast:i,sunTimes:r=Le,latitude:c=40,fontSize:d="medium"}){const y={...t,size:d};return a(be,{config:y,entity:u,hourlyForecast:n,dailyForecast:i,sunTimes:r,latitude:c,children:[a("style",{children:fe()}),a("ha-card",{class:`size-${d}`,style:{width:"400px"},children:a("div",{class:"card-content weather-card",children:a(ke,{})})})]})}const je={title:"Weather/HourlyChart",component:Oe,parameters:{layout:"centered",backgrounds:{default:"dark",values:[{name:"dark",value:"#0d0d0d"}]}},argTypes:{fontSize:{control:"select",options:["small","medium","large"],description:"Widget size"},latitude:{control:"number",description:"Latitude (positive=north, negative=south)"}}},E={args:{config:s,entity:e,hourlyForecast:re,dailyForecast:o,fontSize:"medium"}},H={name:"Ice - Light Freeze (32°F)",args:{config:s,entity:{...e,state:"cloudy",attributes:{...e.attributes,temperature:32}},hourlyForecast:m({startDate:new Date("2026-01-18T08:00:00"),hours:12,conditions:["cloudy"],tempRange:[30,34],cloudCoverage:80}),dailyForecast:o,fontSize:"medium"}},k={name:"Ice - Deep Freeze (-10°F)",args:{config:s,entity:{...e,state:"snowy",attributes:{...e.attributes,temperature:-10}},hourlyForecast:m({startDate:new Date("2026-01-18T08:00:00"),hours:12,conditions:["snowy"],tempRange:[-15,-5],cloudCoverage:100,precipitation:.5}),dailyForecast:o,fontSize:"medium"}},C={name:"Puddles - Light Rain",args:{config:s,entity:{...e,state:"rainy",attributes:{...e.attributes,temperature:55}},hourlyForecast:m({startDate:new Date("2026-01-18T08:00:00"),hours:12,conditions:["rainy"],tempRange:[50,58],cloudCoverage:90,precipitation:.5}),dailyForecast:o,fontSize:"medium"}},R={name:"Puddles - Heavy Rain",args:{config:s,entity:{...e,state:"pouring",attributes:{...e.attributes,temperature:60}},hourlyForecast:m({startDate:new Date("2026-01-18T08:00:00"),hours:12,conditions:["pouring"],tempRange:[55,62],cloudCoverage:100,precipitation:5,windSpeed:15}),dailyForecast:o,fontSize:"medium"}},N={name:"Windy Day",args:{config:s,entity:{...e,state:"windy",attributes:{...e.attributes,temperature:55,wind_speed:25}},hourlyForecast:m({startDate:new Date("2026-03-15T08:00:00"),hours:12,conditions:["partlycloudy","cloudy","partlycloudy"],tempRange:[50,60],cloudCoverage:60,windSpeed:25,windBearing:270}),dailyForecast:o,fontSize:"medium"}},M={name:"Stormy - Strong Wind",args:{config:s,entity:{...e,state:"lightning-rainy",attributes:{...e.attributes,temperature:65,wind_speed:35}},hourlyForecast:m({startDate:new Date("2026-04-15T14:00:00Z"),hours:12,conditions:["rainy","lightning-rainy","pouring","rainy"],tempRange:[58,68],cloudCoverage:100,precipitation:3,windSpeed:35,windBearing:180}),dailyForecast:o,fontSize:"medium"}},I={name:"Night Time - Clear",args:{config:s,entity:{...e,state:"clear-night",attributes:{...e.attributes,temperature:45}},hourlyForecast:m({startDate:new Date("2026-01-18T22:00:00Z"),hours:8,conditions:["clear-night"],tempRange:[40,48],cloudCoverage:5}),dailyForecast:o,sunTimes:{sunrise:new Date("2026-01-19T07:00:00Z"),sunset:new Date("2026-01-18T17:00:00Z"),dawn:new Date("2026-01-19T06:30:00Z"),dusk:new Date("2026-01-18T17:30:00Z")},fontSize:"medium"}},P={name:"Sand - Hot Day (95°F)",args:{config:s,entity:{...e,state:"sunny",attributes:{...e.attributes,temperature:95}},hourlyForecast:m({startDate:new Date("2026-07-18T08:00:00"),hours:12,conditions:["sunny"],tempRange:[88,98],cloudCoverage:5}),dailyForecast:o,sunTimes:{sunrise:new Date("2026-07-18T10:00:00Z"),sunset:new Date("2026-07-19T01:00:00Z"),dawn:new Date("2026-07-18T09:30:00Z"),dusk:new Date("2026-07-19T01:30:00Z")},fontSize:"medium"}},L={name:"Sand - Extreme Heat (110°F)",args:{config:s,entity:{...e,state:"sunny",attributes:{...e.attributes,temperature:110}},hourlyForecast:m({startDate:new Date("2026-07-18T08:00:00"),hours:12,conditions:["sunny"],tempRange:[100,115],cloudCoverage:0}),dailyForecast:o,sunTimes:{sunrise:new Date("2026-07-18T10:00:00Z"),sunset:new Date("2026-07-19T01:00:00Z"),dawn:new Date("2026-07-18T09:30:00Z"),dusk:new Date("2026-07-19T01:30:00Z")},fontSize:"medium"}},O={name:"Spring - Northern Hemisphere (April)",args:{config:s,entity:{...e,state:"sunny",attributes:{...e.attributes,temperature:68}},hourlyForecast:m({startDate:new Date("2026-04-15T08:00:00"),hours:12,conditions:["sunny","partlycloudy","sunny"],tempRange:[58,72],cloudCoverage:20}),dailyForecast:o,latitude:40,sunTimes:{sunrise:new Date("2026-04-15T10:30:00Z"),sunset:new Date("2026-04-15T23:30:00Z"),dawn:new Date("2026-04-15T10:00:00Z"),dusk:new Date("2026-04-16T00:00:00Z")},fontSize:"medium"}},A={name:"Summer - Northern Hemisphere (July)",args:{config:s,entity:{...e,state:"sunny",attributes:{...e.attributes,temperature:78}},hourlyForecast:m({startDate:new Date("2026-07-15T08:00:00"),hours:12,conditions:["sunny"],tempRange:[70,85],cloudCoverage:10}),dailyForecast:o,latitude:40,sunTimes:{sunrise:new Date("2026-07-15T09:30:00Z"),sunset:new Date("2026-07-16T00:30:00Z"),dawn:new Date("2026-07-15T09:00:00Z"),dusk:new Date("2026-07-16T01:00:00Z")},fontSize:"medium"}},J={name:"Fall - Northern Hemisphere (October)",args:{config:s,entity:{...e,state:"partlycloudy",attributes:{...e.attributes,temperature:58}},hourlyForecast:m({startDate:new Date("2026-10-15T08:00:00"),hours:12,conditions:["partlycloudy","sunny","partlycloudy"],tempRange:[48,62],cloudCoverage:40}),dailyForecast:o,latitude:40,sunTimes:{sunrise:new Date("2026-10-15T11:00:00Z"),sunset:new Date("2026-10-15T22:00:00Z"),dawn:new Date("2026-10-15T10:30:00Z"),dusk:new Date("2026-10-15T22:30:00Z")},fontSize:"medium"}},B={name:"Winter - Northern Hemisphere (January, Nice Day)",args:{config:s,entity:{...e,state:"sunny",attributes:{...e.attributes,temperature:45}},hourlyForecast:m({startDate:new Date("2026-01-15T08:00:00"),hours:12,conditions:["sunny"],tempRange:[38,50],cloudCoverage:10}),dailyForecast:o,latitude:40,fontSize:"medium"}},U={name:"Spring - Southern Hemisphere (October)",args:{config:s,entity:{...e,state:"sunny",attributes:{...e.attributes,temperature:68}},hourlyForecast:m({startDate:new Date("2026-10-15T08:00:00"),hours:12,conditions:["sunny","partlycloudy"],tempRange:[58,72],cloudCoverage:20}),dailyForecast:o,latitude:-34,sunTimes:{sunrise:new Date("2026-10-15T19:00:00Z"),sunset:new Date("2026-10-16T08:00:00Z"),dawn:new Date("2026-10-15T18:30:00Z"),dusk:new Date("2026-10-16T08:30:00Z")},fontSize:"medium"}},$={name:"Summer - Southern Hemisphere (January)",args:{config:s,entity:{...e,state:"sunny",attributes:{...e.attributes,temperature:78}},hourlyForecast:m({startDate:new Date("2026-01-15T08:00:00"),hours:12,conditions:["sunny"],tempRange:[70,85],cloudCoverage:5}),dailyForecast:o,latitude:-34,sunTimes:{sunrise:new Date("2026-01-15T18:00:00Z"),sunset:new Date("2026-01-16T09:00:00Z"),dawn:new Date("2026-01-15T17:30:00Z"),dusk:new Date("2026-01-16T09:30:00Z")},fontSize:"medium"}},Y={name:"Fall - Southern Hemisphere (April)",args:{config:s,entity:{...e,state:"partlycloudy",attributes:{...e.attributes,temperature:58}},hourlyForecast:m({startDate:new Date("2026-04-15T08:00:00"),hours:12,conditions:["partlycloudy","sunny"],tempRange:[50,62],cloudCoverage:35}),dailyForecast:o,latitude:-34,sunTimes:{sunrise:new Date("2026-04-15T20:00:00Z"),sunset:new Date("2026-04-16T07:00:00Z"),dawn:new Date("2026-04-15T19:30:00Z"),dusk:new Date("2026-04-16T07:30:00Z")},fontSize:"medium"}},j={name:"Winter - Southern Hemisphere (July, Nice Day)",args:{config:s,entity:{...e,state:"sunny",attributes:{...e.attributes,temperature:55}},hourlyForecast:m({startDate:new Date("2026-07-15T08:00:00"),hours:12,conditions:["sunny"],tempRange:[45,60],cloudCoverage:15}),dailyForecast:o,latitude:-34,sunTimes:{sunrise:new Date("2026-07-15T21:00:00Z"),sunset:new Date("2026-07-16T07:00:00Z"),dawn:new Date("2026-07-15T20:30:00Z"),dusk:new Date("2026-07-16T07:30:00Z")},fontSize:"medium"}},K={name:"Sunny Day to Night Transition",args:{config:s,entity:{...e,state:"sunny",attributes:{...e.attributes,temperature:65}},hourlyForecast:(()=>{const t=[],u=new Date("2026-04-15T14:00:00");for(let n=0;n<12;n++){const i=new Date(u);i.setHours(i.getHours()+n);const r=i.getHours();let c="sunny";r>=19&&r<21&&(c="partlycloudy"),(r>=21||r<6)&&(c="clear-night");const d=r>=18?65-(r-18)*3:70;t.push({datetime:i.toISOString(),condition:c,temperature:Math.round(d),cloud_coverage:r>=19?20:5,precipitation:0,wind_speed:8})}return t})(),dailyForecast:o,sunTimes:{sunrise:new Date("2026-04-15T10:30:00Z"),sunset:new Date("2026-04-15T23:00:00Z"),dawn:new Date("2026-04-15T10:00:00Z"),dusk:new Date("2026-04-15T23:30:00Z")},fontSize:"medium"}},G={name:"Approaching Storm",args:{config:s,entity:{...e,state:"partlycloudy",attributes:{...e.attributes,temperature:72,wind_speed:15}},hourlyForecast:(()=>{const t=[],u=new Date("2026-05-15T12:00:00"),n=["sunny","sunny","partlycloudy","partlycloudy","cloudy","cloudy","rainy","pouring","lightning-rainy","rainy","cloudy","partlycloudy"],i=[10,20,40,60,80,95,100,100,100,90,70,50],r=[0,0,0,0,0,.1,1,5,3,1,.2,0],c=[5,8,10,12,15,18,22,28,25,18,12,8];for(let d=0;d<12;d++){const y=new Date(u);y.setHours(y.getHours()+d),t.push({datetime:y.toISOString(),condition:n[d],temperature:75-d*2,cloud_coverage:i[d],precipitation:r[d],precipitation_probability:r[d]>0?80:20,wind_speed:c[d],wind_bearing:220})}return t})(),dailyForecast:o,fontSize:"medium"}},X={name:"Cold Front Arrival",args:{config:s,entity:{...e,state:"cloudy",attributes:{...e.attributes,temperature:45,wind_speed:20}},hourlyForecast:(()=>{const t=[],u=new Date("2026-11-15T10:00:00");for(let n=0;n<12;n++){const i=new Date(u);i.setHours(i.getHours()+n);const r=55-n*4,c=r>40?"cloudy":r>32?"snowy-rainy":"snowy";t.push({datetime:i.toISOString(),condition:c,temperature:r,cloud_coverage:90,precipitation:r<=40?.5:0,precipitation_probability:r<=40?70:30,wind_speed:15+n,wind_bearing:320})}return t})(),dailyForecast:o,fontSize:"medium"}},q={name:"Heat Wave",args:{config:s,entity:{...e,state:"sunny",attributes:{...e.attributes,temperature:105}},hourlyForecast:m({startDate:new Date("2026-07-25T08:00:00"),hours:12,conditions:["sunny"],tempRange:[95,110],cloudCoverage:0,windSpeed:3}),dailyForecast:o,sunTimes:{sunrise:new Date("2026-07-25T09:30:00Z"),sunset:new Date("2026-07-26T00:30:00Z"),dawn:new Date("2026-07-25T09:00:00Z"),dusk:new Date("2026-07-26T01:00:00Z")},fontSize:"medium"}},Q={name:"Mixed Precipitation (Wintry Mix)",args:{config:s,entity:{...e,state:"snowy-rainy",attributes:{...e.attributes,temperature:33}},hourlyForecast:(()=>{const t=[],u=new Date("2026-02-15T08:00:00");for(let n=0;n<12;n++){const i=new Date(u);i.setHours(i.getHours()+n);const r=31+Math.sin(n/2)*4,c=r>33?"rainy":r<31?"snowy":"snowy-rainy";t.push({datetime:i.toISOString(),condition:c,temperature:Math.round(r),cloud_coverage:100,precipitation:1.5,precipitation_probability:90,wind_speed:10,wind_bearing:45})}return t})(),dailyForecast:o,fontSize:"medium"}},V={name:"Size - Small",args:{config:s,entity:e,hourlyForecast:re,dailyForecast:o,fontSize:"small"}},ee={name:"Size - Large",args:{config:s,entity:e,hourlyForecast:re,dailyForecast:o,fontSize:"large"}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    config,
    entity: weatherEntity as unknown as WeatherEntity,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'medium'
  }
}`,...E.parameters?.docs?.source}}};H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: 'Ice - Light Freeze (32°F)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'cloudy',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 32
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-01-18T08:00:00'),
      hours: 12,
      conditions: ['cloudy'],
      tempRange: [30, 34],
      cloudCoverage: 80
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'medium'
  }
}`,...H.parameters?.docs?.source}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: 'Ice - Deep Freeze (-10°F)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'snowy',
      attributes: {
        ...weatherEntity.attributes,
        temperature: -10
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-01-18T08:00:00'),
      hours: 12,
      conditions: ['snowy'],
      tempRange: [-15, -5],
      cloudCoverage: 100,
      precipitation: 0.5
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'medium'
  }
}`,...k.parameters?.docs?.source}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: 'Puddles - Light Rain',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'rainy',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 55
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-01-18T08:00:00'),
      hours: 12,
      conditions: ['rainy'],
      tempRange: [50, 58],
      cloudCoverage: 90,
      precipitation: 0.5
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'medium'
  }
}`,...C.parameters?.docs?.source}}};R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: 'Puddles - Heavy Rain',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'pouring',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 60
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-01-18T08:00:00'),
      hours: 12,
      conditions: ['pouring'],
      tempRange: [55, 62],
      cloudCoverage: 100,
      precipitation: 5,
      windSpeed: 15
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'medium'
  }
}`,...R.parameters?.docs?.source}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: 'Windy Day',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'windy',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 55,
        wind_speed: 25
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-03-15T08:00:00'),
      hours: 12,
      conditions: ['partlycloudy', 'cloudy', 'partlycloudy'],
      tempRange: [50, 60],
      cloudCoverage: 60,
      windSpeed: 25,
      windBearing: 270 // West wind
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'medium'
  }
}`,...N.parameters?.docs?.source}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: 'Stormy - Strong Wind',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'lightning-rainy',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 65,
        wind_speed: 35
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-04-15T14:00:00Z'),
      hours: 12,
      conditions: ['rainy', 'lightning-rainy', 'pouring', 'rainy'],
      tempRange: [58, 68],
      cloudCoverage: 100,
      precipitation: 3,
      windSpeed: 35,
      windBearing: 180 // South wind
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'medium'
  }
}`,...M.parameters?.docs?.source}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: 'Night Time - Clear',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'clear-night',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 45
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-01-18T22:00:00Z'),
      // 10pm UTC (night)
      hours: 8,
      conditions: ['clear-night'],
      tempRange: [40, 48],
      cloudCoverage: 5
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    sunTimes: {
      sunrise: new Date('2026-01-19T07:00:00Z'),
      // Next morning
      sunset: new Date('2026-01-18T17:00:00Z'),
      // Already set
      dawn: new Date('2026-01-19T06:30:00Z'),
      dusk: new Date('2026-01-18T17:30:00Z')
    },
    fontSize: 'medium'
  }
}`,...I.parameters?.docs?.source}}};P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: 'Sand - Hot Day (95°F)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 95
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-07-18T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [88, 98],
      cloudCoverage: 5
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    sunTimes: {
      sunrise: new Date('2026-07-18T10:00:00Z'),
      sunset: new Date('2026-07-19T01:00:00Z'),
      dawn: new Date('2026-07-18T09:30:00Z'),
      dusk: new Date('2026-07-19T01:30:00Z')
    },
    fontSize: 'medium'
  }
}`,...P.parameters?.docs?.source}}};L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: 'Sand - Extreme Heat (110°F)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 110
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-07-18T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [100, 115],
      cloudCoverage: 0
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    sunTimes: {
      sunrise: new Date('2026-07-18T10:00:00Z'),
      sunset: new Date('2026-07-19T01:00:00Z'),
      dawn: new Date('2026-07-18T09:30:00Z'),
      dusk: new Date('2026-07-19T01:30:00Z')
    },
    fontSize: 'medium'
  }
}`,...L.parameters?.docs?.source}}};O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: 'Spring - Northern Hemisphere (April)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 68
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-04-15T08:00:00'),
      hours: 12,
      conditions: ['sunny', 'partlycloudy', 'sunny'],
      tempRange: [58, 72],
      cloudCoverage: 20
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: 40,
    // Northern hemisphere
    sunTimes: {
      sunrise: new Date('2026-04-15T10:30:00Z'),
      sunset: new Date('2026-04-15T23:30:00Z'),
      dawn: new Date('2026-04-15T10:00:00Z'),
      dusk: new Date('2026-04-16T00:00:00Z')
    },
    fontSize: 'medium'
  }
}`,...O.parameters?.docs?.source}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: 'Summer - Northern Hemisphere (July)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 78
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-07-15T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [70, 85],
      cloudCoverage: 10
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: 40,
    sunTimes: {
      sunrise: new Date('2026-07-15T09:30:00Z'),
      sunset: new Date('2026-07-16T00:30:00Z'),
      dawn: new Date('2026-07-15T09:00:00Z'),
      dusk: new Date('2026-07-16T01:00:00Z')
    },
    fontSize: 'medium'
  }
}`,...A.parameters?.docs?.source}}};J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: 'Fall - Northern Hemisphere (October)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'partlycloudy',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 58
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-10-15T08:00:00'),
      hours: 12,
      conditions: ['partlycloudy', 'sunny', 'partlycloudy'],
      tempRange: [48, 62],
      cloudCoverage: 40
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: 40,
    sunTimes: {
      sunrise: new Date('2026-10-15T11:00:00Z'),
      sunset: new Date('2026-10-15T22:00:00Z'),
      dawn: new Date('2026-10-15T10:30:00Z'),
      dusk: new Date('2026-10-15T22:30:00Z')
    },
    fontSize: 'medium'
  }
}`,...J.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  name: 'Winter - Northern Hemisphere (January, Nice Day)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 45
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-01-15T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [38, 50],
      cloudCoverage: 10
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: 40,
    fontSize: 'medium'
  }
}`,...B.parameters?.docs?.source}}};U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: 'Spring - Southern Hemisphere (October)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 68
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-10-15T08:00:00'),
      hours: 12,
      conditions: ['sunny', 'partlycloudy'],
      tempRange: [58, 72],
      cloudCoverage: 20
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: -34,
    // Southern hemisphere (Sydney-ish)
    sunTimes: {
      sunrise: new Date('2026-10-15T19:00:00Z'),
      // ~5am local
      sunset: new Date('2026-10-16T08:00:00Z'),
      // ~6pm local
      dawn: new Date('2026-10-15T18:30:00Z'),
      dusk: new Date('2026-10-16T08:30:00Z')
    },
    fontSize: 'medium'
  }
}`,...U.parameters?.docs?.source}}};$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  name: 'Summer - Southern Hemisphere (January)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 78
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-01-15T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [70, 85],
      cloudCoverage: 5
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: -34,
    sunTimes: {
      sunrise: new Date('2026-01-15T18:00:00Z'),
      sunset: new Date('2026-01-16T09:00:00Z'),
      dawn: new Date('2026-01-15T17:30:00Z'),
      dusk: new Date('2026-01-16T09:30:00Z')
    },
    fontSize: 'medium'
  }
}`,...$.parameters?.docs?.source}}};Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: 'Fall - Southern Hemisphere (April)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'partlycloudy',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 58
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-04-15T08:00:00'),
      hours: 12,
      conditions: ['partlycloudy', 'sunny'],
      tempRange: [50, 62],
      cloudCoverage: 35
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: -34,
    sunTimes: {
      sunrise: new Date('2026-04-15T20:00:00Z'),
      sunset: new Date('2026-04-16T07:00:00Z'),
      dawn: new Date('2026-04-15T19:30:00Z'),
      dusk: new Date('2026-04-16T07:30:00Z')
    },
    fontSize: 'medium'
  }
}`,...Y.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: 'Winter - Southern Hemisphere (July, Nice Day)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 55
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-07-15T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [45, 60],
      cloudCoverage: 15
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: -34,
    sunTimes: {
      sunrise: new Date('2026-07-15T21:00:00Z'),
      sunset: new Date('2026-07-16T07:00:00Z'),
      dawn: new Date('2026-07-15T20:30:00Z'),
      dusk: new Date('2026-07-16T07:30:00Z')
    },
    fontSize: 'medium'
  }
}`,...j.parameters?.docs?.source}}};K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: 'Sunny Day to Night Transition',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 65
      }
    } as unknown as WeatherEntity,
    hourlyForecast: (() => {
      const forecast: WeatherForecast[] = [];
      const start = new Date('2026-04-15T14:00:00'); // 2pm

      for (let i = 0; i < 12; i++) {
        const date = new Date(start);
        date.setHours(date.getHours() + i);
        const hour = date.getHours();

        // Transition from day to night
        let condition = 'sunny';
        if (hour >= 19 && hour < 21) condition = 'partlycloudy';
        if (hour >= 21 || hour < 6) condition = 'clear-night';
        const temp = hour >= 18 ? 65 - (hour - 18) * 3 : 70;
        forecast.push({
          datetime: date.toISOString(),
          condition,
          temperature: Math.round(temp),
          cloud_coverage: hour >= 19 ? 20 : 5,
          precipitation: 0,
          wind_speed: 8
        });
      }
      return forecast;
    })(),
    dailyForecast: dailyForecast as WeatherForecast[],
    sunTimes: {
      sunrise: new Date('2026-04-15T10:30:00Z'),
      sunset: new Date('2026-04-15T23:00:00Z'),
      // 7pm local
      dawn: new Date('2026-04-15T10:00:00Z'),
      dusk: new Date('2026-04-15T23:30:00Z')
    },
    fontSize: 'medium'
  }
}`,...K.parameters?.docs?.source}}};G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: 'Approaching Storm',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'partlycloudy',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 72,
        wind_speed: 15
      }
    } as unknown as WeatherEntity,
    hourlyForecast: (() => {
      const forecast: WeatherForecast[] = [];
      const start = new Date('2026-05-15T12:00:00');
      const conditions = ['sunny', 'sunny', 'partlycloudy', 'partlycloudy', 'cloudy', 'cloudy', 'rainy', 'pouring', 'lightning-rainy', 'rainy', 'cloudy', 'partlycloudy'];
      const clouds = [10, 20, 40, 60, 80, 95, 100, 100, 100, 90, 70, 50];
      const precip = [0, 0, 0, 0, 0, 0.1, 1, 5, 3, 1, 0.2, 0];
      const wind = [5, 8, 10, 12, 15, 18, 22, 28, 25, 18, 12, 8];
      for (let i = 0; i < 12; i++) {
        const date = new Date(start);
        date.setHours(date.getHours() + i);
        forecast.push({
          datetime: date.toISOString(),
          condition: conditions[i],
          temperature: 75 - i * 2,
          cloud_coverage: clouds[i],
          precipitation: precip[i],
          precipitation_probability: precip[i] > 0 ? 80 : 20,
          wind_speed: wind[i],
          wind_bearing: 220
        });
      }
      return forecast;
    })(),
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'medium'
  }
}`,...G.parameters?.docs?.source}}};X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: 'Cold Front Arrival',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'cloudy',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 45,
        wind_speed: 20
      }
    } as unknown as WeatherEntity,
    hourlyForecast: (() => {
      const forecast: WeatherForecast[] = [];
      const start = new Date('2026-11-15T10:00:00');
      for (let i = 0; i < 12; i++) {
        const date = new Date(start);
        date.setHours(date.getHours() + i);

        // Temperature drops dramatically
        const temp = 55 - i * 4; // From 55 to 11
        const condition = temp > 40 ? 'cloudy' : temp > 32 ? 'snowy-rainy' : 'snowy';
        forecast.push({
          datetime: date.toISOString(),
          condition,
          temperature: temp,
          cloud_coverage: 90,
          precipitation: temp <= 40 ? 0.5 : 0,
          precipitation_probability: temp <= 40 ? 70 : 30,
          wind_speed: 15 + i,
          wind_bearing: 320
        });
      }
      return forecast;
    })(),
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'medium'
  }
}`,...X.parameters?.docs?.source}}};q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: 'Heat Wave',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 105
      }
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: new Date('2026-07-25T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [95, 110],
      cloudCoverage: 0,
      windSpeed: 3
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    sunTimes: {
      sunrise: new Date('2026-07-25T09:30:00Z'),
      sunset: new Date('2026-07-26T00:30:00Z'),
      dawn: new Date('2026-07-25T09:00:00Z'),
      dusk: new Date('2026-07-26T01:00:00Z')
    },
    fontSize: 'medium'
  }
}`,...q.parameters?.docs?.source}}};Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: 'Mixed Precipitation (Wintry Mix)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'snowy-rainy',
      attributes: {
        ...weatherEntity.attributes,
        temperature: 33
      }
    } as unknown as WeatherEntity,
    hourlyForecast: (() => {
      const forecast: WeatherForecast[] = [];
      const start = new Date('2026-02-15T08:00:00');
      for (let i = 0; i < 12; i++) {
        const date = new Date(start);
        date.setHours(date.getHours() + i);

        // Temperature hovers around freezing
        const temp = 31 + Math.sin(i / 2) * 4;
        const condition = temp > 33 ? 'rainy' : temp < 31 ? 'snowy' : 'snowy-rainy';
        forecast.push({
          datetime: date.toISOString(),
          condition,
          temperature: Math.round(temp),
          cloud_coverage: 100,
          precipitation: 1.5,
          precipitation_probability: 90,
          wind_speed: 10,
          wind_bearing: 45
        });
      }
      return forecast;
    })(),
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'medium'
  }
}`,...Q.parameters?.docs?.source}}};V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: 'Size - Small',
  args: {
    config,
    entity: weatherEntity as unknown as WeatherEntity,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'small'
  }
}`,...V.parameters?.docs?.source}}};ee.parameters={...ee.parameters,docs:{...ee.parameters?.docs,source:{originalSource:`{
  name: 'Size - Large',
  args: {
    config,
    entity: weatherEntity as unknown as WeatherEntity,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'large'
  }
}`,...ee.parameters?.docs?.source}}};const Ke=["Default","IceLightFreeze","IceDeepFreeze","PuddlesLightRain","PuddlesHeavyRain","WindyDay","StormyWind","NightTime","SandHotDay","SandExtremeHeat","SpringNorthern","SummerNorthern","FallNorthern","WinterNorthernNice","SpringSouthern","SummerSouthern","FallSouthern","WinterSouthernNice","DayToNightTransition","ApproachingStorm","ColdFront","HeatWave","MixedPrecipitation","SmallSize","LargeSize"];export{G as ApproachingStorm,X as ColdFront,K as DayToNightTransition,E as Default,J as FallNorthern,Y as FallSouthern,q as HeatWave,k as IceDeepFreeze,H as IceLightFreeze,ee as LargeSize,Q as MixedPrecipitation,I as NightTime,R as PuddlesHeavyRain,C as PuddlesLightRain,L as SandExtremeHeat,P as SandHotDay,V as SmallSize,O as SpringNorthern,U as SpringSouthern,M as StormyWind,A as SummerNorthern,$ as SummerSouthern,N as WindyDay,B as WinterNorthernNice,j as WinterSouthernNice,Ke as __namedExportsOrder,je as default};
