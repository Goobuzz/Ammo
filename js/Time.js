define([
	'goo/entities/systems/System',
	'js/Game'
],
function (
	System,
	Game
){
	"use strict";
	function Time(goo){
		this._ft = 1.0 / Time.fps; // forecasted dt
		this._pFt = 1.0 / Time.fps; // previous forecasted dt

		this._tr = 0.0; // trend
		this._pTr = 0.0; // previous trend

		this._avg = (2/(1 + Time.fps)); // dt average
		this._maxFrame = this._ft * 10;
		this._accumulated = 0.0;
		this.world = goo;
		System.call(this, "Time", []);
	};
	Time.prototype = Object.create(System.prototype);
	Time.contstructor = Time;
	Time.fps = 60;
	Time.dt = 1.0 / Time.fps; // smoothed dt
	Time.fixedFPS = 150;
	Time.fixedDT = 1.0 / Time.fixedFPS;
	Time.time = 0.0;;
	Time.timeScale = 1.0;
	Time.alpha = 0.0;
	Time.negAlpha = 0.0;
	Time.prototype.process = function(entities, tpf){
		if(tpf > this._maxFrame){tpf = this._maxFrame;}

		this._pFt = this._ft;
		this._pTr = this._tr;

		this._ft = ((tpf * this._avg) + ((1-this._avg) * (this._pFt + this._pTr))) * Time.timeScale;
		this._tr = ((this._ft - this._pFt) * this._avg) + ((1 - this._avg) * this._pTr);

		Time.dt = this._ft + this._tr;
		Time.time += Time.dt;
		this._accumulated += Time.dt;

		Game.raiseEvent("Update");

		while(Time.fixedDT < this._accumulated){
			Game.raiseEvent("FixedUpdate");
			if(Game.ammoWorld){
				Game.ammoWorld.stepSimulation(Time.fixedDT, 0);
				Game.raiseEvent("AmmoUpdate");
			}
			this._accumulated -= Time.fixedDT;
		}

		Time.alpha = this._accumulated / Time.fixedDT;
		Time.negAlpha = 1 - Time.alpha;

		Game.raiseEvent("RenderUpdate");
		Game.raiseEvent("LateUpdate");
	};

	return Time;
});