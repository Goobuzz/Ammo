var state = 0;
var fixedDT = 0;

self.addEventListener('message', function(e){
  switch(state){
    case 0:
      state = 1;
      fixedDT = Number(e.data);
      doWork();
      break;
    case 1:
      // stop thread
      break;
  }
}, false)

function doWork(){
  postMessage();
  setTimeout(doWork, fixedDT);
}