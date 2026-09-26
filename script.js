const button = document.getElementById("rollButton");
const resultText = document.getElementById("result");

button.addEventListener("click", function() {

    const result = Math.floor(Math.random() * 6) + 1;

    resultText.textContent = result;

});