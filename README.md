# node-red-contrib-unofficial-sense

 This Node-Red module connects to the Sense API used by mobile app and website to retrive data and expose 6 nodes to be used in your node-red flows.

If you are looking for a Node module to interface with sense, take a look at the [unofficial-sense](https://github.com/blandman/unofficial-sense) module.

---

## Installation

`npm install node-red-contrib-unofficial-sense`

**WARNING:** This module requires es6 syntax and requires nodeJS 7+. If using the node-red docker image, `nodered/node-red-docker:v8` works fantastically. If you install this module on an older node version, it will crash.

## Disclaimer

This module was developed without the consent of the Sense company, and makes use of an undocumented and unsupported API. Use at your own risk, and be aware that Sense may change the API at any time and break this repository perminantly.

## Usage

There are 6 nodes included in this module. 

- Sense Update
- Sense Now
- Sense Device Trigger
- Sense Device On
- Sense Monitor
- Sense Devices 

Every node needs to have a Sense config assigned. This hidden node stores user credentials securely and can be re-used for any number of Sense nodes. Only 1 API connection (websocket) will be maintained per Sense config.

### **Sense Update Node**

The Sense update node will be triggered whenever there is new data from the Sense API. Sense uses Websockets, so this data can be real time. This is usually 4-5 times per second. An optional Interval property is available to set a minimum time in milliseconds between updates. (5000 = 5 seconds)

![Sense Update Config](https://github.com/blandman/node-red-unofficial-sense/blob/master/screenshots/sense-config2.png?raw=true)

![Example of Sense update](https://github.com/blandman/node-red-unofficial-sense/blob/master/screenshots/sense-high-usage.png?raw=true)

(Example of sense high energy usage triggering Google Home Notifier)

#### Payload Output

```
"payload": {
    "hz": 60.003795623779,
    "c": 122,
    "channels": [
        5870.3833007812,
        5293.4794921875
    ],
    "devices": [
        {
            "c": 61,
            "w": 5584.701171875,
            "name": "Dryer",
            "icon": "washer",
            "id": "11654c89",
            "tags": {
            ...
            }
        },
        {
            "c": 47,
            "w": 4340.5068359375,
            "name": "Other",
            "icon": "home",
            "id": "unknown",
            "tags": {
            ...
            }
        },
        {
            "c": 7,
            "w": 726,
            "name": "Always On",
            "icon": "alwayson",
            "id": "always_on",
            "tags": {
            ...
            }
        }
    ],
    "w": 11163.86328125,
    "_stats": {
        "mrcv": 1528234116.29,
        "brcv": 1528234116.1969,
        "msnd": 1528234116.29
    },
    "epoch": 1528234102,
    "deltas": [ ],
    "voltage": [
        121.58633422852,
        122.09526824951
    ],
    "frame": 18657330
}
```

### **Sense Now Node**

Payload returned is the same data as the Sense Update Node, but relies on an input to be triggered. Input is ignored.

![](https://github.com/blandman/node-red-unofficial-sense/blob/master/screenshots/sense-now.png?raw=true)

### **Sense Device Trigger**

The Sense Device Trigger node will be ran when the selected device turns on or off. Two outputs available, top (on) and bottom (off). 

Node Properties include a dropdown containing all descovered devices

![](https://github.com/blandman/node-red-unofficial-sense/blob/master/screenshots/sense-config4.png?raw=true)


#### Example Flows
![](https://github.com/blandman/node-red-unofficial-sense/blob/master/screenshots/sense-washer-dryer.png?raw=true)

Here The washer and dryer triggers are send to a format node that takes the device.name and alerts the house with Google Home Notifier.
![](https://github.com/blandman/node-red-unofficial-sense/blob/master/screenshots/sense-washer-param.png?raw=true)


#### Payload Output On

```
"payload" : {
    "c": 61,
    "w": 5584.701171875,
    "name": "Dryer",
    "icon": "washer",
    "id": "11654c89"
    "tags": {...}
}
```

#### Payload Output Off

```
"payload": {
    "status": "Device off"
}
```

### **Sense Device On**

This node returns the same payload output as the device trigger, but accepts an input to toggle the check, or to dynamically pass a device name or id. `msg.payload` or `msg.device` can be used to set the device to check. Or this node can also make use of the device


![](https://github.com/blandman/node-red-unofficial-sense/blob/master/screenshots/sense-bottle.png?raw=true)
Here the baby bottle warmer triggers a delay with a repeating timer. If the warmer is on for longer than 2 minutes, Google Home Notifier with alert us every minute that the bottle warmer was left on.

![](https://github.com/blandman/node-red-unofficial-sense/blob/master/screenshots/sense-config-3.png?raw=true)

### **Sense Monitor**

This node returns the status of the physical Energy Monitor, including devices being learned. Input is ignored, used as a trigger. 

#### Payload Output

```
"payload": {
  "signals": {
    "progress": 100,
    "status": "OK"
  },
  "device_detection": {
    "in_progress": [
      {
        "icon": "cup",
        "name": "Possible Coffee Maker",
        "progress": 16
      },
      {
        "icon": "dishes",
        "name": "Possible Dishwasher",
        "progress": 5
      },
      {
        "icon": "stove",
        "name": "Possible Oven",
        "progress": 10
      } ...
    ],
    "found": [
      {
        "icon": "stove",
        "name": "Oven",
        "progress": 48
      },
      {
        "icon": "dishes",
        "name": "Washer",
        "progress": 50
      },
      {
        "icon": "home",
        "name": "Motor",
        "progress": 96
      } ...
    ],
    "num_detected": 18
  },
  "monitor_info": {
    "serial": "XXXXXXXXXX",
    "ndt_enabled": true,
    "online": true,
    "version": "1.11.1870-2d186a5-master",
    "ssid": "For the Horde",
    "signal": "-44 dBm",
    "mac": "xx:xx:xx:xx:xx:xx"
  }
}
```

### **Sense Devices**

This node returns an array of all devices known by your sense. Input is ignored, used as a trigger.

#### Payload Output

```

"payload": [
    {
      "id": "xxxxxxx",
      "name": "Microwave",
      "icon": "microwave",
      "tags": {...}
    },
    {
      "id": "xxxxxxx",
      "name": "Stove 2",
      "icon": "stove",
      "tags": {...}
    },
    {
      "id": "xxxxxxxx",
      "name": "Washer",
      "icon": "dishes",
      "tags": {...}
    } ...
]
```

## Disclaimer

This module was developed without the consent of the Sense company, and makes use of an undocumented and unsupported API. Use at your own risk, and be aware that Sense may change the API at any time and break this repository perminantly.

## Tips for node-red creators

If you're here wondering how to change the color of label text (Inside the html js for node regisration)

```
label: function() {
    $("#" + this.id.replace('.', '\\.') + " > text").css("fill", "white");
    return "node label";
}
```

