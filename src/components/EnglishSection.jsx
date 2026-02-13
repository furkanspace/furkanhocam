import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, ChevronRight, GraduationCap, School, Building2, Globe, Award, FileText, ExternalLink } from 'lucide-react';

const categories = [
    {
        id: 'ilkokul',
        name: 'İlkokul',
        icon: School,
        color: '#10b981',
        subcategories: [
            {
                name: '4. Sınıf',
                items: [
                    '10_Food and Drinks', '1_Classroom Rules', '2_Nationality', '3_Cartoon Characters', '4_Free Time',
                    '5_My Day', '6_Fun With Science', '7_Jobs', '8_My Clothes', '9_My Friends'
                ]
            }
        ]
    },
    {
        id: 'ortaokul',
        name: 'Ortaokul',
        icon: BookOpen,
        color: '#3b82f6',
        subcategories: [
            {
                name: '5. Sınıf',
                items: ['1-Hello', '10-Festivals', '2-My Town', '3-Games and Hobbies', '4-My Daily Routine', '5-Health', '6-Movies', '7-Party Time', '8-Fitness', '9-The Animal Shelter']
            },
            {
                name: '6. Sınıf',
                items: ['1-Life', '10-Democracy', '2-Yummy Breakfast', '3-Downtown', '4-Weather and Emotions', '5-At the Fair', '6-Occupations', '7-Holidays', '8-Bookworms', '9-Saving the Planet']
            },
            {
                name: '7. Sınıf',
                items: []
            },
            {
                name: '8. Sınıf',
                items: ['1-Friendship', '10-Natural Forces', '2-Teen', '3-The Kitchen', '4-On the Phone', '5-The Internet', '6-Adventures', '7-Tourism', '8-Chores', '9-Science']
            }
        ]
    },
    {
        id: 'lise',
        name: 'Lise',
        icon: GraduationCap,
        color: '#8b5cf6',
        subcategories: [
            {
                name: '9. Sınıf',
                items: ['1-Studying Abroad', '10-Television and Social Media', '2-My Environment', '3-Movies', '4-Human in Nature', '5-Inspirational People', '6-Bridging Cultures', '7-World Heritage', '8-Emergency and Health Problems', '9-Invitations and Celebrations']
            },
            {
                name: '10. Sınıf',
                items: ['1-School Life_flashcards', '10-Shopping_flashcards', '2-Plans_flashcards', '3-Legendary Figures_flashcards', '4-Traditions_flashcards', '5-Travel_flashcards', '6-Helpful Tips_flashcards', '7-Food and Festivals_flashcards', '8-Digital Era_flashcards', '9-Heroes and Heroines_flashcards']
            },
            {
                name: '11. Sınıf',
                items: ['1-Future Jobs', '10-Values and Norms', '2-Hobbies and Skills', '3-Hard Times', '4-What a Life', '5-Back to the Past', '6-Open Your Heart', '7-Facts About Turkey', '8-Sports', '9-My Friends']
            },
            {
                name: '12. Sınıf',
                items: ['1-Music', '10-Manners', '2-Friendship', '3-Human Rights', '4-Coming Soon', '5-Psychology', '6-Favors', '7-News Stories', '8-Alternative Energy', '9-Technology']
            }
        ]
    },
    {
        id: 'university',
        name: 'Üniversite Hazırlık',
        icon: Building2,
        color: '#f59e0b',
        subcategories: [
            { name: 'Hazırlık 1', items: [] },
            { name: 'Hazırlık 2', items: [] },
            { name: 'Hazırlık 3', items: [] },
            { name: 'Hazırlık 4', items: [] }
        ]
    },
    {
        id: 'yds',
        name: 'YDS',
        icon: Award,
        color: '#ec4899',
        subcategories: [
            { name: 'YDS 1', items: [] },
            { name: 'YDS 2', items: [] },
            { name: 'YDS 3', items: [] }
        ]
    },
    {
        id: 'yokdil',
        name: 'YÖKDİL',
        icon: FileText,
        color: '#ef4444',
        subcategories: [
            { name: 'Fen', items: [] },
            { name: 'Sağlık', items: [] },
            { name: 'Sosyal', items: [] }
        ]
    },
    {
        id: 'ielts-toefl',
        name: 'IELTS-TOEFL',
        icon: Globe,
        color: '#06b6d4',
        subcategories: [
            { name: 'Set 1', items: [] },
            { name: 'Set 2', items: [] },
            { name: 'Set 3', items: [] }
        ]
    }
];

