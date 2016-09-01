Homer is an experimental home control system build on Raspberry Pi IOT device.

At phase1 Homeer provides minimal functionality ie. just one temperature sensor which is implemented by 
DS18b20 digital temperature sensor. The idea of phase1 is to get familiar with Rasbperry Pi as an IOT device and
build up demo full stack control system which can be enhanced later by adding more sensors and releted logics.

Temperature sensor DS18b20 is integrated to Raspberry Pi GIO PIN 14 ( add picture here).  More DS18b20s with their
individual IDs can easily be connected to the same Raspberry GIO PIN.  

HomeControl's IOT device is running on Raspbian OS basing on Debian Linux.
IOT device pushes it's sensor data via REST API to server's database. Web browsers are using Socket IO interface 
to get the online data from IOT device and the history data from server's database. Server is implemented 
on node.js and on Mongo database, and it's hosted on Amazon AWS.





