let todos = [];
let currentPage = 1;
const tasksPerPage = 5;
let taskIndexToDelete;

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBHyIxiH1CP33K-LdUkYEv0SJ5D7jBD4NQ",
    authDomain: "todolist-1e85f.firebaseapp.com",
    projectId: "todolist-1e85f",
    storageBucket: "todolist-1e85f.appspot.com",
    messagingSenderId: "605339194794",
    appId: "1:605339194794:web:1caa085466f85b509c87d3",
    measurementId: "G-FF79ZN3325"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

function getISTDate() {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() * 60000; // Get UTC offset in milliseconds
    const istOffset = 5.5 * 3600000; // IST offset is UTC + 5:30
    return new Date(now.getTime() + utcOffset + istOffset);
}

// Function to load tasks from Firebase
async function loadTodos() {
    const snapshot = await firebase.database().ref('todos').once('value');
    todos = [];
    const istNow = getISTDate();
    const istToday = istNow.toISOString().split('T')[0]; // Get YYYY-MM-DD format

    snapshot.forEach(childSnapshot => {
        const todo = childSnapshot.val();
        todo.id = childSnapshot.key;
        const todoDate = new Date(todo.timestamp).toISOString().split('T')[0];
        if (todoDate === istToday || todo.completed) {
            // If the task's date matches today's date or if it's completed, add it to todos
            if (!todo.deleted) {
                todos.push(todo);
            }
        }
    });

    // Sort todos based on timestamp
    todos.sort((a, b) => a.timestamp - b.timestamp);

    renderTodos();
}



async function clearTodosAtMidnight() {
    const istNow = getISTDate();
    const millisecondsUntilMidnight = (24 - istNow.getHours()) * 3600000 +
        (60 - istNow.getMinutes()) * 60000 +
        (60 - istNow.getSeconds()) * 1000;

    setTimeout(async () => {
        await firebase.database().ref('todos').remove();
        await firebase.database().ref('completedTasks').remove();
        todos = [];
        renderTodos();
        clearTodosAtMidnight(); // Schedule next cleanup
    }, millisecondsUntilMidnight);
}

// Render todos
function renderTodos() {
    const todoList = document.getElementById('todo-list');
    const completedTasksContainer = document.getElementById('completed-tasks');
    todoList.innerHTML = ''; // Clear existing list
    completedTasksContainer.innerHTML = ''; // Clear existing completed tasks

    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const currentTodos = todos.slice(startIndex, endIndex);

    currentTodos.forEach((todo, index) => {
        // Skip rendering completed tasks
        if (!todo.completed) {
            const todoItem = document.createElement('div');
            todoItem.classList.add('task-item');
            todoItem.innerHTML = `
                <img src="${todo.logo}" alt="Task Logo" class="task-logo">
                <span class="bullet">&#8226;</span>
                <span>${todo.text}</span>
                <div class="draggable-container">
                    <div class="draggable" data-index="${startIndex + index}"></div>
                    <div class="progress-bar" style="width: ${todo.progress}%;"></div>
                    ${todo.completed && todo.progress === 100 ? '<img src="icons/check-mark.png" alt="Check Mark" class="check-mark">' : ''}
                </div>
                <button class="trash-button" onclick="openDeleteModal(${startIndex + index})">&#128465;</button>
            `;
            todoList.appendChild(todoItem);
            // Triggering the smooth effect
            setTimeout(() => {
                todoItem.classList.add('show');
            }, 100 * index);
        }
    });

    // Render completed tasks separately
    todos.forEach((todo, index) => {
        if (todo.completed) {
            const completedTaskItem = document.createElement('div');
            completedTaskItem.classList.add('completed-task');
            completedTaskItem.innerHTML = `
                <span>${todo.text}</span>
                <img src="icons/check-mark.png" alt="Check Mark" class="check-mark">
            `;
            completedTasksContainer.appendChild(completedTaskItem);
        }
    });

    // Attach event listeners to draggable elements
    const draggableElements = document.querySelectorAll('.draggable');
    draggableElements.forEach(draggable => {
        draggable.addEventListener('mousedown', startDragging);
    });

    updatePagination();
    updateTaskBoxVisibility();
}


