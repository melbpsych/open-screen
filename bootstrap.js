/** Only startup failures are handled here. Never discard an active sitting or
 * automatically reload after an error: answers live only in this tab.
 */
const entrypoints = { library: "./app.js", interview: "./interview.js", logic: "./logic.js" }
const name = document.documentElement.dataset.app
const entrypoint = Object.hasOwn(entrypoints, name) ? entrypoints[name] : null
const loading = entrypoint ? import(entrypoint) : Promise.reject(new Error("Unknown application"))

loading.catch(() => {
  const main = document.createElement("main")
  main.className = "wrap"
  main.id = "main"
  main.setAttribute("role", "alert")
  const title = document.createElement("h1")
  title.textContent = "Screening is unavailable"
  const message = document.createElement("p")
  message.textContent = "A configuration or loading error prevented startup. Ask the practice administrator to run the configuration checks before beginning an assessment."
  main.append(title, message)
  const settings = document.createElement("a")
  settings.href = "logic.html"
  settings.textContent = "Review practice settings"
  main.append(settings)
  document.querySelector("#app").replaceChildren(main)
  console.error("Open Screen startup failed. Run npm run check in the project folder.")
})
