export const questions = {
  'Fiber Types': {
    200: {
      question: 'What type of fiber optic cable is most commonly used for long-distance communication?',
      options: [
        'Single-mode fiber',
        'Multi-mode fiber',
        'Plastic optical fiber',
        'Hybrid fiber'
      ],
      correctAnswer: 'Single-mode fiber'
    },
    400: {
      question: 'Which fiber type has a larger core diameter?',
      options: [
        'Multi-mode fiber',
        'Single-mode fiber',
        'Both have the same diameter',
        'Depends on the manufacturer'
      ],
      correctAnswer: 'Multi-mode fiber'
    },
    600: {
      question: 'What is the typical core size of single-mode fiber?',
      options: [
        '9 microns',
        '50 microns',
        '62.5 microns',
        '100 microns'
      ],
      correctAnswer: '9 microns'
    },
    800: {
      question: 'Which type of fiber experiences less dispersion?',
      options: [
        'Single-mode fiber',
        'Multi-mode fiber',
        'Both have equal dispersion',
        'Depends on the wavelength'
      ],
      correctAnswer: 'Single-mode fiber'
    },
    1000: {
      question: 'What color is typically used for single-mode fiber jacket?',
      options: [
        'Yellow',
        'Orange',
        'Aqua',
        'Red'
      ],
      correctAnswer: 'Yellow'
    }
  },
  'Installation Methods': {
    200: {
      question: 'What is the minimum bend radius typically recommended for fiber optic cables?',
      options: [
        '10x cable diameter',
        '20x cable diameter',
        '5x cable diameter',
        '15x cable diameter'
      ],
      correctAnswer: '10x cable diameter'
    },
    400: {
      question: 'Which tool is used to strip the outer jacket of fiber optic cable?',
      options: [
        'Fiber optic stripper',
        'Wire stripper',
        'Utility knife',
        'Scissors'
      ],
      correctAnswer: 'Fiber optic stripper'
    },
    600: {
      question: 'What should be used to clean fiber ends before splicing?',
      options: [
        'Isopropyl alcohol',
        'Water',
        'Compressed air',
        'Paper towel'
      ],
      correctAnswer: 'Isopropyl alcohol'
    },
    800: {
      question: 'What method is preferred for permanent fiber connections?',
      options: [
        'Fusion splicing',
        'Mechanical splicing',
        'Connectorization',
        'Adhesive joining'
      ],
      correctAnswer: 'Fusion splicing'
    },
    1000: {
      question: 'What is the recommended pulling tension for fiber optic cable installation?',
      options: [
        'Maximum 100-150 pounds',
        'Maximum 200-250 pounds',
        'Maximum 300-350 pounds',
        'Maximum 400-450 pounds'
      ],
      correctAnswer: 'Maximum 100-150 pounds'
    }
  },
  'Troubleshooting': {
    200: {
      question: 'What device is used to locate breaks in fiber optic cables?',
      options: [
        'OTDR',
        'Power meter',
        'Light source',
        'Multimeter'
      ],
      correctAnswer: 'OTDR'
    },
    400: {
      question: 'What is the most common cause of signal loss in fiber optics?',
      options: [
        'Dirty connectors',
        'Fiber breaks',
        'Bend radius',
        'Temperature'
      ],
      correctAnswer: 'Dirty connectors'
    },
    600: {
      question: 'What does a red light visible through the cable jacket indicate?',
      options: [
        'Micro-bend',
        'Normal operation',
        'Overheating',
        'Signal loss'
      ],
      correctAnswer: 'Micro-bend'
    },
    800: {
      question: 'What tool measures the actual power level in a fiber optic system?',
      options: [
        'Power meter',
        'OTDR',
        'Visual fault locator',
        'Spectrum analyzer'
      ],
      correctAnswer: 'Power meter'
    },
    1000: {
      question: 'What is the typical acceptable loss for a fusion splice?',
      options: [
        '0.1 dB or less',
        '0.5 dB or less',
        '1.0 dB or less',
        '2.0 dB or less'
      ],
      correctAnswer: '0.1 dB or less'
    }
  },
  'Network Architecture': {
    200: {
      question: 'What type of network topology is most common in FTTH deployments?',
      options: [
        'PON',
        'Point-to-point',
        'Ring',
        'Mesh'
      ],
      correctAnswer: 'PON'
    },
    400: {
      question: 'What does GPON stand for?',
      options: [
        'Gigabit Passive Optical Network',
        'Global Passive Optical Network',
        'General Purpose Optical Network',
        'Gigabit Point Optical Network'
      ],
      correctAnswer: 'Gigabit Passive Optical Network'
    },
    600: {
      question: 'What is the typical split ratio in a GPON network?',
      options: [
        '1:32',
        '1:16',
        '1:64',
        '1:128'
      ],
      correctAnswer: '1:32'
    },
    800: {
      question: 'What is the maximum distance typically supported by GPON?',
      options: [
        '20 km',
        '10 km',
        '30 km',
        '40 km'
      ],
      correctAnswer: '20 km'
    },
    1000: {
      question: 'What is the downstream bandwidth of XG-PON?',
      options: [
        '10 Gbps',
        '2.5 Gbps',
        '5 Gbps',
        '20 Gbps'
      ],
      correctAnswer: '10 Gbps'
    }
  },
  'Testing Equipment': {
    200: {
      question: 'What device is used for basic continuity testing of fiber?',
      options: [
        'Visual fault locator',
        'OTDR',
        'Power meter',
        'Fusion splicer'
      ],
      correctAnswer: 'Visual fault locator'
    },
    400: {
      question: 'What does OTDR stand for?',
      options: [
        'Optical Time Domain Reflectometer',
        'Optical Testing Digital Reader',
        'Optical Transmission Data Recorder',
        'Optical Technical Distance Reader'
      ],
      correctAnswer: 'Optical Time Domain Reflectometer'
    },
    600: {
      question: 'What equipment is needed for insertion loss testing?',
      options: [
        'Light source and power meter',
        'OTDR only',
        'Visual fault locator only',
        'Fusion splicer'
      ],
      correctAnswer: 'Light source and power meter'
    },
    800: {
      question: 'What wavelengths are typically used for testing single-mode fiber?',
      options: [
        '1310 and 1550 nm',
        '850 and 1300 nm',
        '780 and 850 nm',
        '1550 and 1625 nm'
      ],
      correctAnswer: '1310 and 1550 nm'
    },
    1000: {
      question: 'What type of device is used to certify fiber installation to industry standards?',
      options: [
        'Fiber certification tester',
        'Simple power meter',
        'Visual fault locator',
        'Fiber identifier'
      ],
      correctAnswer: 'Fiber certification tester'
    }
  },
  'Industry Standards': {
    200: {
      question: 'Which organization publishes fiber optic cabling standards?',
      options: [
        'TIA',
        'IEEE',
        'ISO',
        'All of the above'
      ],
      correctAnswer: 'All of the above'
    },
    400: {
      question: 'What is the standard color for APC connectors?',
      options: [
        'Green',
        'Blue',
        'Black',
        'Gray'
      ],
      correctAnswer: 'Green'
    },
    600: {
      question: 'What is the minimum category rating for fiber backbone cabling in data centers?',
      options: [
        'OM3',
        'OM1',
        'OM2',
        'OS1'
      ],
      correctAnswer: 'OM3'
    },
    800: {
      question: 'What is the maximum attenuation allowed for a 1310nm single-mode fiber per km?',
      options: [
        '0.4 dB/km',
        '0.5 dB/km',
        '0.3 dB/km',
        '0.2 dB/km'
      ],
      correctAnswer: '0.4 dB/km'
    },
    1000: {
      question: 'Which standard defines the requirements for installing and testing fiber optic cabling?',
      options: [
        'TIA-568',
        'TIA-569',
        'TIA-606',
        'TIA-607'
      ],
      correctAnswer: 'TIA-568'
    }
  }
};

// Daily Double positions (random for each game)
export const getDailyDoublePositions = () => {
  const positions = [];
  
  // First daily double should be in the first three rows
  const firstPosition = {
    category: Object.keys(questions)[Math.floor(Math.random() * 6)],
    value: [200, 400, 600][Math.floor(Math.random() * 3)]
  };
  positions.push(firstPosition);

  // Second daily double can be anywhere except where the first one is
  let secondPosition;
  do {
    secondPosition = {
      category: Object.keys(questions)[Math.floor(Math.random() * 6)],
      value: [200, 400, 600, 800, 1000][Math.floor(Math.random() * 5)]
    };
  } while (
    secondPosition.category === firstPosition.category &&
    secondPosition.value === firstPosition.value
  );
  positions.push(secondPosition);

  return positions;
};

// Helper function to check if a position is a daily double
export const isDailyDouble = (category, value, dailyDoublePositions) => {
  return dailyDoublePositions.some(
    position => position.category === category && position.value === value
  );
};
