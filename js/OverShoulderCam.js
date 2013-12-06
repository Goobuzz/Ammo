define([
	'goo/entities/components/Component',
	'goo/math/Vector3',
	'goo/math/Quaternion',
	'goo/math/Matrix3x3',
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
	Matrix3x3,
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
	//var physTransform = new Ammo.btTransform();
	//var pquat;
	var quaternion = new Quaternion();
	function OverShoulderCam(ent){
		this.type = "OverShoulderCam";
		this.entity = ent;
		this.ray = new Ray();
		this.verticalTic = 0.01;
		this.horizontalTic = 0.01;

		this.targetPosition = ent.transformComponent.transform.translation;
		this.targetOffset = new Vector3(0,1.25,0);
		//this.offset = new Vector3();
		this.camTarget = new Vector3();
		this.offsetRotation = new Matrix3x3();
		this.yaw = 0;
		this.pitch = 0;
		this.roll = 0.0;

		this.wantPos = new Vector3();
		this.wantRot = new Vector3();

		this.wantDistance = 3;
		this.distance = 3;
		
		this.camEntity = Game.world.createEntity("View Cam");
		this.camEntity.addToWorld();
		
		var cam = new Camera(45, 1, 0.1, 100);
		this.camEntity.setComponent(new CameraComponent(cam));

		Game.viewCam = this.camEntity;

		Game.register("MouseMove", this, mouseMove);
		Game.register("MouseButton1", this, mouseButton1);
		Game.register("LateUpdate", this, this.lateUpdate);
	}
	OverShoulderCam.prototype = Object.create(Component.prototype);
	OverShoulderCam.prototype = OverShoulderCam;

	OverShoulderCam.prototype.setYaw = function(n0){
		this.yaw = n0;
	}
	OverShoulderCam.prototype.setOffsetRotation = function(rot0){
		this.offsetRotation.copy(rot0);
	}

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
			this.pitch += Input.movement.y * this.verticalTic;
			this.pitch = Math.min(Math.max(this.pitch, -Math.PI*0.5), Math.PI*0.5);
		}

		// mouse X - Camera Y axis
		if(Input.movement.x){
			this.yaw += Input.movement.x * this.horizontalTic;
			if(this.yaw < -2*Math.PI){
				this.yaw += 2*Math.PI;
			}
			if(this.yaw > 2*Math.PI){
				this.yaw -= 2*Math.PI;
			}
			if(this.yaw > 2*Math.PI){
				this.yaw = 2*Math.PI;
			}
			if(this.yaw < -2*Math.PI){
				this.yaw = -2*Math.PI;
			}
		}
	}
	var targetRot = new Vector3();
	OverShoulderCam.prototype.lateUpdate = function(){
		this.offsetRotation.toAngles(targetRot);

		this.targetOffset.x = -Math.cos(this.yaw)*0.25;
		this.targetOffset.z = -Math.sin(this.yaw)*0.25;

		Vector3.add(this.targetOffset, this.targetPosition, this.camTarget);

		DistanceElevationHeading(this.wantDistance, this.pitch, this.yaw, this.wantPos);
		this.wantPos.add(this.camTarget);

		this.ray.origin.copy(this.camTarget);
		Vector3.sub(this.wantPos, this.ray.origin, this.ray.direction);
		this.ray.direction.normalize();

		this.distance = this.wantDistance;
		var hit = Game.castRay(this.ray, 1);
		if(hit != null){
			if(hit.distance < this.wantDistance){
				this.distance = hit.distance;
			}
		}

		DistanceElevationHeading(this.distance, this.pitch, this.yaw, this.wantPos);
		this.wantPos.add(this.camTarget);

		//console.log(this.wantPos.x+','+this.wantPos.y+','+this.wantPos.z);
		this.camEntity.transformComponent.transform.translation.lerp(this.wantPos, 20*Time.dt);
		this.camEntity.transformComponent.transform.lookAt(this.camTarget, Vector3.UNIT_Y);
		this.camEntity.transformComponent.setUpdated();

		Game.userTorso.transformComponent.transform.rotation.fromAngles(0, -targetRot.y-this.yaw, 0);
		Game.userTorso.transformComponent.setUpdated();
	}

	function DistanceElevationHeading(distance, elevation, heading, v0){
		var radH = (heading-(Math.PI*0.5)); // Mathf.Deg2Rad;
		var radE = elevation//*Mathf.Deg2Rad;
		var a = distance * Math.cos(radE);
		v0 = typeof v0 !== 'undefined' ? v0 : new Vector3();
		v0.x = a*Math.cos(radH);
		v0.y = distance*Math.sin(radE);
		v0.z = a*Math.sin(radH);
		return v0;
	}

	return OverShoulderCam;
});