function getTaskLogo(task) {
    const keywords = ["grocery", "groceries", "milk", "curd", "sugar", "eggs", "onion", "tomato", "carrot", "potato", "capsicum"]; // Keywords associated with groceries
    // Check if task contains any of the keywords
    for (const keyword of keywords) {
        if (task.includes(keyword)) {
            return taskLogos["groceries"]; // Return the grocery logo if found
        }
    }
    // Return the default logo if no match is found
    return taskLogos[task.toLowerCase()] || 'icons/icons8-task-24.png';
}

function updateTaskBoxVisibility() {
    const taskBox = document.getElementById('task-box');

    // Check if there are any todos present
    const areTodosPresent = todos.length > 0;

    // Check if all todos are completed or removed
    const allTodosCompletedOrRemoved = todos.length > 0 && todos.every(todo => todo.completed);

    // Determine visibility based on conditions
    if (!areTodosPresent || allTodosCompletedOrRemoved) {
        taskBox.classList.add('closed');
    } else {
        taskBox.classList.remove('closed');
    }
}

// List of valid words
const validWords = ['gym', 'work', 'study', 'milk', /* Add more valid words as needed */];

// Function to check if the text has proper meaning
function isTextMeaningful(text) {
    // Convert the text to lowercase for case-insensitive comparison
    const lowercaseText = text.toLowerCase();

    // Check if the lowercase text matches any valid word
    return validWords.includes(lowercaseText);
}

// Updated addTodo function with timestamp
async function addTodo() {
    const todoInput = document.getElementById('todo-input');
    const todoText = todoInput.value.trim();

    // Check if the todo text is meaningful
    if (await isTextMeaningful(todoText)) {
        const taskLogo = getTaskLogo(todoText.toLowerCase()); // Get the relevant logo for the task
        const progress = 0; // Initial progress
        const status = getStatus(progress); // Get initial status based on progress
        const timestamp = Date.now(); // Current timestamp
        const newTodo = { text: todoText, progress: progress, completed: false, logo: taskLogo, status: status, timestamp: timestamp };
        const newTodoRef = firebase.database().ref('todos').push();
        newTodoRef.set(newTodo, function (error) {
            if (error) {
                console.error("Error adding todo: ", error);
            } else {
                console.log("Todo added successfully!");
                newTodo.id = newTodoRef.key;
                todos.push(newTodo);
                todoInput.value = ''; // Clear input field
                renderTodos(); // Update the list
                const taskBox = document.getElementById('task-box');
                taskBox.classList.remove('closed'); // Open the task box
            }
        }); // Store the logo with the task
    } else {
        // Show error modal with appropriate message
        showErrorModal("Please enter a valid todo task.");
    }
}

function getStatus(progress) {
    if (progress >= 100) {
        return "COMPLETED";
    } else if (progress > 0) {
        return "IN_PROGRESS";
    } else {
        return "NOT_STARTED";
    }
}

let todoContainer = document.getElementById('todo-container');
let isTodoListMinimized = false;

function toggleTodoList() {
    if (isTodoListMinimized) {
        // Restore the todo list
        todoContainer.style.display = 'flex';
        isTodoListMinimized = false;
    } else {
        // Minimize the todo list
        todoContainer.style.display = 'none';
        isTodoListMinimized = true;
    }
}
window.onload = function () {
    loadTodos(); // Load tasks from Firebase
    const completedTasksContainerMain = document.getElementById('completed-tasks-container');
    completedTasksContainerMain.style.display = 'none'; // Hide the completed tasks container initially
    updateDateTime(); // Initial update of date and time
    clearTodosAtMidnight(); // Schedule the first cleanup
};

function completeTask(index) {
    // Get the completed task
    const completedTask = todos[index];
    // Mark the task as completed
    completedTask.completed = true;
    // Render the updated todos
    renderTodos();
    // Move the completed task to a tab called "Completed Tasks"
    addToCompletedTasks(completedTask.text);
}

