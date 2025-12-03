document.addEventListener('DOMContentLoaded', function() {
    console.log('inputData.js is loaded!');

    const habitsForm = document.getElementById('habitsForm');
    const formResult = document.getElementById('formResponse');
    const rankedHabits = document.getElementById('rankedHabits');

    //Add Additional habit.
    document.getElementById("addHabit").addEventListener("click", function () {
        const input = document.getElementById("addtlHabit");
        const value = input.value;

        if (value === "") return; // Ignore empty input

        const NewHabit = document.createElement('li');
        NewHabit.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        NewHabit.style.width = "100%";
        NewHabit.innerHTML = `
            ${value} <span class="bi bi-arrows-move"></span>
        `;

        NewHabit.setAttribute('data-habit', value);

        document.getElementById("rankedHabits").appendChild(NewHabit);

    });
    // setup the drag and drop thing for ranking habits
    if (rankedHabits && window.Sortable) {
        const trash = document.getElementById('rmvHabit');
        
        trash.addEventListener('dragenter', () => trash.classList.add('drag-hover'));
        trash.addEventListener('dragleave', () => trash.classList.remove('drag-hover'));
        trash.addEventListener('drop', () => trash.classList.remove('drag-hover'));

        // maintain custom dragover animation
        trash.addEventListener('dragover', (e) => {
            e.preventDefault(); 
        });

        Sortable.create(rankedHabits, {
            animation: 150, 

            onEnd(evt) {
                const trashBounds = trash.getBoundingClientRect();
                const x = evt.originalEvent.clientX;
                const y = evt.originalEvent.clientY;

                //check if trashed item is in bounds
                if( x >= trashBounds.left && x <= trashBounds.right && y >= trashBounds.top && y <= trashBounds.bottom ) {
                    evt.item.remove();
                } 
            }

        });

        Sortable.create(document.getElementById('rmvHabit'), {
            group: {
                name: 'habits',
                pull: false,
                put: () => false
            },

            animation: 150, 
        });
    }

    // handle form when user clicks submit
    if (habitsForm) {
        habitsForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            event.stopPropagation();

            // check if form is filled out correctly
            if (!habitsForm.checkValidity()) {
                habitsForm.classList.add('was-validated');
                if (formResult) {
                    formResult.innerHTML = '<div class="alert alert-danger">Please fill all required fields correctly.</div>';
                }
                return;
            }

            // grab all the data from the form
            const formData = {
                user_name: document.getElementById('userName').value,
                sleep_hours: document.getElementById('sleepHours').value,
                credit_hours: document.getElementById('creditHours').value,
                study_hours: document.getElementById('studyHours').value,
                exercise_hours: document.getElementById('exerciseHours').value,
                screen_time: document.getElementById('screenTime').value,
                habit_ranking: []
            };

            // get the habits in the order they ranked them
            document.querySelectorAll('#rankedHabits li').forEach(li => {
                formData.habit_ranking.push(li.getAttribute('data-habit'));
                console.log(li.getAttribute('data-habit'));
            });

            // show loading while we wait
            if (formResult) {
                formResult.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
            }

            try {
                // first save everything to database
                const saveResponse = await fetch('/api/habits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!saveResponse.ok) {
                    throw new Error('Failed to save your data');
                }

                const saveData = await saveResponse.json();
                console.log('Data saved successfully:', saveData);

                // now get the AI tips
                if (formResult) {
                    formResult.innerHTML = `
                        <div class="alert alert-info">
                            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                            Getting personalized advice...
                        </div>
                    `;
                }

                const analyzeResponse = await fetch('/api/habits/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!analyzeResponse.ok) {
                    throw new Error('Failed to get personalized advice');
                }

                const analyzeData = await analyzeResponse.json();

                // hide the form and show the AI response
                habitsForm.style.display = 'none';

                if (formResult) {
                    formResult.innerHTML = `
                        <div class="card border-success">
                            <div class="card-header bg-success text-white">
                                <h4 class="mb-0">Your Personalized Habit Plan</h4>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-success mb-3">
                                    <strong>Success!</strong> Your habits have been saved.
                                </div>
                                <div class="advice-content" style="white-space: pre-wrap; line-height: 1.8;">
                                    ${analyzeData.tips}
                                </div>
                            </div>
                            <div class="card-footer">
                                <button class="btn btn-primary" onclick="location.href='viewGoals.html'">
                                    View Your Goals
                                </button>
                                <button class="btn btn-secondary ms-2" onclick="location.reload()">
                                    Submit Another Response
                                </button>
                            </div>
                        </div>
                    `;
                }

            } catch (err) {
                // something went wrong
                console.error('Error:', err);
                if (formResult) {
                    formResult.innerHTML = `
                        <div class="alert alert-danger">
                            <strong>Error:</strong> ${err.message}
                        </div>
                    `;
                }
            }
        });
    }
});