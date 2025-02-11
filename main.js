import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Octree } from 'three/addons/math/Octree.js'
import { Capsule } from 'three/addons/math/Capsule.js'

const scene = new THREE.Scene()
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const canvas = document.getElementById("experience-canvas")
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Physics stuff
const GRAVITY = 30
const CAPSULE_RADIUS = 0.35
const CAPSULE_HEIGHT = 1
const JUMP_HEIGHT = 10
const MOVE_SPEED = 6

let character = {
    instance: null,
    isMoving: false,
    spawnPosition: new THREE.Vector3()
}
let targetRotation = - Math.PI / 2

const colliderOctree = new Octree()
const playerCollider = new Capsule(
    new THREE.Vector3(0, CAPSULE_RADIUS, 0),
    new THREE.Vector3(0, CAPSULE_HEIGHT, 0),
    CAPSULE_RADIUS
)

let playerVelocity = new THREE.Vector3()
let playerOnFloor = false

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
renderer.setSize( sizes.width, sizes.height )
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.shadowMap.enabled = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.75

// Toggle theme night and day mode
const themeToggleButton = document.querySelector(".theme-mode-toggle-button")
const firstIcon = document.querySelector(".first-icon")
const secondIcon = document.querySelector(".second-icon")

function toggleTheme(){
    const isDarkTheme = document.body.classList.contains("dark-theme")
    document.body.classList.toggle("dark-theme")
    document.body.classList.toggle("light-theme")

    if (firstIcon.style.display === "none") {
        firstIcon.style.display = "block"
        secondIcon.style.display = "none"
    } else {
        firstIcon.style.display = "none"
        secondIcon.style.display = "block"
    }

    gsap.to(light.color, {
        r: isDarkTheme ? 1.0 : 0.25,
        g: isDarkTheme ? 1.0 : 0.31,
        b: isDarkTheme ? 1.0 : 0.78,
        duration: 1,
        ease: "power2.inOut",
      });
    
      gsap.to(light, {
        intensity: isDarkTheme ? 0.8 : 0.9,
        duration: 1,
        ease: "power2.inOut",
      });
    
      gsap.to(sun, {
        intensity: isDarkTheme ? 1 : 0.8,
        duration: 1,
        ease: "power2.inOut",
      });
    
      gsap.to(sun.color, {
        r: isDarkTheme ? 1.0 : 0.25,
        g: isDarkTheme ? 1.0 : 0.41,
        b: isDarkTheme ? 1.0 : 0.88,
        duration: 1,
        ease: "power2.inOut",
    });
}

themeToggleButton.addEventListener("click", toggleTheme)

// Modal 
const modalContent = {
    Lepetit:{
        title: "Le Petit Society",
        content: "This is the Le Petit Society UI/UX design refresh project. Created the web and mobile assets using Figma to be sent to the developer for implementation. Vibrant and youthful!",
        link: "https://www.artistwan.com/projects/lepetitsociety-uiux"
    },
    School:{
        title: "School Entrance",
        content: "This is an interactive 3D scene on the web of a school entrance. Created using Three.js, React, HTML and CSS, have fun exploring!",
        link: "https://3d-school-entrance-threejs.vercel.app/"
    },
    Spartner:{
        title: "Spartner",
        content: "This is an app to connect martial arts enthusiasts with each other. Created in a team during the le Wagon bootcamp using Ruby on Rails. Let's spar!",
        link: "https://www.artistwan.com/projects/spartner"
    },
}

const modal = document.querySelector(".modal")
const modalTitle = document.querySelector(".modal-title")
const modalProjectDescription = document.querySelector(".modal-project-description")
const modalExitButton = document.querySelector(".modal-exit-button")
const modalVisitProjectButton = document.querySelector(".modal-project-visit-button")

function showModal(id){
    const content = modalContent[id]
    if(content){
        modalTitle.textContent = content.title
        modalProjectDescription.textContent = content.content

        if(content.link){
            modalVisitProjectButton.href = content.link
            modalVisitProjectButton.classList.remove('hidden')
        }else{
            modalVisitProjectButton.classList.add('hidden')
        }

        modal.classList.toggle("hidden")
    }
}

function hideModal(){
    modal.classList.toggle("hidden")
}

const intersectObjects = []
const intersectObjectsNames = [
    "Lepetit",
    "School",
    "Spartner",
    "Bull",
    "Chicken",
    "Dropbear",
    "Sylveon",
    "Squirtle"
]

let intersectObject = ""

const loader = new GLTFLoader();

loader.load( './Portfolio.glb', function ( glb ) {
	glb.scene.traverse((child) => {
        if (intersectObjectsNames.includes(child.name)){
            intersectObjects.push(child)
        }
        if(child.isMesh){
            child.castShadow = true
            child.receiveShadow = true
            // console.log(child.material.color)

        }

        if(child.name === "Character"){
            character.spawnPosition.copy(child.position)
            character.instance = child
            playerCollider.start
                .copy(child.position)
                .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0))
            playerCollider.end
                .copy(child.position)
                .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0))
        }
        if(child.name === "collision"){
            colliderOctree.fromGraphNode(child)
            child.visible = false
        }
    })
    scene.add( glb.scene )
}, undefined, function ( error ) {
	console.error( error )
})

const sun = new THREE.DirectionalLight( 0xFFFFFF )
sun.castShadow = true
sun.position.set(75,80,0)
sun.target.position.set(50, 0, -15)
sun.shadow.mapSize.width = 4096
sun.shadow.mapSize.height = 4096
sun.shadow.camera.left = -100
sun.shadow.camera.right = 100
sun.shadow.camera.top = 100
sun.shadow.camera.bottom = -100
sun.shadow.normalBias = 0.2
scene.add( sun )

