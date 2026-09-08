import * as THREE from 'three';
import { LoreNote } from '../types';

export interface WallBox {
  id?: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
}

export interface InteractableItem {
  id: string;
  type:
    | 'fuse' // Used as Spark Plug / Generator Part
    | 'battery'
    | 'keycard' // Used as Ranger Key
    | 'note'
    | 'fusebox' // Used as Generator Power Console
    | 'exit_door' // Used as Forestry Perimeter Gate
    | 'substation_door' // Used as Ranger Station Door
    | 'locker' // Used as Wooden Hunting Blind / Outhouse
    | 'bottle'
    | 'flare'
    | 'cctv' // Used as Wildlife Trail Camera Terminal
    | 'radio' // Used as Ham Radio Transceiver Station
    | 'radio_tube' // Vacuum Tube for Ranger Ham Radio
    | 'fuel_can' // 5-Gallon Heavy Diesel Canister
    | 'map'
    | 'truck_hood'; // Abandoned pickup engine bay
  position: THREE.Vector3;
  label: string;
  loreNote?: LoreNote;
  collected?: boolean;
}

export const LORE_NOTES: Record<string, LoreNote> = {
  note_start: {
    id: 'note_start',
    title: 'Ranger Shaw - Field Log #04',
    date: 'OCTOBER 19, 09:15 PM',
    author: 'Chief Ranger Shaw',
    body: `If anyone finds this truck, turn back immediately.
Something came down from the high ridges when the fog rolled in. It moves between the pines faster than a deer, and it has antlers like crown bone.
It reacts violently to heavy footfalls—if you run, it will hear you through the trees.

The South Perimeter Road Gate is sealed shut without power. The emergency diesel generator in the East Woods needs 3 heavy-duty spark plugs AND a full canister of diesel fuel.
I locked the cabin door; the Ranger Key is hidden near the abandoned pickup truck. God protect us.`,
  },
  note_campsite: {
    id: 'note_campsite',
    title: 'Torn Camper Journal',
    date: 'OCTOBER 17, 02:40 AM',
    author: 'Lost Hiker',
    body: `It has been circling our campsite for two hours.
We heard branches snapping, then we saw its eyes reflecting in our flashlight beam—tall, gaunt, towering between two birch trees.
Marcus tried to throw a glass bottle to distract it, and it dashed toward the sound.
I left the spare generator plug here under the tent tarp. If you get cornered, burn a magnesium flare—it recoils from intense light!`,
  },
  note_monoliths: {
    id: 'note_monoliths',
    title: 'Scratched Bark Rubbing',
    date: 'UNKNOWN',
    author: 'Local Historian',
    body: `THE WOODS REMEMBER.
THEY WORSHIPED THE HORNED STALKER AT THE STONE CIRCLE.
DO NOT LINGER IN THE MIST.
SEEK REFUGE INSIDE THE WOODEN HUNTING BLINDS.
WHEN THE FOG THICKENS, CROUCH LOW.`,
  },
  note_generator: {
    id: 'note_generator',
    title: 'Generator Maintenance Notice',
    date: 'OCTOBER 14',
    author: 'Forestry Maintenance',
    body: `Notice to all park rangers:
All 3 spark plugs were removed during seasonal overhaul:
- Plug #1 was stored by the North Campsite tent.
- Plug #2 was left near the Ancient Stone Monoliths.
- Plug #3 is on the workbench in the Old Logging Shed.

CRITICAL: The fuel line was drained! You MUST retrieve the yellow 5-gallon Diesel Canister from the Old Logging Camp fuel depot before priming the starter cord!`,
  },
  note_radio: {
    id: 'note_radio',
    title: 'Emergency Ham Radio Log',
    date: 'OCTOBER 19, 11:00 PM',
    author: 'Forestry Dispatch',
    body: `EMERGENCY DISPATCH PROTOCOL:
The main transmitter blew its 6L6 amplifier vacuum tube during the electrical storm.
A replacement vacuum tube is kept in the cabin desk drawer.
Once the tube is slotted, transmit on 144.200 MHz to establish contact with county emergency services.`,
  },
};

// Dynamic doors and gates that change collision state
export const DYNAMIC_WALL_CABIN_DOOR: WallBox = {
  id: 'door_substation',
  minX: 13.5,
  maxX: 14.5,
  minZ: -21.0,
  maxZ: -18.0,
  height: 3.8,
};

