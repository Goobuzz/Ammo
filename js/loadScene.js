require([
	'goo/addons/howler/components/HowlerComponent',
	'goo/addons/howler/systems/HowlerSystem',
	'goo/loaders/DynamicLoader',
	'goo/math/Vector3',
	'goo/util/rsvp',
	'js/Game',
	'js/Time',
	'js/Input',
	'js/OverShoulderCam',
	'js/RigidbodyComponent',
	'js/CapsuleColliderComponent',
	'js/CharacterController'

], function (
	HowlerComponent,
	HowlerSystem,
	DynamicLoader,
	Vector3,
	RSVP,
	Game,
	Time,
	Input,
	OverShoulderCam,
	RigidbodyComponent,
	CapsuleColliderComponent,
	CharacterController
) {
	'use strict';
	// Ammo vars
	Game.levelMesh;
    
	Game.ammoWorld;
	//var physTransform;
	//var btVec;

	// enum PHY_ScalarType
	//var PHY_FLOAT = 0;
	//var PHY_DOUBLE = 1;
	var PHY_INTEGER = 2;
	//var PHY_SHORT = 3;
	//var PHY_FIXEDPOINT88 = 4;
	//var PHY_UCHAR = 5;

	Vector3.DOWN = new Vector3(0,-1,0);
	Object.freeze(Vector3.DOWN);

	function initAmmoWorld() {

		//physTransform = new Ammo.btTransform();
		//Game.physTransform = physTransform;
		//quaternion = new Quaternion();
		//btVec = new Ammo.btVector3();

		var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		var dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
		var overlappingPairCache = new Ammo.btDbvtBroadphase();
		var solver = new Ammo.btSequentialImpulseConstraintSolver();
		Game.ammoWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, overlappingPairCache, solver, collisionConfiguration );
		Game.ammoWorld.setGravity(new Ammo.btVector3(0, -20, 0));
		//Game.gravity = 12;

		//for(var i = 0, ilen = Game.levelMesh.transformComponent.children.length; i < ilen; i++){
		//	createAmmoMeshShape(Game.levelMesh.transformComponent.children[i].entity);
		//}
		createAmmoMeshShape(Game.levelMesh);

		// TODO:  Do this updating in a Worker()
		
		//setInterval(function(){ammoWorld.stepSimulation(1/60, 5)}, 1000/60);
	}

	function createAmmoMeshShape(entity){
		entity.colliderComponent = {ammoShape:createTriangleMeshShape(entity)};
		entity.setComponent(new RigidbodyComponent(entity, {mass:0}));
	}

	function createTriangleMeshShape(entity) {
		
		var mesh = entity.getComponent("meshDataComponent");
		if(null == mesh){console.error("Entity requires a meshDataComponent.");return;}

		var meshData = mesh.meshData;
		var vertices = meshData.dataViews.POSITION;
		var indices = meshData.indexData.data;
		var numTriangles = meshData.indexCount / 3;
		var numVertices = meshData.vertexCount;

		var triangleMesh = new Ammo.btTriangleIndexVertexArray();

		var indexType = PHY_INTEGER;
		var mesh = new Ammo.btIndexedMesh();

		var floatByteSize = 4;
		var vertexBuffer = Ammo.allocate( floatByteSize * vertices.length, "float", Ammo.ALLOC_NORMAL );

		var scale = 1;

		for ( var i = 0, il = vertices.length; i < il; i ++ ) {

			Ammo.setValue( vertexBuffer + i * floatByteSize, scale * vertices[ i ], 'float' );

		}
		var use32bitIndices = true;
		var intByteSize = use32bitIndices ? 4 : 2;
		var intType = use32bitIndices ? "i32" : "i16";


		var indexBuffer = Ammo.allocate( intByteSize * indices.length, intType, Ammo.ALLOC_NORMAL );

		for ( var i = 0, il = indices.length; i < il; i ++ ) {

			Ammo.setValue( indexBuffer + i * intByteSize, indices[ i ], intType );

		}


		var indexStride = intByteSize * 3;
		var vertexStride = floatByteSize * 3;

		mesh.set_m_numTriangles( numTriangles );
		mesh.set_m_triangleIndexBase( indexBuffer );
		mesh.set_m_triangleIndexStride( indexStride );

		mesh.set_m_numVertices( numVertices );
		mesh.set_m_vertexBase( vertexBuffer );
		mesh.set_m_vertexStride( vertexStride );

		triangleMesh.addIndexedMesh( mesh, indexType );

		var useQuantizedAabbCompression = true;
		var buildBvh = true;

		var shape = new Ammo.btBvhTriangleMeshShape( triangleMesh, useQuantizedAabbCompression, buildBvh );

		return shape;
	}

	function createUserEntity(){
		Game.userEntity = Game.world.createEntity("UserEntity");
		Game.userEntity.addToWorld();
		Game.userEntity.transformComponent.attachChild(Game.userLeggs.transformComponent);
		Game.userEntity.transformComponent.attachChild(Game.userTorso.transformComponent);
		Game.userEntity.transformComponent.setTranslation(0,25,0);
		Game.userEntity.setComponent(new CapsuleColliderComponent(Game.userEntity, {radius:0.5, height:0.8}));
		Game.userEntity.setComponent(new RigidbodyComponent(Game.userEntity, {mass:1.5}));

		Game.userEntity.rigidbodyComponent.setSleepingThresholds(0.0, 0.0);
		Game.userEntity.rigidbodyComponent.setAngularFactor(0,0,0);
		Game.userEntity.rigidbodyComponent.setFriction(0.0);
		Game.userEntity.rigidbodyComponent.setRestitution(0.0);
		Game.userEntity.rigidbodyComponent.setOffsetPosition(0,-0.9,0);
		
		Game.userEntity.setComponent(new CharacterController(Game.userEntity));

		Game.userEntity.setComponent(new OverShoulderCam(Game.userEntity));
	}

	function init() {

		// Make sure user is running Chrome/Firefox and that a WebGL context works
		var isChrome, isFirefox, isIE, isOpera, isSafari, isCocoonJS;
	 	isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
	  	isFirefox = typeof InstallTrigger !== 'undefined';
	  	isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
	  	isChrome = !!window.chrome && !isOpera;
	  	isIE = false || document.documentMode;
	  	isCocoonJS = navigator.appName === "Ludei CocoonJS";
		if (!(isFirefox || isChrome || isSafari || isCocoonJS)) {
			alert("Sorry, but your browser is not supported.\nGoo works best in Google Chrome or Mozilla Firefox.\nYou will be redirected to a download page.");
			window.location.href = 'https://www.google.com/chrome';
		} else if (!window.WebGLRenderingContext) {
			alert("Sorry, but we could not find a WebGL rendering context.\nYou will be redirected to a troubleshooting page.");
			window.location.href = 'http://get.webgl.org/troubleshooting';
		} else {

		// Loading screen callback
		var progressCallback = function (handled, total) {
			var loadedPercent = (100*handled/total).toFixed();
			$('#loadingOverlay').show();
			$('#loadingOverlay .loadingMessage').show();
			$('#loadingOverlay .progressBar').show();
			$('#loadingOverlay .progressBar .progress').css('width', loadedPercent+'%');
		};

		var promises = [];
		// Create typical goo application
		Game.world.setSystem(new Time(Game));
		//Input.init(Game);
		Game.world.setSystem(new HowlerSystem());

		// The Loader takes care of loading data from a URL...
		var loader = new DynamicLoader({
			world: Game.world,
			rootPath: 'res',
			progressCallback: progressCallback});

		promises.push(loader.loadFromBundle('project.project', 'root.bundle', {recursive: false, preloadBinaries: true}));
		promises.push(loader.loadFromBundle('project.project', 'Marine.bundle', {recursive: false, preloadBinaries: true}));

		RSVP.all(promises).then(function() {
			console.log(loader._configs);
			//var oldCam = loader.getCachedObjectForRef("entities/DefaultToolCamera.entity");
			//oldCam.removeFromWorld();
			
			Game.levelMesh = loader.getCachedObjectForRef("Level/entities/Box01_0.entity");
			Game.levelMesh.hitMask = 1;

			Game.userLeggs = loader.getCachedObjectForRef("MarineBottom/entities/RootNode.entity");
			Game.userTorso = loader.getCachedObjectForRef("MarineTop/entities/RootNode.entity");
		//	Game.userMesh = loader.getCachedObjectForRef("Space_MarineIdle/entities/RootNode.entity");

			initAmmoWorld();
			createUserEntity();
			// This function is called when the project has finished loading.
			Input.assignKeyToAction(87, "Forward");
			Input.assignKeyToAction(83, "Back");
			Input.assignKeyToAction(65, "Left");
			Input.assignKeyToAction(68, "Right");
			Input.assignKeyToAction(32, "Jump");

			Input.assignGamepadButtonToAction(0, 12, "Forward");
			Input.assignGamepadButtonToAction(0, 13, "Back");
			Input.assignGamepadButtonToAction(0, 14, "Left");
			Input.assignGamepadButtonToAction(0, 15, "Right");
			Input.assignGamepadButtonToAction(0, 11, "Jump");

			Input.assignGamepadAxisToAction(0, 3, "LookYAxis");
			Input.assignGamepadAxisToAction(0, 2, "LookXAxis");

			Input.assignMouseButtonToAction(1, "LeftClick");
			//Game.renderer.domElement.id = 'goo';
			//document.body.appendChild(Game.renderer.domElement);
			Game.doRender = true;
		})
		.then(null, function(e) {
			// The second parameter of 'then' is an error handling function.
			// We just pop up an error message in case the scene fails to load.
			alert('Failed to load scene: ' + e);
			console.log(e.stack);
		});
	}
}
	init();
});
