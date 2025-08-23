'use client';

import React, { useState, useEffect } from 'react';
import type { Line, LineItemV2, QuizStateV2, LineDuelItem } from '@/lib/types';
import LineDuelsComponent from './LineDuelsComponent';

interface LinesComponentV2Props {
  quizState: QuizStateV2;
  onLineVerdict: (line: Line, token: 'C' | 'O' | 'F', severity: number, items: any) => void;
  lineItems: LineItemV2[];
  lineDuelItems?: Record<Line, LineDuelItem[]>;
}

export default function LinesComponentV2({ 
  quizState, 
  onLineVerdict, 
  lineItems,
  lineDuelItems
}: LinesComponentV2Props) {
  // ALL HOOKS MUST BE CALLED FIRST, before any validation or logic
  const [currentLineIndex, setCurrentLineIndex] = useState(() => {
    // Start from the first unprocessed line
    const processedLines = quizState?.lines?.lineVerdicts?.map(v => v.line) || [];
    const lines: Line[] = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];
    const firstUnprocessedIndex = lines.findIndex(line => !processedLines.includes(line));
    console.log('🎯 Initializing line index:', { processedLines, firstUnprocessedIndex, lines });
    return firstUnprocessedIndex >= 0 ? firstUnprocessedIndex : 0;
  });
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [lineVerdicts, setLineVerdicts] = useState<Record<Line, Array<{ token: 'C' | 'O' | 'F'; severity: number }>>>({} as Record<Line, Array<{ token: 'C' | 'O' | 'F'; severity: number }>>);
  const [needsLineDuel, setNeedsLineDuel] = useState<Line | null>(null);
  const [currentLine, setCurrentLine] = useState<Line>(() => {
    const lines: Line[] = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];
    return lines[currentLineIndex];
  });

  // Define lines array
  const lines: Line[] = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];

  // Validate props
  console.log('🚀 LinesComponentV2 Props Validation:', {
    quizState: quizState ? 'Present' : 'Missing',
    onLineVerdict: typeof onLineVerdict,
    lineItems: Array.isArray(lineItems) ? lineItems.length : typeof lineItems,
    lineDuelItems: lineDuelItems ? 'Present' : 'Missing'
  });

  if (!Array.isArray(lineItems)) {
    console.error('❌ lineItems is not an array:', lineItems);
    return (
      <div className="text-center p-8">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-4">Data Error</h2>
        <p className="text-neutral-300">Line items data is invalid</p>
        <div className="mt-4 text-sm text-neutral-400">
          <p>Type: {typeof lineItems}</p>
          <p>Value: {JSON.stringify(lineItems)}</p>
        </div>
      </div>
    );
  }

  if (lineItems.length === 0) {
    console.error('❌ No line items provided');
    return (
      <div className="text-center p-8">
        <div className="text-yellow-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-4">No Data</h2>
        <p className="text-neutral-300">No line items available</p>
      </div>
    );
  }

  // NOW you can use currentLine - after all hooks are called
  const currentLineItems = lineItems.filter(item => item.line === currentLine);

  // Validate currentLineItems has items
  if (currentLineItems.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-4">No Items for Current Line</h2>
        <p className="text-neutral-300">No items found for line: {currentLine}</p>
      </div>
    );
  }

  // Only show content when in the lines stage
  if (quizState?.stage !== 'lines') {
    return null;
  }

  // Debug logging
  console.log('🔍 LinesComponentV2 Debug:', {
    currentLine,
    currentLineIndex,
    totalLineItems: lineItems.length,
    lineItems: lineItems,
    currentLineItems: lineItems.filter(item => item.line === currentLine),
    allLineNames: lineItems.map(item => item.line),
    uniqueLineNames: [...new Set(lineItems.map(item => item.line))]
  });
  
  // Wrap the main render logic in try-catch
  try {
    // Before accessing line items, validate the indices
    if (currentItemIndex >= currentLineItems.length) {
      console.error(`⚠️ Item index ${currentItemIndex} out of bounds for line ${currentLine}. Available: ${currentLineItems.length}`);
      // Reset to valid index
      setCurrentItemIndex(0);
    }
  } catch (error) {
    console.error('🚨 Error in LinesComponentV2:', error);
    return <div>Error loading quiz. Please refresh.</div>;
  }

  // Now safely access the item
  const currentItem = currentLineItems[currentItemIndex];

  // Debug current line items
  console.log('📋 Current Line Analysis:', {
    currentLine,
    currentLineIndex,
    totalLines: lines.length,
    currentLineItemsCount: currentLineItems.length,
    currentLineItems: currentLineItems.map(item => ({ id: item.id, prompt: item.prompt.substring(0, 50) + '...' })),
    allLineItemsCount: lineItems.length,
    lineItemsByLine: lines.map(line => ({
      line,
      count: lineItems.filter(item => item.line === line).length
    }))
  });

  // Skip the family line (assume 'C' - stable)
  const shouldSkipFamilyLine = currentLine === quizState.faceTriad.family;

  // Auto-advance family line
  useEffect(() => {
    if (shouldSkipFamilyLine) {
      console.log('🚀 Auto-advancing family line:', currentLine);
      if (currentLineIndex < lines.length - 1) {
        setCurrentLineIndex(prev => prev + 1);
        setCurrentItemIndex(0);
      }
    }
  }, [shouldSkipFamilyLine, currentLineIndex, lines.length]);

  // Reset selection when item changes
  useEffect(() => {
    setSelectedOption(null);
  }, [currentLineIndex, currentItemIndex]);

  // Debug current state
  useEffect(() => {
    console.log('📊 LinesComponentV2 State Update:', {
      currentLine,
      currentLineIndex,
      currentItemIndex,
      currentLineItems: currentLineItems.length,
      currentItem,
      shouldSkipFamilyLine,
      lineVerdicts
    });
  }, [currentLine, currentLineIndex, currentItemIndex, currentLineItems, currentItem, shouldSkipFamilyLine, lineVerdicts]);

  // Ensure line items are properly filtered
  useEffect(() => {
    const filteredItems = lineItems.filter(item => item.line === currentLine);
    console.log(`🔍 Line ${currentLine} has ${filteredItems.length} items:`, filteredItems);
    
    // Validate current item index
    if (currentItemIndex >= filteredItems.length) {
      console.warn(`⚠️ Resetting item index from ${currentItemIndex} to 0 for line ${currentLine}`);
      setCurrentItemIndex(0);
    }
  }, [currentLine, lineItems, currentItemIndex]);

  const handleOptionSelect = (optionKey: string) => {
    // Validate current stage
    if (quizState?.stage !== 'lines') {
      console.warn('⚠️ LinesComponentV2: Ignoring option selection - wrong stage:', quizState?.stage);
      return;
    }
    
    setSelectedOption(optionKey);
    
    // Auto-confirm the selection after a brief delay for visual feedback
    setTimeout(() => {
      // Check if stage has changed during the delay
      if (quizState?.stage !== 'lines') {
        console.warn('⚠️ LinesComponentV2: Stage changed during delay, ignoring selection');
        return;
      }
      
      if (!currentItem || !currentItem.token_map) {
        console.error('❌ Invalid currentItem or missing token_map:', currentItem);
        return;
      }

      const token = currentItem.token_map[optionKey];
      if (!token) {
        console.error('❌ No token found for option:', optionKey, 'in currentItem:', currentItem);
        return;
      }
      
      const severity = token === 'C' ? 0 : token === 'O' ? 1 : 2;

      // Record this item's verdict
      const newLineVerdicts = { ...lineVerdicts };
      if (!newLineVerdicts[currentLine]) {
        newLineVerdicts[currentLine] = [];
      }
      
      // Safety check to ensure the array is properly initialized
      if (!Array.isArray(newLineVerdicts[currentLine])) {
        newLineVerdicts[currentLine] = [];
      }
      
      newLineVerdicts[currentLine][currentItemIndex] = { token, severity };
      setLineVerdicts(newLineVerdicts);

      // Move to next item or line
      if (currentItemIndex < currentLineItems.length - 1) {
        setCurrentItemIndex(prev => prev + 1);
      } else {
        // Line complete, check if we need a duel
        if (checkIfNeedsLineDuel(currentLine, newLineVerdicts[currentLine])) {
          setNeedsLineDuel(currentLine);
          return;
        }
        
        // No duel needed, determine final verdict
        const finalVerdict = determineLineVerdict(newLineVerdicts[currentLine]);
        
        // Safety check to ensure finalVerdict is valid
        if (!finalVerdict || !finalVerdict.token || finalVerdict.severity === undefined) {
          console.error('❌ Invalid finalVerdict:', finalVerdict, 'for line:', currentLine);
          return;
        }
        
        // Double-check stage before calling onLineVerdict
        if (quizState?.stage === 'lines') {
          // Safety check to ensure we have the expected items
          const lineItems = newLineVerdicts[currentLine];
          if (!lineItems || lineItems.length < 2) {
            console.error('❌ Insufficient line items for verdict:', lineItems);
            return;
          }
          
          onLineVerdict(currentLine, finalVerdict.token, finalVerdict.severity, {
            item1: lineItems[0],
            item2: lineItems[1]
          });
        } else {
          console.warn('⚠️ Stage changed after line completion, not recording line verdict');
        }

        // Move to next line
        if (currentLineIndex < lines.length - 1) {
          setCurrentLineIndex(prev => prev + 1);
          setCurrentItemIndex(0);
        }
      }
    }, 300); // 300ms delay for visual feedback
  };

  const handleLineDuelResult = (winner: 'C' | 'O' | 'F') => {
    // Validate current stage
    if (quizState?.stage !== 'lines') {
      console.warn('⚠️ LinesComponentV2: Ignoring duel result - wrong stage:', quizState?.stage);
      return;
    }
    
    const severity = winner === 'C' ? 0 : winner === 'O' ? 1 : 2;
    
    // Record the duel result and complete the line
    if (quizState?.stage === 'lines') {
      // Safety check to ensure line verdicts exist
      const currentLineVerdicts = lineVerdicts[needsLineDuel!];
      if (!currentLineVerdicts || currentLineVerdicts.length < 2) {
        console.error('❌ Missing line verdicts for duel:', needsLineDuel, 'Available:', currentLineVerdicts);
        return;
      }
      
      onLineVerdict(needsLineDuel!, winner, severity, {
        item1: currentLineVerdicts[0],
        item2: currentLineVerdicts[1],
        duelResult: winner
      });
    } else {
      console.warn('⚠️ Stage changed during duel result processing, not recording line verdict');
    }
    
    // Clear duel state and move to next line
    setNeedsLineDuel(null);
    if (currentLineIndex < lines.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
      setCurrentItemIndex(0);
    }
  };

  const determineLineVerdict = (items: Array<{ token: 'C' | 'O' | 'F'; severity: number }>): { token: 'C' | 'O' | 'F'; severity: number } => {
    if (!items || items.length === 0) {
      return { token: 'C', severity: 0 };
    }

    // Use max severity rule (F > O > C)
    const maxSeverity = Math.max(...items.map(item => item.severity));
    const maxSeverityItems = items.filter(item => item.severity === maxSeverity);
    
    // If multiple items have same severity, prefer the first one
    // Add safety check to ensure we always return a valid verdict
    if (maxSeverityItems.length === 0 || !maxSeverityItems[0]) {
      console.warn('⚠️ No valid verdict found, using fallback:', { items, maxSeverity, maxSeverityItems });
      return { token: 'C', severity: 0 };
    }
    
    return maxSeverityItems[0];
  };

  const checkIfNeedsLineDuel = (line: Line, items: Array<{ token: 'C' | 'O' | 'F'; severity: number }>): boolean => {
    if (!items || items.length < 2) return false;
    
    // Safety check to ensure all items have valid properties
    if (!items.every(item => item && item.token && item.severity !== undefined)) {
      console.warn('⚠️ Invalid items in checkIfNeedsLineDuel:', items);
      return false;
    }
    
    // Check for edge cases that might need duels
    const tokens = items.map(item => item.token);
    const hasMixedSeverity = tokens.some(t => t === 'C') && tokens.some(t => t === 'F');
    const hasEqualSeverity = items.every(item => item.severity === items[0].severity);
    
    // Trigger duel if we have mixed severity or equal severity with different tokens
    return hasMixedSeverity || (hasEqualSeverity && new Set(tokens).size > 1);
  };

  const getProgressPercentage = (): number => {
    const totalItems = lines.length * 2; // 2 items per line
    const completedItems = Object.values(lineVerdicts).reduce((sum, items) => sum + items.length, 0);
    return (completedItems / totalItems) * 100;
  };

  const getCurrentLineProgress = (): number => {
    if (!lineVerdicts[currentLine]) return 0;
    return (lineVerdicts[currentLine].length / 2) * 100;
  };

  if (shouldSkipFamilyLine) {
    return (
      <div className="text-center p-8">
        <p className="text-neutral-400">Auto-advancing through family line: {currentLine}</p>
        <div className="animate-pulse mt-4">
          <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  // Check if we have items for the current line
  if (!currentLineItems || currentLineItems.length === 0) {
    console.error('❌ No line items found for line:', currentLine, 'Available items:', lineItems);
    return (
      <div className="text-center p-8">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-4">Line Content Error</h2>
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6 text-left">
          <p className="text-red-300 font-mono text-sm">
            <strong>Line:</strong> {currentLine}<br/>
            <strong>Available Items:</strong> {lineItems.length}<br/>
            <strong>Filtered Items:</strong> {currentLineItems.length}<br/>
            <strong>All Items:</strong> {JSON.stringify(lineItems.map(item => ({ line: item.line, id: item.id })), null, 2)}
          </p>
        </div>
        <p className="text-neutral-300">This line has no quiz items available.</p>
      </div>
    );
  }

  // Additional safety check for currentItem
  if (!currentItem || !currentItem.prompt || !currentItem.options || !currentItem.token_map) {
    console.error('❌ Invalid currentItem:', currentItem, 'for line:', currentLine, 'at index:', currentItemIndex);
    return (
      <div className="text-center p-8">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-4">Item Data Error</h2>
        <p className="text-neutral-300">Invalid item data at index {currentItemIndex} for line {currentLine}</p>
        <div className="mt-4 text-sm text-neutral-400">
          <p>Current Line: {currentLine}</p>
          <p>Current Index: {currentItemIndex}</p>
          <p>Available Items: {currentLineItems.length}</p>
          <p>Item Data: {JSON.stringify(currentItem, null, 2)}</p>
        </div>
      </div>
    );
  }

  // Show line duel if needed
  if (needsLineDuel) {
    const duelItems = lineDuelItems?.[needsLineDuel] || [];
    return (
      <LineDuelsComponent
        line={needsLineDuel}
        duelItems={duelItems}
        onDuelResult={handleLineDuelResult}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Lines Assessment
        </h2>
        <p className="text-neutral-300 mb-6">
          Now let's assess your 7 operating lines. Each line has 2 questions to determine your pattern.
        </p>
        
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-neutral-400 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="w-full bg-neutral-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Current Line Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-neutral-400 mb-2">
            <span>{currentLine} Line Progress</span>
            <span>{Math.round(getCurrentLineProgress())}%</span>
          </div>
          <div className="w-full bg-neutral-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCurrentLineProgress()}%` }}
            />
          </div>
        </div>

        {/* Lines Overview */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {lines.map((line, index) => {
            const isCurrent = index === currentLineIndex;
            const isCompleted = lineVerdicts[line] && lineVerdicts[line].length >= 2;
            const isFamilyLine = line === quizState.faceTriad.family;
            
            return (
              <div 
                key={line}
                className={`text-center p-2 rounded-lg border-2 transition-all ${
                  isFamilyLine
                    ? 'border-purple-500 bg-purple-500/20'
                    : isCompleted
                      ? 'border-green-500 bg-green-500/20'
                      : isCurrent
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-neutral-600 bg-neutral-800/40'
                }`}
              >
                <div className="text-xs text-neutral-400 mb-1">{line}</div>
                <div className="text-sm font-bold text-white">
                  {isFamilyLine ? 'C' : isCompleted ? lineVerdicts[line]?.[0]?.token || '?' : '?'}
                </div>
                {isFamilyLine && (
                  <div className="text-xs text-purple-400 mt-1">Family</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Line Item */}
      <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6 mb-6">
        <div className="text-center mb-6">
          <div className="text-sm text-neutral-400 mb-2">
            {currentLine} Line - Question {currentItemIndex + 1} of {currentLineItems.length}
          </div>
          <h3 className="text-xl font-semibold text-white leading-relaxed">
            {currentItem.prompt}
          </h3>
        </div>

        {/* Options Grid */}
        <div className="grid gap-3 mb-6">
          {Object.entries(currentItem.options).map(([optionKey, optionText]) => (
            <button
              key={optionKey}
              onClick={() => handleOptionSelect(optionKey)}
              className={`text-left p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                selectedOption === optionKey
                  ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                  : 'border-neutral-600 bg-neutral-800/40 hover:border-blue-400 hover:bg-blue-500/10 hover:shadow-md hover:shadow-blue-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    selectedOption === optionKey
                      ? 'border-blue-500 bg-blue-500 scale-110'
                      : 'border-neutral-500 group-hover:border-blue-400'
                  }`}>
                    {selectedOption === optionKey && (
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-lg font-medium text-white">
                    {optionKey}. {optionText}
                  </span>
                </div>
                <div className={`text-sm px-2 py-1 rounded transition-all duration-200 ${
                  currentItem.token_map[optionKey] === 'C'
                    ? 'text-green-400 bg-green-500/20'
                    : currentItem.token_map[optionKey] === 'O'
                      ? 'text-yellow-400 bg-yellow-500/20'
                      : 'text-red-400 bg-red-500/20'
                }`}>
                  {currentItem.token_map[optionKey]}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Enhanced Selection Feedback */}
        <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-blue-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <p className="font-medium">Hover over options to preview, click to select automatically</p>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-neutral-400">
        <p>
          <span className="text-blue-400 font-medium">Hover</span> over options to preview, then <span className="text-green-400 font-medium">click once</span> to select automatically.
        </p>
        <p className="mt-2">
          C = Stable, O = Offset, F = Break. We'll use the maximum severity rule.
        </p>
      </div>

      {/* Token Legend */}
      <div className="mt-6 p-4 bg-neutral-900/60 border border-neutral-700 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-3">Token Meanings</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-green-400 font-bold mb-1">C - Stable</div>
            <div className="text-neutral-400">The move lands cleanly without extra passes</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-bold mb-1">O - Offset</div>
            <div className="text-neutral-400">Hesitation/softening adds latency here</div>
          </div>
          <div className="text-center">
            <div className="text-red-400 font-bold mb-1">F - Break</div>
            <div className="text-neutral-400">Pattern derails or reverses under pressure</div>
          </div>
        </div>
      </div>
    </div>
  );
}
