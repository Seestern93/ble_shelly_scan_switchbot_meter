/**
 * This script uses the BLE scan functionality in scripting
 * Will look for Switchbot Meter Plus devices fingerprints in BLE advertisements
 * Sends data via MQTT
 */

var switchbot_devices = {
    "11:22:33:44:55:66": "sbm01",
    "aa:bb:cc:dd:ee:ff": "sbm02",
}

var GLOBAL_DEBUG = false;

let SCAN_DURATION = 30 * 1000; // in ms
let SCAN_ACTIVE_TIME_INTERVAL = 24 * 60 * 60 * 1000; // in ms
let SCAN_PASSIVE_TIME_INTERVAL = 60 * 1000; // in ms

var switchbot_result_cache = {};

function hexEncode(aStr) {
    var hex, i;

    var result = "";
    for (i = 0; i < aStr.length; i++) {
        hex = aStr.charCodeAt(i).toString(16);
        result += (hex).slice(-4);
    }

    return result;
}

function decode_sbm(code, active) {
    byte7 = Number("0x" + code.substr(code.length - 2, 2));
    byte6 = Number("0x" + code.substr(code.length - 4, 2));
    byte5 = Number("0x" + code.substr(code.length - 6, 2));
    byte4 = Number("0x" + code.substr(code.length - 8, 2));

    hum = byte7;
    temp = (byte6 - 128) + ((byte5 & 0x0F) / 10);
    
    let json_msg = {
        "temp": temp,
        "humidity": hum
    };

    if (active) {
        // Add Battery info when active data is available
        battery1 = (byte5 & 0xF0) >> 4;
        battery2 = (byte4 & 0x07) << 4;
        battery = battery1 + battery2;
        json_msg["battery"] = battery;
        console.log("Humidity: " + hum + "%; Temperature: " + temp + "°C; battery: " + battery + "%;");
    }
    else {
        console.log("Humidity: " + hum + "%; Temperature: " + temp + "°C");
    }

    return json_msg
}

// Push BLE devices to MQTT
function pushToMQTT(message, addr) {
    if (!MQTT.isConnected()) return false; // Check the MQTT status
    var dev_name = addr;
    if (switchbot_devices[addr] != "unknown") {
        dev_name = switchbot_devices[addr]
    }

    if (GLOBAL_DEBUG){console.log("MQTT Sending: " + message);}
    MQTT.publish("switchbot/shelly/" + dev_name, message);

    return true
}

function send_to_cache(addr, active, data) {
    if (typeof switchbot_result_cache[addr] === 'undefined') {
        switchbot_result_cache[addr] = {
            "active": active,
            "count": 1,
            "data": data
        };
    }
    else {
        let count = switchbot_result_cache[addr].count + 1;
        switchbot_result_cache[addr].count = count;
        if (switchbot_result_cache[addr].active == false && active == true) {
            // overwrite passive data with active data
            switchbot_result_cache[addr] = {
                "active": active,
                "count": count,
                "data": data
            };
        }
    }
}

function scanCB(ev, res) {
    if (ev === BLE.Scanner.SCAN_RESULT) {
        if (res.addr in switchbot_devices) {
            let active = false;
            // Switchbot device found over MAC address
            if (typeof res.service_data !== 'undefined') {
                // Active Scan
                active = true;
                sbm_code = hexEncode(res.service_data["fd3d"]);
            }
            else {
                // Passive Scan
                sbm_code = hexEncode(res.manufacturer_data["0969"]);
            }
            dev_name = switchbot_devices[res.addr];
            rssi = res.rssi;
            console.log("Found Switchbot Device: " + dev_name + " (" + res.addr + ") with RSSI: " + rssi);
            json_msg = decode_sbm(sbm_code, active);

            json_msg["rssi"] = rssi;
            json_msg["addr"] = res.addr;
            json_msg["name"] = dev_name;
            send_to_cache(res.addr, active, json_msg);
        }
    } else if (ev === BLE.Scanner.SCAN_STOP) {
        // Scan job is done -> send cached results over MQTT
        for (aAddr in switchbot_result_cache) {
            pushToMQTT(JSON.stringify(switchbot_result_cache[aAddr]), aAddr);
        }
        // Clear cache after sending
        switchbot_result_cache = {};

    }

}

function scan_active() {
    print("Start Active Scan")
    if (BLE.Scanner.isRunning()) {
        console.log("Stop running scan");
        BLE.Scanner.Stop();
        Timer.set(500,
            false,
            scan_active
        )
    }
    else {
    BLE.Scanner.Start({ duration_ms: SCAN_DURATION, active: true }, scanCB);
    }
}

function scan_passive() {
    print("Start Passive Scan")
    if (!BLE.Scanner.isRunning()) {
        BLE.Scanner.Start({ duration_ms: SCAN_DURATION, active: false }, scanCB);
    }
    else{
        console.log("Scan already running - skip passive scan.");
    }
}
Timer.set(
    SCAN_ACTIVE_TIME_INTERVAL,
    true,
    scan_active
)
Timer.set(
    SCAN_PASSIVE_TIME_INTERVAL,
    true,
    scan_passive
)
scan_passive();
