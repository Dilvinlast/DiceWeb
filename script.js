const container =
    document.getElementById("diceContainer");

const diceSelector =
    document.getElementById("diceSelector");

const rollButton =
    document.getElementById("rollButton");

const resultText =
    document.getElementById("result");


/* =====================================================
   SCENE
===================================================== */

const scene =
    new THREE.Scene();


/* =====================================================
   CAMERA
===================================================== */

const camera =
    new THREE.PerspectiveCamera(
        38,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );


camera.position.set(
    0,
    2.5,
    6
);


camera.lookAt(
    0,
    0,
    0
);


/* =====================================================
   RENDERER
===================================================== */

const renderer =
    new THREE.WebGLRenderer({

        antialias: true,

        alpha: true
    });


renderer.setPixelRatio(

    Math.min(
        window.devicePixelRatio,
        2
    )
);


renderer.setSize(

    container.clientWidth,

    container.clientHeight
);


renderer.setClearColor(
    0x000000,
    0
);


renderer.outputColorSpace =
    THREE.SRGBColorSpace;


renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


renderer.toneMappingExposure =
    1.1;


container.appendChild(
    renderer.domElement
);


/* =====================================================
   LIGHTS
===================================================== */

const ambientLight =
    new THREE.AmbientLight(
        0xffffff,
        0.48
    );


scene.add(
    ambientLight
);


const mainLight =
    new THREE.DirectionalLight(
        0xfff7eb,
        3.2
    );


mainLight.position.set(
    -4,
    6,
    5
);


scene.add(
    mainLight
);


const fillLight =
    new THREE.DirectionalLight(
        0xdde8ff,
        0.55
    );


fillLight.position.set(
    5,
    1,
    3
);


scene.add(
    fillLight
);


const backLight =
    new THREE.DirectionalLight(
        0xffffff,
        0.25
    );


backLight.position.set(
    0,
    2,
    -5
);


scene.add(
    backLight
);


/* =====================================================
   MATERIALS
===================================================== */

const diceMaterial =
    new THREE.MeshStandardMaterial({

        color:
            0xf2efe8,

        roughness:
            0.72,

        metalness:
            0,

        flatShading:
            true
    });


const dotMaterial =
    new THREE.MeshStandardMaterial({

        color:
            0x151515,

        roughness:
            0.45,

        metalness:
            0
    });


/* =====================================================
   VARIABLES
===================================================== */

let currentDiceType =
    diceSelector.value || "d6";


let diceGroup =
    null;


let currentFaces =
    [];


let rolling =
    false;


let pendingResult =
    null;


let rollStartTime =
    0;


const rollDuration =
    1600;


const startQuaternion =
    new THREE.Quaternion();


let targetQuaternion =
    new THREE.Quaternion();


/* =====================================================
   STARTING ANGLES
===================================================== */

const startRotations = {

    d4: {
        x: -0.85,
        y: 0.70,
        z: 0.48
    },

    d6: {
        x: -0.42,
        y: 0.62,
        z: 0.10
    },

    /*
        D8 оставляем максимально
        близко к твоему хорошему виду.
    */

    d8: {
        x: -0.35,
        y: 0.65,
        z: 0.12
    },

    d10: {
        x: -0.45,
        y: 0.62,
        z: 0.18
    },

    d12: {
        x: -0.38,
        y: 0.62,
        z: 0.12
    },

    d20: {
        x: -0.38,
        y: 0.62,
        z: 0.12
    }
};


/* =====================================================
   D6 NORMALS
===================================================== */

const d6FaceNormals = {

    1:
        new THREE.Vector3(
            0,
            0,
            1
        ),

    2:
        new THREE.Vector3(
            0,
            -1,
            0
        ),

    3:
        new THREE.Vector3(
            1,
            0,
            0
        ),

    4:
        new THREE.Vector3(
            -1,
            0,
            0
        ),

    5:
        new THREE.Vector3(
            0,
            1,
            0
        ),

    6:
        new THREE.Vector3(
            0,
            0,
            -1
        )
};


/* =====================================================
   D6 DOTS
===================================================== */

const pipPatterns = {

    1: [
        [0, 0]
    ],

    2: [
        [-0.34, 0.34],
        [0.34, -0.34]
    ],

    3: [
        [-0.34, 0.34],
        [0, 0],
        [0.34, -0.34]
    ],

    4: [
        [-0.34, 0.34],
        [0.34, 0.34],

        [-0.34, -0.34],
        [0.34, -0.34]
    ],

    5: [
        [-0.34, 0.34],
        [0.34, 0.34],

        [0, 0],

        [-0.34, -0.34],
        [0.34, -0.34]
    ],

    6: [
        [-0.34, 0.38],
        [-0.34, 0],
        [-0.34, -0.38],

        [0.34, 0.38],
        [0.34, 0],
        [0.34, -0.38]
    ]
};


