const diceContainer = document.getElementById("diceContainer");
const diceSelector = document.getElementById("diceSelector");

const button = document.getElementById("rollButton");
const resultText = document.getElementById("result");


let currentDice = "d6";


function showDice() {

    const dice = diceTypes[currentDice];

    diceContainer.innerHTML = dice.html;

}


diceSelector.addEventListener("change", function() {

    currentDice = diceSelector.value;

    showDice();

    resultText.textContent = "-";

});


button.addEventListener("click", function() {

    const dice = diceTypes[currentDice];

    const result =
        Math.floor(Math.random() * dice.sides) + 1;

    resultText.textContent = result;

});


showDice();