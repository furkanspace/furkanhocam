import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Lightbulb, GraduationCap, Trophy, Dribbble, Target, Zap } from 'lucide-react';

const FloatingIcon = ({ children, delay = 0, x = 0, y = 0 }) => (
    <motion.div
        className="floating-icon"
        initial={{ opacity: 0, scale: 0 }}
        animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.1, 1],
            y: [y, y - 20, y],
            rotate: [0, 5, -5, 0]
        }}
        transition={{
            delay,
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
        }}
        style={{ left: `${x}%`, top: `${y}%` }}
    >
        {children}
    </motion.div>
);

const LandingPage = ({ onEnterGame, onEnterStudy }) => {
    return (
        <div className="landing-page">
            {/* Left Side - Study */}
            <motion.div
                className="landing-section study-section"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                onClick={onEnterStudy}
                whileHover={{ flex: 1.1 }}
            >
                <div className="section-bg-icons">
                    <FloatingIcon delay={0} x={10} y={20}><BookOpen size={40} /></FloatingIcon>
                    <FloatingIcon delay={0.5} x={80} y={15}><Brain size={50} /></FloatingIcon>
                    <FloatingIcon delay={1} x={20} y={70}><Lightbulb size={35} /></FloatingIcon>
                    <FloatingIcon delay={1.5} x={70} y={60}><GraduationCap size={45} /></FloatingIcon>
                    <FloatingIcon delay={2} x={50} y={40}><Brain size={60} /></FloatingIcon>
                </div>

                <div className="section-content">
                    <motion.div
                        className="brain-half left-brain"
                        animate={{
                            boxShadow: ["0 0 30px rgba(59, 130, 246, 0.3)", "0 0 60px rgba(59, 130, 246, 0.5)", "0 0 30px rgba(59, 130, 246, 0.3)"]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Brain size={80} />
                    </motion.div>
                    <h1>DERS ZAMANI</h1>
                    <h2>DERS</h2>
                    <p>Bilginin gücüyle zihninizi güçlendirin</p>
                    <motion.button
                        className="btn-enter study-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Giriş Yap
                    </motion.button>
                </div>
            </motion.div>

            {/* Center Divider */}
            <div className="landing-divider">
                <motion.div
                    className="divider-line"
                    animate={{ height: ["0%", "100%"] }}
                    transition={{ duration: 1, delay: 0.5 }}
                />
                <motion.div
                    className="divider-text"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                >
                    &
                </motion.div>
            </div>

            {/* Right Side - Game */}
            <motion.div
                className="landing-section game-section"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                onClick={onEnterGame}
                whileHover={{ flex: 1.1 }}
            >
                <div className="section-bg-icons">
                    <FloatingIcon delay={0.2} x={15} y={25}><Trophy size={45} /></FloatingIcon>
                    <FloatingIcon delay={0.7} x={75} y={20}><Dribbble size={40} /></FloatingIcon>
                    <FloatingIcon delay={1.2} x={25} y={65}><Target size={35} /></FloatingIcon>
                    <FloatingIcon delay={1.7} x={65} y={55}><Zap size={50} /></FloatingIcon>
                    <FloatingIcon delay={2.2} x={45} y={35}><Trophy size={55} /></FloatingIcon>
                </div>

                <div className="section-content">
                    <motion.div
                        className="brain-half right-brain"
                        animate={{
                            boxShadow: ["0 0 30px rgba(0, 255, 136, 0.3)", "0 0 60px rgba(0, 255, 136, 0.5)", "0 0 30px rgba(0, 255, 136, 0.3)"]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Zap size={80} />
                    </motion.div>
                    <h1>OYUN ZAMANI</h1>
                    <h2>OYUN</h2>
                    <p>Rekabet ve eğlencenin gücünü keşfedin</p>
                    <motion.button
                        className="btn-enter game-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Giriş Yap
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default LandingPage;
