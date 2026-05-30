import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function Cursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { stiffness: 150, damping: 18 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Detect mobile touch pointer
    const checkCoarse = window.matchMedia('(pointer: coarse)');
    setIsMobile(checkCoarse.matches);

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      if (e.target && (e.target.classList?.contains('interactive') || e.target.closest?.('.interactive'))) {
        setIsHovered(true);
      }
    };

    const handleMouseOut = (e) => {
      if (e.target && (e.target.classList?.contains('interactive') || e.target.closest?.('.interactive'))) {
        setIsHovered(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [mouseX, mouseY]);

  if (isMobile) return null;

  return (
    <motion.div
      className="cursor"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        width: isHovered ? 26 : 10,
        height: isHovered ? 26 : 10,
        backgroundColor: isHovered ? 'var(--accent-dim)' : 'transparent',
      }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
    />
  );
}
