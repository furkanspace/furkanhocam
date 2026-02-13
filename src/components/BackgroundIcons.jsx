import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Lightbulb, GraduationCap, Trophy, Dribbble, Target, Zap } from 'lucide-react';

const FloatingIcon = ({ children, delay = 0, x = 0, y = 0, color = 'rgba(255,255,255,0.1)' }) => (
    <motion.div
        className="floating-icon"
        initial={{ opacity: 0, scale: 0 }}
        animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
            y: [y, y - 20, y],
            rotate: [0, 10, -10, 0]
        }}
        transition={{
            delay,
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
        }}
        style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            color: color,
            zIndex: 0
        }}
    >
        {children}
    </motion.div>
);

const BackgroundIcons = ({ theme = 'mixed' }) => {
    // theme: 'study' (blue), 'game' (green), 'mixed' (both)

    const icons = [];

    if (theme === 'study' || theme === 'mixed') {
        icons.push(
            <FloatingIcon key="1" delay={0} x={10} y={20} color="rgba(59, 130, 246, 0.2)"><BookOpen size={40} /></FloatingIcon>,
            <FloatingIcon key="2" delay={1} x={80} y={15} color="rgba(59, 130, 246, 0.2)"><Brain size={50} /></FloatingIcon>,
            <FloatingIcon key="3" delay={2} x={20} y={70} color="rgba(59, 130, 246, 0.2)"><Lightbulb size={35} /></FloatingIcon>,
            <FloatingIcon key="4" delay={3} x={70} y={60} color="rgba(59, 130, 246, 0.2)"><GraduationCap size={45} /></FloatingIcon>
        );
    }

    if (theme === 'game' || theme === 'mixed') {
        icons.push(
            <FloatingIcon key="5" delay={0.5} x={15} y={80} color="rgba(0, 255, 136, 0.2)"><Trophy size={45} /></FloatingIcon>,
            <FloatingIcon key="6" delay={1.5} x={85} y={30} color="rgba(0, 255, 136, 0.2)"><Dribbble size={40} /></FloatingIcon>,
            <FloatingIcon key="7" delay={2.5} x={30} y={40} color="rgba(0, 255, 136, 0.2)"><Target size={35} /></FloatingIcon>,
            <FloatingIcon key="8" delay={3.5} x={60} y={85} color="rgba(0, 255, 136, 0.2)"><Zap size={50} /></FloatingIcon>
        );
    }

    return (
        <div className="background-icons-container" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {icons}
        </div>
    );
};

export default BackgroundIcons;
