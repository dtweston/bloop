#!/usr/bin/env node

/**
* This is Bloop, a CLI tool for helping Mac / OSX developers work with Intel Edison more easily.
* Support for Linux and Windows pending on my future enthusiasm (and yours) to keep working on this.
*/

/**
* Define version, help info here
*/
var program = require('commander'),
	edisonCLI = require('./bloop-cli.js');

/**
* Define version, help info here
*/
program
    .version('0.0.8')
    .usage('[options] <keywords>');

/**
* Connect command, fast way to get a terminal using Edison.
*/ 
program
  .command('c')
  .option("-f, --force", "Automatically cleans any screen session that may exist.")
  .description('Instantly initiate a terminal session with a connected Edison over Micro-USB.')
  .action(function(options){
  		if(options.force){
  			edisonCLI.cleanScreens(function handleClean(err, result){
			  if ( err ) {
			      console.log(err);
			  } else {
			      console.log('Cleaned screens!');
			      edisonCLI.connect(function handleConnect(err, result){
				  if ( err ) {
					console.log("Something went wrong. If you got a PTY error, try running \'bloop c -f.\'\nMake sure BOTH Micro-USB are connected to your computer from Edison.");
				    console.log(err);
				  } else {
				  	// Success.
				  }
				});
			  }
			});
  		} else {
			//Initiate a connection to an attached Edison.
			edisonCLI.connect(function handleConnect(err, result){
			  if ( err ) {
				console.log("Something went wrong. If you got a PTY error, try running \'bloop c -f.\'\nMake sure BOTH Micro-USB are connected to your computer from Edison.");
			    console.log(err);
			  } else {
			  	// Success.
			  }
			});
  		}
	});

/**
* Sniff simply lists any Intel Edison connected to your computer and outputs a connection
* string you can use to access it.
*
* Example output: screen /dev/cu.usbserial-XXXX 115200 -L
*/ 
program
	.command('sniff')
	.option("-c, --copy", "Copy the input to your clipboard automatically.")
	.description('Sniffs out active Edisons connected to your computer via Micro-USB and generates a connection command (but doesn\'t execute it).')
	.action(function(options){
		edisonCLI.getConnectionString(function handleConnect(err, result){
		  if ( err ) {
		    console.log(err);
		  } else {
		  	if(options.copy){
		  		edisonCLI.copyInput(result, function handleCopy(err, result){
					if ( err ) {
					   console.log(err);
					} else {
						console.log(result);
						console.log("Copied to clipboard. Hit Command + v to paste the command.");
					}
		  		});
		  	}else{
				console.log("Generated command: " + result);
		  	}
		  }
		});
	});

/**
* Print a list of attached Edison devices.
*
* Example output: /dev/cu.usbserial-XXXX
*/ 
program
  .command('list')
  .description('Easy way to view attached Edison devices.')
  .action(function(options){
  		edisonCLI.getUSBSerialDevices(function handleDevices(err, result){
		  if ( err ) {
		    console.log(err);
		  } else {
			console.log(result);
		  }
		});
  });

/**
* Clear all screen sessions. Screen can produce detached sessions which will
* block users from accessing Intel Edison via command line resulting in weird
* "Cant get a PTY" errors. This command helps avoid that.
*/ 
program
  .command('clean')
  .description('Clears all existing screen sessions and detached connections. Cleans all by default.')
  .option("-a, --attached", "Kill all attached screen sessions")
  .option("-d, --detached", "Kill all detached screen sessions")
  .action(function(options){
  		if(options.attached){
			edisonCLI.cleanAttachedScreens(function handleClean(err, result){
			  if ( err ) {
			      console.log(err);
			  } else {
			      console.log('Cleaned attached screens!');
			  }
			});
  		} else if(options.detached){
  			edisonCLI.cleanDetachedScreens(function handleClean(err, result){
			  if ( err ) {
			      console.log(err);
			  } else {
			      console.log('Cleaned detached screens!');
			  }
			});
  		} else {
  			edisonCLI.cleanScreens(function handleClean(err, result){
			  if ( err ) {
			      console.log(err);
			  } else {
			      console.log('Cleaned screens!');
			  }
			});
  		}
  });

/**
* Scan the local network for Intel Edison devices.
*/
program
  .command('scan')
  .description('Scan the local network for Intel Edisons.')
  .option("-c, --copy", "SSH into the Edison we found.")
  .action(function(options){
		edisonCLI.scanLocalNetwork(function handleScan(err, result){
			if ( err ) {
		      console.log(err);
		      return;
			}

		  	if(options.copy){
		  		var modifiedInput = "ssh root@" + result;
		  		edisonCLI.copyInput(modifiedInput, function handleCopy(err, result){
					if ( err ) {
					   console.log(err);
					} else {
						console.log("Edison found, use \'bloop ssh\' (and add your username with -u if you aren't using root) to ssh into to it: " + result);
						console.log("Copied to clipboard. Hit Command + v to paste the command.");
					}
		  		});
		  	}else{
				console.log("Edison found, use ssh to connect to it: " + result);
		  	}
		});
  });

/**
* SSH into a local Edison on the network.
*/
program
  .command('ssh')
  .option("-u, --user [option]", "Allow the specification of a user other than root.")
  .description('SSH into a local Intel Edison on your network.')
  .action(function(options){
  		var user = options.user;
		edisonCLI.scanLocalNetwork(function handleScan(err, result){
			if ( err ) {
		      console.log(err);
		      return;
			}

		    console.log("Attempting to ssh into: " + result);
	  		edisonCLI.ssh(result,user, function handleSSH(err, result){
				if ( err ) {
				   console.log(err);
				   return;
				} 
				// success.
	  		});
		});
  });

/**
* Scan the local network for Intel Edison devices.
*/
program
  .command('push')
  .option("-u, --user [option]", "Allow the specification of a user other than root.")
  .option("-c, --copy", "scp the current directory into the Edison we just found.")
  .option("-d, --dir", "Specify a directory into which to scp your current directory.")
  .description('Push the local directory contents to Edison npm_app_slot directory via scp.')
  .action(function(options){
  		var user = (options.user === undefined || options.user === null || options.user === true)?"root":options.user;
		edisonCLI.scanLocalNetwork(function handleScan(err, result){
			if ( err ) {
		      console.log(err);
		      return;
			}

		  	if(options.copy){
		  		edisonCLI.copyInput(result,options.user, options.dir, function handleCopy(err, result){
					if ( err ) {
					   console.log(err);
					} else {
						console.log("Edison found: " + result);
						console.log("Copied to clipboard. Hit Command + v to paste the command.");
					}
		  		});
		  	}else{
		  		var modifiedInput = "scp -r . " + user + "@" + result + ":~/node_app_slot/";
				console.log("Edison found: " + result);
				console.log("Deploy using this: " + modifiedInput);
		  	}
		});
  });

/**
* List any existing screen sessions, attached or detatched.
*/
program
  .command('screens')
  .description('List any existing screen sessions, attached or detatched.')
  .action(function(options){

		edisonCLI.getAttachedScreens(function handleClean(err, result){
		  if ( err ) {
		      console.log(err);
		  } else {
		      console.log('Attached Screens: '  + result);
		  }
		});

		edisonCLI.getDetachedScreens(function handleClean(err, result){
		  if ( err ) {
		      console.log(err);
		  } else {
		      console.log('Detached Screens: '  + result);
		  }
		});
  });

/**
* Parse the args (e.g. --a etc)
*/
program.parse(process.argv);

/**
* Show help by default.
*/
if(!program.args.length) program.help();