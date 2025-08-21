import axisCards from '../data/axis_universal_cards_with_gbu_v1.json';

interface AxisCard {
  line: string;
  base_pattern: string;
  label: string;
  driver_hint: string;
  paragraph: string;
  good: string[];
  bad: string[];
  ugly: string[];
}

interface QuizLineResult {
  line: string;
  distance: string;
  slipDriver: string;
  basePattern: string;
}

export function getGoodBadUglyForResults(quizResults: QuizLineResult[]) {
  const cards = axisCards.cards as AxisCard[];
  
  console.log('GBU Loader - Quiz Results:', quizResults);
  console.log('GBU Loader - Available cards:', cards.length);
  
  const good: string[] = [];
  const bad: string[] = [];
  const ugly: string[] = [];
  
  quizResults.forEach(result => {
    // Find matching card based on line and base pattern
    const matchingCard = cards.find(card => 
      card.line.toLowerCase() === result.line.toLowerCase() &&
      card.base_pattern === result.basePattern
    );
    
    console.log(`Looking for: ${result.line} (${result.basePattern})`);
    console.log(`Found card:`, matchingCard ? 'YES' : 'NO');
    
    if (matchingCard) {
      // Add the correct Good/Bad/Ugly data from the card
      good.push(...matchingCard.good);
      bad.push(...matchingCard.bad);
      ugly.push(...matchingCard.ugly);
    } else {
      // Fallback to generic data if no exact match
      if (result.distance === 'Close') {
        good.push(`${result.line} Close`);
      } else {
        bad.push(`${result.line} ${result.distance} (${result.slipDriver})`);
      }
    }
  });
  
  // Remove duplicates
  const uniqueGood = [...new Set(good)];
  const uniqueBad = [...new Set(bad)];
  const uniqueUgly = [...new Set(ugly)];
  
  return {
    good: uniqueGood,
    bad: uniqueBad,
    ugly: uniqueUgly.length > 0 ? uniqueUgly.join(' ') : undefined
  };
}

// Test function to verify the loader works
export function testGBULoader() {
  const testResults: QuizLineResult[] = [
    {
      line: 'Control',
      distance: 'Close',
      slipDriver: 'context pressure',
      basePattern: '300'
    },
    {
      line: 'Pace',
      distance: 'Offset',
      slipDriver: 'deadlines + multitask',
      basePattern: '030'
    }
  ];
  
  console.log('=== GBU Loader Test ===');
  const result = getGoodBadUglyForResults(testResults);
  console.log('Test GBU Loader Result:', result);
  console.log('=== End Test ===');
  return result;
}
