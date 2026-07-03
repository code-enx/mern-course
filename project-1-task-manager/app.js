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
		task: [],            //Array of task objects
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
const generateID = () => Date.now()

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
		return.newTask
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
