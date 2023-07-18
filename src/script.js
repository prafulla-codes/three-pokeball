import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'lil-gui'
import {gsap} from 'gsap'
import helvatica_Bold from 'three/examples/fonts/helvetiker_bold.typeface.json'
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader'
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
const canvas = document.querySelector('canvas.webgl');
const textureLoader = new THREE.TextureLoader()
const rayCaster = new THREE.Raycaster();
function addMorphedTarget(scene){
    scene.traverse((child)=>{
        if(child.isMesh){
            child.material.morphTargets = true
        }
    })
}
var SCENE_CONFIG = {

    world : null,
    scene : null,
    oldElapsedTime : null,
    canvas : canvas,
    materials : {},
    textures : {},
    sounds : [],
    objectsToTestRaycaster : [],
    animationMixer : null,
    objectsToUpdate:[],
    animationAction : null,
    contactMaterials: {},
    mouse : new THREE.Vector2(),
    camera: null,
    credits:
    {
        texts : [],
        size : 0.08,
        color : new THREE.Color("white")
    },
    pokeball:{
        isButtonHovered: false,
        hoverColor : new THREE.Color("#aeffa8"),
        scene : null,
        gameboyPlane : null,
        isOpen : false
    },
    sizes : {
        width: window.innerWidth,
        height : window.innerHeight
    },
    envMap:{
        intensity: 1
    },

    controls : null,
}

const gltfLoader = new GLTFLoader(); 
const gui = new dat.GUI()
gui.addColor(SCENE_CONFIG.pokeball,'hoverColor').onChange(color=>{
    SCENE_CONFIG.pokeball.hoverColor.set(color)
}) 


const loadedOjects = Promise.all([
    gltfLoader.load("/objects/Pokeball/pokeball.gltf",(gltf)=>{
        console.log(gltf)
        SCENE_CONFIG.scene.add(gltf.scene)
        addMorphedTarget(gltf.scene)
        SCENE_CONFIG.pokeball.gameboyPlane = gltf.scene.children[0]
        SCENE_CONFIG.pokeball.gameboyPlane.visible = false
        SCENE_CONFIG.pokeball.scene = gltf.scene.children[1]
        SCENE_CONFIG.objectsToTestRaycaster.push(SCENE_CONFIG.pokeball.scene.children[0])
        console.log(gltf.scene)
        gltf.scene.rotation.y = 2.70
        gui.add(gltf.scene.rotation,'y',0,Math.PI * 2).name('PokeballRotation')
        SCENE_CONFIG.animationMixer = new THREE.AnimationMixer(gltf.scene)
        SCENE_CONFIG.animationAction = SCENE_CONFIG.animationMixer.clipAction(gltf.animations[0])
        SCENE_CONFIG.animationAction.clampWhenFinished = true
        SCENE_CONFIG.animationAction.repetitions = 0

    }),
    textureLoader.load('/env/pokelab.jpg')
],(resolve,reject)=> {
    resolve(loadedObjects)
}).then((loadedObjects)=>{
    loadScene(loadedObjects)    
}).catch(err=> console.log(err))

function updateAllMaterials(scene,intensity = 1){
    scene.traverse((child)=>{
        if(child.isMesh && child.material.isMeshStandardMaterial)
        {
            child.material.envMapIntensity = intensity
        }
    })
}
function loadScene(loadedObjects){
    
    initializeWorld();
    loadedObjects[1].mapping = THREE.EquirectangularReflectionMapping
    loadedObjects[1].colorSpace = THREE.SRGBColorSpace
    SCENE_CONFIG.scene.background = loadedObjects[1]
    SCENE_CONFIG.scene.environment = loadedObjects[1]
    SCENE_CONFIG.scene.backgroundBlurriness = 0.
    SCENE_CONFIG.scene.backgroundIntensity = 1

    gui.add(SCENE_CONFIG.envMap,'intensity').min(1).max(100).onFinishChange((intensity)=>{
        updateAllMaterials(SCENE_CONFIG.scene,intensity)
    })
    gui.add(SCENE_CONFIG.scene,'backgroundBlurriness').min(0).max(10).step(0.001)
    gui.add(SCENE_CONFIG.scene,'backgroundIntensity').min(0).max(10).step(0.001)

 

    
    tick()

}

function InitializeCredits() {
    const creditsTextureParams = {
        font: new FontLoader().parse(helvatica_Bold), 
        size: SCENE_CONFIG.credits.size,
        height: 0.1, // Depth of the text extrusion
        curveSegments: 12, // Number of points on the curves
        bevelEnabled: false, // Whether to add bevel
      }
    const textMaterial = new THREE.MeshBasicMaterial({ color: SCENE_CONFIG.credits.color });

    const creditsGeometry = new TextGeometry("Credits :)", creditsTextureParams);
    const textCredits = new THREE.Mesh(creditsGeometry, textMaterial);

    
    const creditsText1Geometry = new TextGeometry("1 - @BlockadeLabs", creditsTextureParams);
    const text1Credits = new THREE.Mesh(creditsText1Geometry, textMaterial);

    SCENE_CONFIG.credits.texts.push(textCredits)
    SCENE_CONFIG.credits.texts.push(text1Credits)

    gsap.to(textCredits.position,{
        y: 2,
        x:0,
        duration:2
    })
    
    gsap.to(text1Credits.position,{
        y:1.8,
        x:0,
        duration:2
    })
    SCENE_CONFIG.scene.add(textCredits)
    SCENE_CONFIG.scene.add(text1Credits)
}

