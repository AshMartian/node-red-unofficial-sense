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
            this.realtime = data.data;
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
        this.lastCheck = (new Date()).getTime()
        this.interval = config.interval;

        var node = this;

        var startListening = () => {
            if(node.senseConfig.senseObj.events) {
                node.senseConfig.senseObj.events.on('data', (data) => {
                    if(!data || !data.payload) return
                    if((new Date()).getTime() > this.lastCheck + parseInt(this.interval)) {
                        this.lastCheck = (new Date()).getTime()
                        node.send({
                            payload: data.payload
                        })
                    }
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

    function SenseDeviceTrigger(config) {
        RED.nodes.createNode(this, config);
        
        var globalContext = this.context().global;
        this.senseConfig = RED.nodes.getNode(config.sense);
        this.deviceOn = null;
        this.watchingDevice = config.device;

        var node = this;

        var startListening = () => {
            if(node.senseConfig.senseObj.events) {
                node.senseConfig.senseObj.events.on('data', (data) => {
                    if(!data || !data.payload || !data.payload.devices) return
                    let foundDevice = data.payload.devices.filter((device) => {
                        return device.name === this.watchingDevice || device.id === parseInt(this.watchingDevice)
                    })

                    if(this.deviceOn !== (foundDevice.length == 1)) {
                        this.deviceOn = foundDevice.length == 1;
                        if(this.deviceOn) {
                            node.send([{
                                payload: foundDevice[0]
                            }, null])
                        } else {
                            node.send(null, {payload: {"status": "Device off"}});
                        }
                    } else {
                        node.send(null, {payload: {"status": "Could not find devices"}})
                    }
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

    function SenseNow(config) {
        RED.nodes.createNode(this, config);
        
        var globalContext = this.context().global;
        this.senseConfig = RED.nodes.getNode(config.sense);

        var node = this;

        node.on('input', (msg) => {
            if(this.senseConfig && this.senseConfig.realtime) {
                msg.payload = this.senseConfig.realtime.payload ? this.senseConfig.realtime.payload : msg.payload;
                node.send(msg)
            }
        })
    }

    function SenseMonitor(config) {
        RED.nodes.createNode(this, config);
        
        var globalContext = this.context().global;
        this.senseConfig = RED.nodes.getNode(config.sense);

        var node = this;

        var getMonitorInfo = async (msg) => {
            let monitorData = await node.senseConfig.senseObj.getMonitorInfo();
            msg.payload = monitorData;
            node.send(msg);
        }

        node.on('input', (msg) => {
            if(this.senseConfig && this.senseConfig.senseObj) {
                getMonitorInfo(msg);
            } else {
                node.senseConfig.events.on('connected', function(){
                    getMonitorInfo(msg);
                });
            }
        })
    }

    function SenseDevices(config) {
        RED.nodes.createNode(this, config);
        
        var globalContext = this.context().global;
        this.senseConfig = RED.nodes.getNode(config.sense);

        var node = this;

        var getDevices = async (msg) => {
            let deviceData = await node.senseConfig.senseObj.getDevices();
            msg.payload = deviceData;
            node.send(msg);
        }

        node.on('input', (msg) => {
            if(this.senseConfig && this.senseConfig.senseObj) {
                getDevices(msg);
            } else {
                node.senseConfig.events.on('connected', function(){
                    getDevices(msg);
                });
            }
        })
    }

    function SenseDeviceOn(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var globalContext = this.context().global;
        this.senseConfig = RED.nodes.getNode(config.sense);
        this.watchingDevice = config.device;

        node.on('input', (msg) => {
            if(this.senseConfig && this.senseConfig.realtime && this.senseConfig.realtime.payload && this.senseConfig.realtime.payload.devices) {
                var devices = this.senseConfig.realtime.payload.devices;
                var msg2 = Object.assign({}, msg);
                if(Array.isArray(devices)) {
                    let foundDevice = devices.filter((device) => {
                        return device.name === msg.device || device.id === parseInt(msg.device) || device.name === msg.payload || device.id === parseInt(msg.payload) || device.name === this.watchingDevice || device.id === this.watchingDevice
                    })
                    if(foundDevice[0]) {
                        msg.payload = foundDevice[0]
                        msg2 = null;
                    } else {
                        msg = null;
                        msg2.payload = {"status": "Device off"}
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
    RED.nodes.registerType("sense-now", SenseNow);
    RED.nodes.registerType("sense-devices", SenseDevices);
    RED.nodes.registerType("sense-monitor", SenseMonitor);
    RED.nodes.registerType("sense-trigger", SenseDeviceTrigger);
    RED.nodes.registerType("sense-device-on", SenseDeviceOn);
}