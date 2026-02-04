// Redirect /static/sw.js to /sw.js
export default defineEventHandler(async (event) => {
  await sendRedirect(event, '/sw.js', 301)
})