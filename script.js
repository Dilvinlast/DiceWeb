
(function () {
    "use strict";

    const container = document.getElementById("diceContainer");
    const selector = document.getElementById("diceSelector");
    const button = document.getElementById("rollButton");
    const result = document.getElementById("result");
    const message = document.getElementById("loadingMessage");

    /* ========================================
       DICE MODELS
    ======================================== */

    const types = {
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

    /* ========================================
       SAVED CALIBRATION
    ======================================== */

    const STORAGE_KEY = "dice-blackgold-calibration-v1";

    let calibration = {};

    try {
        const stored = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "{}"
        );

        if (stored && typeof stored === "object") {
            calibration = stored;
        }
    } catch (error) {
        console.warn("Calibration loading error:", error);
    }

    function savedPose(type, number) {
        const value =
            calibration[type] &&
            calibration[type][String(number)];

        if (
            !Array.isArray(value) ||
            value.length !== 4 ||
            !value.every(Number.isFinite)
        ) {
            return null;
        }

        const pose = new THREE.Quaternion(
            value[0],
            value[1],
            value[2],
            value[3]
        );

        if (pose.lengthSq() < 0.01) {
            return null;
        }

        return pose.normalize();
    }

    /* ========================================
       THREE.JS SCENE
    ======================================== */

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        38,
        1,
        0.1,
        100
    );

    camera.position.set(0, 2.5, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    /* ========================================
       LIGHTING
    ======================================== */

    scene.add(
        new THREE.AmbientLight(0xffffff, 0.75)
    );

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

    /* ========================================
       VARIABLES
    ======================================== */

    const loader = new THREE.GLTFLoader();

    const defaultPose = new THREE.Quaternion()
        .setFromEuler(
            new THREE.Euler(-0.38, 0.62, 0.12)
        );

    const axisX = new THREE.Vector3(1, 0, 0);
    const axisY = new THREE.Vector3(0, 1, 0);

    const spinX = new THREE.Quaternion();
    const spinY = new THREE.Quaternion();
    const wobbleQuaternion = new THREE.Quaternion();

    const interpolated = new THREE.Quaternion();
    const startPose = new THREE.Quaternion();
    const targetPose = new THREE.Quaternion();

    let diceGroup = null;

    let currentType =
        selector.value in types
            ? selector.value
            : "d6";

    let ready = false;
    let rolling = false;

    let requestId = 0;
    let startTime = 0;

    let pendingNumber = 0;
    let lastNumber = 0;

    // Duration of the roll in milliseconds
    const duration = 2800;

    const zoomDuration = 1000;

const normalCameraZ = 6;
const closeCameraZ = 5.0;

let zoomStartTime = 0;
let zooming = false;
let zoomDirection = 1;
let zoomFromZ = normalCameraZ;
let zoomToZ = closeCameraZ;

function startZoom(toClose) {
    zoomFromZ = camera.position.z;
    zoomToZ = toClose ? closeCameraZ : normalCameraZ;
    zoomStartTime = performance.now();
    zooming = true;
}

function updateZoom(time) {
    if (!zooming) return;

    const t = THREE.MathUtils.clamp(
        (time - zoomStartTime) / zoomDuration,
        0,
        1
    );

    const eased = t * t * (3 - 2 * t);

    camera.position.z =
        zoomFromZ +
        (zoomToZ - zoomFromZ) * eased;

    if (t >= 1) {
        camera.position.z = zoomToZ;
        zooming = false;
    }
}

    /* ========================================
       RESIZE
    ======================================== */

    function resize() {
        const width = Math.max(
            1,
            container.clientWidth
        );

        const height = Math.max(
            1,
            container.clientHeight
        );

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height, false);
    }

    window.addEventListener("resize", resize);

    if ("ResizeObserver" in window) {
        new ResizeObserver(resize).observe(container);
    }

    resize();

    /* ========================================
       CONTROLS
    ======================================== */

    function setBusy(busy) {
        button.disabled = busy;
        selector.disabled = busy;

        container.classList.toggle("is-busy", busy);

        container.setAttribute(
            "aria-disabled",
            String(busy)
        );
    }

    /* ========================================
       LOAD DICE
    ======================================== */

    function loadDice(type) {
        const config = types[type];

        if (!config) {
            return;
        }

        const token = ++requestId;


ready = false;
rolling = false;

// Останавливаем предыдущее приближение
zooming = false;

// Возвращаем камеру в исходное положение
camera.position.set(0, 2.5, normalCameraZ);
camera.lookAt(0, 0, 0);

// Сбрасываем состояние приближения
zoomFromZ = normalCameraZ;
zoomToZ = normalCameraZ;

setBusy(true);


        result.textContent = "-";

        if (message) {
            message.textContent = "Loading...";
        }

        if (diceGroup) {
            scene.remove(diceGroup);
            diceGroup = null;
        }

        loader.load(
            config.file,

            function (gltf) {
                if (token !== requestId) {
                    return;
                }

                const model = gltf.scene;

                model.updateMatrixWorld(true);

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

                if (
                    !(maxSize > 0) ||
                    !Number.isFinite(maxSize)
                ) {
                    console.error("Invalid model:", config.file);

                    if (message) {
                        message.textContent = "Invalid 3D model";
                    }

                    return;
                }

                const centerGroup = new THREE.Group();

                model.position.sub(center);
                centerGroup.add(model);

                centerGroup.scale.setScalar(
                    1.85 / maxSize
                );

                diceGroup = new THREE.Group();
                diceGroup.add(centerGroup);

                diceGroup.quaternion.copy(
                    savedPose(type, 1) || defaultPose
                );

                diceGroup.position.set(0, 0, 0);

                scene.add(diceGroup);

                ready = true;
                setBusy(false);

                if (message) {
                    message.textContent = "";
                }

                console.log(
                    "Loaded:",
                    type,
                    config.file
                );

                console.log(
                    "Calibrated faces:",
                    Object.keys(
                        calibration[type] || {}
                    ).length
                );
            },

            undefined,

            function (error) {
                if (token !== requestId) {
                    return;
                }

                console.error(
                    "Failed to load:",
                    config.file,
                    error
                );

                if (message) {
                    message.textContent = "Model loading error";
                }
            }
        );
    }

    /* ========================================
       RANDOM POSE
    ======================================== */

    function randomPose() {
        return new THREE.Quaternion()
            .setFromEuler(
                new THREE.Euler(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                )
            );
    }

    /* ========================================
       START ROLL
    ======================================== */

    function roll() {
        if (!ready || rolling || !diceGroup) {
            return;
        }

        const config = types[currentType];

        pendingNumber =
            Math.floor(Math.random() * config.sides) + 1;

        const pose = savedPose(
            currentType,
            pendingNumber
        );

        if (!pose) {
            console.warn(
                "No saved orientation for:",
                currentType,
                pendingNumber
            );
        }

        startPose.copy(diceGroup.quaternion);

        targetPose.copy(
            pose || randomPose()
        );

startZoom(false);

startTime = performance.now();

rolling = true;

        result.textContent = "?";

        setBusy(true);
    }

    /* ========================================
       SMOOTH ROLL ANIMATION
    ======================================== */

    
function animate(time) {
    requestAnimationFrame(animate);

    if (rolling && diceGroup) {

        const t = THREE.MathUtils.clamp(
            (time - startTime) / duration,
            0,
            1
        );

        // Плавное ускорение и замедление
        const eased = t * t * (3 - 2 * t);

        // Постепенный переход к нужной грани
        interpolated
            .copy(startPose)
            .slerp(targetPose, eased);

        // Медленное вращение: 2 оборота по X и 2 по Y
        spinX.setFromAxisAngle(
            axisX,
            Math.PI * 2 * 2 * eased
        );

        spinY.setFromAxisAngle(
            axisY,
            Math.PI * 2 * 2 * eased
        );

        diceGroup.quaternion
            .copy(interpolated)
            .multiply(spinX)
            .multiply(spinY);

        // Очень лёгкое покачивание
        const wobbleStrength =
            Math.sin(t * Math.PI * 4) *
            Math.pow(1 - t, 2) *
            0.025;

        wobbleQuaternion.setFromAxisAngle(
            axisX,
            wobbleStrength
        );

        diceGroup.quaternion.multiply(
            wobbleQuaternion
        );

        // Небольшой плавный подъём
        diceGroup.position.y =
            Math.sin(t * Math.PI) * 0.08;

       if (t >= 1) {
    diceGroup.quaternion.copy(targetPose);
    diceGroup.position.y = 0;

    rolling = false;
    lastNumber = pendingNumber;

    result.textContent = String(pendingNumber);

    startZoom(true);

    setBusy(false);
}
    }

    updateZoom(time);


    renderer.render(scene, camera);
}


    /* ========================================
       CHANGE DICE TYPE
    ======================================== */

    selector.addEventListener(
        "change",
        function () {
            if (rolling) {
                return;
            }

            currentType = selector.value;

            lastNumber = 0;

            loadDice(currentType);
        }
    );

    /* ========================================
       CLICK ON DICE TO ROLL
    ======================================== */

    button.addEventListener("click", roll);

    container.addEventListener(
        "click",
        function () {
            button.click();
        }
    );

    /* ========================================
       KEYBOARD SUPPORT
    ======================================== */

    container.addEventListener(
        "keydown",
        function (event) {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                button.click();
            }
        }
    );

    /* ========================================
       START
    ======================================== */

    loadDice(currentType);

    requestAnimationFrame(animate);

})();
