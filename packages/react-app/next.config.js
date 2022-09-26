const withTM = require("next-transpile-modules")(["eth-hooks", "@svgr/webpack"]) // pass the modules you would like to see transpiled

module.exports = withTM();

