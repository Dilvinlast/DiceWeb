
const container = document.getElementById("diceContainer");
const diceSelector = document.getElementById("diceSelector");
const rollButton = document.getElementById("rollButton");
const resultText = document.getElementById("result");

// ========================================
// DICE MODELS
// ========================================

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

// ========================================
// CALIBRATED FACE POSITIONS
// ========================================

const calibration = {
    d4: {
        1: [-0.8315301168413545, 0.024947424654920048, 0.08583096614525375, 0.5482411294671923],
        2: [0.6832953548864821, -0.5163044276032179, -0.5150068273665382, -0.03612705071996439],
        3: [-0.1446573324237177, -0.35840949077342915, -0.7501837412140092, 0.5365083853191278],
        4: [-0.4828795204023346, -0.8435074318227485, -0.1809248274547534, 0.15029566875419478]
    },

    d6: {
        1: [0.5453713629876399, 0.22164604335656674, 0.07798566792792973, 0.8045876853986876],
        2: [-0.24501572347493572, 0.1398088312060676, 0.6161772790019855, 0.7353545721681186],
        3: [-0.6303461762302371, -0.4414611058772489, -0.5303184815416064, 0.35572193950466435],
        4: [-0.6855320585683093, 0.46200142454931026, 0.53092535522861, 0.18632967440769738],
        5: [-0.04230512127118832, -0.9625160954241572, 0.26790363270414475, 0.0008284609753328031],
        6: [0.04760311563908204, -0.5914876978834587, 0.8047190696837937, 0.017420261801370414]
    },

    d8: {
        1: [0.5461032661067096, 0.11329260819745464, 0.11281600785176525, 0.8223190111190383],
        2: [-0.8058265056671851, 0.5694130396730811, -0.15798260914907783, 0.03813041071016791],
        3: [-0.7373633287109687, 0.046780069510954835, 0.5684831570241051, -0.3618478226392098],
        4: [-0.377212878149916, 0.7333905705560511, -0.2481493968656472, -0.5082032983093894],
        5: [-0.15682602313880997, 0.3342283520306442, -0.38798793867076675, 0.8444894117816723],
        6: [-0.5839013674731419, -0.463049603358395, -0.28285478504639405, 0.6038521577911155],
        7: [-0.04568817445340892, -0.31364332922486376, -0.5266284273744393, 0.788798423064463],
        8: [-0.8449682376115413, 0.06908161621096581, -0.01720708681979986, 0.5300569062775264]
    },

    d10: {
        1: [-0.09936586307066622, 0.8546352389622792, 0.034163680117868994, -0.5084858666088109],
        2: [0.8962172173224143, -0.024790332765640428, -0.4379992236999753, -0.06585452766861442],
        3: [-0.015977632892221913, 0.9871368344103086, 0.07640647455187173, 0.13952647076490665],
        4: [0.9871143562599862, 0.030333979505382018, 0.1084566928150272, -0.11367604469028225],
        5: [-0.1254254436251215, -0.6856087566254436, -0.07132553753550079, -0.7135276859556513],
        6: [0.6993719617555612, -0.09673000747175128, 0.7060249743607462, -0.055234955812423395],
        7: [-0.09457365555791028, -0.1450749877102611, 0.00045203711967715476, -0.9848902818475385],
        8: [0.161857836939679, -0.08027618316414233, 0.9834404050371351, 0.014238847502553527],
        9: [-0.13302227700530858, 0.4345549773166836, 0.09394322012881631, -0.8858000434079061],
        10: [0.4533336264318429, 0.07822872411844917, -0.8869534426078117, -0.04101805108858085]
    },

    d12: {
        1: [0.5524174372008103, -0.01823505905429089, -0.007959850293713402, 0.8333301257491397],
        2: [0.034843100921785525, -0.9867698784796914, -0.028386606026721398, -0.15577344395503737],
        3: [0.07142375795461248, 0.6972005060909636, 0.033574785138719025, 0.7125186558322766],
        4: [-0.01224769194425281, 0.8871014625631015, 0.027032942172601254, -0.4606193756214967],
        5: [-0.03305173137622336, -0.16706360774878098, -0.032405295756775324, -0.9848589903259813],
        6: [0.203031237518656, -0.810087410092733, 0.3578261890325962, -0.4177285279260923],
        7: [-0.05348898099088146, 0.4318015212573537, 0.0038179517474244713, -0.9003731439780103],
        8: [0.01241481975644018, 0.9043991673816879, -0.40632280869938303, -0.12965258740329622],
        9: [-0.3574690038888055, 0.42031705462903884, -0.19192784239385988, 0.8116114761144967],
        10: [-0.24547191421622602, -0.6075456692472531, 0.2383692678815658, 0.7168067321388211],
        11: [-0.373523680056792, -0.10340329907582697, 0.051312362570137, 0.9204101583666584],
        12: [-0.03847355465281641, 0.6465005433082593, -0.7617504461681143, 0.017119896529505345]
    },

    d20: {
        1: [0.19061483479611804, 0.5616759679337525, -0.7927299213043751, -0.14058934408442889],
        2: [0.41245572492824883, 0.5767827968182617, -0.39629142396599304, -0.5832280750781998],
        3: [-0.1584042762093459, 0.8072407793093325, -0.5315560755213123, 0.20178837447939305],
        4: [-0.15289284113620943, 0.7755875571972605, -0.4613080931635227, -0.4028431002659954],
        5: [-0.34924021912616426, -0.878097552229611, 0.32161148648636706, 0.05951478701216867],
        6: [-0.5611956255839095, 0.2578865943801704, -0.12654656455270907, 0.7762344628167374],
        7: [-0.4458645423218894, -0.38264474888442157, -0.10443239051778541, 0.8024223836995145],
        8: [-0.4496865976850693, 0.7660788317642512, -0.04666655135242416, 0.45686696134653754],
        9: [-0.24963382245242258, -0.03183245677844732, 0.34673723889319036, 0.903572319489684],
        10: [0.11088834261805458, -0.4969659042312084, 0.46329502112168386, -0.7253181294486833],
        11: [-0.14651190289100094, -0.8399754331062002, -0.08904173653170366, 0.5148272557321808],
        12: [0.16293629169094598, -0.9862841199571271, -0.022163837554932946, 0.014288592486209015],
        13: [0.07207375743225898, -0.4343033959176799, 0.18750181892520798, 0.8780825711080397],
        14: [0.13616393715858965, 0.8641751292991392, -0.09715990904700977, 0.47457420936273476],
        15: [0.4519210917573434, -0.727329545209529, -0.08617256178718265, 0.5092478267849405],
        16: [-0.035206574061921556, -0.0182127660456012, 0.1930206715680896, -0.9803937028781828],
        17: [0.08612141424711493, -0.5135552353537403, -0.18330828997376336, -0.8338118451279856],
        18: [0.09321699012879792, -0.48653601550130426, -0.4814018271304705, 0.7230806173635737],
        19: [-0.12605383876026216, 0.7947153791639062, 0.4791647230178441, 0.3506266733570097],
        20: [0.551737464161978, -0.1979631190256424, -0.15485277375200845, 0.7952464980162179]
    }
};

