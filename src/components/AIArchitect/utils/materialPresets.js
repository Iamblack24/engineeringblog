export const materialPresets = {
    walls: [
      { id: 'white', name: 'White Paint', color: 0xffffff },
      { id: 'beige', name: 'Beige Paint', color: 0xf5f5dc },
      { id: 'brick', name: 'Red Brick', color: 0xb35c44 },
      { id: 'drywall', name: 'Drywall', color: 0xf0f0f0 }
    ],
    floors: [
      { id: 'wood', name: 'Hardwood', color: 0x8b4513 },
      { id: 'tile', name: 'Ceramic Tile', color: 0xdcdcdc },
      { id: 'carpet', name: 'Carpet', color: 0x808080 },
      { id: 'vinyl', name: 'Vinyl', color: 0xf0f8ff }
    ],
    ceiling: [
      { id: 'white', name: 'White Paint', color: 0xffffff },
      { id: 'textured', name: 'Textured', color: 0xf8f8ff },
      { id: 'popcorn', name: 'Popcorn', color: 0xfffacd },
    ]
  };
  
  export const getMaterialById = (type, id) => {
    return materialPresets[type].find(material => material.id === id);
  };