function initializeWorld(){
    // THREE WORLD
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("black");


    let ambientLight = new THREE.AmbientLight({color:'white'});
    scene.add(ambientLight);

    SCENE_CONFIG.scene = scene

    // Camera 
    const camera = new THREE.PerspectiveCamera(75,SCENE_CONFIG.sizes.width/ SCENE_CONFIG.sizes.height)
    camera.position.z=5;
    camera.position.y = 2;
    camera.position.x = -2;
    // camera.lookAt(portal)
    // Orbit Controls
    const controls = new OrbitControls(camera, SCENE_CONFIG.canvas)
    controls.enableDamping = true;
    // Renderer

    const renderer = new THREE.WebGLRenderer({canvas: SCENE_CONFIG.canvas});

    renderer.setSize(SCENE_CONFIG.sizes.width,SCENE_CONFIG.sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    SCENE_CONFIG.camera = camera
    SCENE_CONFIG.controls = controls
    SCENE_CONFIG.renderer = renderer
    InitializeCredits()
}




// DOUBLE CLICK
window.addEventListener('dblclick', () =>
{
    if(!document.fullscreenElement)
    {
        SCENE_CONFIG.canvas.requestFullscreen()
    }
    else
    {
        document.exitFullscreen()
    }
})

window.addEventListener('mousedown',(e)=>{
    if(SCENE_CONFIG.pokeball.isButtonHovered && !SCENE_CONFIG.pokeball.isOpen){
        SCENE_CONFIG.pokeball.isOpen = true
        SCENE_CONFIG.animationAction.play()
        // gsap.to(SCENE_CONFIG.camera.position,{
        //     z:0.5,
        //     x:-0.5,
        //     y:2.3,
        //     duration: 2.5,
        //     clear:false
        // })

 

        SCENE_CONFIG.pokeball.gameboyPlane.visible = true
    }
})
window.addEventListener('mousemove',(e)=>{
     SCENE_CONFIG.mouse.x = e.clientX/SCENE_CONFIG.sizes.width * 2 - 1
     SCENE_CONFIG.mouse.y = - (e.clientY/SCENE_CONFIG.sizes.height) * 2 + 1
})
// RESIZE
window.addEventListener('resize', () =>
{
    // Update sizes
    SCENE_CONFIG.sizes.width = window.innerWidth
    SCENE_CONFIG.sizes.height = window.innerHeight
    // Update camera
    SCENE_CONFIG.camera.aspect = SCENE_CONFIG.sizes.width / SCENE_CONFIG.sizes.height;
    SCENE_CONFIG.camera.updateProjectionMatrix()
    SCENE_CONFIG.renderer.setSize(SCENE_CONFIG.sizes.width, SCENE_CONFIG.sizes.height)
    SCENE_CONFIG.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
})


// setInterval( () =>  ledStrip.lightingEventHandler(),1000)

// 


let clock = new THREE.Clock();
var radius = 0;
var delay = 12;
var animSeconds = 22;
let oldElapsedTime = 0
const tick = () => {
    if(SCENE_CONFIG.canvas != null){
        const elapsedTime = clock.getElapsedTime();
        const deltaTime = elapsedTime - SCENE_CONFIG.oldElapsedTime
        SCENE_CONFIG.oldElapsedTime = elapsedTime
    
        if(SCENE_CONFIG.animationMixer!=null){
            SCENE_CONFIG.animationMixer.update(deltaTime)
        }
        // Update controls
        if(SCENE_CONFIG.controls)
        {
        SCENE_CONFIG.controls.update()
        }       
        if(SCENE_CONFIG.renderer!=null)
        {
        SCENE_CONFIG.renderer.render(SCENE_CONFIG.scene,SCENE_CONFIG.camera);
        }
        if(rayCaster != null && SCENE_CONFIG.objectsToTestRaycaster.length > 0){
            rayCaster.setFromCamera(SCENE_CONFIG.mouse,SCENE_CONFIG.camera)
            const intersects = rayCaster.intersectObjects(SCENE_CONFIG.objectsToTestRaycaster)
            
            for(const intersect of intersects)
            {
                intersect.object.material.color.set(SCENE_CONFIG.pokeball.hoverColor)
                SCENE_CONFIG.pokeball.isButtonHovered = true
                document.getElementsByTagName('body')[0].style.cursor = "pointer"
            }

            for(const object of SCENE_CONFIG.objectsToTestRaycaster)
            {
                if(!intersects.find(intersect => intersect.object === object))
                {
                    object.material.color.set('#ffffff')
                    SCENE_CONFIG.pokeball.isButtonHovered = false
                    document.getElementsByTagName('body')[0].style.cursor = "auto"


                }
            }

            for(const text of SCENE_CONFIG.credits.texts) text.lookAt(SCENE_CONFIG.camera.position)
        }

        window.requestAnimationFrame(tick);
    }
   
}
tick();



