
import { Box, Item, Location } from '../types';

const LOCATIONS_KEY = 'baul_locations';
const BOXES_KEY = 'baul_boxes';
const ITEMS_KEY = 'baul_items';

// Helper to simulate an ID
export const generateId = (): string => Math.random().toString(36).substr(2, 9);

// --- Locations ---
export const getLocations = (): Location[] => {
  const data = localStorage.getItem(LOCATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLocation = (loc: Location): void => {
  const locations = getLocations();
  const existingIndex = locations.findIndex(l => l.id === loc.id);
  if (existingIndex >= 0) {
    locations[existingIndex] = loc;
  } else {
    locations.push(loc);
  }
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
};

export const deleteLocation = (locId: string): void => {
  // We should prevent deleting if boxes exist, but for simple app we cascade or orphan
  const locations = getLocations().filter(l => l.id !== locId);
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  // Not strictly implementing cascade delete for boxes here, they will just show 'Unknown Location'
};

// --- Boxes ---
export const getBoxes = (): Box[] => {
  const data = localStorage.getItem(BOXES_KEY);
  const boxes: Box[] = data ? JSON.parse(data) : [];
  
  // Migration: Ensure history exists
  return boxes.map(box => ({
    ...box,
    history: box.history || [{ date: box.createdAt, type: 'CREATE', details: 'Caja registrada en sistema' }]
  }));
};

export const saveBox = (box: Box): void => {
  const boxes = getBoxes();
  const existingIndex = boxes.findIndex(b => b.id === box.id);
  if (existingIndex >= 0) {
    boxes[existingIndex] = box;
  } else {
    boxes.push(box);
  }
  localStorage.setItem(BOXES_KEY, JSON.stringify(boxes));
};

export const deleteBox = (boxId: string): void => {
  const boxes = getBoxes().filter(b => b.id !== boxId);
  localStorage.setItem(BOXES_KEY, JSON.stringify(boxes));
  // Cascade delete items
  const items = getItems().filter(i => i.boxId !== boxId);
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
};

// --- Items ---
export const getItems = (): Item[] => {
  const data = localStorage.getItem(ITEMS_KEY);
  const items: Item[] = data ? JSON.parse(data) : [];
  
  // Migration: Ensure new fields exist
  return items.map(item => ({
    ...item,
    photoUrls: item.photoUrls || (item.photoUrl ? [item.photoUrl] : []),
    history: item.history || [{ date: item.createdAt, type: 'CREATE', details: 'Item importado/creado' }]
  }));
};

export const saveItem = (item: Item): void => {
  const items = getItems();
  const existingIndex = items.findIndex(i => i.id === item.id);
  if (existingIndex >= 0) {
    items[existingIndex] = item;
  } else {
    items.push(item);
  }
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
};

export const deleteItem = (itemId: string): void => {
  const items = getItems().filter(i => i.id !== itemId);
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
};

// --- Seed Data (Dummy) ---
export const checkAndSeedData = (): boolean => {
  const existingBoxes = getBoxes();
  if (existingBoxes.length === 0) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    // Create Dummy Locations
    const locations: Location[] = [
      { id: 'loc_basement', name: 'Sótano', description: 'Zona de almacenamiento principal bajo la casa.' },
      { id: 'loc_office', name: 'Oficina', description: 'Armarios y estanterías del despacho.' },
      { id: 'loc_garage', name: 'Garage', description: 'Zona de trabajo y banco de herramientas.' }
    ];
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));

    // Create Dummy Boxes linked to Locations
    const boxes: Box[] = [
      { 
        id: 'box_alpha', 
        locationId: 'loc_basement',
        code: 'SEC-A01', 
        name: 'Hardware Legacy', 
        location: 'Sótano', // Keep for backward comp fallback
        description: 'Componentes antiguos de PC, cables propietarios y adaptadores.', 
        createdAt: now - (day * 30),
        history: [
            { date: now - (day * 30), type: 'CREATE', details: 'Caja registrada' },
            { date: now - (day * 5), type: 'MOVE', details: 'Traslado desde Oficina a Sótano' }
        ]
      },
      { 
        id: 'box_beta', 
        locationId: 'loc_office',
        code: 'SEC-B02', 
        name: 'Periféricos VR', 
        location: 'Oficina', 
        description: 'Equipamiento de realidad virtual, sensores base y mandos.', 
        createdAt: now,
        history: [{ date: now, type: 'CREATE', details: 'Caja registrada' }]
      },
      { 
        id: 'box_gamma', 
        locationId: 'loc_garage',
        code: 'SEC-C03', 
        name: 'Drones & RC', 
        location: 'Garage', 
        description: 'Repuestos de drones, hélices y baterías LiPo.', 
        createdAt: now,
        history: [{ date: now, type: 'CREATE', details: 'Caja registrada' }]
      }
    ];

    // Create Dummy Items
    const items: Item[] = [
      { 
        id: 'item_1', 
        boxId: 'box_alpha', 
        name: 'NVIDIA GTX 1080 Ti', 
        description: 'GPU edición fundadores, en caja original. Funcional.', 
        tags: ['gpu', 'nvidia', 'hardware', 'componente'], 
        createdAt: now - (day * 20), 
        photoUrls: [],
        weight: '1.2 kg',
        dimensions: '28 x 12 cm',
        loan: { isLoaned: false },
        history: [
            { date: now - (day * 20), type: 'CREATE', details: 'Registrado en sistema' }
        ]
      },
      { 
        id: 'item_2', 
        boxId: 'box_alpha', 
        name: 'Teclado Mecánico Custom', 
        description: 'Switches Cherry MX Blue, keycaps retro beige.', 
        tags: ['teclado', 'input', 'retro'], 
        createdAt: now, 
        photoUrls: [],
        weight: '0.9 kg',
        loan: { isLoaned: false },
        history: [
            { date: now, type: 'CREATE', details: 'Registrado en sistema' }
        ]
      },
      { 
        id: 'item_3', 
        boxId: 'box_beta', 
        name: 'Oculus Quest 2', 
        description: 'Headset VR 64GB con correa elite y batería extra.', 
        tags: ['vr', 'oculus', 'gaming', 'meta'], 
        createdAt: now - (day * 10), 
        photoUrls: [],
        loan: { 
          isLoaned: true, 
          borrowerName: 'Alex Chen', 
          loanDate: now - (day * 5)
        },
        history: [
            { date: now - (day * 10), type: 'CREATE', details: 'Registrado en sistema' },
            { date: now - (day * 5), type: 'LOAN', details: 'Prestado a Alex Chen' }
        ]
      },
      { 
        id: 'item_4', 
        boxId: 'box_gamma', 
        name: 'DJI Mavic Air 2', 
        description: 'Drone plegable con 3 baterías y filtros ND.', 
        tags: ['drone', 'dji', 'fotografía', 'vuelo'], 
        createdAt: now, 
        photoUrls: [],
        loan: { isLoaned: false },
        history: [
            { date: now, type: 'CREATE', details: 'Registrado en sistema' }
        ]
      },
      { 
        id: 'item_5', 
        boxId: 'box_gamma', 
        name: 'Estación de Soldadura', 
        description: 'Weller digital con puntas de precisión.', 
        tags: ['herramienta', 'soldadura', 'electrónica'], 
        createdAt: now - (day * 15), 
        photoUrls: [],
        loan: { 
          isLoaned: true, 
          borrowerName: 'Taller Central', 
          loanDate: now - (day * 12) 
        },
        history: [
            { date: now - (day * 15), type: 'CREATE', details: 'Registrado en sistema' },
            { date: now - (day * 12), type: 'LOAN', details: 'Prestado a Taller Central' }
        ]
      }
    ];

    localStorage.setItem(BOXES_KEY, JSON.stringify(boxes));
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    return true; 
  }
  return false;
};

// --- Image Utility ---
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};