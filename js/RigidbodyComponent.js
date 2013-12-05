define([
	'goo/entities/components/Component',
	'goo/math/Quaternion',
	'goo/math/Vector3',
	'js/Game',
	'js/Time'
],function(
	Component,
	Quaternion,
	Vector3,
	Game,
	Time
){
	var quaternion = new Quaternion();
	var ptrans = new Ammo.btTransform();
	var pquat = new Ammo.btQuaternion(0,0,0,1);
	var origin = new Ammo.btVector3();
	"use strict";
	function RigidbodyComponent(entity, configs){
		this.type = "RigidbodyComponent";
		console.log(entity);

		console.log(entity.getComponent("ColliderComponent"));
		if(null == entity.colliderComponent){console.error("ColliderComponent required!");return;}
		
		this.entity = entity;
		this.position = entity.transformComponent.transform.translation;
		this.rotation = entity.transformComponent.transform.rotation;
		
		this.oldPos = new Vector3();
		this.newPos = new Vector3();
		this.oldRot = new Quaternion();
		this.newRot = new Quaternion();
		this.offsetPosition = new Vector3();

		quaternion.fromRotationMatrix(this.rotation);

		this.mass = typeof configs.mass !== 'undefined' ? configs.mass : 1.0;

		var quat = new Ammo.btQuaternion(quaternion.x,quaternion.y,quaternion.z,quaternion.w);
		var pos = new Ammo.btVector3(this.position.x,this.position.y,this.position.z);

		var trans = new Ammo.btTransform(quat, pos);
		var localInertia = new Ammo.btVector3(0,0,0);
		
		entity.colliderComponent.ammoShape.calculateLocalInertia(this.mass, localInertia);
		var motionState = new Ammo.btDefaultMotionState(trans);
		this.rbInfo = new Ammo.btRigidBodyConstructionInfo( this.mass, motionState, entity.colliderComponent.ammoShape, localInertia );
		this.ammoRB = new Ammo.btRigidBody(this.rbInfo);
		Game.ammoWorld.addRigidBody(this.ammoRB);
		if(this.mass > 0){
			Game.register("AmmoUpdate", this, this._ammoUpdate);
			Game.register("RenderUpdate", this, this._renderUpdate);
		}
	};

	RigidbodyComponent.prototype = Object.create(Component.prototype);
	RigidbodyComponent.constructor = RigidbodyComponent;

	RigidbodyComponent.prototype.setLinearFactor = function(n0, n1, n2){
		this.ammoRB.setLinearFactor(new Ammo.btVector3(n0,n1,n2));
	};
	// rotation
	RigidbodyComponent.prototype.setAngularFactor = function(n0, n1, n2){
		this.ammoRB.setAngularFactor(new Ammo.btVector3(n0,n1,n2));
	};
	RigidbodyComponent.prototype.setFriction = function(n1){
		this.ammoRB.setFriction(n1);
	};
	RigidbodyComponent.prototype.setSleepingThresholds = function(min, max){
		this.ammoRB.setSleepingThresholds(min, max);
	};
	RigidbodyComponent.prototype.setMass = function(n1){
		this.ammoRB.setFriction(n1);
	};
	RigidbodyComponent.prototype.setRestitution = function(n0){
		this.ammoRB.setRestitution(n0);
	}
	RigidbodyComponent.prototype.setOffsetPosition = function(n0, n1, n2){
		this.offsetPosition.x = n0;
		this.offsetPosition.y = n1;
		this.offsetPosition.z = n2;
	}

	RigidbodyComponent.prototype._ammoUpdate = function(){
		this.oldPos.copy(this.newPos);
		this.oldRot.copy(this.newRot);
		this.ammoRB.getMotionState().getWorldTransform(ptrans);
		origin = ptrans.getOrigin();
		pquat = ptrans.getRotation();
		

		this.newPos.setd(origin.x()+this.offsetPosition.x, origin.y()+this.offsetPosition.y, origin.z()+this.offsetPosition.z);
		this.newRot.setd(pquat.x(), pquat.y(), pquat.z(), pquat.w());
		
		//quaternion.setd(pquat.x(), pquat.y(), pquat.z(), pquat.w());
		//this.position.setd(origin.x(), origin.y(), origin.z());
		//this.rotation.copyQuaternion(quaternion);
		//this.entity.transformComponent.setUpdated();
	}

	RigidbodyComponent.prototype._renderUpdate = function(){
		/*this.position.setd(
			(this.newPos.x * Time.alpha) + (this.oldPos.x * Time.negAlpha),
			(this.newPos.y * Time.alpha) + (this.oldPos.y * Time.negAlpha),
			(this.newPos.z * Time.alpha) + (this.oldPos.z * Time.negAlpha)
			);
		quaternion.setd(
			(this.newRot.x * Time.alpha) + (this.oldRot.x * Time.negAlpha),
			(this.newRot.y * Time.alpha) + (this.oldRot.y * Time.negAlpha),
			(this.newRot.z * Time.alpha) + (this.oldRot.z * Time.negAlpha),
			(this.newRot.w * Time.alpha) + (this.oldRot.w * Time.negAlpha)
			);
		this.entity.transformComponent.transform.rotation.copyQuaternion(quaternion);
		this.entity.transformComponent.setUpdated();*/

		this.position.setd(
			this.newPos.x,
			this.newPos.y,
			this.newPos.z
			);
		quaternion.setd(
			this.newRot.x,
			this.newRot.y,
			this.newRot.z,
			this.newRot.w
			);
		this.rotation.copyQuaternion(quaternion);
		this.entity.transformComponent.setUpdated();
	}

	return RigidbodyComponent;
});