function openApp(appName) {
    // Handle opening different applications
    // For example, you can open different modal dialogs or perform other actions based on the app name
    console.log('Opening ' + appName + '...');
}

function removeTask(index) {
    const todoToRemove = todos[index];
    if (!todoToRemove) return; // If todo doesn't exist, exit

    const taskTextToRemove = todoToRemove.text;

    // Remove the task from Firebase
    const todoRef = firebase.database().ref('todos');
    todoRef.orderByChild('text').equalTo(taskTextToRemove).once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            childSnapshot.ref.remove()
                .then(function () {
                    console.log("Todo removed successfully from database!");
                })
                .catch(function (error) {
                    console.error("Error removing todo from database: ", error);
                });
        });
    });

    // Remove the task from the UI
    todos.splice(index, 1);
    renderTodos(); // Update the list
    updateTaskBoxVisibility(); // Check if the task box should be hidden
}



function addToCompletedTasks(taskText) {
    // Get a reference to the 'completedTasks' node in your Firebase database
    const completedTasksRef = firebase.database().ref('completedTasks');

    // Create a new unique key for the completed task
    const newCompletedTaskRef = completedTasksRef.push();

    // Define the completed task object
    const completedTask = {
        text: taskText,
        timestamp: firebase.database.ServerValue.TIMESTAMP // Use Firebase server timestamp
    };

    // Save the completed task to the database
    newCompletedTaskRef.set(completedTask)
        .then(() => {
            console.log("Completed task added to the database successfully!");
        })
        .catch(error => {
            console.error("Error adding completed task to the database: ", error);
        });

    // Display the Completed Tasks container
    const completedTasksContainerMain = document.getElementById('completed-tasks-container');
    completedTasksContainerMain.style.display = 'block';

    // Reset and hide the completed tasks container after 1 minute
    setTimeout(function () {
        completedTasksContainerMain.classList.add('fadeOut'); // Add fade-out animation
        setTimeout(function () {
            completedTasksContainerMain.style.display = 'none'; // Hide the container after animation
            completedTasksContainerMain.classList.remove('fadeOut'); // Remove animation class for future use
            // Reset the completed tasks content
            const completedTasksContent = document.getElementById('completed-tasks');
            completedTasksContent.innerHTML = '';
        }, 1000); // Wait for 1 second for the fade-out animation to complete
    }, 60000); // 1 minute timeout
}

document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);

function openDeleteModal(index) {
    taskIndexToDelete = index;
    const deleteModal = document.getElementById('myModal');
    deleteModal.style.display = 'block';
}

function closeDeleteModal() {
    const deleteModal = document.getElementById('myModal');
    deleteModal.style.display = 'none';
}

function confirmDelete() {
    removeTask(taskIndexToDelete);
    closeDeleteModal();
}

// Function to show modal with error message
function showErrorModal(message) {
    const errorModal = document.getElementById('errorModal');
    const modalMessage = errorModal.querySelector('#modalMessage');

    modalMessage.textContent = message;
    errorModal.style.display = 'block';

    // Close the modal when the OK button is clicked
    const closeModal = errorModal.querySelector('#closeModal');
    closeModal.onclick = function () {
        errorModal.style.display = 'none';
    };
}

const taskLogos = {
    "gym": "icons/dumbbell.png",
    "work": "icons/man-working-on-a-laptop-from-side-view.png",
    "study": "icons/graduation-hat.png",
    "food": "icons/restaurant.png",
    "groceries": "icons/diet.png",
    // Add more tasks and their logos as needed
};

function removeTask(index) {
    todos.splice(index, 1);
    renderTodos(); // Update the list
    updateTaskBoxVisibility(); // Check if the task box should be hidden
}

