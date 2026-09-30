const container = document.getElementById("diceContainer");
const diceSelector = document.getElementById("diceSelector");
const rollButton = document.getElementById("rollButton");
const resultText = document.getElementById("result");


/* ========================================
   SCENE
======================================== */

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    40,
    container.clientWidth / container.clientHeight,
    0.1,
    100
);

camera.position.set(0, 0, 6);


/* ========================================
   RENDERER
======================================== */

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    container.clientWidth,
    container.clientHeight
);

renderer.setClearColor(0x000000, 0);

container.appendChild(renderer.domElement);


/* ========================================
   LIGHTS
======================================== */

const ambientLight = new THREE.AmbientLight(
    0xffffff,
    1.5
);

scene.add(ambientLight);


const mainLight = new THREE.DirectionalLight(
    0xffffff,
    2.5
);

mainLight.position.set(4, 6, 5);

scene.add(mainLight);


const sideLight = new THREE.DirectionalLight(
    0x9CCAEE,
    0.7
);

sideLight.position.set(-4, 2, 3);

scene.add(sideLight);


/* ========================================
   MATERIAL
======================================== */

const diceMaterial = new THREE.MeshStandardMaterial({
    color: 0xF6F3EB,
    roughness: 0.7,
    metalness: 0,
    flatShading: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
});


/* ========================================
   VARIABLES
======================================== */

let currentDiceType = "d6";

let diceGroup = null;

let rolling = false;

let targetRotationX = 0;
let targetRotationY = 0;
let targetRotationZ = 0;


/* ========================================
   NUMBER TEXTURE
======================================== */

function createNumberTexture(number) {

    const canvas = document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.fillStyle = "#2E4E7B";

    ctx.font = "bold 220px Arial";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";


    ctx.fillText(
        number.toString(),
        256,
        275
    );


    const texture =
        new THREE.CanvasTexture(canvas);

    texture.needsUpdate = true;

    return texture;
}


/* ========================================
   GET TRIANGLES
======================================== */

