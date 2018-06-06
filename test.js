var helper = require("node-red-node-test-helper");
var redSense = require('./sense')

var flow = [{ id: "n1", type: "senes-config", name: "Sense Config" }];
helper.load(redSense, flow, function () {
    var n1 = helper.getNode("n1");
    console.log(n1)
});