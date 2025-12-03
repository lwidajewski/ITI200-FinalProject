function createGoals(goalText, goalID) {
    if (!goalText) return "";

    const html = `
        <div data-id="${goalID}">
            <input type="checkbox" class="strikethrough">
            <label class="cb-label">${goalText}</label>
        </div>
    `;

    return html;
};

async function deleteGoals(containerID) {
    const containerLocation = document.getElementById(containerID); // this is the specific div element we are in

    // find every checkbox that is checked in that specific container (div)
    const checkedGoals = containerLocation.querySelectorAll(".strikethrough:checked");

    // for every checkbox (cb) delete in the backend and then remove on frontend
    for (let cb of checkedGoals){
        const goalDiv = cb.parentElement;
        const goalID = goalDiv.dataset.id; // this from the createGoals() where we created the div with an id
        const url = `api/viewGoals/delete/${goalID}`;

        await fetch(url, {
            method: 'DELETE'
        });

        goalDiv.remove(); // remove from frontend after deleting from database
    };
};

async function getData() {

    const url = "/api/viewGoals";

    const request = await fetch(url);

    const response = await request.json();

    //console.log(response);

    // clear all lists
    document.getElementById("list-dailyGoals").innerHTML = "";
    document.getElementById("list-shortTermGoals").innerHTML = "";
    document.getElementById("list-longTermGoals").innerHTML = "";

    // add in goals
    response.forEach(goal => {
        if (goal.dailygoal){
            document.getElementById("list-dailyGoals").innerHTML += createGoals(goal.dailygoal, goal.id);
        };
        if (goal.shortgoal){
            document.getElementById("list-shortTermGoals").innerHTML += createGoals(goal.shortgoal, goal.id);
        };
        if (goal.longgoal){
            document.getElementById("list-longTermGoals").innerHTML += createGoals(goal.longgoal, goal.id);
        };
    });
};

async function saveData(inputID, goalType) {
    
    const input = document.getElementById(inputID);
    const goalValue = input.value.trim();

    if (!goalValue) return; // there is nothing there in any of the goals

    // setup for sending data to backend
    const product = {
        dailyGoals: goalType === 'daily' ? goalValue : null,
        shortTermGoals: goalType === 'short' ? goalValue : null,
        longTermGoals: goalType === 'long' ? goalValue : null
    };
    
    // send data to backend
    await fetch('api/viewGoals/save', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(product)
    });

    // clear form for further input
    input.value = "";

    // refresh lists
    await getData();
}

getData(); // display goals from database

// check for adding a goal and save it to database
document.getElementById("form-dailyGoals").addEventListener("submit", event => {
    event.preventDefault();
    saveData("dailyTextInput", "daily");
});
document.getElementById("form-shortGoals").addEventListener("submit", event => {
    event.preventDefault();
    saveData("shortTextInput", "short");
});
document.getElementById("form-longGoals").addEventListener("submit", event => {
    event.preventDefault();
    saveData("longTextInput", "long");
});

// check for clear button click -- delete specific goals
document.getElementById("clearDailyBtn").addEventListener("click", () => {
    deleteGoals("list-dailyGoals");
});
document.getElementById("clearShortBtn").addEventListener("click", () => {
    deleteGoals("list-shortTermGoals");
});
document.getElementById("clearLongBtn").addEventListener("click", () => {
    deleteGoals("list-longTermGoals");
});