function getTriangles(geometry) {

    const position =
        geometry.attributes.position;

    const index =
        geometry.index;

    const triangles = [];


    function addTriangle(a, b, c) {

        const A =
            new THREE.Vector3()
                .fromBufferAttribute(
                    position,
                    a
                );

        const B =
            new THREE.Vector3()
                .fromBufferAttribute(
                    position,
                    b
                );

        const C =
            new THREE.Vector3()
                .fromBufferAttribute(
                    position,
                    c
                );


        const center =
            new THREE.Vector3()
                .add(A)
                .add(B)
                .add(C)
                .divideScalar(3);


        const edge1 =
            new THREE.Vector3()
                .subVectors(B, A);

        const edge2 =
            new THREE.Vector3()
                .subVectors(C, A);


        const normal =
            new THREE.Vector3()
                .crossVectors(
                    edge1,
                    edge2
                )
                .normalize();


        /*
            Проверяем, смотрит ли
            нормаль наружу.
        */

        if (
            normal.dot(center) < 0
        ) {

            normal.multiplyScalar(-1);
        }


        triangles.push({
            center: center,
            normal: normal
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


/* ========================================
   GROUP TRIANGLES INTO REAL FACES
======================================== */

function getRealFaces(
    geometry,
    expectedFaces
) {

    const triangles =
        getTriangles(geometry);


    const groups = [];


    triangles.forEach(triangle => {

        let groupFound = null;


        for (
            const group of groups
        ) {

            const normalSimilarity =
                triangle.normal.dot(
                    group.normal
                );


            const planeDistance =
                Math.abs(
                    triangle.center.dot(
                        group.normal
                    )
                    -
                    group.center.dot(
                        group.normal
                    )
                );


            if (
                normalSimilarity > 0.995 &&
                planeDistance < 0.05
            ) {

                groupFound = group;

                break;
            }
        }


        if (groupFound) {

            groupFound.triangles.push(
                triangle
            );


            groupFound.center
                .set(0, 0, 0);


            groupFound.triangles
                .forEach(t => {

                    groupFound.center.add(
                        t.center
                    );
                });


            groupFound.center.divideScalar(
                groupFound.triangles.length
            );

        } else {

            groups.push({

                normal:
                    triangle.normal.clone(),

                center:
                    triangle.center.clone(),

                triangles: [
                    triangle
                ]
            });
        }
    });


    return groups.slice(
        0,
        expectedFaces
    );
}


/* ========================================
   CREATE NUMBER LABEL
======================================== */

function createNumberLabel(
    number,
    face,
    diceType
) {

    const texture =
        createNumberTexture(number);


    const material =
        new THREE.MeshBasicMaterial({

            map: texture,

            transparent: true,

            depthTest: true,

            depthWrite: false,

            side: THREE.DoubleSide
        });


    let size = 0.55;


    if (diceType === "d20") {
        size = 0.42;
    }


    if (diceType === "d12") {
        size = 0.48;
    }


    if (diceType === "d10") {
        size = 0.46;
    }


    if (diceType === "d8") {
        size = 0.50;
    }


    if (diceType === "d4") {
        size = 0.52;
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
        Центр грани.
    */

    label.position.copy(
        face.center
    );


    /*
        Немного поднимаем над
        поверхностью, чтобы избежать
        мерцания.
    */

    label.position.add(
        face.normal
            .clone()
            .multiplyScalar(0.025)
    );


    /*
        Поворачиваем плоскость
        параллельно поверхности.
    */

    const defaultNormal =
        new THREE.Vector3(
            0,
            0,
            1
        );


    label.quaternion.setFromUnitVectors(
        defaultNormal,
        face.normal
    );


    return label;
}


/* ========================================
   EDGES
======================================== */

function addEdges(
    geometry,
    group
) {

    const edgeGeometry =
        new THREE.EdgesGeometry(
            geometry,
            10
        );


    const edgeMaterial =
        new THREE.LineBasicMaterial({

            color:
                0x2E4E7B,

            transparent:
                true,

            opacity:
                0.35
        });


    const edges =
        new THREE.LineSegments(
            edgeGeometry,
            edgeMaterial
        );


    group.add(edges);
}


/* ========================================
   CREATE DICE
======================================== */

function createDice(type) {

    if (diceGroup !== null) {

        scene.remove(
            diceGroup
        );
    }


    const dice =
        diceTypes[type];


    diceGroup =
        new THREE.Group();


    const geometry =
        dice.createGeometry();


    const mesh =
        new THREE.Mesh(
            geometry,
            diceMaterial
        );


    diceGroup.add(mesh);


    addEdges(
        geometry,
        diceGroup
    );


    /*
        Находим настоящие грани.
    */

    const faces =
        getRealFaces(
            geometry,
            dice.sides
        );


    /*
        Добавляем номер
        на каждую грань.
    */

    faces.forEach(
        (face, index) => {

            const number =
                index + 1;


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


    /*
        Начальный красивый угол.
    */

    diceGroup.rotation.set(
        0.45,
        0.65,
        0.1
    );


    scene.add(
        diceGroup
    );
}


/* ========================================
   CHANGE DICE
======================================== */

diceSelector.addEventListener(
    "change",
    function () {

        currentDiceType =
            diceSelector.value;


        createDice(
            currentDiceType
        );


        resultText.textContent =
            "-";
    }
);


/* ========================================
   ROLL
======================================== */

rollButton.addEventListener(
    "click",
    function () {

        if (
            rolling ||
            diceGroup === null
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
                * dice.sides
            ) + 1;


        resultText.textContent =
            result;


        targetRotationX =
            diceGroup.rotation.x
            +
            Math.PI
            *
            (
                4 +
                Math.random() * 4
            );


        targetRotationY =
            diceGroup.rotation.y
            +
            Math.PI
            *
            (
                4 +
                Math.random() * 4
            );


        targetRotationZ =
            diceGroup.rotation.z
            +
            Math.PI
            *
            (
                2 +
                Math.random() * 3
            );


        rolling = true;
    }
);


/* ========================================
   ANIMATION
======================================== */

function animate() {

    requestAnimationFrame(
        animate
    );


    if (
        rolling &&
        diceGroup
    ) {

        diceGroup.rotation.x +=
            (
                targetRotationX
                -
                diceGroup.rotation.x
            )
            * 0.08;


        diceGroup.rotation.y +=
            (
                targetRotationY
                -
                diceGroup.rotation.y
            )
            * 0.08;


        diceGroup.rotation.z +=
            (
                targetRotationZ
                -
                diceGroup.rotation.z
            )
            * 0.08;


        const dx =
            Math.abs(
                targetRotationX
                -
                diceGroup.rotation.x
            );


        const dy =
            Math.abs(
                targetRotationY
                -
                diceGroup.rotation.y
            );


        const dz =
            Math.abs(
                targetRotationZ
                -
                diceGroup.rotation.z
            );


        if (
            dx < 0.01 &&
            dy < 0.01 &&
            dz < 0.01
        ) {

            diceGroup.rotation.set(
                targetRotationX,
                targetRotationY,
                targetRotationZ
            );


            rolling = false;
        }
    }


    renderer.render(
        scene,
        camera
    );
}


/* ========================================
   START
======================================== */

createDice(
    currentDiceType
);

animate();




window.addEventListener(
    "resize",
    function () {

        const width =
            container.clientWidth;

        const height =
            container.clientHeight;


        camera.aspect =
            width / height;


        camera.updateProjectionMatrix();


        renderer.setSize(
            width,
            height
        );
    }
);