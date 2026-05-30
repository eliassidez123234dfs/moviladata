// PWA helper - placeholder for registration
export function registerServiceWorker(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/service-worker.js').catch(()=>{})
  }
}
