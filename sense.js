module.exports = function(RED) {
    var sense = require('unofficial-sense');
    var EventEmmitter = require('events')

    function SenseConfig(config) {
        RED.nodes.createNode(this, config);
        let creds = {email: this.credentials.email, password: this.credentials.password};
        var globalContext = this.context().global;
        this.events = new EventEmmitter();

        sense(creds, (data) => {
            globalContext.set('sense-realtime', data);
            this.realtime = data;
            if(data.type == "Authenticated") {
                console.log(data)
            }
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
        RED.nodes.createNode(this, config);
        
        var globalContext = this.context().global;
        this.senseConfig = RED.nodes.getNode(config.sense);

        var node = this;

        var startListening = () => {
            node.log(node.senseConfig.senseObj)
            if(node.senseConfig.senseObj.events) {
                node.senseConfig.senseObj.events.on('data', (data) => {
                    node.send({
                        payload: data
                    })
                });
            } else {
                node.senseConfig.events.on('connected', function(){
                    startListening();
                }) 
            }
        }
        
        if(node.senseConfig) {
            if(node.senseConfig.senseObj) {
                startListening();
            } else {
                node.senseConfig.events.on('connected', function(){
                    startListening();
                }) 
            }
        } else {
            console.log("Could not get config");
            //setTimeout(startListening, 10000);
        }
    }

    function SenseDeviceOn(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var globalContext = this.context().global;
        this.senseConfig = RED.nodes.getNode(config.sense);

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