const light = new THREE.AmbientLight( 0x404040, 3 )
scene.add( light )

const aspect = sizes.width / sizes.height
const camera = new THREE.OrthographicCamera( 
    -aspect * 50, 
    aspect * 50, 
    50,
    -50,
    1, 
    1000 
)

camera.position.x = 73
camera.position.y = 36
camera.position.z = -43

const cameraOffset = new THREE.Vector3(73, 36, -43)
camera.zoom = 2.5
camera.updateProjectionMatrix()

function onResize(){
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    const aspect = sizes.width / sizes.height
    camera.left = -aspect * 50
    camera.right = aspect * 50
    camera.top = 50
    camera.bottom = -50   
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

function onPointerMove( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function respawnCharacter(){
    character.instance.position.copy(character.spawnPosition)

    playerCollider.start
        .copy(character.spawnPosition)
        .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0))
    playerCollider.end
        .copy(character.spawnPosition)
        .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0))

    playerVelocity.set(0, 0, 0)
    character.isMoving = false
}

function jumpCharacter(meshID){
    const mesh = scene.getObjectByName(meshID)
    const jumpHeight = 2
    const jumpDuration = 0.5

    const t1 = gsap.timeline()

    t1.to(mesh.scale, {
        x: 1.2,
        y: 0.8,
        z: 1.2,
        duration: jumpDuration * 0.2,
        ease: "power2.out",
    })

    t1.to(mesh.scale, {
        x: 0.8,
        y: 1.3,
        z: 0.8,
        duration: jumpDuration * 0.3,
        ease: "power2.out",
    })

    t1.to(mesh.position, {
        y: mesh.position.y + jumpHeight,
        duration: jumpDuration * 0.5,
        ease: "power2.out",
    }, "<"
    )

    t1.to(mesh.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: jumpDuration * 0.3,
        ease: "power1.inOut"
    })

    t1.to(
        mesh.position,
        {
            y: mesh.position.y,
            duration: jumpDuration * 0.5,
            ease: "bounce.out"
        }
    )
}

function onClick(){
    if(intersectObject !==""){
        if (["Bull","Chicken","Dropbear","Sylveon","Squirtle"].includes(intersectObject)){
            jumpCharacter(intersectObject)
        } else {
            showModal(intersectObject)
        }
    }
}

function playerCollisions(){
    const result = colliderOctree.capsuleIntersect(playerCollider)
    playerOnFloor = false

    if(result){
        playerOnFloor = result.normal.y > 0
        playerCollider.translate(result.normal.multiplyScalar(result.depth))

        if(playerOnFloor){
            character.isMoving = false
            playerVelocity.x = 0
            playerVelocity.z = 0
        }
    }
}

function updatePlayer(){
    if (!character.instance) return

    if(character.instance.position.y < -20){
        respawnCharacter()
        return
    }

    if (!playerOnFloor){
        playerVelocity.y -= GRAVITY * 0.05
    }

    playerCollider.translate(playerVelocity.clone().multiplyScalar(0.05))

    playerCollisions()

    character.instance.position.copy(playerCollider.start)
    character.instance.position.y -= CAPSULE_RADIUS

    let rotationDiff = 
        ((((targetRotation - character.instance.rotation.y) % (2 * Math.PI)) +
            3 * Math.PI) %
            (2 * Math.PI)) - 
        Math.PI
        let finalRotation = character.instance.rotation.y + rotationDiff
        

    character.instance.rotation.y = THREE.MathUtils.lerp(
        character.instance.rotation.y,
        targetRotation,
        0.1
    )
}

function onKeyDown(event){
    if(event.key.toLowerCase()==="r"){
        respawnCharacter()
        return
    }
    
    if (character.isMoving) return
    
    switch(event.key.toLowerCase()) {
        case "w":
        case "arrowup":
            playerVelocity.x -= MOVE_SPEED
            targetRotation = Math.PI 
            break
        case "a":
        case "arrowleft":
            playerVelocity.z += MOVE_SPEED
            targetRotation = -Math.PI / 2
            break
        case "s":
        case "arrowdown":
            playerVelocity.x += MOVE_SPEED
            targetRotation = 0
            break
        case "d":
        case "arrowright":
            playerVelocity.z -= MOVE_SPEED
            targetRotation = Math.PI / 2
            break
        default:
            return
        }
    playerVelocity.y = JUMP_HEIGHT
    character.isMoving = true
}

modalExitButton.addEventListener("click", hideModal)
window.addEventListener("resize", onResize)
window.addEventListener("click", onClick)
window.addEventListener("pointermove", onPointerMove)
window.addEventListener("keydown", onKeyDown)

function animate() {
    updatePlayer()

    if(character.instance){
        const targetCameraPosition = new THREE.Vector3(
            character.instance.position.x + cameraOffset.x, 
            cameraOffset.y, 
            character.instance.position.z + cameraOffset.z
        )
        camera.position.copy(targetCameraPosition)
        camera.lookAt(
            character.instance.position.x,
            camera.position.y - 39,
            character.instance.position.z
        )
    }

    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera( pointer, camera );

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects( intersectObjects );

    if(intersects.length > 0){
        document.body.style.cursor = "pointer"
    } else {
        document.body.style.cursor = "default"
        intersectObject = ""
    }

    for ( let i = 0; i < intersects.length; i ++ ) {
        intersectObject = intersects[0].object.parent.name
    }
    
    renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );