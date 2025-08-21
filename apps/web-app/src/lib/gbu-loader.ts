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

// Transform detailed content into minimalist quote style
function transformToMinimalistQuotes(content: string[]): string[] {
  // Only take first 3 items maximum
  const limitedContent = content.slice(0, 3);
  
  return limitedContent.map(item => {
    // Remove ALL technical jargon and complex phrases completely
    let simplified = item
      .replace(/context pressure|stall tax|optics bleed|tempo loss|check tax|posting receipt|deadlines|multitask|alignment threads|rolling delays|pre-announcement drift/gi, '')
      .replace(/under |when |while |though |because |so |but |and |or |in |on |at |to |for |of |with |by /gi, '')
      .replace(/appears|creates|imposes|adds|expands|lengthens|increases|decreases|becomes|stays|remains/gi, '')
      .replace(/brief |small |momentary |sustained |prolonged |long |short |wide |narrow /gi, '')
      .replace(/without |before |after |during |around |through |across |between |among /gi, '')
      .replace(/the |a |an |this |that |these |those /gi, '')
      .replace(/\.|,|;|:|\(|\)|\+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Convert to ultra-short, bold statements (6 words max)
    const words = simplified.split(' ').filter(word => word.length > 0);
    if (words.length > 6) {
      simplified = words.slice(0, 6).join(' ');
    }
    
    // Ensure we have meaningful content
    if (simplified.length < 3) {
      simplified = 'Stable outcomes';
    }
    
    return simplified;
  });
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
  
  // Transform to minimalist quote style
  const transformedGood = transformToMinimalistQuotes(uniqueGood);
  const transformedBad = transformToMinimalistQuotes(uniqueBad);
  const transformedUgly = transformToMinimalistQuotes(uniqueUgly);
  
  return {
    good: transformedGood,
    bad: transformedBad,
    ugly: transformedUgly.length > 0 ? transformedUgly.join(' ') : undefined
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
