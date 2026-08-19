function r(e){const t=new Date;if(e.deadlineDate)return new Date(e.deadlineDate)<t;if(e.createdAt){const a=new Date(e.createdAt);return new Date(a.getTime()+720*60*60*1e3)<t}return!1}export{r as i};