/* =====================================================
   CREATE DOT
===================================================== */

function createPip() {

    const geometry =
        new THREE.SphereGeometry(
            0.105,
            24,
            16
        );


    const pip =
        new THREE.Mesh(
            geometry,
            dotMaterial
        );


    pip.scale.set(
        1,
        1,
        0.25
    );


    return pip;
}


/* =====================================================
   ADD D6 FACE
===================================================== */

function addPipFace(
    group,
    number,
    normal,
    up
) {

    const pattern =
        pipPatterns[number];


    const n =
        normal
            .clone()
            .normalize();


    const u =
        up
            .clone()
            .normalize();


    const right =
        new THREE.Vector3()
            .crossVectors(
                u,
                n
            )
            .normalize();


    const surface =
        0.885;


    pattern.forEach(
        ([x, y]) => {

            const pip =
                createPip();


            const position =
                n
                    .clone()
                    .multiplyScalar(
                        surface
                    );


            position.add(

                right
                    .clone()
                    .multiplyScalar(x)
            );


            position.add(

                u
                    .clone()
                    .multiplyScalar(y)
            );


            pip.position.copy(
                position
            );


            pip.quaternion.setFromUnitVectors(

                new THREE.Vector3(
                    0,
                    0,
                    1
                ),

                n
            );


            group.add(
                pip
            );
        }
    );
}


/* =====================================================
   ADD ALL D6 DOTS
===================================================== */

function addD6Pips(
    group
) {

    addPipFace(
        group,
        1,
        d6FaceNormals[1],
        new THREE.Vector3(0, 1, 0)
    );


    addPipFace(
        group,
        6,
        d6FaceNormals[6],
        new THREE.Vector3(0, 1, 0)
    );


    addPipFace(
        group,
        3,
        d6FaceNormals[3],
        new THREE.Vector3(0, 1, 0)
    );


    addPipFace(
        group,
        4,
        d6FaceNormals[4],
        new THREE.Vector3(0, 1, 0)
    );


    addPipFace(
        group,
        5,
        d6FaceNormals[5],
        new THREE.Vector3(0, 0, -1)
    );


    addPipFace(
        group,
        2,
        d6FaceNormals[2],
        new THREE.Vector3(0, 0, 1)
    );
}


/* =====================================================
   READ TRIANGLES
===================================================== */

function getTriangles(
    geometry
) {

    const position =
        geometry.attributes.position;


    const index =
        geometry.index;


    const triangles =
        [];


    function addTriangle(
        ia,
        ib,
        ic
    ) {

        const a =
            new THREE.Vector3()
                .fromBufferAttribute(
                    position,
                    ia
                );


        const b =
            new THREE.Vector3()
                .fromBufferAttribute(
                    position,
                    ib
                );


        const c =
            new THREE.Vector3()
                .fromBufferAttribute(
                    position,
                    ic
                );


        const center =
            new THREE.Vector3()
                .add(a)
                .add(b)
                .add(c)
                .divideScalar(3);


        const ab =
            new THREE.Vector3()
                .subVectors(
                    b,
                    a
                );


        const ac =
            new THREE.Vector3()
                .subVectors(
                    c,
                    a
                );


        const normal =
            new THREE.Vector3()
                .crossVectors(
                    ab,
                    ac
                )
                .normalize();


        if (
            normal.dot(center) < 0
        ) {

            normal.multiplyScalar(-1);
        }


        triangles.push({

            center:
                center,

            normal:
                normal
        });
    }


    if (index) {

        for (
            let i = 0;
            i < index.count;
            i += 3
        ) {

            addTriangle(

                index.getX(i),

                index.getX(i + 1),

                index.getX(i + 2)
            );
        }

    } else {

        for (
            let i = 0;
            i < position.count;
            i += 3
        ) {

            addTriangle(
                i,
                i + 1,
                i + 2
            );
        }
    }


    return triangles;
}


/* =====================================================
   FIND REAL FACES
===================================================== */

function getRealFaces(
    geometry
) {

    const triangles =
        getTriangles(
            geometry
        );


    const faces =
        [];


    triangles.forEach(
        triangle => {

            let matchingFace =
                null;


            for (
                const face of faces
            ) {

                const similarity =
                    face.normal.dot(
                        triangle.normal
                    );


                const planeA =
                    face.center.dot(
                        face.normal
                    );


                const planeB =
                    triangle.center.dot(
                        face.normal
                    );


                const difference =
                    Math.abs(
                        planeA -
                        planeB
                    );


                if (
                    similarity > 0.999 &&
                    difference < 0.025
                ) {

                    matchingFace =
                        face;

                    break;
                }
            }


            if (
                matchingFace
            ) {

                matchingFace.centers.push(
                    triangle.center.clone()
                );


                matchingFace.center.set(
                    0,
                    0,
                    0
                );


                matchingFace.centers.forEach(
                    point => {

                        matchingFace.center.add(
                            point
                        );
                    }
                );


                matchingFace.center.divideScalar(
                    matchingFace.centers.length
                );

            } else {

                faces.push({

                    normal:
                        triangle.normal.clone(),

                    center:
                        triangle.center.clone(),

                    centers: [
                        triangle.center.clone()
                    ]
                });
            }
        }
    );


    return faces;
}


