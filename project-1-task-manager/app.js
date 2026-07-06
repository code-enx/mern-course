/* =============================================================
   TASK MANAGER - app.js

   Architecture:
   1. STATE			- the single source of truth for all data
   2. UTILITIES     - small helper functions
   3. TASK LOGIC    - pure functions that work with task data
   4. STORAGE       - reading and writing to localStorage
   5. RENDER        - updating the DOM (Lesson 5)
   6. EVENTS        - wiring up user interactions (Lesson 5)
   ============================================================= */

/* =============================================================
   SECTION 1: STATE

   "State" means the current data your application holds.
   We keep ALL state in one place - one object called `state`.

   Why one object?
   If state is scattered across many variables, it becomes
   impossible to track what changed and when. One object
   means one place to look.
   ============================================================= */

const state = {
		tasks: [],            //Array of task objects
		currentFilter: "all" // Which filter is active: "all" | "active" | "completed"
}

/*
  const state = { ... }

  We use const because we will never reassign state to a
  different object. But we WILL modify its properties
  (state.tasks, state.currentFilter) - that is allowed with const.

  state.tasks starts as an empty array [].
  Tasks will be added here as the user creates them.

  state.currentFilter starts as "all" because the "ALL"
  filter button is active by default.
*/


/* =============================================================
   SECTION 2: UTILITIES

   Small, reusable helper functions that don't belong to
   any specific feature. They just do one simple thing.
   ============================================================= */


/**
 * Generates a unique ID for a new task.
 * Uses the current timestamp (milliseconds since 1970) as the ID.
 * Since no two tasks can be created at the exact same millisecond,
 * this guarantees uniqueness for a single-user app.
 *
 * @returns {number} A unique timestamp-based ID
 */
const generateId = () => Date.now()

/*
  () => Date.now()

  Arrow function with no parameters () and a single expression
  body (Date.now()) - so no curly braces needed and the value is returned implicitly.

  Date.now() returns the number of milliseconds since
  January 1, 1970 (called "Unix timestamp").
  Example: 1705312200000

  Every time you call generateId(), you get the current
  timestamp -always different, always unique.
*/

/**
 * Returns the current date and time as an ISO string.
 * Example: "2025-01-15T10:30:00.000Z"
 *
 * @returns {string} ISO format date string
 */
const getCurrentTimestamp = () => new Date().toISOString()

/*
  new Date() creates a Date object representing right now.
  .toISOString() converts it to a standardized string format.

  The "Z" at the end means UTC (Coordinated Universal Time).
  this is the correct way to store timestamps - always in UTC,
  convert to local time only when displaying to the user.
*/


/**
 * Validates task input text.
 * Returns an error message string if invalid, null if valid.
 *
 * @param {string} text -The task text to validate
 * @returns {string|null} Error message or null
 */
const validateTaskInput = (text) => {
		// trim() removes whitespace from both ends
		// " " (only space) becomes "" (empty string) after trim
		const trimmedText = text.trim()

		if (!trimmedText) {
				return "Please enter a task. The field cannot be empty."
		}

		if (trimmedText.length < 2) {
				return "Task must be at least 2 characters long."
		}

		if (trimmedText.length > 200) {
				return `Task is too long. Maximum 200 characters (you typed ${trimmedText.length}).`
		}

		// No errors found - return null to signal "valid"
		return null
}

/*
  This function demonstrates the "guard clause" pattern.
  Each check returns early with an error message if it fails.
  If ALL checks pass, we reach the final return null.

  Why return null for "valid" instead of true?
  Because the caller wants to know the ERROR MESSAGE, not just
  whether it's valid. Returning null means "no error".
  Returning a string means "here is the error".

  We will use it like this:

  const error = validateTaskInput(inputValue)
  if (error) {
		showError(error)  --  error is a non-empty string, truthy
		return
  }
  // If we get here, error is null (falsy), input is valid
  addTask(inputValue)
*/

