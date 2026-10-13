
const container = document.getElementById("diceContainer");
const diceSelector = document.getElementById("diceSelector");
const rollButton = document.getElementById("rollButton");
const resultText = document.getElementById("result");

// ALL GLB DICE MODELS

const diceTypes = {
    d4: {
        sides: 4,
        file: "model/MP_D4_BlackGold.glb"
    },
    d6: {
        sides: 6,
        file: "model/MP_D6_BlackGold.glb"
    },
    d8: {
        sides: 8,
        file: "model/MP_D8_BlackGold.glb"
    },
    d10: {
        sides: 10,
        file: "model/MP_D10_BlackGold.glb"
    },
    d12: {
        sides: 12,
        file: "model/MP_D12_BlackGold.glb"
    },
    d20: {
        sides: 20,
        file: "model/MP_D20_BlackGold.glb"
    }
};

// SCENE

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    38,
    1,
    0.1,
    100
);

camera.position.set(0, 2.5, 6);
camera.lookAt(0, 0, 0);

// RENDERER

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setClearColor(0x000000, 0);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

// LIGHTS

const ambientLight = new THREE.AmbientLight(
    0xffffff,
    0.75
);

scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(
    0xffffff,
    3
);

mainLight.position.set(-4, 6, 5);
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(
    0xdde8ff,
    1
);

fillLight.position.set(5, 2, 3);
scene.add(fillLight);

const backLight = new THREE.DirectionalLight(
    0xffffff,
    0.7
);

backLight.position.set(0, 3, -5);
scene.add(backLight);

// VARIABLES

const loader = new THREE.GLTFLoader();

let currentDiceType = diceSelector.value || "d6";

let diceGroup = null;
let rolling = false;
let modelReady = false;

let pendingResult = null;
let rollStartTime = 0;
let modelRequestId = 0;

const rollDuration = 1600;

const startQuaternion = new THREE.Quaternion();
const targetQuaternion = new THREE.Quaternion();

const spinQuaternion = new THREE.Quaternion();
const temporaryQuaternion = new THREE.Quaternion();

// Resize renderer for desktop and mobile

function resizeRenderer() {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

resizeRenderer();

window.addEventListener("resize", resizeRenderer);

// LOAD SELECTED GLB MODEL

function createDice(type) {
    const dice = diceTypes[type];

    if (!dice) {
        console.error("Unknown dice type:", type);
        return;
    }

    modelRequestId++;

    const requestId = modelRequestId;

    modelReady = false;
    rollButton.disabled = true;

    resultText.textContent = "-";

    // Remove previous dice

    if (diceGroup) {
        scene.remove(diceGroup);
    }

    diceGroup = new THREE.Group();

    scene.add(diceGroup);

    const currentGroup = diceGroup;

    loader.load(
        dice.file,

        function(gltf) {
            // Ignore outdated loading requests

            if (
                requestId !== modelRequestId ||
                diceGroup !== currentGroup
            ) {
                return;
            }

            const model = gltf.scene;

            model.updateMatrixWorld(true);

            // Calculate original model bounds

            const box = new THREE.Box3()
                .setFromObject(model);

            const size = box.getSize(
                new THREE.Vector3()
            );

            const center = box.getCenter(
                new THREE.Vector3()
            );

            const maxSize = Math.max(
                size.x,
                size.y,
                size.z
            );

            if (!Number.isFinite(maxSize) || maxSize <= 0) {
                console.error("Invalid GLB dimensions:", dice.file);
                resultText.textContent = "Kļūda";
                return;
            }

            // Center model in its own coordinate system

            model.position.sub(center);

            // Wrapper scales the complete model

            const wrapper = new THREE.Group();

            wrapper.scale.setScalar(
                1.85 / maxSize
            );

            wrapper.add(model);

            currentGroup.add(wrapper);

            // Set initial viewing angle

            currentGroup.rotation.set(
                -0.38,
                0.62,
                0.12
            );

            modelReady = true;
            rollButton.disabled = false;

            console.log(
                type.toUpperCase() + " loaded:",
                dice.file
            );
        },

        undefined,

        function(error) {
            if (requestId !== modelRequestId) {
                return;
            }

            modelReady = false;
            rollButton.disabled = true;
            resultText.textContent = "Kļūda";

            console.error(
                "Failed to load " + dice.file,
                error
            );
        }
    );
}

// DICE SELECTOR

diceSelector.addEventListener("change", function() {
    if (rolling) return;

    currentDiceType = diceSelector.value;

    createDice(currentDiceType);
});

// ROLL BUTTON

rollButton.addEventListener("click", function() {
    if (rolling || !modelReady || !diceGroup) {
        return;
    }

    const dice = diceTypes[currentDiceType];

    pendingResult =
        Math.floor(Math.random() * dice.sides) + 1;

    resultText.textContent = "?";

    startQuaternion.copy(diceGroup.quaternion);

    // Temporary landing orientation.
    // Actual face-to-number mapping needs calibration
    // for each imported GLB model.

    targetQuaternion.setFromEuler(
        new THREE.Euler(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        )
    );

    rollStartTime = performance.now();

    rolling = true;

    rollButton.disabled = true;
    diceSelector.disabled = true;
});

// ANIMATION

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function animate(time) {
    requestAnimationFrame(animate);

    if (rolling && diceGroup) {
        let t = (time - rollStartTime) / rollDuration;

        t = THREE.MathUtils.clamp(t, 0, 1);

        const eased = easeOutCubic(t);

        spinQuaternion.setFromEuler(
            new THREE.Euler(
                (1 - eased) * Math.PI * 5,
                (1 - eased) * Math.PI * 7,
                (1 - eased) * Math.PI * 4
            )
        );

        temporaryQuaternion
            .copy(startQuaternion)
            .multiply(spinQuaternion);

        temporaryQuaternion.slerp(
            targetQuaternion,
            eased
        );

        diceGroup.quaternion.copy(
            temporaryQuaternion
        );

        if (t >= 1) {
            diceGroup.quaternion.copy(
                targetQuaternion
            );

            rolling = false;

            resultText.textContent =
                pendingResult;

            pendingResult = null;

            rollButton.disabled = false;
            diceSelector.disabled = false;
        }
    }

    renderer.render(scene, camera);
}

// START

createDice(currentDiceType);

requestAnimationFrame(animate);