/* =====================================================
   SORT FACES
===================================================== */

function sortFaces(
    faces
) {

    return faces.sort(
        (a, b) => {

            if (
                Math.abs(
                    a.center.y -
                    b.center.y
                ) > 0.001
            ) {

                return (
                    b.center.y -
                    a.center.y
                );
            }


            const angleA =
                Math.atan2(
                    a.center.z,
                    a.center.x
                );


            const angleB =
                Math.atan2(
                    b.center.z,
                    b.center.x
                );


            return (
                angleA -
                angleB
            );
        }
    );
}


/* =====================================================
   NUMBER TEXTURE
===================================================== */

function createNumberTexture(
    number
) {

    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        512;


    canvas.height =
        512;


    const context =
        canvas.getContext(
            "2d"
        );


    context.clearRect(
        0,
        0,
        512,
        512
    );


    context.fillStyle =
        "#2E4E7B";


    context.font =
        "bold 210px Arial";


    context.textAlign =
        "center";


    context.textBaseline =
        "middle";


    context.fillText(
        number.toString(),
        256,
        256
    );


    const texture =
        new THREE.CanvasTexture(
            canvas
        );


    texture.colorSpace =
        THREE.SRGBColorSpace;


    texture.needsUpdate =
        true;


    return texture;
}


/* =====================================================
   NUMBER ON FACE
===================================================== */

function createNumberLabel(
    number,
    face,
    type
) {

    const texture =
        createNumberTexture(
            number
        );


    const material =
        new THREE.MeshBasicMaterial({

            map:
                texture,

            transparent:
                true,

            side:
                THREE.DoubleSide,

            depthWrite:
                false
        });


    let size =
        0.46;


    let offset =
        0.025;


    if (type === "d4") {
    size = 1.50;
}

if (type === "d8") {
    size = 1.14;
}

if (type === "d10") {
    size = 1.14;
    offset = 0.045;
}

if (type === "d12") {
    size = 1.14;
}

if (type === "d20") {
    size = 1.14;
}


    const geometry =
        new THREE.PlaneGeometry(
            size,
            size
        );


    const label =
        new THREE.Mesh(
            geometry,
            material
        );


    /*
        Ставим число в центр
        настоящей грани.
    */

    label.position.copy(
        face.center
    );


    /*
        Чуть-чуть поднимаем
        над поверхностью.
    */

    label.position.add(

        face.normal
            .clone()
            .multiplyScalar(
                offset
            )
    );


    /*
        Разворачиваем плоскость
        точно по normal грани.
    */

    label.quaternion.setFromUnitVectors(

        new THREE.Vector3(
            0,
            0,
            1
        ),

        face.normal
            .clone()
            .normalize()
    );


    return label;
}


/* =====================================================
   CREATE DICE
===================================================== */

function createDice(
    type
) {

    if (
        diceGroup
    ) {

        scene.remove(
            diceGroup
        );
    }


    diceGroup =
        new THREE.Group();


    currentFaces =
        [];


    const dice =
        diceTypes[type];


    const geometry =
        dice.createGeometry();


    const mesh =
        new THREE.Mesh(
            geometry,
            diceMaterial
        );


    diceGroup.add(
        mesh
    );


    /* =================================================
       D6
    ================================================= */

    if (
        type === "d6"
    ) {

        addD6Pips(
            diceGroup
        );


        for (
            let number = 1;
            number <= 6;
            number++
        ) {

            currentFaces.push({

                number:
                    number,

                normal:
                    d6FaceNormals[
                        number
                    ].clone()
            });
        }

    }


    /* =================================================
       OTHER DICE
    ================================================= */

    else {

        let faces;


        /*
            D10 уже знает точные
            центры своих 10 граней.
        */

        if (
            type === "d10" &&
            geometry.userData.diceFaces
        ) {

            faces =
                geometry.userData
                    .diceFaces
                    .map(
                        face => ({

                            center:
                                face.center.clone(),

                            normal:
                                face.normal.clone()
                        })
                    );

        } else {

            /*
                D4 / D8 / D12 / D20
            */

            faces =
                getRealFaces(
                    geometry
                );


            faces =
                sortFaces(
                    faces
                );
        }


        faces =
            faces.slice(
                0,
                dice.sides
            );


        faces.forEach(
            (
                face,
                index
            ) => {

                const number =
                    index + 1;


                currentFaces.push({

                    number:
                        number,

                    normal:
                        face.normal.clone(),

                    center:
                        face.center.clone()
                });


                const label =
                    createNumberLabel(

                        number,

                        face,

                        type
                    );


                diceGroup.add(
                    label
                );
            }
        );
    }


    /* =================================================
       START ROTATION
    ================================================= */

    const rotation =
        startRotations[type];


    diceGroup.rotation.set(

        rotation.x,

        rotation.y,

        rotation.z
    );


    scene.add(
        diceGroup
    );
}


