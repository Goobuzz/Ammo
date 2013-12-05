define([
	'goo/entities/components/Component'
], function(
	Component
){
	function CapsuleColliderComponent(entity, configs){
		this.type = "ColliderComponent";
		this.radius = typeof configs.radius !== 'undefined' ? configs.radius : 0.5;
		this.height = typeof configs.height !== 'undefined' ? configs.height : 0.0;

		this.ammoShape = new Ammo.btCapsuleShape(this.radius, this.height);
	};
	CapsuleColliderComponent.prototype = Object.create(Component.prototype);
	CapsuleColliderComponent.constructor = CapsuleColliderComponent;

	return CapsuleColliderComponent;
});