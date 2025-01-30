# Functionality
The script is using bluetooth low energy (BLE) to listen for Switchbotmeter devices and their broadcast messages. Over a whitelist of MAC addresses, only devices you like to read are checked.
The data is parsed and finally broadcasted over WiFi with MQTT so that other devices can use the information (or your home automation system can import and show you the values).

# Prerequisites
The script needs following hardware (other variants may work too):
*Prices are for EU*
* SwitchbotMeter Plus (https://eu.switch-bot.com/products/switchbot-meter-plus)
	* 22€ on Switchbot website
	* 14€ on Amazon (offer) https://amzn.eu/d/hzSsyH1
* Shelly Gen2 / Gen3 device (use whatever you already have)
	* 17€ on Amazon (1PM Mini Gen3 https://amzn.eu/d/hzSsyH1)

I have tested it on following shelly devices:
* Shelly RGBW PM (Plus device)
* Shelly Plus 1 (Plus device)

# How to install on Shelly Gen2 or higher
1. You need to activate Bluetooth on your shelly device
2. Disable "Bluetooth Gateway", otherwise active scan will not work
   ![grafik](https://github.com/user-attachments/assets/48c67ee6-a343-45a2-8dea-5cd7a48438db)

4. Make sure, that no other script is running which uses BLE Scanner, otherwise scripts will interfere each other (if you have multiple Shelly devices, you can split the load over them)
5. Create new script and copy the code to the script
6. Enter the MAC addresses from the Switchbotmeter devices to the script, and start the script
7. Make sure, that "Run on startup" is marked for the script, so that after startup it still works
8. Check on console, if the devices are found and useful values are printed

# Open Points
* Verify that script is bug-free
	* Unusual temperatures like negative °C temperatures
* Cleanup code and enhance in-code docu
* Support other Switchbot devices like SBM Pro or Outdoor or Switchbot Hub
* Check that code works

# Remark
If you find any bugs, please raise an issue. Since I am very busy, it may take some time to answer.
If you have improvements, you can create a pull-request and I will takeover useful code enhancements :)
Apart from that, I cannot give any guarantee that the script works or work in the future (since maybe some firmware changes and BLE broadcast payload is being changed by Switchbot or something similar).
