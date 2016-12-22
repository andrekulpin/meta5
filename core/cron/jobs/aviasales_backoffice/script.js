var Casper = require('casper');
var system = require('system');
var args = system.args;
// var url = args[args.length - 2];
// var proxy = args[args.length - 1];

var casper = Casper.create({
	// 	pageSettings: {
	// 	proxy: proxy
	// },
	viewportSize: {
		width: 1024,
		height: 900
	},
	waitTimeout: 120000
});

casper.start('https://backoffice.aviasales.ru');

casper.wait(5000, function(){
	console.log(555)
	this.fillSelectors('#auth-cell form', {
		'input[name = login ]' : 'OneTwoTrip.ru',
		'input[name = password ]' : 'JLlBOmvEaUkw&H$'
	});
	this.evaluate(function(){
		return document.querySelector('.rubix-panel div div div:nth-child(4)').click();
	})
})

casper.wait(10000, function(){
	this.evaluate(function(){
		return document.querySelector('body div:nth-child(2) div div div:nth-child(7) button').click();
	})
});

casper.thenOpen('https://backoffice.aviasales.ru/downloads', function(){

})

casper.wait(30000, function(){})

casper.run();




