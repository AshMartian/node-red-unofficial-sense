module.exports = function(RED) {
    var sense = require('unofficial-sense');
    var EventEmmitter = require('events')

    function SenseConfig(config) {
        RED.nodes.createNode(this, config);
        let creds = {email: this.credentials.email, password: this.credentials.password};
        var globalContext = this.context().global;
        this.events = new EventEmmitter();

        sense(creds, (data) => {
            globalContext.set('sense-realtime', data.data);
            this.realtime = data.data;
        }).then(senseObj => {
            this.senseObj = senseObj;
            this.events.emit('connected');
            /*
            senseObj.getDevices().then(devices => {
                globalContext.set('sense-devices', devices.data);
                this.senseDevices = devices.data;
            })*/
            
        })
    }
    function SenseUpdate(config) {
        RED.nodes.createNode(config);
        var node = this;
        var globalContext = this.context().global;
        this.senseConfig = RED.nodes.getNode(this.config);
        var startListening = () => {
            console.log(this.senseConfig.senseObj)
            this.senseConfig.senseObj.events.on('data', (data) => {
                this.send({
                    payload: data.data
                })
            });
        }
        if(this.senseConfig) {
            this.senseConfig.events.on('connected', function(){
                startListening();
            })
        } else {
            setTimeout(startListening, 10000);
        }
    }

    function SenseDeviceOn(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var globalContext = this.context().global;
        this.senseConfig = RED.nodes.getNode(this.config);

        node.on('input', (msg) => {
            if(this.senseConfig) {
                var devices = this.senseConfig.realtime.devices;
                console.log("Got devices", devices);
                var msg2 = Object.assign({}, msg);
                if(Array.isArray(devices)) {
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
            }
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