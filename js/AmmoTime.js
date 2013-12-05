var state = 0;

self.addEventListener('message', function(e){
  switch(state){
    case 0:
      state = 1;
      doWork();
      break;
    case 1:

      break;
  }
}, false)

function doWork(){
  postMessage("AmmoUpdate");
  setTimeout(doWork, 1000/60);
}