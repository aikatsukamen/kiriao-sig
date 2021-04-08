let scene, renderer, camera, mesh, helper;

let ready = false;

//browser size
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

//Obujet Clock
const clock = new THREE.Clock();

const Pmx = './pmx/aoi/Aoi Kiriya (PR ver)edit .pmx';
const MotionObjects = [{ id: 'Signalize!', VmdClip: null, AudioClip: true }];

window.onload = () => {
  Init();

  LoadModeler();

  Render();
};

/*
 * Initialize Three
 * camera and right
 */
Init = () => {
  scene = new THREE.Scene();

  const ambient = new THREE.AmbientLight(0xeeeeee);
  scene.add(ambient);

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xcccccc, 0);

  // documentにMMDをセットする
  document.body.appendChild(renderer.domElement);

  //cameraの作成
  camera = new THREE.PerspectiveCamera(40, windowWidth / windowHeight, 1, 1000);
  camera.position.set(0, 100, 70);

  // カメラコントローラーを作成
  const controls = new THREE.OrbitControls(camera);
};

/*
 * Load PMX and VMD and Audio
 */
LoadModeler = async () => {
  const loader = new THREE.MMDLoader();

  //Loading PMX
  LoadPMX = () => {
    return new Promise((resolve) => {
      loader.load(
        Pmx,
        (object) => {
          mesh = object;
          scene.add(mesh);

          resolve(true);
        },
        onProgress,
        onError
      );
    });
  };

  //Loading VMD
  LoadVMD = (id) => {
    return new Promise((resolve) => {
      const path = './vmd/' + id + '.vmd';
      const val = MotionObjects.findIndex((MotionObject) => MotionObject.id == id);

      loader.loadAnimation(
        path,
        mesh,
        (vmd) => {
          vmd.name = id;

          MotionObjects[val].VmdClip = vmd;

          resolve(true);
        },
        onProgress,
        onError
      );
    });
  };

  //Load Audio
  LoadAudio = (id) => {
    console.log('LoadAudio: ' + id);
    return new Promise((resolve) => {
      const path = './audio/' + id + '.mp3';
      const val = MotionObjects.findIndex((MotionObject) => MotionObject.id == id);

      if (MotionObjects[val].AudioClip) {
        new THREE.AudioLoader().load(
          path,
          (buffer) => {
            const listener = new THREE.AudioListener();
            const audio = new THREE.Audio(listener).setBuffer(buffer);
            audio.setVolume(0.5);
            MotionObjects[val].AudioClip = audio;

            resolve(true);
          },
          onProgress,
          onError
        );
      } else {
        console.warn(path + ' is not found');
        resolve(false);
      }
    });
  };

  // Loading PMX...
  await LoadPMX();

  // Loading VMD...
  await Promise.all(
    MotionObjects.map(async (MotionObject) => {
      return await LoadVMD(MotionObject.id);
    })
  );

  // Loading Audio...
  await Promise.all(
    MotionObjects.map(async (MotionObject) => {
      return await LoadAudio(MotionObject.id);
    })
  );

  //Set VMD on Mesh
  // VmdControl('Signalize!', true);
};

/*
 * Start Vmd and Audio.
 * And, Get Vmd Loop Event
 */
VmdControl = (id, loop) => {
  const index = MotionObjects.findIndex((MotionObject) => MotionObject.id == id);

  // Not Found id
  if (index === -1) {
    console.log('not Found ID');
    return;
  }

  ready = false;
  helper = new THREE.MMDAnimationHelper({ afterglow: 2.0, resetPhysicsOnLoop: true });

  //
  helper.add(mesh, {
    animation: MotionObjects[index].VmdClip,
    physics: false,
  });

  //Start Audio
  if (MotionObjects[index].AudioClip) {
    console.log('audio play');
    MotionObjects[index].AudioClip.play();
  }

  const mixer = helper.objects.get(mesh).mixer;
  //animation Loop Once
  if (!loop) {
    mixer.existingAction(MotionObjects[index].VmdClip).setLoop(THREE.LoopOnce);
  }

  // VMD Loop Event
  mixer.addEventListener('loop', (event) => {
    console.log('loop');
  });

  // VMD Loop Once Event
  mixer.addEventListener('finished', (event) => {
    console.log('finished');
    VmdControl('Signalize!', true);
  });

  ready = true;
};

/*
 * Loading PMX or VMD or Voice
 */
onProgress = (xhr) => {
  if (xhr.lengthComputable) {
    const percentComplete = (xhr.loaded / xhr.total) * 100;
    console.log(Math.round(percentComplete, 2) + '% downloaded');
  }
};

/*
 * loading error
 */
onError = (xhr) => {
  console.log('ERROR');
};

/*
 * MMD Model Render
 */
Render = () => {
  requestAnimationFrame(Render);
  renderer.clear();
  renderer.render(scene, camera);

  if (ready) {
    helper.update(clock.getDelta());
  }
};

/*
 * Click Event
 */
PoseClickEvent = (id) => {
  console.log(id);

  switch (id) {
    case 'Signalize!':
      VmdControl('Signalize!', true);
      break;
  }
};
