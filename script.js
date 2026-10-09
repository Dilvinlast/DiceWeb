
const container = document.getElementById("diceContainer");
const diceSelector = document.getElementById("diceSelector");
const rollButton = document.getElementById("rollButton");
const resultText = document.getElementById("result");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    38,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    100
);

camera.position.set(0, 2.5, 6);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(
    container.clientWidth,
    Math.max(container.clientHeight, 1)
);
renderer.setClearColor(0x000000, 0);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.48);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xfff7eb, 3.2);
mainLight.position.set(-4, 6, 5);
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xdde8ff, 0.55);
fillLight.position.set(5, 1, 3);
scene.add(fillLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.25);
backLight.position.set(0, 2, -5);
scene.add(backLight);

const diceMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2efe8,
    roughness: 0.72,
    metalness: 0,
    flatShading: true
});

const dotMaterial = new THREE.MeshStandardMaterial({
    color: 0x151515,
    roughness: 0.45,
    metalness: 0
});

let currentDiceType = diceSelector.value || "d6";
let diceGroup = null;
let currentFaces = [];
let rolling = false;
let pendingResult = null;
let rollStartTime = 0;
let targetQuaternion = new THREE.Quaternion();
let startQuaternion = new THREE.Quaternion();
let modelRequestId = 0;

const rollDuration = 1600;

const startRotations = {
    d4: { x: -0.85, y: 0.70, z: 0.48 },
    d6: { x: -0.42, y: 0.62, z: 0.10 },
    d8: { x: -0.35, y: 0.65, z: 0.12 },
    d10: { x: -0.45, y: 0.62, z: 0.18 },
    d12: { x: -0.38, y: 0.62, z: 0.12 },
    d20: { x: -0.38, y: 0.62, z: 0.12 }
};

const d6FaceNormals = {
    1: new THREE.Vector3(0, 0, 1),
    2: new THREE.Vector3(0, -1, 0),
    3: new THREE.Vector3(1, 0, 0),
    4: new THREE.Vector3(-1, 0, 0),
    5: new THREE.Vector3(0, 1, 0),
    6: new THREE.Vector3(0, 0, -1)
};

function getTriangles(geometry) {
    const position = geometry.attributes.position;
    const index = geometry.index;
    const triangles = [];

    function addTriangle(ia, ib, ic) {
        const a = new THREE.Vector3().fromBufferAttribute(position, ia);
        const b = new THREE.Vector3().fromBufferAttribute(position, ib);
        const c = new THREE.Vector3().fromBufferAttribute(position, ic);

        const center = a.clone().add(b).add(c).divideScalar(3);

        const normal = b.clone()
            .sub(a)
            .cross(c.clone().sub(a))
            .normalize();

        if (normal.dot(center) < 0) {
            normal.negate();
        }

        triangles.push({ center, normal });
    }

    if (index) {
        for (let i = 0; i < index.count; i += 3) {
            addTriangle(
                index.getX(i),
                index.getX(i + 1),
                index.getX(i + 2)
            );
        }
    } else {
        for (let i = 0; i < position.count; i += 3) {
            addTriangle(i, i + 1, i + 2);
        }
    }

    return triangles;
}

function getRealFaces(geometry) {
    const triangles = getTriangles(geometry);
    const faces = [];

    triangles.forEach(triangle => {
        let matchingFace = null;

        for (const face of faces) {
            const similarity = face.normal.dot(triangle.normal);
            const difference = Math.abs(
                face.center.dot(face.normal) -
                triangle.center.dot(face.normal)
            );

            if (similarity > 0.999 && difference < 0.025) {
                matchingFace = face;
                break;
            }
        }

        if (matchingFace) {
            matchingFace.centers.push(triangle.center.clone());

            matchingFace.center.set(0, 0, 0);

            matchingFace.centers.forEach(point => {
                matchingFace.center.add(point);
            });

            matchingFace.center.divideScalar(
                matchingFace.centers.length
            );
        } else {
            faces.push({
                normal: triangle.normal.clone(),
                center: triangle.center.clone(),
                centers: [triangle.center.clone()]
            });
        }
    });

    return faces;
}

function sortFaces(faces) {
    return faces.sort((a, b) => {
        if (Math.abs(a.center.y - b.center.y) > 0.001) {
            return b.center.y - a.center.y;
        }

        return Math.atan2(a.center.z, a.center.x) -
               Math.atan2(b.center.z, b.center.x);
    });
}

function createNumberTexture(number) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = "#2E4E7B";
    ctx.font = "bold 210px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(number), 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
}

function createNumberLabel(number, face, type) {
    const texture = createNumberTexture(number);

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    let size = 1.38;
    let offset = 0.025;

    if (type === "d4") size = 1.14;
    if (type === "d8") size = 1.08;
    if (type === "d10") {
        size = 0.87;
        offset = 0.045;
    }
    if (type === "d12") size = 1.08;
    if (type === "d20") size = 0.87;

    const label = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        material
    );

    label.position.copy(face.center);
    label.position.addScaledVector(face.normal, offset);

    label.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        face.normal.clone().normalize()
    );

    return label;
}