/* =============================================================
   SECTION 3: TASK LOGIC

   There are "pure functions" - functions that:
   1. Take input
   2. Return output
   3. Do NOT modify anything outside themselves
   4. Do NOT touch the DOM
   5. Given the same input, ALWAYS produce the same output

   Pure functions are easy to understand, easy to test,
   and impossible to have hidden side effects.
   ============================================================= */

/**
 * Creates a new task object from the given text.
 * Does NOT add it t state - just creates and returns it.
 *
 * @param {string} text - The task description
 * @returns {Object} A new task object
 */
const createTask = (text) => {
		return {
				id: generateId(),
				text: text.trim(),
				isCompleted: false,
				createdAt: getCurrentTimestamp()
		}
}

/*
  createTask("Buy groceries") returns:
  {
  id: 1705312200000,
  text: "But groceries",
  isCompleted: false,
  createdAt: "2025-01015T10:30:00.000Z"
  }

  We call text.trim() here as well, so even if the caller
  forgot to trim, the stored task has no leading/trailing spaces.

  This function is pure:
  - It does not modify state
  - It does not touch the DOM
  - It only creates and returns a new object

  Adding to state is done in a separate function (addTaskToState)
  so each function has exactly ONE responsibility.
*/

/**
 * Adds a task to the state.
 * Returns the update tasks array.
 *
 * @param {string} text - The task text
 * @returns {Object} The newly created task
 */
const addTaskToState = (text) => {
		const newTask = createTask(text)
		state.tasks.push(newTask)
		return newTask
}

/*
  state.tasks.push(newTask) adds newTask to the end of
  the tasks array. push() modifies the array in place and 
  returns the new length of the array (which we ignore here).

  We return newTask so the caller can use it if needed
  (for example, to immediately render just that new task).
*/

/**
 * Removes a task from state by its ID.
 * Returns the removed task (or undefined if not found).
 *
 * @param {number} taskID - The ID of the task to remove
 * @returns {Object|undefined} The removed task
 */
const removeTaskFromState = (taskId) => {
		//Find the index of the task with this ID
		const taskIndex = state.tasks.findIndex(task => task.id === taskId)

		// If task not found, findIndex return -1
		if (taskIndex === -1) {
				console.warn(`Task with id ${taskId} not found`)
				return undefined
		}

		// splice(startIndex, deleteCount) removes items from an array
		// It returns an array of removed items
		// We removed 1 item, so we destructure [0] to get the item itself
		const [removedTask] = state.tasks.splice(taskIndex, 1)
		return removedTask
}

/*
  findIndex() searches the array and returns the INDEX
  (position number) of the first element where the callback
  returns true. If nothing matches, it returns -1.

  task => task.id ===taskId
  This arrow function checks: "does this task's id equal taskId?"
  findIndex runs this for each task until one returns true.
  
  splice(startIndex, deleteCount):
  - startIndex: where to start removing
  - deleteCount: how many items to remove
  - Returns: array of removed items

  const [removedTask] = state.tasks.splice(taskIndex, 1)
  This is array destructuring. splice returns an array like
  [theRemovedTask]. We destructure it to get just theRemovedTask.

  Equivalent to:
  const removedArray = state.tasks.splice(taskIndex, 1)
  const removedTask = removedArray[0]
*/

/**
 * Toggles the completion status of a task.
 * If it was complete, it becomes incomplete. And vice versa.
 *
 * @param {number} taskId - The ID of the task to toggle
 * @return {Object|undefined} The updated task
 */
const toggleTaskComplete = (taskId) => {
		const task = state.tasks.find(task => task.id === taskId)

		if (!task) {
				console.warn(`Task with id ${taskId} not found`)
				return undefined
		}

		task.isCompleted = !task.isCompleted
		return task
}

/*
  find() is like findIndex() but returns the ELEMENT itself
  (not the index). Returns undefined if nothing matches.

  task,isCompleted =!task.isCompleted

  The ! operator flips a boolean:
  !false = true
  !true  = false

  So if the task was false (incomplete), it becomes true.
  If it was true (completed), it becomes false.

  We are directly modifying the task object inside state.tasks.
  This works because task is a reference to the object in the
  array, not a copy. We will discuss references vs copies
  in detail in Lesson 4.
*/

