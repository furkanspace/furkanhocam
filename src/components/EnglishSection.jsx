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
                    'Classroom Rules', 'Nationality', 'Cartoon Characters', 'Free Time',
                    'My Day', 'Fun With Science', 'Jobs', 'My Clothes', 'My Friends', 'Food and Drinks'
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
                items: ['Hello', 'My Town', 'Games and Hobbies', 'My Daily Routine', 'Health', 'Movies', 'Party Time', 'Fitness', 'The Animal Shelter', 'Festivals']
            },
            {
                name: '6. Sınıf',
                items: ['Life', 'Yummy Breakfast', 'Downtown', 'Weather and Emotions', 'At the Fair', 'Occupations', 'Holidays', 'Bookworms', 'Saving the Planet', 'Democracy']
            },
            {
                name: '7. Sınıf',
                items: ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5', 'Unit 6', 'Unit 7', 'Unit 8', 'Unit 9', 'Unit 10']
            },
            {
                name: '8. Sınıf',
                items: ['Friendship', 'Teen', 'The Kitchen', 'On the Phone', 'The Internet', 'Adventures', 'Tourism', 'Chores', 'Science', 'Natural Forces']
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
                items: ['Studying Abroad', 'My Environment', 'Movies', 'Human in Nature', 'Inspirational People', 'Bridging Cultures', 'World Heritage', 'Emergency and Health', 'Invitations', 'TV and Social Media']
            },
            {
                name: '10. Sınıf',
                items: ['School Life', 'Plans', 'Legendary Figures', 'Traditions', 'Travel', 'Helpful Tips', 'Food and Festivals', 'Digital Era', 'Heroes and Heroines', 'Shopping']
            },
            {
                name: '11. Sınıf',
                items: ['Future Jobs', 'Hobbies and Skills', 'Hard Times', 'What a Life', 'Back to the Past', 'Open Your Heart', 'Facts About Turkey', 'Sports', 'My Friends', 'Values and Norms']
            },
            {
                name: '12. Sınıf',
                items: ['Music', 'Friendship', 'Human Rights', 'Coming Soon', 'Psychology', 'Favors', 'News Stories', 'Alternative Energy', 'Technology', 'Manners']
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
        id: 'exams',
        name: 'Sınavlar',
        icon: Award,
        color: '#ec4899',
        subcategories: [
            { name: 'YDS', items: ['YDS 1', 'YDS 2', 'YDS 3'] },
            { name: 'YÖKDİL', items: ['Fen', 'Sağlık', 'Sosyal'] },
            { name: 'IELTS-TOEFL', items: ['Set 1', 'Set 2', 'Set 3'] }
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