// Загружаем готовую чёрно-золотую модель D6
function loadBlackGoldD6(group, requestId) {
    const loader = new THREE.FBXLoader();

    loader.load(
        "model/Dice_BlackGold.fbx",

        function(model) {
            if (requestId !== modelRequestId || diceGroup !== group) {
                return;
            }

            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);

            if (maxSize <= 0) {
                console.error("Неверный размер FBX-модели");
                return;
            }

            const scale = 1.75 / maxSize;

            model.scale.multiplyScalar(scale);
            model.position.addScaledVector(center, -scale);

            // Убираем временный стандартный D6
            while (group.children.length > 0) {
                const child = group.children[0];
                group.remove(child);

                if (child.geometry) {
                    child.geometry.dispose();
                }
            }

            // Новая модель вращается вместе с diceGroup
            group.add(model);

            console.log("Новая модель D6 загружена");
        },

        undefined,

        function(error) {
            console.error("Ошибка загрузки Dice_BlackGold.fbx:", error);
        }
    );
}

function createDice(type) {
    modelRequestId++;
    const requestId = modelRequestId;

    if (diceGroup) {
        scene.remove(diceGroup);
    }

    diceGroup = new THREE.Group();
    currentFaces = [];

    const dice = diceTypes[type];

    if (type === "d6") {
        // Временная геометрия до загрузки FBX
        const geometry = dice.createGeometry();

        const mesh = new THREE.Mesh(geometry, diceMaterial);
        diceGroup.add(mesh);

        for (let number = 1; number <= 6; number++) {
            currentFaces.push({
                number,
                normal: d6FaceNormals[number].clone()
            });
        }

        loadBlackGoldD6(diceGroup, requestId);
    } else {
        const geometry = dice.createGeometry();
        const mesh = new THREE.Mesh(geometry, diceMaterial);

        diceGroup.add(mesh);

        let faces;

        if (
            type === "d10" &&
            geometry.userData.diceFaces &&
            geometry.userData.diceFaces.length > 0
        ) {
            faces = geometry.userData.diceFaces.map(face => ({
                center: face.center.clone(),
                normal: face.normal.clone()
            }));
        } else {
            faces = sortFaces(getRealFaces(geometry));
        }

        faces = faces.slice(0, dice.sides);

        faces.forEach((face, index) => {
            const number = index + 1;

            currentFaces.push({
                number,
                center: face.center.clone(),
                normal: face.normal.clone()
            });

            diceGroup.add(
                createNumberLabel(number, face, type)
            );
        });
    }

    const rotation = startRotations[type];
    diceGroup.rotation.set(rotation.x, rotation.y, rotation.z);

    scene.add(diceGroup);
}

function getLandingQuaternion(result) {
    const face = currentFaces.find(item => item.number === result);

    if (!face) {
        return new THREE.Quaternion();
    }

    const cameraDirection = camera.position.clone().normalize();

    return new THREE.Quaternion().setFromUnitVectors(
        face.normal.clone().normalize(),
        cameraDirection
    );
}

diceSelector.addEventListener("change", function() {
    if (rolling) return;

    currentDiceType = diceSelector.value;
    createDice(currentDiceType);
    resultText.textContent = "-";
});

rollButton.addEventListener("click", function() {
    if (rolling || !diceGroup) return;

    const dice = diceTypes[currentDiceType];

    pendingResult = Math.floor(Math.random() * dice.sides) + 1;
    resultText.textContent = "?";

    startQuaternion.copy(diceGroup.quaternion);
    targetQuaternion = getLandingQuaternion(pendingResult);

    rollStartTime = performance.now();
    rolling = true;

    rollButton.disabled = true;
    diceSelector.disabled = true;
});

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function animate(time) {
    requestAnimationFrame(animate);

    if (rolling && diceGroup) {
        let t = (time - rollStartTime) / rollDuration;
        t = THREE.MathUtils.clamp(t, 0, 1);

        const eased = easeOutCubic(t);

        const spin = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
                (1 - eased) * Math.PI * 5,
                (1 - eased) * Math.PI * 7,
                (1 - eased) * Math.PI * 4
            )
        );

        const temporary = startQuaternion.clone().multiply(spin);
        temporary.slerp(targetQuaternion, eased);

        diceGroup.quaternion.copy(temporary);

        if (t >= 1) {
            diceGroup.quaternion.copy(targetQuaternion);

            rolling = false;
            resultText.textContent = pendingResult;
            pendingResult = null;

            rollButton.disabled = false;
            diceSelector.disabled = false;
        }
    }

    renderer.render(scene, camera);
}

createDice(currentDiceType);
requestAnimationFrame(animate);

window.addEventListener("resize", function() {
    const width = container.clientWidth;
    const height = Math.max(container.clientHeight, 1);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});
