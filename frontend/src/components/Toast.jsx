import { motion, AnimatePresence } from 'framer-motion';

export default function Toast({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="toast"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <span>✦ saved</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