function startDragging(event) {
    event.preventDefault();
    const dragItem = event.target.closest('.draggable-container');
    if (dragItem) {
        const draggable = dragItem.querySelector('.draggable');
        const progressBar = dragItem.querySelector('.progress-bar');
        const index = parseInt(draggable.getAttribute('data-index'));
        const initialX = event.clientX;
        const initialLeft = draggable.offsetLeft;
        const containerWidth = dragItem.offsetWidth;

        // Smooth transition for progress bar
        progressBar.style.transition = 'width 0.5s, font-size 0.5s';

        let progressTimeout = null;

        // Add event listeners to the document for mousemove and mouseup
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDragging);

        function drag(event) {
            if (!event.buttons) {
                // If no mouse buttons are pressed, stop dragging
                stopDragging();
                return;
            }
            clearTimeout(progressTimeout); // Clear previous timeout
            progressTimeout = setTimeout(() => {
                let offsetX = event.clientX - initialX;
                let newLeft = initialLeft + offsetX;
                const draggableWidth = draggable.offsetWidth;
                if (newLeft < 0) {
                    newLeft = 0;
                } else if (newLeft > containerWidth - draggableWidth) {
                    newLeft = containerWidth - draggableWidth;
                }

                let progress = (newLeft / (containerWidth - draggableWidth)) * 100;

                // Ensure progress is within bounds
                progress = Math.min(100, Math.max(0, progress));

                // Update the progress percentage text
                progressBar.textContent = Math.round(progress) + "%";

                draggable.style.transform = `translateX(${newLeft}px)`; // Use CSS transform for smoother dragging
                progressBar.style.width = progress + '%';
            }, 0);
        }

        function stopDragging() {
            document.removeEventListener('mousemove', drag); // Remove the mousemove event listener
            document.removeEventListener('mouseup', stopDragging); // Remove the mouseup event listener

            const todo = todos[index]; // Get the todo item
            if (!todo) return; // If todo doesn't exist, exit

            const todoName = todo.text; // Get the name of the todo item
            const progress = parseFloat(progressBar.style.width) || 0; // Get the current progress from the progress bar width

            // Update status of the task in the database where text matches the task name
            const todoRef = firebase.database().ref('todos');
            todoRef.orderByChild('text').equalTo(todoName).once('value', function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    const todoId = childSnapshot.key;

                    // Update the status based on progress
                    let newStatus = "NOT_STARTED";
                    if (progress >= 100) {
                        newStatus = "COMPLETED";
                    } else if (progress > 0) {
                        newStatus = "IN_PROGRESS";
                    }

                    // Update status in the database
                    firebase.database().ref('todos/' + todoId).update({
                        progress: progress,
                        status: newStatus
                    }).then(function () {
                        console.log("Todo status updated successfully!");
                    }).catch(function (error) {
                        console.error("Error updating todo status: ", error);
                    });
                });
            });

            // Update the todo object
            todo.progress = progress;
            todo.status = getStatus(progress); // Update status based on progress

            if (progress >= 100 && !todo.completed) {
                todo.completed = true;
                completeTask(index);
            } else if (progress < 100 && todo.completed) {
                todo.completed = false;
            }
        }
    }
}

// Debounce function
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function updatePagination() {
    const totalPages = Math.ceil(todos.length / tasksPerPage);
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // Clear existing pagination

    for (let i = 1; i <= totalPages; i++) {
        const pageLink = document.createElement('a');
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.classList.add('page-link');
        if (i === currentPage) {
            pageLink.classList.add('active');
        }
        pageLink.addEventListener('click', () => {
            currentPage = i;
            renderTodos();
        });
        paginationContainer.appendChild(pageLink);
    }
}

function updateDateTime() {
    const currentDate = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = currentDate.toLocaleDateString('en-US', options);
    document.getElementById('current-date').textContent = formattedDate;

}


document.getElementById('confirmDelete').addEventListener('click', function () {
    // Close the delete modal
    closeDeleteModal();

    // Remove the todo item from the 'todos' array
    todos.splice(taskIndexToDelete, 1);

    // Re-render the UI to reflect the changes
    renderTodos();
});
document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);

// Update date and time every second
setInterval(updateDateTime, 1000);

// Initial update
updateDateTime();
renderTodos();