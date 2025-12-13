module.exports = {
  content: ["./client/dist/**/*.html", "./client/dist/**/*.js", "./client/src/**/*.css", "./client/src/**/*.html", "./client/src/**/*.js"],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'bg-sunny',
    'bg-warm', 
    'bg-mild',
    'bg-cold',
    'bg-freezing'
  ]
}
