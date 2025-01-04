export const validateDimensions = (dimensions) => {
    const { width, length, height } = dimensions;
    const minSize = 5; // feet
    const maxSize = 50; // feet
    const minHeight = 7; // feet
    const maxHeight = 20; // feet
  
    const errors = [];
  
    if (width < minSize || width > maxSize) {
      errors.push(`Width must be between ${minSize} and ${maxSize} feet`);
    }
  
    if (length < minSize || length > maxSize) {
      errors.push(`Length must be between ${minSize} and ${maxSize} feet`);
    }
  
    if (height < minHeight || height > maxHeight) {
      errors.push(`Height must be between ${minHeight} and ${maxHeight} feet`);
    }
  
    return {
      isValid: errors.length === 0,
      errors
    };
  };