// ========================================
// THREE.JS SCENE
// ========================================

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
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 2)
);

renderer.setClearColor(0x000000, 0);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

// ========================================
// LIGHTING
// ========================================

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

// ========================================
// RESIZE
// ========================================

function resizeRenderer() {
    const width = Math.max(
        container.clientWidth,
        1
    );

    const height = Math.max(
        container.clientHeight,
        1
    );

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

resizeRenderer();

window.addEventListener(
    "resize",
    resizeRenderer
);

// ========================================
// STATE
// ========================================

const loader = new THREE.GLTFLoader();

let currentDiceType = diceSelector.value || "d6";

let diceGroup = null;
let modelReady = false;
let rolling = false;

let pendingResult = null;
let rollStartTime = 0;
let modelRequestId = 0;

const startQuaternion = new THREE.Quaternion();
const targetQuaternion = new THREE.Quaternion();

const spinAxis = new THREE.Vector3(
    0.6,
    1,
    0.4
).normalize();

// ========================================
// GET CALIBRATED ORIENTATION
// ========================================

function getLandingQuaternion(type, result) {
    const orientation = calibration[type]?.[result];

    if (!orientation || orientation.length !== 4) {
        console.error(
            "Missing calibration:",
            type,
            result
        );

        return null;
    }

    return new THREE.Quaternion()
        .fromArray(orientation)
        .normalize();
}

// ========================================
// LOAD MODEL
// ========================================

function createDice(type) {
    const dice = diceTypes[type];

    if (!dice) {
        console.error("Unknown dice type:", type);
        return;
    }

    modelRequestId++;

    const requestId = modelRequestId;

    modelReady = false;
    rolling = false;

    rollButton.disabled = true;
    resultText.textContent = "-";

    if (diceGroup) {
        scene.remove(diceGroup);
    }

    diceGroup = new THREE.Group();
    scene.add(diceGroup);

    const currentGroup = diceGroup;

    loader.load(
        dice.file,

        function(gltf) {
            if (
                requestId !== modelRequestId ||
                diceGroup !== currentGroup
            ) {
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
                !Number.isFinite(maxSize) ||
                maxSize <= 0
            ) {
                resultText.textContent = "Kļūda";

                console.error(
                    "Invalid model dimensions:",
                    dice.file
                );

                return;
            }

            // Center the model
            model.position.sub(center);

            // Scale the model
            const wrapper = new THREE.Group();

            wrapper.scale.setScalar(
                1.85 / maxSize
            );

            wrapper.add(model);
            currentGroup.add(wrapper);

            // Initial position
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
                "Failed to load:",
                dice.file,
                error
            );
        }
    );
}

