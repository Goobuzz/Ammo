define([
	'goo/entities/components/Component',
	'goo/math/Vector3',
	'goo/math/Quaternion',
	'goo/util/GameUtils',
	'js/Input',
	'js/Game',
	'js/Time',
	'goo/math/Ray',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/entities/EntityUtils'
], function(
	Component,
	Vector3,
	Quaternion,
	GameUtils,
	Input,
	Game,
	Time,
	Ray,
	Camera,
	CameraComponent,
	EntityUtils
){
	"use strict";
	var physTransform = new Ammo.btTransform();
	var pquat;
	function OverShoulderCam(ent){
		this.type = "OverShoulderCam";
		this.entity = ent;
		this.ray = new Ray();
		this.verticalTic = 0.01;
		this.horizontalTic = 0.01;
		this.p0Rot = new Vector3();
		this.p1Rot = new Vector3();
		this.oldPos = new Vector3();
		this.newPos = new Vector3();
		this.wantDistance = 4;

		this.pivot0 = Game.world.createEntity("Cam Pivot0");
		this.pivot0.addToWorld();
		this.pivot0.transformComponent.setTranslation(0,1.25,0);
		this.entity.transformComponent.attachChild(this.pivot0.transformComponent);
		this.entity.transformComponent.setUpdated();
		this.pivot1 = Game.world.createEntity("Cam Pivot1");
		this.pivot1.addToWorld();
		this.pivot1.transformComponent.setTranslation(-0.25, 0, 0);
		this.pivot1.transformComponent.setRotation(-15*(Math.PI/180),0,0);
		this.pivot0.transformComponent.attachChild(this.pivot1.transformComponent);
		this.pivot0.transformComponent.setUpdated();

		this.pivot2 = Game.world.createEntity("Cam Pivot2");
		this.pivot2.addToWorld();
		this.pivot2.transformComponent.setRotation(0,Math.PI,0);
		this.pivot2.transformComponent.setTranslation(0,0,-this.wantDistance);
		this.pivot2.transformComponent.setUpdated();

		this.pivot1.transformComponent.attachChild(this.pivot2.transformComponent);
		this.pivot1.transformComponent.setUpdated();
		
		this.camEntity = Game.world.createEntity("View Cam");
		this.camEntity.addToWorld();
		
		var cam = new Camera(45, 1, 0.1, 100);
		this.camEntity.setComponent(new CameraComponent(cam));
		ent.transformComponent.attachChild(this.pivot0.transformComponent);

		Game.viewCam = this.camEntity;

		Game.register("MouseMove", this, mouseMove);
		Game.register("MouseButton1", this, mouseButton1);
		Game.register("LateUpdate", this, lateUpdate);
	}
	OverShoulderCam.prototype = Object.create(Component.prototype);
	OverShoulderCam.prototype = OverShoulderCam;

	function mouseButton1(){
		if(true == Input.mouseButton[1]){
			if(!document.pointerLockElement) {
				GameUtils.requestPointerLock();
				return;
			}
		}
	}

	function mouseMove(){
		if(!document.pointerLockElement){return;}
		// mouse Y - Camera X axis
		if(Input.movement.y){
			this.pivot1.transformComponent.transform.rotation.toAngles(this.p1Rot);
			this.p1Rot.x += Input.movement.y * this.verticalTic;
			this.p1Rot.x = Math.min(Math.max(this.p1Rot.x, -Math.PI*0.5), Math.PI*0.5);
			this.pivot1.transformComponent.transform.rotation.fromAngles(this.p1Rot.x, this.p1Rot.y, this.p1Rot.z);
			this.pivot1.transformComponent.setUpdated();
		}

		// mouse X - Camera Y axis
		if(Input.movement.x){
			this.pivot0.transformComponent.transform.rotation.toAngles(this.p0Rot);
			this.p0Rot.y -= Input.movement.x * this.horizontalTic;
			if(this.p0Rot.y < -2*Math.PI){
				this.p0Rot.y += 2*Math.PI;
			}
			if(this.p0Rot.y > 2*Math.PI){
				this.p0Rot.y -= 2*Math.PI;
			}
			if(this.p0Rot.y > 2*Math.PI){
				this.p0Rot.y = 2*Math.PI;
			}
			if(this.p0Rot.y < -2*Math.PI){
				this.p0Rot.y = -2*Math.PI;
			}
			//console.log(this.p0Rot.y*(180/Math.PI));
			this.pivot0.transformComponent.transform.rotation.fromAngles(this.p0Rot.x, this.p0Rot.y, this.p0Rot.z);
			this.pivot0.transformComponent.setUpdated();
		}
		
	}

	function lateUpdate(){
		this.camEntity.transformComponent.setTranslation(this.pivot2.transformComponent.worldTransform.translation);
		this.camEntity.transformComponent.lookAt(this.pivot1.transformComponent.worldTransform.translation, Vector3.UNIT_Y);
		this.camEntity.transformComponent.setUpdated();
	}

	return OverShoulderCam;
});