const EnglishSection = ({ onBack }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setSelectedSubcategory(null);
    };

    const handleSubcategoryClick = (subcategory) => {
        setSelectedSubcategory(subcategory);
    };

    const handleBackClick = () => {
        if (selectedSubcategory) {
            setSelectedSubcategory(null);
        } else if (selectedCategory) {
            setSelectedCategory(null);
        } else {
            onBack();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="english-section-page"
        >
            {/* Header */}
            <div className="english-header">
                <button onClick={handleBackClick} className="btn-back-english">
                    <ArrowLeft size={20} /> {selectedSubcategory ? selectedCategory.name : selectedCategory ? 'Kategoriler' : 'Dersler'}
                </button>
                <div className="english-title">
                    <Globe size={40} className="english-title-icon" />
                    <h1>İNGİLİZCE</h1>
                    <p>{selectedSubcategory ? selectedSubcategory.name : selectedCategory ? selectedCategory.name : 'Seviyeni seç, öğrenmeye başla!'}</p>
                </div>
            </div>

            {/* Kelime Kampı Link */}
            {!selectedCategory && (
                <motion.a
                    href="https://kelime-kampi-app.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kelime-kampi-banner"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="banner-content">
                        <span className="banner-icon">🎴</span>
                        <div>
                            <h3>Kelime Kampı</h3>
                            <p>Flashcard uygulaması ile kelime ezberle</p>
                        </div>
                    </div>
                    <ExternalLink size={20} />
                </motion.a>
            )}

            {/* Content */}
            <div className="english-content">
                <AnimatePresence mode="wait">
                    {/* Categories Grid */}
                    {!selectedCategory && (
                        <motion.div
                            key="categories"
                            className="categories-grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {categories.map((category, index) => {
                                const IconComponent = category.icon;
                                return (
                                    <motion.div
                                        key={category.id}
                                        className="category-card"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: 1.03, y: -5 }}
                                        onClick={() => handleCategoryClick(category)}
                                        style={{ '--category-color': category.color }}
                                    >
                                        <div className="category-icon-wrapper">
                                            <IconComponent size={40} />
                                        </div>
                                        <h3>{category.name}</h3>
                                        <span className="category-count">{category.subcategories.length} bölüm</span>
                                        <ChevronRight className="category-arrow" size={20} />
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Subcategories List */}
                    {selectedCategory && !selectedSubcategory && (
                        <motion.div
                            key="subcategories"
                            className="subcategories-list"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                        >
                            {selectedCategory.subcategories.map((sub, index) => (
                                <motion.div
                                    key={sub.name}
                                    className="subcategory-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.02, x: 10 }}
                                    onClick={() => handleSubcategoryClick(sub)}
                                    style={{ '--category-color': selectedCategory.color }}
                                >
                                    <div className="subcategory-info">
                                        <h4>{sub.name}</h4>
                                        <span>{sub.items.length} konu</span>
                                    </div>
                                    <ChevronRight size={20} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Topics List */}
                    {selectedSubcategory && (
                        <motion.div
                            key="topics"
                            className="topics-list"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                        >
                            {selectedSubcategory.items.length === 0 ? (
                                <div className="empty-topics">
                                    <p>🚧 Bu bölüm yakında eklenecek!</p>
                                </div>
                            ) : (
                                selectedSubcategory.items.map((topic, index) => (
                                    <motion.div
                                        key={topic}
                                        className="topic-card"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        whileHover={{ scale: 1.01, x: 5 }}
                                        style={{ '--category-color': selectedCategory.color }}
                                    >
                                        <FileText size={18} className="topic-icon" />
                                        <span>{topic}</span>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default EnglishSection;
