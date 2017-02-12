 #!/bin/bash
export NODE_PATH=$NODE_PATH:.

if [ -z $1 ];
	then mocha --recursive --bail tests;
else
	mocha --recursive --bail $1;
fi;
