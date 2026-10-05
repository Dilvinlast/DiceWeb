const diceTypes = {

    d4: {
        name: "D4",
        sides: 4,

        createGeometry() {
            return new THREE.TetrahedronGeometry(1.25, 0);
        }
    },

    d6: {
        name: "D6",
        sides: 6,

        createGeometry() {
            return new THREE.BoxGeometry(1.75, 1.75, 1.75);
        }
    },

    d8: {
        name: "D8",
        sides: 8,

        createGeometry() {
            return new THREE.OctahedronGeometry(1.25, 0);
        }
    },

    d10: {
        name: "D10",
        sides: 10,

        createGeometry() {
            return createD10Geometry();
        }
    },

    d12: {
        name: "D12",
        sides: 12,

        createGeometry() {
            return new THREE.DodecahedronGeometry(1.2, 0);
        }
    },

    d20: {
        name: "D20",
        sides: 20,

        createGeometry() {
            return new THREE.IcosahedronGeometry(1.25, 0);
        }
    }
};


/* =====================================================
   D10
   PENTAGONAL TRAPEZOHEDRON
===================================================== */

function createD10Geometry() {

    /*
        D10 состоит из:

        1 верхней вершины
        5 верхних вершин пояса
        5 нижних вершин пояса
        1 нижней вершины

        Всего: 12 вершин

        Каждая игровая сторона —
        настоящий плоский четырёхугольник.
    */


    const vertices = [];

    const indices = [];

    const diceFaces = [];


    /* =================================================
       РАЗМЕРЫ
    ================================================= */

    const radius = 1.0;

    const ringHeight = 0.38;

    const poleHeight = 1.30;


    /* =================================================
       ВЕРХНИЙ ПОЛЮС
       index = 0
    ================================================= */

    vertices.push(
        0,
        poleHeight,
        0
    );


    const TOP = 0;


    /* =================================================
       ВЕРХНЕЕ КОЛЬЦО
       indices 1 - 5
    ================================================= */

    for (let i = 0; i < 5; i++) {

        const angle =
            i * Math.PI * 2 / 5;


        vertices.push(

            Math.cos(angle) * radius,

            ringHeight,

            Math.sin(angle) * radius
        );
    }


    /* =================================================
       НИЖНЕЕ КОЛЬЦО
       indices 6 - 10

       Поворачиваем его на 36 градусов.
    ================================================= */

    for (let i = 0; i < 5; i++) {

        const angle =
            i * Math.PI * 2 / 5
            +
            Math.PI / 5;


        vertices.push(

            Math.cos(angle) * radius,

            -ringHeight,

            Math.sin(angle) * radius
        );
    }


    /* =================================================
       НИЖНИЙ ПОЛЮС
       index = 11
    ================================================= */

    vertices.push(
        0,
        -poleHeight,
        0
    );


    const BOTTOM = 11;


    /* =================================================
       ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    ================================================= */

    function upper(i) {

        const n =
            ((i % 5) + 5) % 5;

        return 1 + n;
    }


    function lower(i) {

        const n =
            ((i % 5) + 5) % 5;

        return 6 + n;
    }


    function getVertex(index) {

        return new THREE.Vector3(

            vertices[index * 3],

            vertices[index * 3 + 1],

            vertices[index * 3 + 2]
        );
    }


    /* =================================================
       ДОБАВЛЕНИЕ ОДНОЙ ИГРОВОЙ ГРАНИ
    ================================================= */

    function addFace(
        a,
        b,
        c,
        d
    ) {

        const va =
            getVertex(a);

        const vb =
            getVertex(b);

        const vc =
            getVertex(c);

        const vd =
            getVertex(d);


        /*
            Центр четырёхугольной грани
        */

        const center =
            new THREE.Vector3()
                .add(va)
                .add(vb)
                .add(vc)
                .add(vd)
                .multiplyScalar(0.25);


        /*
            Normal.
        */

        const normal =
            new THREE.Vector3()
                .subVectors(vb, va)
                .cross(
                    new THREE.Vector3()
                        .subVectors(vc, va)
                )
                .normalize();


        /*
            Normal должна смотреть наружу.
        */

        if (
            normal.dot(center) < 0
        ) {

            normal.multiplyScalar(-1);
        }


        /*
            Проверяем направление треугольников.

            Каждая четырёхугольная сторона
            рендерится двумя треугольниками.
        */

        const testNormal =
            new THREE.Vector3()
                .subVectors(vb, va)
                .cross(
                    new THREE.Vector3()
                        .subVectors(vc, va)
                );


        if (
            testNormal.dot(center) > 0
        ) {

            indices.push(
                a,
                b,
                c,

                a,
                c,
                d
            );

        } else {

            indices.push(
                a,
                c,
                b,

                a,
                d,
                c
            );
        }


        /*
            Эти данные использует script.js
            для номера и броска.
        */

        diceFaces.push({

            center:
                center,

            normal:
                normal
        });
    }


    /* =================================================
       ВЕРХНИЕ 5 ГРАНЕЙ

       TOP
          /\
         /  \
        U----U
         \  /
          L
    ================================================= */

    for (let i = 0; i < 5; i++) {

        addFace(

            TOP,

            upper(i),

            lower(i),

            upper(i + 1)
        );
    }


    /* =================================================
       НИЖНИЕ 5 ГРАНЕЙ

          U
         / \
        L---L
         \ /
        BOTTOM
    ================================================= */

    for (let i = 0; i < 5; i++) {

        addFace(

            BOTTOM,

            lower(i),

            upper(i + 1),

            lower(i + 1)
        );
    }


    /* =================================================
       BUFFER GEOMETRY
    ================================================= */

    const geometry =
        new THREE.BufferGeometry();


    geometry.setAttribute(

        "position",

        new THREE.Float32BufferAttribute(
            vertices,
            3
        )
    );


    geometry.setIndex(
        indices
    );


    /*
        Flat normals нужны, чтобы каждая
        сторона выглядела как отдельная
        плоская грань.
    */

    geometry.computeVertexNormals();


    /*
        Сохраняем 10 игровых граней.

        Твой script.js уже умеет
        использовать geometry.userData.diceFaces.
    */

    geometry.userData.diceFaces =
        diceFaces;


    return geometry;
}