export const DYNAMIC_WALL_EXIT_GATE: WallBox = {
  id: 'door_exit_gate',
  minX: -6.0,
  maxX: 6.0,
  minZ: 47.5,
  maxZ: 49.5,
  height: 4.5,
};

export function getFacilityLayout() {
  // Physical collision boxes for natural obstacles, trees, boulders, vehicles, and structures
  // Perimeter walls keep the forest contained while the centered south opening remains the escape route.
  const collisionWalls: WallBox[] = [
    { id: 'perimeter_north', minX: -60, maxX: 60, minZ: -60, maxZ: -58, height: 3.8 },
    { id: 'perimeter_west', minX: -60, maxX: -58, minZ: -60, maxZ: 60, height: 3.8 },
    { id: 'perimeter_east', minX: 58, maxX: 60, minZ: -60, maxZ: 60, height: 3.8 },
    { id: 'perimeter_south_west', minX: -60, maxX: -6.5, minZ: 47.5, maxZ: 49.5, height: 3.8 },
    { id: 'perimeter_south_east', minX: 6.5, maxX: 60, minZ: 47.5, maxZ: 49.5, height: 3.8 },
    // Abandoned Ranger Station Log Cabin (x: 14 to 30, z: -28 to -12) with spacious doorway
    { id: 'cabin_n', minX: 14, maxX: 30, minZ: -28.5, maxZ: -27.5, height: 3.8 }, // North cabin wall
    { id: 'cabin_s', minX: 14, maxX: 30, minZ: -12.5, maxZ: -11.5, height: 3.8 }, // South cabin wall
    { id: 'cabin_e', minX: 29.5, maxX: 30.5, minZ: -28.5, maxZ: -11.5, height: 3.8 }, // East cabin wall
    { id: 'cabin_w_n', minX: 13.5, maxX: 14.5, minZ: -28.5, maxZ: -21.0, height: 3.8 }, // West cabin wall (north wing)
    { id: 'cabin_w_s', minX: 13.5, maxX: 14.5, minZ: -18.0, maxZ: -11.5, height: 3.8 }, // West cabin wall (south wing)
    { id: 'cabin_desk', minX: 18.5, maxX: 21.5, minZ: -25.5, maxZ: -23.5, height: 1.2 }, // Ranger desk inside

    // Old Logging Camp Open Shelter & Workbench (x: -36 to -20, z: 18 to 32)
    { id: 'shack_post_nw', minX: -35.5, maxX: -34.5, minZ: 18.5, maxZ: 19.5, height: 3.6 },
    { id: 'shack_post_ne', minX: -21.5, maxX: -20.5, minZ: 18.5, maxZ: 19.5, height: 3.6 },
    { id: 'shack_post_sw', minX: -35.5, maxX: -34.5, minZ: 30.5, maxZ: 31.5, height: 3.6 },
    { id: 'shack_post_se', minX: -21.5, maxX: -20.5, minZ: 30.5, maxZ: 31.5, height: 3.6 },
    { id: 'shack_timber_wall', minX: -35.5, maxX: -34.5, minZ: 20.0, maxZ: 30.0, height: 3.2 }, // Back windbreak wall
    { id: 'shack_bench', minX: -30.0, maxX: -25.0, minZ: 24.0, maxZ: 26.0, height: 1.2 }, // Logging workbench inside

    // Generator Power Station (x: 20 to 32, z: 16 to 28)
    { id: 'generator_console', minX: 24.5, maxX: 27.5, minZ: 20.5, maxZ: 23.5, height: 2.2 }, // Diesel Console
    { id: 'generator_tank', minX: 28.5, maxX: 31.0, minZ: 18.0, maxZ: 22.0, height: 2.6 }, // Fuel Storage Tank

    // Abandoned Pickup Truck at Trailhead (centered at -1, -26)
    { id: 'truck', minX: -2.4, maxX: 0.4, minZ: -28.6, maxZ: -23.4, height: 2.2 },

    // Abandoned Campsite Tent & Fire Ring
    { id: 'tent', minX: -28.5, maxX: -24.5, minZ: -6.0, maxZ: -1.5, height: 2.3 },
    { id: 'tent_2', minX: -33.0, maxX: -29.0, minZ: -7.0, maxZ: -2.5, height: 2.3 },
    { id: 'campfire', minX: -26.5, maxX: -24.5, minZ: -8.5, maxZ: -6.5, height: 0.8 },

    // Ancient Stone Monoliths (Standing Megaliths + Central Altar at -24, -32)
    { id: 'monolith_0', minX: -19.5, maxX: -18.0, minZ: -32.8, maxZ: -31.2, height: 5.0 },
    { id: 'monolith_1', minX: -22.5, maxX: -21.0, minZ: -26.8, maxZ: -25.2, height: 5.0 },
    { id: 'monolith_2', minX: -28.8, maxX: -27.2, minZ: -27.8, maxZ: -26.2, height: 5.0 },
    { id: 'monolith_3', minX: -29.8, maxX: -28.2, minZ: -35.8, maxZ: -34.2, height: 5.0 },
    { id: 'monolith_4', minX: -22.5, maxX: -21.0, minZ: -37.8, maxZ: -36.2, height: 5.0 },
    { id: 'altar', minX: -25.5, maxX: -22.5, minZ: -33.5, maxZ: -30.5, height: 1.1 },

    // Lookout Bluff Wooden Watchtower Base (x: 34 to 42, z: -8 to 0)
    { id: 'tower_leg_nw', minX: 34.5, maxX: 35.5, minZ: -7.5, maxZ: -6.5, height: 6.0 },
    { id: 'tower_leg_ne', minX: 40.5, maxX: 41.5, minZ: -7.5, maxZ: -6.5, height: 6.0 },
    { id: 'tower_leg_sw', minX: 34.5, maxX: 35.5, minZ: -1.5, maxZ: -0.5, height: 6.0 },
    { id: 'tower_leg_se', minX: 40.5, maxX: 41.5, minZ: -1.5, maxZ: -0.5, height: 6.0 },

    // Massive Forest Boulders scattered across exploration paths
    { id: 'boulder_1', minX: -14.9, maxX: -12.5, minZ: -10.9, maxZ: -8.5, height: 1.8 },
    { id: 'boulder_2', minX: -21.1, maxX: -18.5, minZ: -18.1, maxZ: -15.5, height: 2.0 },
    { id: 'boulder_3', minX: -12.8, maxX: -10.5, minZ: -4.8, maxZ: -2.5, height: 1.6 },
    { id: 'boulder_4', minX: 8.5, maxX: 11.5, minZ: -6.0, maxZ: -3.0, height: 1.9 },
    { id: 'boulder_5', minX: -11.0, maxX: -8.5, minZ: 9.0, maxZ: 11.5, height: 1.8 },
    { id: 'boulder_6', minX: 9.1, maxX: 11.5, minZ: 5.1, maxZ: 7.5, height: 1.6 },
    { id: 'boulder_7', minX: -10.1, maxX: -7.5, minZ: 24.0, maxZ: 26.5, height: 2.0 },
    { id: 'boulder_8', minX: 7.0, maxX: 9.5, minZ: 22.0, maxZ: 24.5, height: 1.8 },
    { id: 'boulder_9', minX: -42.0, maxX: -39.0, minZ: 4.0, maxZ: 7.0, height: 2.4 },
    { id: 'boulder_10', minX: 38.0, maxX: 41.0, minZ: 18.0, maxZ: 21.0, height: 2.2 },

    // Wooden Hunting Blinds / Outhouses (Safe hiding shelters)
    { id: 'locker_trailhead', minX: -8.8, maxX: -7.2, minZ: -22.8, maxZ: -21.2, height: 2.8 },
    { id: 'locker_campsite', minX: -36.8, maxX: -35.2, minZ: -6.8, maxZ: -5.2, height: 2.8 },
    { id: 'locker_cabin', minX: 27.2, maxX: 28.8, minZ: -14.8, maxZ: -13.2, height: 2.8 },
    { id: 'locker_logging', minX: -33.8, maxX: -32.2, minZ: 31.2, maxZ: 32.8, height: 2.8 },
    { id: 'locker_lookout', minX: 36.2, maxX: 37.8, minZ: 1.2, maxZ: 2.8, height: 2.8 },

    // South Highway Gate Pillars (Chokepoint for the escape gate)
    { id: 'pillar_w', minX: -16, maxX: -6.0, minZ: 47, maxZ: 49, height: 4.5 },
    { id: 'pillar_e', minX: 6.0, maxX: 16, minZ: 47, maxZ: 49, height: 4.5 },
  ];

  // Interactive items and landmarks distributed throughout the expanded state park
  const items: InteractableItem[] = [
    // 1. Trailhead Starting Note (On truck hood)
    {
      id: 'note_start',
      type: 'note',
      position: new THREE.Vector3(-1, 1.95, -26),
      label: 'Read Ranger Shaw Log #04 [E]',
      loreNote: LORE_NOTES.note_start,
    },
    // 2. Campsite Note (At tent entrance)
    {
      id: 'note_campsite',
      type: 'note',
      position: new THREE.Vector3(-25, 0.02, -4),
      label: 'Read Torn Camper Journal [E]',
      loreNote: LORE_NOTES.note_campsite,
    },
    // 3. Ancient Monoliths Note (Carved on stone altar)
    {
      id: 'note_monoliths',
      type: 'note',
      position: new THREE.Vector3(-24, 0.68, -32),
      label: 'Inspect Stone Carving [E]',
      loreNote: LORE_NOTES.note_monoliths,
    },
    // 4. Generator Shed Note
    {
      id: 'note_generator',
      type: 'note',
      position: new THREE.Vector3(23, 0.28, 22),
      label: 'Read Generator Notice [E]',
      loreNote: LORE_NOTES.note_generator,
    },

    // Hood control mounted on the pickup grille; the key remains inside the engine bay.
    {
      id: 'truck_hood',
      type: 'truck_hood',
      position: new THREE.Vector3(-1, 0.78, -28.76),
      label: 'Open Pickup Hood [E]',
    },
    {
      id: 'item_keycard',
      type: 'keycard',
      position: new THREE.Vector3(-1, 1.18, -27.8),
      label: 'Take Ranger Cabin Key from Engine Bay [E]',
    },

    // National Park Trail Map (On bulletin signboard at trailhead)
    {
      id: 'item_map',
      type: 'map',
      position: new THREE.Vector3(20.5, 0.82, -24.0),
      label: 'Take Blackwood Pines Trail Map [E]',
    },

    // Spark Plug 1 (At the abandoned campsite near the green tent)
    {
      id: 'item_fuse_1',
      type: 'fuse',
      position: new THREE.Vector3(-27, 0.02, -3),
      label: 'Take Generator Spark Plug [1/3] [E]',
    },

    // Spark Plug 2 (At Ancient Stone Monoliths altar)
    {
      id: 'item_fuse_2',
      type: 'fuse',
      position: new THREE.Vector3(-24, 0.68, -32),
      label: 'Take Generator Spark Plug [2/3] [E]',
    },

    // Spark Plug 3 (Inside Old Logging Camp workbench)
    {
      id: 'item_fuse_3',
      type: 'fuse',
      position: new THREE.Vector3(-28, 1.05, 25),
      label: 'Take Generator Spark Plug [3/3] [E]',
    },

    // Flashlight Batteries (Found in woods & shacks)
    {
      id: 'item_battery_1',
      type: 'battery',
      position: new THREE.Vector3(-1, 1.22, -27.8),
      label: 'Take Flashlight Battery [E]',
    },
    {
      id: 'item_battery_2',
      type: 'battery',
      position: new THREE.Vector3(-23, 0.02, -5),
      label: 'Take Flashlight Battery [E]',
    },
    {
      id: 'item_battery_3',
      type: 'battery',
      position: new THREE.Vector3(22, 0.82, -24),
      label: 'Take Flashlight Battery [E]',
    },
    {
      id: 'item_battery_4',
      type: 'battery',
      position: new THREE.Vector3(-26, 1.05, 25),
      label: 'Take Flashlight Battery [E]',
    },
    {
      id: 'item_battery_5',
      type: 'battery',
      position: new THREE.Vector3(38, 0.02, -4),
      label: 'Take Flashlight Battery [E]',
    },

    // Distraction Glass Bottles (Throw with [G] to attract stalker away)
    {
      id: 'item_bottle_1',
      type: 'bottle',
      position: new THREE.Vector3(-12, 0.05, -14),
      label: 'Pick up Glass Bottle [E] (Throw with [G])',
    },
    {
      id: 'item_bottle_2',
      type: 'bottle',
      position: new THREE.Vector3(8, 0.05, -12),
      label: 'Pick up Glass Bottle [E] (Throw with [G])',
    },
    {
      id: 'item_bottle_3',
      type: 'bottle',
      position: new THREE.Vector3(-25, 0.05, 22),
      label: 'Pick up Glass Bottle [E] (Throw with [G])',
    },

    // Magnesium Flares (Ignite with [X] to blind and repel the creature)
    {
      id: 'item_flare_1',
      type: 'flare',
      position: new THREE.Vector3(-29, 0.02, -4),
      label: 'Take Emergency Magnesium Flare [E] (Ignite with [X])',
    },
    {
      id: 'item_flare_2',
      type: 'flare',
      position: new THREE.Vector3(19, 0.82, -24),
      label: 'Take Emergency Magnesium Flare [E] (Ignite with [X])',
    },
    {
      id: 'item_flare_3',
      type: 'flare',
      position: new THREE.Vector3(37, 0.02, -3),
      label: 'Take Emergency Magnesium Flare [E] (Ignite with [X])',
    },

    // Wooden Hunting Blinds / Shelters (Enter with [E] to conceal yourself and mute breath)
    {
      id: 'locker_trailhead',
      type: 'locker',
      position: new THREE.Vector3(-8, 0.0, -22),
      label: 'Hide in Wooden Hunting Blind [E]',
    },
    {
      id: 'locker_campsite',
      type: 'locker',
      position: new THREE.Vector3(-36, 0.0, -6),
      label: 'Hide in Hunting Blind [E]',
    },
    {
      id: 'locker_cabin',
      type: 'locker',
      position: new THREE.Vector3(28, 0.0, -14),
      label: 'Hide in Cabin Closet [E]',
    },
    {
      id: 'locker_logging',
      type: 'locker',
      position: new THREE.Vector3(-33, 0.0, 32),
      label: 'Hide in Timber Shed [E]',
    },
    {
      id: 'locker_lookout',
      type: 'locker',
      position: new THREE.Vector3(37, 0.0, 2),
      label: 'Hide in Lookout Blind [E]',
    },

    // Wildlife Trail Camera Console (Inside Ranger Cabin)
    {
      id: 'terminal_cctv',
      type: 'cctv',
      position: new THREE.Vector3(20, 0.82, -24),
      label: 'Access Wildlife Trail Camera Feed [E]',
    },

    // Emergency Ham Radio Station (Inside Ranger Cabin)
    {
      id: 'terminal_radio',
      type: 'radio',
      position: new THREE.Vector3(19, 0.82, -24.5),
      label: 'Emergency Ham Radio (Needs Vacuum Tube) [E]',
    },

    // Ham Radio 6L6 Glass Vacuum Tube (Inside Ranger Cabin desk drawer)
    {
      id: 'item_radio_tube',
      type: 'radio_tube',
      position: new THREE.Vector3(21, 0.82, -24.8),
      label: 'Take Ham Radio Amplifier Vacuum Tube [E]',
    },

    // Emergency Radio Manual Note (On cabin desk)
    {
      id: 'note_radio',
      type: 'note',
      position: new THREE.Vector3(20.5, 0.82, -24.0),
      label: 'Read Emergency Radio Protocol [E]',
      loreNote: LORE_NOTES.note_radio,
    },

    // Heavy 5-Gallon Diesel Fuel Canister (At Old Logging Camp Timber Shelter)
    {
      id: 'item_fuel_can',
      type: 'fuel_can',
      position: new THREE.Vector3(-31, 0.02, 28.5),
      label: 'Take Heavy 5-Gal Diesel Fuel Canister [E]',
    },

    // Ranger Station Cabin Door (Requires Ranger Key)
    {
      id: 'door_substation',
      type: 'substation_door',
      position: new THREE.Vector3(14, 1.5, -19.5),
      label: 'Ranger Station Door (Locked - Needs Ranger Key) [E]',
    },

    // Emergency Diesel Generator Console
    {
      id: 'station_fusebox',
      type: 'fusebox',
      position: new THREE.Vector3(26, 1.3, 22),
      label: 'Diesel Generator Console [E]',
    },

    // South Highway Forestry Gate
    {
      id: 'door_exit',
      type: 'exit_door',
      position: new THREE.Vector3(0, 1.8, 48.5),
      label: 'Forestry Perimeter Highway Gate [E]',
    },
  ];

  return { collisionWalls, items };
}
