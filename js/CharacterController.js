define([
	'goo/entities/components/Component',
	'js/Game',
	'js/Time',
	'goo/math/Vector3',
	'goo/math/Quaternion',
	'goo/math/Matrix3x3',
	'js/Input',
	'goo/math/Ray'

], function(
	Component,
	Game,
	Time,
	Vector3,
	Quaternion,
	Matrix3x3,
	Input,
	Ray
){
	"use strict";
	var physTransform = new Ammo.btTransform();
	var quaternion = new Quaternion();
	function CharacterController(entity){
		this.type = "CharacterController";
		this.entity = entity;
		//this.newPos = new Vector3();
		//this.oldPos = new Vector3();

		this.ray = new Ray();
		this.jumpHeight = 1.0;
		this.falling = true;

		this.fwdBase = new Vector3(0,0,-1);
		this.leftBase = new Vector3(-1,0,0);

		this.direction = new Vector3(0,0,0);
		this.left = new Vector3(1,0,0);
		this.movement = new Vector3(0,0,0);
		this.grounded = false;
		//this.camComponent = null;

		this.horizontalTic = 0.01;

		this.moveVector = new Ammo.btVector3();
		this.speed = 3;
		this.oldAnim = -1;

		//this.entityRot = new Vector3();
		//this.yaw = 0.0;

		Game.register("Update", this, this.update);
		Game.register("MouseButton1", this, this.mouseButton1);
	};
	CharacterController.prototype = Object.create(Component.prototype);
	CharacterController.constructor = CharacterController;

	CharacterController.prototype.mouseButton1 = function(){
		if(true == Input.mouseButton[1]){
			if(!document.pointerLockElement){return;}
			this.turnCamera();
		}
	}

	CharacterController.prototype.turnCamera = function(n0){
		var rot = new Matrix3x3();
		rot.copy(this.entity.overShoulderCam.camEntity.transformComponent.transform.rotation);
		var rotVec = new Vector3();
		rot.toAngles(rotVec);
		rotVec.x = 0;
		rotVec.z = 0;
		rotVec.y = typeof n0 !== 'undefined' ? Math.PI+n0+rotVec.y : Math.PI+rotVec.y;

		if(rotVec.y < -2*Math.PI){
			rotVec.y += 2*Math.PI;
		}
		if(rotVec.y > 2*Math.PI){
			rotVec.y -= 2*Math.PI;
		}
		if(rotVec.y > 2*Math.PI){
			rotVec.y = 2*Math.PI;
		}
		if(rotVec.y < -2*Math.PI){
			rotVec.y = -2*Math.PI;
		}

		rot.fromAngles(rotVec.x, rotVec.y, rotVec.z);
		this.entity.rigidbodyComponent.setRotation(rot);
		this.entity.overShoulderCam.setOffsetRotation(rot);
	}
	//this.entity.rigidbodyComponent.setLinearVelocity(this.movement);
	CharacterController.prototype.jump = function(){
		this.movement.x = this.entity.rigidbodyComponent.getLinearVelocity().x();
		this.movement.z = this.entity.rigidbodyComponent.getLinearVelocity().z();
		this.movement.y = Math.sqrt(2*20*this.jumpHeight)*this.entity.rigidbodyComponent.mass;
		this.entity.rigidbodyComponent.setLinearVelocity(this.movement);
	}
	CharacterController.prototype.update = function(){
        this.grounded = false;
        var wantAnim = 0;
        
       	Game.viewCam.transformComponent.transform.applyForwardVector( this.fwdBase, this.direction); // get the direction the camera is looking
		Game.viewCam.transformComponent.transform.applyForwardVector( this.leftBase, this.left); // get the direction to the left of the camera

		this.movement.copy(Vector3.ZERO);

		if (true == Input.keys[87]) // W
			this.movement.add(this.direction);
		if (true == Input.keys[83]) // S
			this.movement.sub(this.direction);
		if (true == Input.keys[65]) // A
			this.movement.add(this.left);
		if (true == Input.keys[68]) // D
			this.movement.sub(this.left);
		this.movement.normalize();


		if(this.movement.x != 0 || this.movement.z != 0){
			this.turnCamera();
			 // move the same amount regardless of where we look-
			//this.movement.x*=this.speed;
			//this.movement.z*=this.speed;
			wantAnim = 1;
		}
		else{
			var leggRot = new Vector3();
			var bodyRot = new Vector3();
			Game.userLeggs.transformComponent.transform.rotation.toAngles(leggRot);
			Game.userTorso.transformComponent.transform.rotation.toAngles(bodyRot);

			var diff = leggRot.y-bodyRot.y;
			if(diff > Math.PI*0.25){
				this.turnCamera(Math.PI*0.25);
			}
			if(diff < -Math.PI*0.25){
				this.turnCamera(-Math.PI*0.25);
			}
			//console.log(diff);
		}
		this.movement.normalize();
    	this.ray.origin.copy(this.entity.transformComponent.transform.translation);
		this.ray.origin.y += 1.0;
		this.ray.direction = Vector3.DOWN;
		this.ray.distance = 1.0;
		var hit = Game.castRay(this.ray, 1);
		if(null != hit){
			//var cross = new Vector3();
			//Vector3.cross(this.movement, hit.normal, cross);
			//Vector3.cross(cross, hit.normal, this.movement);

			if(hit.distance < 1.1){
				this.falling = false;
				this.grounded = true;
			}
		}

		this.movement.x*=this.speed;
		this.movement.z*=this.speed;
		this.movement.y = this.entity.rigidbodyComponent.getLinearVelocity().y();

		if (true == Input.keys[32]){
			if(true == this.grounded) { // space bar
				// (2 * gravity * height)*mass
				wantAnim = 0;
				this.jump();
			}
			else{
				if(false == this.falling && this.movement.y < -0.1){
					wantAnim = 0;
					this.falling = true;
				}
				if(this.falling){
					wantAnim = 0;
					this.movement.y += 50.0*Time.dt;
					if(this.movement.y > 5){
						this.movement.y = 5;
					}
				}
			}
		}
		this.entity.rigidbodyComponent.setLinearVelocity(this.movement);
		Game.userLeggs.animationComponent.transitionTo(Game.userLeggs.animationComponent.getStates()[wantAnim]);
		Game.userTorso.animationComponent.transitionTo(Game.userTorso.animationComponent.getStates()[wantAnim]);
    };

	return CharacterController;
});