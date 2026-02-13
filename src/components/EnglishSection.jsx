import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, ChevronRight, GraduationCap, School, Building2, Globe, Award, FileText, ExternalLink, Lock, Upload, Trash2, Download, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFiles, uploadFile, deleteFile } from '../api';

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
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { user } = useAuth(); // Get user from context

    // Helpers
    const getPath = (category, subcategory) => {
        const catId = category.id;
        // Normalize subcategory name to folder name (e.g. "4. Sınıf" -> "4.sinif")
        let subName = subcategory.name.toLowerCase().replace(' sınıf', '.sinif').replace(/\s+/g, '');
        // Special cases if needed, matching the folder structure created
        if (catId === 'ielts-toefl') subName = subcategory.name.toLowerCase().replace(/\s+/g, '-');
        if (catId === 'yds') subName = subcategory.name.toLowerCase().replace(/\s+/g, '');
        // Let's check folders created: yokdilfen, yokdilsaglik, yokdilsosyal
        if (catId === 'yokdil') subName = 'yokdil' + subcategory.name.toLowerCase();

        // Fix for simple cases
        subName = subName.replace('ı', 'i').replace('ç', 'c').replace('ş', 's').replace('ö', 'o').replace('ü', 'u').replace('ğ', 'g');

        return `${catId}/${subName}`;
    };

    const fetchFiles = async (category, subcategory) => {
        setLoading(true);
        try {
            const path = getPath(category, subcategory);
            const fileList = await getFiles(path);
            setFiles(fileList);
        } catch (error) {
            console.error(error);
            setFiles([]); // Fallback to empty or could show error
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setSelectedSubcategory(null);
    };

    const handleSubcategoryClick = (subcategory) => {
        setSelectedSubcategory(subcategory);
        fetchFiles(selectedCategory, subcategory);
    };

    const handleBackClick = () => {
        if (selectedSubcategory) {
            setSelectedSubcategory(null);
            setFiles([]);
        } else if (selectedCategory) {
            setSelectedCategory(null);
            onBack(); // Ensure EnglishSection resets correctly or parent handles it
        } else {
            onBack();
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const path = getPath(selectedCategory, selectedSubcategory);
            await uploadFile(path, file);
            await fetchFiles(selectedCategory, selectedSubcategory); // Refresh
        } catch (error) {
            alert('Yükleme başarısız!');
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    const handleDelete = async (filename) => {
        if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;

        try {
            const path = `${getPath(selectedCategory, selectedSubcategory)}/${filename}`;
            await deleteFile(path);
            await fetchFiles(selectedCategory, selectedSubcategory); // Refresh
        } catch (error) {
            alert('Silme başarısız!');
        }
    };

    const canManageFiles = user && user.role === 'admin';

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
                                        <span>{sub.items.length > 0 ? sub.items.length + ' konu' : 'Dosyaları Görüntüle'}</span>
                                    </div>
                                    <ChevronRight size={20} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Files List */}
                    {selectedSubcategory && (
                        <motion.div
                            key="files"
                            className="files-container"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                        >
                            {/* Toolbar */}
                            <div className="files-toolbar">
                                <h3>Dosyalar: {selectedSubcategory.name}</h3>
                                {canManageFiles && (
                                    <>
                                        <button
                                            className="btn-upload"
                                            onClick={() => document.getElementById('file-upload').click()}
                                        >
                                            <Upload size={18} /> Dosya Yükle
                                        </button>
                                        <input
                                            type="file"
                                            id="file-upload"
                                            style={{ display: 'none' }}
                                            onChange={handleUpload}
                                            disabled={uploading}
                                        />
                                    </>
                                )}
                            </div>

                            {loading ? (
                                <div className="loading-spinner">Yükleniyor...</div>
                            ) : files.length === 0 ? (
                                <div className="empty-state">
                                    <p>Bu klasörde henüz dosya yok.</p>
                                </div>
                            ) : (
                                <div className="files-grid">
                                    {files.map((file, index) => (
                                        <motion.div
                                            key={file.name}
                                            className="file-card"
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <div className="file-icon">
                                                <FileText size={24} />
                                            </div>
                                            <div className="file-info">
                                                <span className="file-name" title={file.name}>{file.name}</span>
                                                <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                            <div className="file-actions">
                                                <a
                                                    href={import.meta.env.PROD ? file.url : `http://localhost:5001${file.url}`}
                                                    target="_blank"
                                                    download
                                                    className="btn-download"
                                                    title="İndir"
                                                >
                                                    <Download size={18} />
                                                </a>
                                                {canManageFiles && (
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleDelete(file.name)}
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default EnglishSection;
