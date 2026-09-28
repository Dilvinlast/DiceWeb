const diceTypes = {

    d6: {
        name: "D6",
        sides: 6,

        html: `
            <div class="dice" id="dice">

                <div class="face face-1">
                    <span class="dot p5"></span>
                </div>

                <div class="face face-2">
                    <span class="dot p1"></span>
                    <span class="dot p9"></span>
                </div>

                <div class="face face-3">
                    <span class="dot p1"></span>
                    <span class="dot p5"></span>
                    <span class="dot p9"></span>
                </div>

                <div class="face face-4">
                    <span class="dot p1"></span>
                    <span class="dot p3"></span>
                    <span class="dot p7"></span>
                    <span class="dot p9"></span>
                </div>

                <div class="face face-5">
                    <span class="dot p1"></span>
                    <span class="dot p3"></span>
                    <span class="dot p5"></span>
                    <span class="dot p7"></span>
                    <span class="dot p9"></span>
                </div>

                <div class="face face-6">
                    <span class="dot p1"></span>
                    <span class="dot p3"></span>
                    <span class="dot p4"></span>
                    <span class="dot p6"></span>
                    <span class="dot p7"></span>
                    <span class="dot p9"></span>
                </div>

            </div>
        `
    },


    d4: {
        name: "D4",
        sides: 4,
        html: `
            <div class="dice-placeholder">
                D4
            </div>
        `
    },


    d8: {
        name: "D8",
        sides: 8,
        html: `
            <div class="dice-placeholder">
                D8
            </div>
        `
    },


    d10: {
        name: "D10",
        sides: 10,
        html: `
            <div class="dice-placeholder">
                D10
            </div>
        `
    },


    d12: {
        name: "D12",
        sides: 12,
        html: `
            <div class="dice-placeholder">
                D12
            </div>
        `
    },


    d20: {
        name: "D20",
        sides: 20,
        html: `
            <div class="dice-placeholder">
                D20
            </div>
        `
    }

};