/* =====================================================
   FIND FACE BY NUMBER
===================================================== */

function getFaceByNumber(
    number
) {

    return currentFaces.find(
        face =>
            face.number === number
    );
}


/* =====================================================
   LANDING ROTATION
===================================================== */

function getLandingQuaternion(
    result
) {

    const face =
        getFaceByNumber(
            result
        );


    if (
        !face
    ) {

        return new THREE.Quaternion();
    }


    const faceNormal =
        face.normal
            .clone()
            .normalize();


    /*
        Направление от центра
        к камере.
    */

    const cameraDirection =
        camera.position
            .clone()
            .normalize();


    /*
        Поворачиваем нужную normal
        прямо к камере.
    */

    const quaternion =
        new THREE.Quaternion();


    quaternion.setFromUnitVectors(

        faceNormal,

        cameraDirection
    );


    return quaternion;
}


/* =====================================================
   CHANGE DICE
===================================================== */

diceSelector.addEventListener(
    "change",
    function () {

        if (
            rolling
        ) {

            return;
        }


        currentDiceType =
            diceSelector.value;


        createDice(
            currentDiceType
        );


        resultText.textContent =
            "-";
    }
);


/* =====================================================
   ROLL
===================================================== */

rollButton.addEventListener(
    "click",
    function () {

        if (
            rolling ||
            !diceGroup
        ) {

            return;
        }


        const dice =
            diceTypes[
                currentDiceType
            ];


        const result =
            Math.floor(
                Math.random()
                *
                dice.sides
            )
            +
            1;


        pendingResult =
            result;


        resultText.textContent =
            "?";


        startQuaternion.copy(
            diceGroup.quaternion
        );


        targetQuaternion =
            getLandingQuaternion(
                result
            );


        rollStartTime =
            performance.now();


        rolling =
            true;


        rollButton.disabled =
            true;


        diceSelector.disabled =
            true;
    }
);


/* =====================================================
   EASING
===================================================== */

function easeOutCubic(
    t
) {

    return (
        1 -
        Math.pow(
            1 - t,
            3
        )
    );
}


/* =====================================================
   ANIMATION
===================================================== */

function animate(
    time
) {

    requestAnimationFrame(
        animate
    );


    if (
        rolling &&
        diceGroup
    ) {

        let t =
            (
                time -
                rollStartTime
            )
            /
            rollDuration;


        t =
            THREE.MathUtils.clamp(
                t,
                0,
                1
            );


        const eased =
            easeOutCubic(
                t
            );


        /*
            Быстрое вращение
            в начале броска.
        */

        const spin =
            new THREE.Quaternion()
                .setFromEuler(

                    new THREE.Euler(

                        (1 - eased)
                        *
                        Math.PI
                        *
                        5,

                        (1 - eased)
                        *
                        Math.PI
                        *
                        7,

                        (1 - eased)
                        *
                        Math.PI
                        *
                        4
                    )
                );


        const temporary =
            startQuaternion
                .clone()
                .multiply(
                    spin
                );


        /*
            Чем ближе конец броска,
            тем сильнее кость
            стремится к нужной грани.
        */

        temporary.slerp(
            targetQuaternion,
            eased
        );


        diceGroup.quaternion.copy(
            temporary
        );


        /* =============================================
           FINISH
        ============================================= */

        if (
            t >= 1
        ) {

            /*
                Фиксируем ТОЧНО
                нужную грань.
            */

            diceGroup.quaternion.copy(
                targetQuaternion
            );


            rolling =
                false;


            resultText.textContent =
                pendingResult;


            pendingResult =
                null;


            rollButton.disabled =
                false;


            diceSelector.disabled =
                false;
        }
    }


    renderer.render(
        scene,
        camera
    );
}


/* =====================================================
   START
===================================================== */

createDice(
    currentDiceType
);


requestAnimationFrame(
    animate
);


/* =====================================================
   RESIZE
===================================================== */

window.addEventListener(
    "resize",
    function () {

        const width =
            container.clientWidth;


        const height =
            container.clientHeight;


        camera.aspect =
            width /
            height;


        camera.updateProjectionMatrix();


        renderer.setSize(
            width,
            height
        );
    }
);