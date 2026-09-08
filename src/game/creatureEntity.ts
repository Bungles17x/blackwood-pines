import * as THREE from 'three';
import { CreatureState } from '../types';
import { horrorAudio } from '../audio/horrorAudio';
import { WallBox } from './facilityMap';

export class CreatureEntity {
  public group: THREE.Group;
  public state: CreatureState = 'PATROL';
  public position: THREE.Vector3;
  public speed: number = 1.6;

  // Animation nodes
  private headMesh: THREE.Mesh;
  private jawMesh: THREE.Mesh;
  private leftEye: THREE.PointLight;
  private rightEye: THREE.PointLight;
  private leftEyeMesh: THREE.Mesh;
  private rightEyeMesh: THREE.Mesh;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private torsoMesh: THREE.Mesh;

  // AI navigation waypoints across the expanded forest landmarks
  private waypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 0, -22),   // North Trailhead Overlook
    new THREE.Vector3(-24, 0, -32), // Ancient Monolith Ring
    new THREE.Vector3(-27, 0, -4),  // Misty Campsite
    new THREE.Vector3(0, 0, 0),     // Heart of the Woods Crossroads
    new THREE.Vector3(20, 0, -18),  // Outside Ranger Cabin
    new THREE.Vector3(36, 0, -4),   // Lookout Bluff
    new THREE.Vector3(26, 0, 20),   // Diesel Generator Power Substation
    new THREE.Vector3(0, 0, 36),    // South Mountain Highway approach
    new THREE.Vector3(-28, 0, 24),  // Old Logging Camp & Timber Shed
    new THREE.Vector3(-14, 0, 10),  // Deep Western Pines
  ];
  private currentWaypointIndex: number = 0;
  private targetPosition: THREE.Vector3;

  private animTimer: number = 0;
  private audioTimer: number = 0;
  private chaseTimer: number = 0;
  private twitchTimer: number = 0;
  private isTwitching: boolean = false;
  private vocalTimer: number = 0;
  private twigTimer: number = 0;
  private hissCooldown: number = 0;

  constructor(initialPosition = new THREE.Vector3(0, -100, 20), startDormant = true) {
    this.position = initialPosition.clone();
    this.targetPosition = this.waypoints[5].clone();
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.state = startDormant ? 'DORMANT' : 'PATROL';
    this.group.visible = !startDormant;

    // Build the twisted, gaunt creature mesh
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2126,
      roughness: 0.88,
      metalness: 0.1,
    });

    const darkVeinMaterial = new THREE.MeshStandardMaterial({
      color: 0x090c0e,
      roughness: 0.9,
    });

    const antlerMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d352e,
      roughness: 0.75,
    });

    // 1. Torso (Tall, gaunt, visible ribs)
    const torsoGeo = new THREE.CylinderGeometry(0.3, 0.22, 1.7, 8);
    this.torsoMesh = new THREE.Mesh(torsoGeo, skinMaterial);
    this.torsoMesh.position.set(0, 1.85, 0.08);
    this.torsoMesh.rotation.x = -0.18;
    this.torsoMesh.castShadow = true;
    this.group.add(this.torsoMesh);

    // Ribcage rungs
    for (let r = 0; r < 5; r++) {
      const ribGeo = new THREE.TorusGeometry(0.32 - r * 0.02, 0.03, 6, 12, Math.PI);
      const rib = new THREE.Mesh(ribGeo, darkVeinMaterial);
      rib.position.set(0, 2.1 - r * 0.14, 0.05);
      rib.rotation.x = Math.PI * 0.5;
      this.group.add(rib);
    }

    // Spine bumps on back
    for (let s = 0; s < 7; s++) {
      const spineGeo = new THREE.BoxGeometry(0.08, 0.08, 0.12);
      const spine = new THREE.Mesh(spineGeo, darkVeinMaterial);
      spine.position.set(0, 2.2 - s * 0.15, -0.22);
      this.group.add(spine);
    }

    // 2. Neck and Head
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.35, 6);
    const neck = new THREE.Mesh(neckGeo, skinMaterial);
    neck.position.set(0, 2.68, 0.12);
    neck.rotation.x = 0.38;
    this.group.add(neck);

    // Head (elongated skull)
    const headGeo = new THREE.BoxGeometry(0.36, 0.52, 0.44);
    this.headMesh = new THREE.Mesh(headGeo, skinMaterial);
    this.headMesh.position.set(0, 3.08, 0.24);
    this.headMesh.rotation.x = 0.18;
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);

    // Forest Wendigo Antler Horns
    for (let side of [-1, 1]) {
      // Main antler beam
      const mainBeamGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.7, 6);
      const mainBeam = new THREE.Mesh(mainBeamGeo, antlerMaterial);
      mainBeam.position.set(side * 0.16, 0.38, -0.05);
      mainBeam.rotation.set(-0.2, 0, side * 0.45);
      this.headMesh.add(mainBeam);

      // Tine 1 (forward tine)
      const tine1Geo = new THREE.CylinderGeometry(0.02, 0.035, 0.35, 5);
      const tine1 = new THREE.Mesh(tine1Geo, antlerMaterial);
      tine1.position.set(side * 0.26, 0.5, 0.05);
      tine1.rotation.set(0.4, 0, side * 0.7);
      this.headMesh.add(tine1);

      // Tine 2 (upward high tine)
      const tine2Geo = new THREE.CylinderGeometry(0.015, 0.03, 0.4, 5);
      const tine2 = new THREE.Mesh(tine2Geo, antlerMaterial);
      tine2.position.set(side * 0.35, 0.7, -0.1);
      tine2.rotation.set(-0.3, 0, side * 0.3);
      this.headMesh.add(tine2);
    }

    // Jaw (hinged lower)
    const jawGeo = new THREE.BoxGeometry(0.28, 0.18, 0.32);
    this.jawMesh = new THREE.Mesh(jawGeo, darkVeinMaterial);
    this.jawMesh.position.set(0, -0.22, 0.08);
    this.headMesh.add(this.jawMesh);

    // Terrifying Razor Fangs (Top and bottom jagged bone needle teeth)
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xeadbc8, roughness: 0.4 });
    for (let t = 0; t < 6; t++) {
      // Lower jaw teeth
      const lowerToothGeo = new THREE.ConeGeometry(0.016, 0.11, 4);
      const lowerTooth = new THREE.Mesh(lowerToothGeo, toothMat);
      lowerTooth.position.set((t - 2.5) * 0.045, 0.09, 0.12 - (t % 2) * 0.02);
      this.jawMesh.add(lowerTooth);

      // Upper skull fangs pointing down
      const upperToothGeo = new THREE.ConeGeometry(0.02, 0.14, 4);
      const upperTooth = new THREE.Mesh(upperToothGeo, toothMat);
      upperTooth.position.set((t - 2.5) * 0.048, -0.15, 0.19);
      upperTooth.rotation.x = Math.PI;
      this.headMesh.add(upperTooth);
    }

    // 3. Glowing Eyes (Deep sunken hollows)
    const eyeSocketMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const socketGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 8);
    const leftSocket = new THREE.Mesh(socketGeo, eyeSocketMat);
    leftSocket.rotation.x = Math.PI / 2;
    leftSocket.position.set(-0.11, 0.08, 0.22);
    this.headMesh.add(leftSocket);
    const rightSocket = new THREE.Mesh(socketGeo, eyeSocketMat);
    rightSocket.rotation.x = Math.PI / 2;
    rightSocket.position.set(0.11, 0.08, 0.22);
    this.headMesh.add(rightSocket);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);

    this.leftEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    this.leftEyeMesh.position.set(-0.11, 0.08, 0.24);
    this.headMesh.add(this.leftEyeMesh);

    this.rightEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    this.rightEyeMesh.position.set(0.11, 0.08, 0.24);
    this.headMesh.add(this.rightEyeMesh);

    this.leftEye = new THREE.PointLight(0x7dd3fc, 0.8, 4);
    this.leftEye.position.copy(this.leftEyeMesh.position);
    this.headMesh.add(this.leftEye);

    this.rightEye = new THREE.PointLight(0x7dd3fc, 0.8, 4);
    this.rightEye.position.copy(this.rightEyeMesh.position);
    this.headMesh.add(this.rightEye);

    // 4. Arms (Spindly, elongated with claws)
    this.leftArmGroup = this.createArm(skinMaterial, darkVeinMaterial, true);
    this.leftArmGroup.position.set(-0.43, 2.45, 0.12);
    this.group.add(this.leftArmGroup);

    this.rightArmGroup = this.createArm(skinMaterial, darkVeinMaterial, false);
    this.rightArmGroup.position.set(0.43, 2.45, 0.12);
    this.group.add(this.rightArmGroup);

    // 5. Legs (Jointed backwards / digitigrade eerie stalk)
    this.leftLegGroup = this.createLeg(skinMaterial, true);
    this.leftLegGroup.position.set(-0.2, 1.15, 0);
    this.group.add(this.leftLegGroup);

    this.rightLegGroup = this.createLeg(skinMaterial, false);
    this.rightLegGroup.position.set(0.2, 1.15, 0);
    this.group.add(this.rightLegGroup);
  }

  private createArm(mat: THREE.Material, clawMat: THREE.Material, isLeft: boolean): THREE.Group {
    const arm = new THREE.Group();
    // Upper arm
    const upperGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.8, 6);
    const upper = new THREE.Mesh(upperGeo, mat);
    upper.position.y = -0.4;
    upper.castShadow = true;
    arm.add(upper);

    // Forearm
    const foreGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.9, 6);
    const fore = new THREE.Mesh(foreGeo, mat);
    fore.position.set(0, -0.85, 0.1);
    fore.rotation.x = 0.25;
    fore.castShadow = true;
    arm.add(fore);

    // Claws
    for (let c = 0; c < 4; c++) {
      const clawGeo = new THREE.ConeGeometry(0.02, 0.22, 4);
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.set((c - 1.5) * 0.04, -1.35, 0.2 + (c % 2) * 0.03);
      claw.rotation.x = 0.4;
      arm.add(claw);
    }
    return arm;
  }

  private createLeg(mat: THREE.Material, isLeft: boolean): THREE.Group {
    const leg = new THREE.Group();
    // Thigh
    const thighGeo = new THREE.CylinderGeometry(0.1, 0.07, 0.82, 6);
    const thigh = new THREE.Mesh(thighGeo, mat);
    thigh.position.y = -0.41;
    thigh.castShadow = true;
    leg.add(thigh);

    // Shin (elongated)
    const shinGeo = new THREE.CylinderGeometry(0.07, 0.05, 1.0, 6);
    const shin = new THREE.Mesh(shinGeo, mat);
    shin.position.set(0, -0.9, -0.08);
    shin.rotation.x = -0.3;
    shin.castShadow = true;
    leg.add(shin);

    // Foot / Talons
    const footGeo = new THREE.BoxGeometry(0.12, 0.05, 0.28);
    const foot = new THREE.Mesh(footGeo, mat);
    foot.position.set(0, -1.38, 0.05);
    leg.add(foot);

    return leg;
  }

  // Update logic: AI state, detection, movement, and animations
  public update(
    delta: number,
    playerPos: THREE.Vector3,
    playerRunning: boolean,
    playerCrouching: boolean,
    flashlightOn: boolean,
    flashlightPos: THREE.Vector3,
    walls: WallBox[],
    isPlayerHiding: boolean = false,
    activeFlarePos: THREE.Vector3 | null = null,
    cameraForward?: THREE.Vector3,
    isHoldingBreath: boolean = false,
    windDir?: THREE.Vector3
  ): { jumpscareTriggered: boolean; distanceToPlayer: number; hearingLevel: number; hearingColor: 'red' | 'yellow' | 'green' } {
    if (this.state === 'DORMANT') {
      this.group.visible = false;
      return { jumpscareTriggered: false, distanceToPlayer: 999, hearingLevel: 0, hearingColor: 'green' };
    }

    this.animTimer += delta;
    this.audioTimer += delta;
    this.twitchTimer += delta;
    this.hissCooldown -= delta;

    const horizontalDist = Math.hypot(this.position.x - playerPos.x, this.position.z - playerPos.z);
    const verticalDist = Math.abs(this.position.y - playerPos.y);
    const distanceToPlayer = Math.hypot(horizontalDist, verticalDist);

    // Line of sight is retained only for chase timeout; the creature cannot acquire a quiet player by sight.
    const hasLineOfSight = this.checkLineOfSight(playerPos, walls);

    // Check proximity to active flare (creature fears bright chemical magnesium flare!)
    if (activeFlarePos && this.position.distanceTo(activeFlarePos) < 9.0) {
      // Flee away from flare
      const awayDir = new THREE.Vector3().subVectors(this.position, activeFlarePos).normalize();
      this.targetPosition.copy(this.position.clone().add(awayDir.multiplyScalar(12)));
      this.state = 'INVESTIGATE';
      this.chaseTimer = 0;
    }

    // The creature is blind and cannot track a quiet player by scent.
    let canScentPlayer = false;

    // Realistic sound detection radius:
    // Sprinting = 24m, walking = 11m, stealth crouching = 4.2m, hiding = 0m
    // Holding breath suppresses audible breathing and panting sounds:
    const soundRadius = isPlayerHiding
      ? 0
      : isHoldingBreath
      ? playerRunning
        ? 15.0
        : playerCrouching
        ? 1.2
        : 4.2
      : playerRunning
      ? 24
      : playerCrouching
      ? 4.2
      : 11;
    const canHearPlayer = distanceToPlayer < soundRadius;
    const proximityFactor = soundRadius > 0 ? Math.max(0, 1 - distanceToPlayer / soundRadius) : 0;
    const movementNoise = playerRunning ? 1.0 : playerCrouching ? 0.3 : 0.62;
    const hearingLevel = Math.round(Math.min(1, movementNoise * (0.35 + proximityFactor * 0.65)) * 100);
    const hearingColor = playerRunning ? 'red' : proximityFactor > 0.55 ? 'yellow' : playerCrouching ? 'green' : 'yellow';

    // The flashlight cannot reveal a player to a blind creature.
    let isLitByFlashlight = false;
    let isStaredAtByBeam = false;

    // When high-beam flashlight directly strikes creature's eyes:
    // Reflective tapetum lucidum flares up, creature recoils with wet predatory hiss
    if (isStaredAtByBeam && distanceToPlayer < 18 && hasLineOfSight) {
      this.leftEye.intensity = 4.5;
      this.rightEye.intensity = 4.5;
      if (this.hissCooldown <= 0) {
        this.hissCooldown = 4.5;
        horrorAudio.playPredatorHiss(distanceToPlayer);
      }
    }

    // STATE MACHINE TRANSITIONS
    if (this.state === 'PATROL' || this.state === 'INVESTIGATE' || this.state === 'STALK') {
      if (!isPlayerHiding && canHearPlayer) {
        // TRANSITION TO CHASE!
        this.state = 'CHASE';
        this.chaseTimer = 8.5; // persist chase
        horrorAudio.playMonsterRoar(distanceToPlayer);
        if (distanceToPlayer < 12) {
          horrorAudio.playMonsterShriek(distanceToPlayer);
        }
      } else if (canHearPlayer) {
        this.state = 'INVESTIGATE';
        this.targetPosition.copy(playerPos);
        if (Math.random() < 0.6) {
          horrorAudio.playMonsterClicks(distanceToPlayer);
        }
      } else if (canScentPlayer && this.state === 'PATROL') {
        // Creature caught human scent riding the mountain wind!
        this.state = 'INVESTIGATE';
        this.targetPosition.copy(playerPos);
        horrorAudio.playMonsterSnarl(distanceToPlayer);
      } else if (distanceToPlayer < 18 && !flashlightOn && this.state === 'PATROL') {
        this.state = 'STALK';
        this.targetPosition.copy(playerPos);
        horrorAudio.playMonsterClicks(distanceToPlayer);
      }
    } else if (this.state === 'CHASE') {
      this.chaseTimer -= delta;
      if (isPlayerHiding) {
        this.chaseTimer -= delta * 2; // lost line of sight into hiding spot
      } else {
        this.targetPosition.copy(playerPos);
      }

      // If player managed to break line of sight and timer expires, revert to investigate
      if (!hasLineOfSight && this.chaseTimer <= 0) {
        this.state = 'INVESTIGATE';
        horrorAudio.playMonsterGrowl(distanceToPlayer);
      }
    }

    // Periodic monster audio cues in forest
    this.vocalTimer += delta;
    this.twigTimer += delta;

    if (this.state === 'CHASE') {
      if (this.vocalTimer > 2.6 && distanceToPlayer < 24) {
        this.vocalTimer = 0;
        const r = Math.random();
        if (distanceToPlayer < 7.0 && r < 0.45) {
          horrorAudio.playMonsterSnarl(distanceToPlayer);
        } else if (r < 0.55) {
          horrorAudio.playMonsterRoar(distanceToPlayer);
        } else if (r < 0.8) {
          horrorAudio.playMonsterShriek(distanceToPlayer);
        } else {
          horrorAudio.playMonsterHeavyBreathing(distanceToPlayer);
        }
      }
    } else if (this.state === 'STALK') {
      if (this.vocalTimer > 4.0 && distanceToPlayer < 20) {
        this.vocalTimer = 0;
        const r = Math.random();
        if (r < 0.4) {
          horrorAudio.playMonsterClicks(distanceToPlayer);
        } else if (r < 0.7) {
          horrorAudio.playDistortedWhispers(distanceToPlayer);
        } else {
          horrorAudio.playMonsterGrowl(distanceToPlayer);
        }
      }
    } else {
      // PATROL / INVESTIGATE
      if (this.vocalTimer > 5.0 && distanceToPlayer < 20) {
        this.vocalTimer = 0;
        const r = Math.random();
        if (r < 0.35) {
          horrorAudio.playMonsterGrowl(distanceToPlayer);
        } else if (r < 0.65) {
          horrorAudio.playMonsterHeavyBreathing(distanceToPlayer);
        } else if (r < 0.85) {
          horrorAudio.playMonsterClicks(distanceToPlayer);
        } else {
          horrorAudio.playMonsterClawScrape(distanceToPlayer);
        }
      }
      if (this.twigTimer > 6.0 && distanceToPlayer < 26) {
        this.twigTimer = 0;
        if (Math.random() < 0.6) {
          horrorAudio.playTwigSnap(distanceToPlayer);
        }
      }
    }

    // SPEED AND VISUALS BASED ON STATE
    if (this.state === 'CHASE') {
      this.speed = 3.65; // fast erratic pursuit!
      // Red burning eyes
      (this.leftEyeMesh.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
      (this.rightEyeMesh.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
      this.leftEye.color.setHex(0xef4444);
      this.rightEye.color.setHex(0xef4444);
      this.leftEye.intensity = 2.5;
      this.rightEye.intensity = 2.5;
      this.jawMesh.position.y = -0.32; // unhinged jaw!
    } else if (this.state === 'STALK') {
      this.speed = 1.3;
      // Dim ghostly white/blue
      (this.leftEyeMesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
      (this.rightEyeMesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
      this.leftEye.color.setHex(0x38bdf8);
      this.rightEye.color.setHex(0x38bdf8);
      this.leftEye.intensity = 0.6;
      this.rightEye.intensity = 0.6;
      this.jawMesh.position.y = -0.22;
    } else {
      // PATROL / INVESTIGATE
      this.speed = 1.7;
      (this.leftEyeMesh.material as THREE.MeshBasicMaterial).color.setHex(0x94a3b8);
      (this.rightEyeMesh.material as THREE.MeshBasicMaterial).color.setHex(0x94a3b8);
      this.leftEye.color.setHex(0x94a3b8);
      this.rightEye.color.setHex(0x94a3b8);
      this.leftEye.intensity = 0.4;
      this.rightEye.intensity = 0.4;
      this.jawMesh.position.y = -0.22;

      // Waypoint cycle in patrol
      if (this.position.distanceTo(this.targetPosition) < 1.5) {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
        this.targetPosition.copy(this.waypoints[this.currentWaypointIndex]);
      }
    }


    // MOVEMENT & ROTATION
    const moveDir = new THREE.Vector3().subVectors(this.targetPosition, this.position);
    moveDir.y = 0;
    const distToTarget = moveDir.length();

    if (distToTarget > 0.3) {
      moveDir.normalize();

      // Face towards target
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, delta * 6);

      // Desired next position with robust sliding collision resolution
      const moveStep = moveDir.clone().multiplyScalar(this.speed * delta);
      this.position.add(moveStep);
      this.resolveCollisions(this.position, walls, 0.55);
      this.group.position.copy(this.position);

      // Footstep sound when near player
      if (Math.sin(this.animTimer * (this.state === 'CHASE' ? 14 : 7)) > 0.95 && distanceToPlayer < 18) {
        horrorAudio.playMonsterStep(distanceToPlayer);
      }
    }

    // PROCEDURAL GAIT & TWITCH ANIMATION
    const walkCycle = Math.sin(this.animTimer * (this.state === 'CHASE' ? 12 : 6));
    this.leftLegGroup.rotation.x = walkCycle * 0.45;
    this.rightLegGroup.rotation.x = -walkCycle * 0.45;

    // Reach arms forward menacingly when chasing
    const armRaise = this.state === 'CHASE' ? 1.1 : 0.2;
    this.leftArmGroup.rotation.x = Math.PI * armRaise + walkCycle * 0.2;
    this.rightArmGroup.rotation.x = Math.PI * armRaise - walkCycle * 0.2;

    // Erratic head twitching
    if (this.twitchTimer > 2.5) {
      this.isTwitching = true;
      if (this.twitchTimer > 2.8) {
        this.isTwitching = false;
        this.twitchTimer = 0;
      }
    }
    if (this.isTwitching) {
      this.headMesh.rotation.z = (Math.random() - 0.5) * 0.6;
      this.headMesh.rotation.y = (Math.random() - 0.5) * 0.5;
    } else {
      this.headMesh.rotation.z = 0;
      this.headMesh.rotation.y = 0;
    }

    // CHECK FOR JUMPSCARE / CATCH PLAYER (Safe if hiding in locker/blind)
    // Monster stands 2.8m tall with long outstretched reach. Horizontal catch radius: 2.2m, vertical: 2.8m
    const jumpscareTriggered = !isPlayerHiding && horizontalDist < 2.2 && verticalDist < 2.8;

    return { jumpscareTriggered, distanceToPlayer, hearingLevel, hearingColor };
  }

  // Audio lure from thrown distraction bottle
  public distractToLocation(loc: THREE.Vector3) {
    this.targetPosition.copy(loc);
    this.state = 'INVESTIGATE';
    this.chaseTimer = 5.0;
  }

  // Simple Ray-box line-of-sight test to see if a solid wall blocks view
  private checkLineOfSight(playerPos: THREE.Vector3, walls: WallBox[]): boolean {
    const x0 = this.position.x;
    const z0 = this.position.z;
    const x1 = playerPos.x;
    const z1 = playerPos.z;

    for (const w of walls) {
      // Check if line segment intersects box
      if (this.lineIntersectsBox(x0, z0, x1, z1, w.minX, w.maxX, w.minZ, w.maxZ)) {
        return false;
      }
    }
    return true;
  }

  private lineIntersectsBox(
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number
  ): boolean {
    // 2D segment - AABB intersection test
    const dx = x2 - x1;
    const dz = z2 - z1;

    let tmin = 0;
    let tmax = 1;

    // X slab
    if (Math.abs(dx) > 0.0001) {
      let t1 = (minX - x1) / dx;
      let t2 = (maxX - x1) / dx;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    } else {
      if (x1 < minX || x1 > maxX) return false;
    }

    // Z slab
    if (Math.abs(dz) > 0.0001) {
      let t1 = (minZ - z1) / dz;
      let t2 = (maxZ - z1) / dz;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    } else {
      if (z1 < minZ || z1 > maxZ) return false;
    }

    return true;
  }

  private resolveCollisions(pos: THREE.Vector3, walls: WallBox[], radius = 0.55): void {
    const WORLD_LIMIT = 78.0;
    pos.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, pos.x));
    pos.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, pos.z));

    for (let it = 0; it < 2; it++) {
      for (const w of walls) {
        if (w.height <= 0.5) continue;
        const minX = w.minX - radius;
        const maxX = w.maxX + radius;
        const minZ = w.minZ - radius;
        const maxZ = w.maxZ + radius;

        if (pos.x <= minX || pos.x >= maxX || pos.z <= minZ || pos.z >= maxZ) {
          continue;
        }

        const closestX = Math.max(w.minX, Math.min(pos.x, w.maxX));
        const closestZ = Math.max(w.minZ, Math.min(pos.z, w.maxZ));
        const dx = pos.x - closestX;
        const dz = pos.z - closestZ;
        const distanceSq = dx * dx + dz * dz;

        if (distanceSq > 0.00001 && distanceSq < radius * radius) {
          const distance = Math.sqrt(distanceSq);
          const overlap = radius - distance;
          pos.x += (dx / distance) * overlap;
          pos.z += (dz / distance) * overlap;
        } else if (distanceSq <= 0.00001) {
          const pushLeft = pos.x - minX;
          const pushRight = maxX - pos.x;
          const pushBottom = pos.z - minZ;
          const pushTop = maxZ - pos.z;
          const minPush = Math.min(pushLeft, pushRight, pushBottom, pushTop);
          if (minPush === pushLeft) pos.x = minX;
          else if (minPush === pushRight) pos.x = maxX;
          else if (minPush === pushBottom) pos.z = minZ;
          else pos.z = maxZ;
        }
      }
      pos.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, pos.x));
      pos.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, pos.z));
    }
  }

  private checkWallCollision(x: number, z: number, walls: WallBox[], radius = 0.5): boolean {
    for (const w of walls) {
      if (w.height <= 0.5) continue;
      const closestX = Math.max(w.minX, Math.min(x, w.maxX));
      const closestZ = Math.max(w.minZ, Math.min(z, w.maxZ));
      const dx = x - closestX;
      const dz = z - closestZ;
      if (dx * dx + dz * dz < radius * radius) {
        return true;
      }
    }
    return false;
  }

  public awaken(spawnPos = new THREE.Vector3(26, 0, 20)) {
    this.position.copy(spawnPos);
    this.group.position.copy(this.position);
    this.group.visible = true;
    this.state = 'PATROL';
    this.currentWaypointIndex = 6; // Near Generator Power Grid
    this.targetPosition.copy(this.waypoints[6]);
    horrorAudio.playMonsterRoar(35);
  }

  public enrage(targetPos?: THREE.Vector3) {
    this.group.visible = true;
    this.state = 'CHASE';
    this.chaseTimer = 45.0; // Long-duration relentless endgame hunt
    this.speed = 3.85;
    if (targetPos) {
      this.targetPosition.copy(targetPos);
    }
  }

  public reset(dormant = true) {
    if (dormant) {
      this.state = 'DORMANT';
      this.group.visible = false;
      this.position.set(0, -100, 20);
      this.group.position.copy(this.position);
    } else {
      this.state = 'PATROL';
      this.group.visible = true;
      this.position.set(26, 0, 20);
      this.targetPosition.copy(this.waypoints[6]);
      this.group.position.copy(this.position);
    }
    this.currentWaypointIndex = 6;
    this.chaseTimer = 0;
    this.vocalTimer = 0;
    this.twigTimer = 0;
  }
}