// ========================================
// SELECT DICE
// ========================================

diceSelector.addEventListener(
    "change",
    function() {
        if (rolling) return;

        currentDiceType = diceSelector.value;

        createDice(currentDiceType);
    }
);

// ========================================
// ROLL DICE
// ========================================

rollButton.addEventListener(
    "click",
    function() {
        if (
            rolling ||
            !modelReady ||
            !diceGroup
        ) {
            return;
        }

        const dice = diceTypes[currentDiceType];

        pendingResult =
            Math.floor(Math.random() * dice.sides) + 1;

        const landing = getLandingQuaternion(
            currentDiceType,
            pendingResult
        );

        if (!landing) {
            resultText.textContent = "Kļūda";
            return;
        }

        resultText.textContent = "?";

        startQuaternion.copy(
            diceGroup.quaternion
        );

        targetQuaternion.copy(landing);

        rollStartTime = performance.now();

        rolling = true;

        rollButton.disabled = true;
        diceSelector.disabled = true;
    }
);

// ========================================
// SMOOTH ANIMATION
// ========================================

function smootherStep(t) {
    return t * t * t *
        (t * (t * 6 - 15) + 10);
}

function animate(time) {
    requestAnimationFrame(animate);

    if (rolling && diceGroup) {
        const duration =
            currentDiceType === "d4"
                ? 2600
                : 2200;

        const t = THREE.MathUtils.clamp(
            (time - rollStartTime) / duration,
            0,
            1
        );

        const progress = smootherStep(t);

        // Smooth transition to calibrated position
        const baseRotation = startQuaternion
            .clone()
            .slerp(
                targetQuaternion,
                progress
            );

        // Three full rotations
        const spinAngle =
            6 * Math.PI * (1 - progress);

        const extraRotation =
            new THREE.Quaternion()
                .setFromAxisAngle(
                    spinAxis,
                    spinAngle
                );

        diceGroup.quaternion.copy(
            extraRotation.multiply(baseRotation)
        );

        if (t >= 1) {
            diceGroup.quaternion.copy(
                targetQuaternion
            );

            rolling = false;

            resultText.textContent =
                String(pendingResult);

            pendingResult = null;

            rollButton.disabled = false;
            diceSelector.disabled = false;
        }
    }

    renderer.render(scene, camera);
}

// ========================================
// START
// ========================================

createDice(currentDiceType);

requestAnimationFrame(animate);
