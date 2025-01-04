export const defaultSettings = {
    room: {
      dimensions: {
        width: 12,
        length: 15,
        height: 9
      },
      materials: {
        walls: 'white',
        floor: 'wood',
        ceiling: 'white'
      }
    },
    camera: {
      fov: 75,
      near: 0.1,
      far: 1000,
      position: {
        x: 10,
        y: 10,
        z: 10
      }
    },
    lighting: {
      ambient: {
        color: 0xffffff,
        intensity: 0.5
      },
      directional: {
        color: 0xffffff,
        intensity: 0.8,
        position: {
          x: 10,
          y: 10,
          z: 10
        }
      }
    }
  };