/**
 * Updates the text of an existing task.
 *
 * @param {number} taskId - The ID of the task to update
 * @param {string} newText - The new task text
 * @return {Object|undefined} The updated task
 */
const updateTaskText = (taskId, newText) => {
		const error = validateTaskInput(newTask)
		if (error) return undefined

		const task = state.tasks.find(task => task.id === taskId)
		if (!task) return undefined

		task.text = newText.trim()
		return task
}

/**
 * Returns tasks filtered by the current state.currentFilter.
 * Does NOT modify state - only reads and returns a subset.
 * 
 * @return {Array} Filtered array of tasks
 */
const getFilteredTasks = () => {
		const { tasks, currentFilter } = state

		/*
		  Object destructuring:
		  const { tasks, currentFilter } = state

		  is the same as:
		  const tasks = state.tasks
		  const currentFilter = state.currentFilter

		  Destructuring extracts properties from an object into
		  individual variables. Much more concise and readable.
		*/

		if (currentFilter === "all") {
				return tasks
		}

		if (currentFilter === "active") {
				return tasks.filter(task => !task.isCompleted)
		}

		if (currentFilter === "completed") {
				return tasks.filter(task => task.isCompleted)
		}

		// Should never reach here, but return all tasks as fallback
		return tasks
}

/*
  filter() creates a NEW array containing only the element
  where the callback returns true.

  tasks.filter(task => !task.isCompleted)
  Returns only tasks where isCompleted is false (active tasks)

  tasks.filter(task => task.isCompleted)
  Returns only tasks where isCompleted is true (completed tasks)

  filter() does not modify the original array. It creates
  and returns a new array. state.tasks is unchanged.
*/

/**
 * Removes all completed tasks from state.
 * Returns the number of tasks removed.
 *
 * @returns {number} Count of removed tasks
 */
const clearCompletedTasks = () => {
		const completedCount = state.tasks.filter(
				task => task.isCompleted
		).length

		state.tasks = state.tasks.filter(task => !task.isCompleted)

		return completedCount
}

/*
  state.tasks = state.tasks.filter(task => !task.isCompleted)

  This replaces state.tasks with a new array containing
  only the INCOMPLETE tasks. Completed tasks are gone.

  We ARE reassigning state.tasks here (state.tasks = ...)
  This is allowed because state is declared with const
  but state.tasks is just a PROPERTY of state - we are not
  reassigning state itself.
*/

/**
 * Sets the active filter.
 * 
 * @param {string} filter - "all" | "active" | "completed"
 */
const setFilter = (filter) => {
		const validFilters = ["all", "active", "completed"]

		if (!validFilters.includes(filter)) {
				console.error(`Invalid filter: "${filter}". Must be one of: ${validFilters.join(", ")}`)
				return
		}

		state.currentFilter = filter
}

/*
  validFilter.includes(filter) checks if filter is one of
  the three valid values. Returns true or false.

  If someone calls setFilter("invalid"), we log an error
  and return early without changing state.

  validFilter.join(", ") converts the array to a string:
  ["all", "active", "completed"] -> "all, active, completed"
  Used in the error message.
*/

/* =============================================================
   SECTION 4: STATISTICS

   Functions that compute summary data from state.
   Pure functions - they read state but do not modify it.
   ============================================================= */

/**
 * Returns statistics about the current tasks.
 *
 * @returns {Object} Stats object with counts
 */
const getStats = () => {
		const total = state.tasks.length
		const completed = state.tasks.filter(task => task.isCompleted).length
		const active = total - completed

		return { total, active, completed }
}

/*
  state.tasks.length gives the total number of tasks.

  .filter(task => task.isCompleted).length
  First filters to completed tasks, then counts them with .length.

  active = total - completed
  We calculate active from the other two instead of filtering
  again - more efficient.

  return { total, active, completed }
  Object shorthand - same as:
  return { total: total, active: active, completed: completed }
*/

