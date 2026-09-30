const diceTypes = {

    d4: {
        name: "D4",
        sides: 4,

        createGeometry: function () {
            return new THREE.TetrahedronGeometry(1.35);
        }
    },


    d6: {
        name: "D6",
        sides: 6,

        createGeometry: function () {
            return new THREE.BoxGeometry(1.7, 1.7, 1.7);
        }
    },


    d8: {
        name: "D8",
        sides: 8,

        createGeometry: function () {
            return new THREE.OctahedronGeometry(1.35);
        }
    },


    d10: {
        name: "D10",
        sides: 10,

        createGeometry: function () {
            return createD10Geometry();
        }
    },


    d12: {
        name: "D12",
        sides: 12,

        createGeometry: function () {
            return new THREE.DodecahedronGeometry(1.25);
        }
    },


    d20: {
        name: "D20",
        sides: 20,

        createGeometry: function () {
            return new THREE.IcosahedronGeometry(1.35);
        }
    }

};



function createD10Geometry() {

    const vertices = [];

    const topY = 1.25;
    const middleY = 0;
    const bottomY = -1.25;

    const radius = 1;


    vertices.push(0, topY, 0);
    vertices.push(0, bottomY, 0);


    for (let i = 0; i < 10; i++) {

        const angle =
            (i / 10) * Math.PI * 2;

        const y =
            i % 2 === 0
                ? 0.32
                : -0.32;

        vertices.push(
            Math.cos(angle) * radius,
            y,
            Math.sin(angle) * radius
        );
    }


    const indices = [];


    for (let i = 0; i < 10; i++) {

        const current = i + 2;
        const next = ((i + 1) % 10) + 2;


        if (i % 2 === 0) {

            indices.push(
                0,
                current,
                next
            );

        } else {

            indices.push(
                1,
                next,
                current
            );
        }
    }


    for (let i = 0; i < 10; i++) {

        const current = i + 2;
        const next = ((i + 1) % 10) + 2;
        const nextNext = ((i + 2) % 10) + 2;

        if (i % 2 === 0) {

            indices.push(
                current,
                nextNext,
                next
            );
        }
    }


    const geometry =
        new THREE.BufferGeometry();


    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            vertices,
            3
        )
    );


    geometry.setIndex(indices);

    geometry.computeVertexNormals();

    return geometry;
}