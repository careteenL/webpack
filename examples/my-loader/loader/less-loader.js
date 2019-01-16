const less = require('less')

function loader (source) {
  let css
  less.render(source, (err, data) => {
    css = data.css
  })
  return css
}

module.exports = loader