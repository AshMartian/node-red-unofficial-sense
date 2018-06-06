module.exports = function(RED) {
    var sense = require('unofficial-sense');

    function SenseConfig(config) {
        RED.nodes.createNode(this, config);
        let creds = {email: this.credentials.email, password: this.credentials.password};
        var globalContext = this.context().global;

        sense(creds, (data) => {
            console.log(data);
            globalContext.set('sense-realtime', data);
            this.realtime = data;
        }).then(senseObj => {
            this.senseObj = senseObj;
            senseObj.getDevices().then(devices => {
                globalContext.set('sense-devices', devices.data);
                this.senseDevices = devices.data;
            })
            
        })
    }
    function SenseUpdate(config) {
        RED.nodes.createNode(config);
        var node = this;
        var globalContext = this.context().global;
        this.senseConfig = RED.nodes.getNode(this.config);
        var startListening = () => {
            this.senseConfig.senseObj.events.on('data', (data) => {
                this.send({
                    payload: data
                })
            });
        }
        if(this.senseConfig && this.senseConfig.senseObj) {
            startListening();
        } else {
            setTimeout(startListening, 3000);
        }
    }

    function SenseDeviceOn(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var globalContext = this.context().global;
        this.senseConfig = RED.nodes.getNode(this.config);

        node.on('input', (msg) => {
            var devices = this.senseConfig.realtime.devices;
            var msg2 = Object.assign({}, msg);
            if(devices) {
                let foundDevice = devices.filter((device) => {
                    return device.name === msg.payload || device.id === msg.payload
                })
                if(foundDevice[0]) {
                    msg.payload = foundDevice[0]
                    msg2 = null;
                } else {
                    msg = null;
                    msg2 = {"status": "Device off"}
                }
            } else {
                msg2.payload = {"error": "no devices"}
                msg = null;
            }
            node.send([msg, msg2]);
        });
    }
    
    RED.nodes.registerType("sense-config", SenseConfig, {
        credentials: {
            email: {type:"text"},
            password: {type:"password"}
        }
    });
    RED.nodes.registerType("sense-update", SenseUpdate);
    RED.nodes.registerType("sense-device-on", SenseDeviceOn);
}