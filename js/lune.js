window.onload = () => {
  if ( window.orientation == 0 || window.orientation == 180 ) { 
    alert('Place your mobile device landscape-wise in a Cardboard viewer for the best experience.'); 
  }
};

var camera, scene, moon, renderer;
var effect, controls;
var element, container;

var clock = new THREE.Clock();

init();
animate();

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  element = renderer.domElement;
  container = document.getElementById('viewer');
  container.appendChild(element);
  
  effect = new THREE.StereoEffect(renderer);
  
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(90, 1, 0.001, 700);
  camera.position.set(0, 10, 0);
  scene.add(camera);
  
  controls = new THREE.OrbitControls(camera, element);
  controls.noZoom = true;
  controls.noPan = true;
  
  function setOrientationControls(e) {
    if (!e.alpha) {
      return;
    }
    
    element.addEventListener('click', fullscreen, false);
    
    window.removeEventListener('deviceorientation', setOrientationControls, true);
  }
  window.addEventListener('deviceorientation', setOrientationControls, true);
  
  
  var light = new THREE.AmbientLight(0xffffff);
  scene.add(light);
  
  addModel(scene, 'Moon_3D_Model/', 'moon.mtl', 'moon.obj')
  .then((loadedMoon) => {
    moon = loadedMoon;
    console.log('Loaded Moon:', moon);
  });
  
  window.addEventListener('resize', resize, false);
  setTimeout(resize, 1);
}

// https://threejs.org/examples/#webgl_loader_obj_mtl
// Resolves with Moon object
function addModel(scene, path, mtlName, objName) {
  return new Promise((resolve, reject) => {
    var onProgress = function ( xhr ) {
      if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round(percentComplete, 2) + '% downloaded' );
      }
    };
    
    THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );
    
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath( path );
    mtlLoader.load( mtlName, function( materials ) {
      materials.preload();
      
      var objLoader = new THREE.OBJLoader();
      objLoader.setMaterials( materials );
      objLoader.setPath( path );
      objLoader.load( objName, function ( object ) {
        // Our model's radius is about 49
        object.position.y = - 95;
        
        // Face the near side of Moon on load, regardless of device
        if (window.matchMedia('(min-width: 800px)').matches) {
          // Desktop
          object.children[0].rotation.y = 180 * Math.PI / 180;
        }
        else {
          // Mobile
          object.children[0].rotation.x = 90 * Math.PI / 180;
        }
        
        scene.add( object );
        controls.target.set(
          object.position.x,
          object.position.y,
          object.position.z
        );
        controls = new THREE.DeviceOrientationControls(object, true);
        controls.connect();
        controls.update();
        
        resolve(object);
      }, onProgress, (xhr) => { reject(xhr); } );
    });
  });
}

function resize() {
  var width = container.offsetWidth;
  var height = container.offsetHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
  effect.setSize(width, height);
}

function update(dt) {
  resize();
  
  camera.updateProjectionMatrix();
  
  controls.update(dt);
}

function render(dt) {
  effect.render(scene, camera);
}

function animate(t) {
  requestAnimationFrame(animate);
  
  update(clock.getDelta());
  render(clock.getDelta());
}

function fullscreen() {
  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if (container.msRequestFullscreen) {
    container.msRequestFullscreen();
  } else if (container.mozRequestFullScreen) {
    container.mozRequestFullScreen();
  } else if (container.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
  }
}