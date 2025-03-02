import React, { useState, useEffect, useCallback } from 'react';
import WordCard from './WordCard';
import PictureCard from './PictureCard';
import Confetti from './Confetti';
import IncorrectFlash from './IncorrectFlash';
import { allPairs } from '../data/gameData';

const WordMatchingGame = () => {
  const [displayPairs, setDisplayPairs] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  // Function to speak the word using the Web Speech API
  const speakWord = (word) => {
    const audioFilePath = `/sounds/vocabulary/${word}.wav`;
    const audio = new Audio(audioFilePath);
    audio.play().catch(error => {
      console.error("Error playing audio:", error);
    });
  };

  // Initialize a new round with 4 pictures
  const setupNewRound = useCallback(() => {
    setShowConfetti(false);
    setShowIncorrect(false);
    setIsAnimating(false);

    // Shuffle and pick 4 random pairs
    const shuffled = [...allPairs].sort(() => 0.5 - Math.random());
    const selectedPairs = shuffled.slice(0, 4); // Always take 4 pairs
    setDisplayPairs(selectedPairs);

    // Pick one of these as the current word to match
    const randomIndex = Math.floor(Math.random() * 4);
    const selectedWord = selectedPairs[randomIndex];
    setCurrentWord(selectedWord);

    // Speak the word
    speakWord(selectedWord.word);

    // Log detailed debugging info about the round setup
    console.log("==== NEW ROUND SETUP ====");
    console.log(`Selected word: "${selectedWord.word}" (ID: ${selectedWord.id})`);
    console.log("All available pictures:");
    selectedPairs.forEach(pair => {
      console.log(`- ${pair.image} (ID: ${pair.id}, Word: "${pair.word}")`);
    });
  }, []);

  // Initialize the first round
  useEffect(() => {
    setupNewRound();
  }, [setupNewRound]);

  const handleSelection = (isCorrect) => {
    if (isAnimating) {
      console.log("Animation already in progress, ignoring selection");
      return;
    }

    setIsAnimating(true);
    setTotalAttempts(prev => prev + 1);

    const playSound = (soundPath, callback) => {
      const audio = new Audio(soundPath);
      audio.play().catch(error => {
        console.error("Error playing sound:", error);
      });
      audio.onended = callback; // Call the callback when the sound finishes
    };

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setShowConfetti(true);

      // Play the clapping sound and wait for it to finish
      playSound('/sounds/clapping.mp3', () => {
        setShowConfetti(false);
        setIsAnimating(false);
        setupNewRound();
      });
    } else {
      // Play the wrong sound and wait for it to finish
      playSound('/sounds/wrong.wav', () => {
        if (currentWord) {
          speakWord(currentWord.word);
          console.log(`Repeating word after incorrect selection: "${currentWord.word}"`);
        }
        setShowIncorrect(false);
        setIsAnimating(false);
      });
      setShowIncorrect(true);
    }
  };

  // Calculate accuracy percentage
  const accuracy = totalAttempts > 0 
    ? Math.round((correctAnswers / totalAttempts) * 100) 
    : 0;

  return (
    <div className="flex flex-col justify-center items-center h-full w-full bg-gray-50 p-4">
      <Confetti active={showConfetti} />
      <IncorrectFlash active={showIncorrect} />
      
      {/* Word Card - Now at the top */}
      <div className="w-full max-w-3xl mb-6">
        {currentWord && <WordCard item={currentWord} onSpeak={speakWord} />}
      </div>
      
      {/* Pictures Grid - Always 4 pictures */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl">
        {displayPairs.map(item => (
          <PictureCard 
            key={item.id} 
            item={item} 
            onSelect={handleSelection} 
            currentWordId={currentWord?.id}
            isAnimating={isAnimating}
          />
        ))}
      </div>

      {/* Accuracy Display - Bottom right corner */}
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', fontSize: '0.9rem', color: 'black', fontWeight: 'bold' }}>
        Accuracy: {accuracy}%
      </div>
    </div>
  );
};

export default WordMatchingGame;