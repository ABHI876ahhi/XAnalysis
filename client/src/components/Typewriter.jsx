import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

function Typewriter({ text, speed = 30, className = "" }) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  return (
    <span className={className}>
      {displayedText}
      {index < text.length && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-1 h-4 bg-yellow-500 ml-1 translate-y-1"
        />
      )}
    </span>
  );
}

export default Typewriter;