/* =============================================================
   SECTION 5: STORAGE

   Functions that save and load data from localStorage.
   localStorage persists data between page refreshes.
   ============================================================= */

const STORAGE_KEY = "taskmanager_tasks"

/*
  We define the storage key as a constant at the top.
  If we need to change the key name later, we change it
  in one place. This is better than having the string
  "taskmanager_tasks" scattered across multiple functions.
*/

/**
 * Saves the current tasks to localStorage.
 */
const saveToStorage = () => {
		try {
				const tasksJSON = JSON.stringify(state.tasks)
				localStorage.setItem(STORAGE_KEY, tasksJSON)
		} catch (error) {
				console.error("Failed to save tasks to localStorage:", error)
		}
}

/*
  localStorage can only store STRINGS. Our tasks are objects.

  JSON.stringify() converts JavaScript objects/arrays to
  a JSON string:
  [{ id: 1, text: "Buy groceries" }]
  becomes:
  '[{"id": 1,"text":"Buy groceries"}]'

  localStorage.setItem(key,value) stores the string.

  We wrap in try/catch because localStorage can fail:
  - User has disabled storage in browser settings
  - Storage quote is exceeded
  - Private browsing mode restrictions

  A try/catch prevents the error from crashing the app.
  Instead we log it and continue. This is called
  "graceful degradation" - the app still works, just
  without persistence.
*/

/**
 * Loads tasks from localStorage into state.
 * Called once when the app starts.
 */
const loadFromStorage = () => {
		try {
				const tasksJSON = localStorage.getItem(STORAGE_KEY)

				// If nothing stored yet, getItem returns null
				if (!tasksJSON) {
						return
				}

				const savedTasks = JSON.parse(tasksJSON)

				// Verify we got an array before using it
				if (Array.isArray(savedTasks)) {
						state.tasks = savedTasks
				}	
		} catch (error) {
				console.error("Failed to load tasks form localStorage:", error)
				// State stays as empty array - app starts fresh
		}
}

/*
  localStorage.getItem(key) returns:
  - The stored string if the key exists
  - null if the key does not exist

  if (!tasksJSON) returns early if null or empty string.

  JSON.parse() is the reverse of JSON.stringify():
  '[{"id":1,"text":"Buy groceries"}]'
  becomes:
  [{ id: 1, text: "Buy groceries" }]

  Array.isArray(savedTasks) verifies the parsed data is
  an array. If someone manually edited localStorage and
  stored invalid data, this protects us from crashing.

  This function is called once at app startup to restore
  the previous session's tasks.
*/

/* =============================================================
   CONSOLE TESTING - temporary, will be removed in lesson 5

   Test the logic functions right now in the console.
   ============================================================= */

console.log("=== Task Manager Logic Tests ===")

// Test createTask
const testTask = createTask("Buy groceries")
console.log("Created task:", testTask)

// Test addTaskToState
addTaskToState("But groceries")
addTaskToState("Call dentist")
addTaskToState("Write code")
console.log("State after adding 3 tasks:", state.tasks)

// Test getStats
console.log("Stats:", getStats())

// Test toggleTaskComplete
const firstTaskId = state.tasks[0].id
toggleTaskComplete(firstTaskId)
console.log("After toggling first task:", state.tasks[0].isCompleted)

// Test getFilteredTasks
setFilter("active")
console.log("Active tasks:", getFilteredTasks())

setFilter("completed")
console.log("Completed tasks:", getFilteredTasks())

setFilter("all")
console.log("All tasks:", getFilteredTasks())

// Test validateTaskInput
console.log("Validate tests:")
console.log(validateTaskInput(""))
console.log(validateTaskInput("a"))
console.log(validateTaskInput("Buy milk"))
console.log(validateTaskInput("x".repeat(201)))

// Test clearCompletedTasks
const cleared = clearCompletedTasks()
console.log(`Cleared ${cleared} completed tasks`)
console.log("Remaining tasks:", state.tasks)
