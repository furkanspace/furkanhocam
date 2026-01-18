import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Share2, X, Edit2, Trash2, Check, Lock, Download, Copy } from 'lucide-react';

const ADMIN_PASSWORD = 'halilhoca...com';

const TrophyCase = ({ trophies, onDeleteTrophy, onEditTrophy }) => {
    const [selectedTrophy, setSelectedTrophy] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [editingTrophy, setEditingTrophy] = useState(null);
    const [editWinner, setEditWinner] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [copied, setCopied] = useState(false);
    const cardRef = useRef(null);

    const handleShare = (trophy) => {
        setSelectedTrophy(trophy);
        setShowShareModal(true);
        setCopied(false);
    };

    const requestAuth = (action) => {
        if (isAuthenticated) {
            action();
        } else {
            setPendingAction(() => action);
            setShowPasswordModal(true);
            setPasswordInput('');
            setPasswordError(false);
        }
    };

    const handlePasswordSubmit = () => {
        if (passwordInput === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setShowPasswordModal(false);
            if (pendingAction) pendingAction();
        } else {
            setPasswordError(true);
        }
    };

    const handleEdit = (trophy) => {
        requestAuth(() => {
            setEditingTrophy(trophy.id);
            setEditWinner(trophy.winner);
        });
    };

    const saveEdit = (trophyId) => {
        if (editWinner.trim() && onEditTrophy) {
            onEditTrophy(trophyId, { winner: editWinner.trim() });
        }
        setEditingTrophy(null);
    };

    const handleDelete = (trophy) => {
        requestAuth(() => {
            if (confirm(`"${trophy.winner}" şampiyonluğunu silmek istediğinize emin misiniz?`)) {
                onDeleteTrophy(trophy.id);
            }
        });
    };

    const getShareUrl = () => window.location.href;

    const getShareText = (trophy) => {
        return `🏆🏆🏆 ŞAMPİYON BELLI OLDU! 🏆🏆🏆

🥇 ${trophy.winner.toUpperCase()} 🥇

${trophy.name} turnuvasının şampiyonu!

📅 ${trophy.date}
⚽ ${trophy.mode === 'LEAGUE' ? 'Lig Formatı' : 'Kupa Formatı'}

Tebrikler! 🎉🎊

#şampiyon #futbol #turnuva #${trophy.winner.replace(/\s+/g, '')}`;
    };

    const getShortShareText = (trophy) => {
        return `🏆 ${trophy.winner} şampiyon oldu! | ${trophy.name} | ${trophy.date} #şampiyon #turnuva`;
    };

    const shareToFacebook = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}&quote=${encodeURIComponent(getShareText(selectedTrophy))}`;
        window.open(url, '_blank', 'width=600,height=400');
    };

    const shareToTwitter = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShortShareText(selectedTrophy))}&url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank', 'width=600,height=400');
    };

    const shareToWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(getShareText(selectedTrophy) + '\n\n' + getShareUrl())}`;
        window.open(url, '_blank');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getShareText(selectedTrophy) + '\n\n' + getShareUrl());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadCard = async () => {
        if (!cardRef.current) return;

        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#0a0a0a',
                scale: 2
            });

            const link = document.createElement('a');
            link.download = `${selectedTrophy.winner}_sampiyon.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            alert('Görsel indirilemedi. Ekran görüntüsü alabilirsiniz.');
        }
    };

    return (
        <>
            {/* Password Modal */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <Lock size={24} className="modal-icon" />
                            <h3>Admin Şifresi</h3>
                        </div>
                        <p>Bu işlem için yönetici şifresini girin:</p>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                            placeholder="Şifre"
                            className={`password-input ${passwordError ? 'error' : ''}`}
                            autoFocus
                        />
                        {passwordError && <span className="error-text">Yanlış şifre!</span>}
                        <div className="modal-buttons">
                            <button onClick={() => setShowPasswordModal(false)} className="btn-cancel">İptal</button>
                            <button onClick={handlePasswordSubmit} className="btn-confirm">Onayla</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="trophy-case glass-panel">
                <h2><Trophy className="trophy-icon" /> Kupalar</h2>
                <div className="trophy-grid">
                    {trophies.map((trophy, index) => (
                        <motion.div
                            key={trophy.id || index}
                            className="trophy-item"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1, type: 'spring' }}
                        >
                            {/* Admin Controls */}
                            <div className="trophy-admin-controls">
                                <button className="btn-trophy-edit" onClick={() => handleEdit(trophy)}>
                                    <Edit2 size={14} />
                                </button>
                                <button className="btn-trophy-delete" onClick={() => handleDelete(trophy)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <motion.div
                                className="trophy-animation"
                                animate={{
                                    rotateY: [0, 10, -10, 0],
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 3,
                                    delay: index * 0.5
                                }}
                            >
                                <Trophy size={60} className="trophy-gold" />
                            </motion.div>
                            <div className="trophy-info">
                                {editingTrophy === trophy.id ? (
                                    <div className="trophy-edit-inline">
                                        <input
                                            type="text"
                                            value={editWinner}
                                            onChange={(e) => setEditWinner(e.target.value)}
                                            className="edit-input"
                                            autoFocus
                                        />
                                        <button onClick={() => saveEdit(trophy.id)} className="btn-edit-save">
                                            <Check size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="trophy-winner">{trophy.winner}</span>
                                )}
                                <span className="trophy-tournament">{trophy.name}</span>
                                <span className="trophy-date">{trophy.date}</span>
                            </div>
                            <button className="btn-share" onClick={() => handleShare(trophy)}>
                                <Share2 size={16} /> Paylaş
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Enhanced Share Modal */}
            {showShareModal && selectedTrophy && (
                <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="share-modal-enhanced glass-panel" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowShareModal(false)}>
                            <X size={20} />
                        </button>

                        {/* Downloadable Trophy Card */}
                        <div className="share-card-container">
                            <div className="share-card" ref={cardRef}>
                                <div className="share-card-bg">
                                    <div className="share-card-confetti"></div>
                                </div>
                                <div className="share-card-content">
                                    <div className="share-card-header">
                                        <span>🏆 ŞAMPİYON 🏆</span>
                                    </div>
                                    <motion.div
                                        className="share-card-trophy"
                                        animate={{
                                            rotateY: [0, 360],
                                            scale: [1, 1.1, 1]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    >
                                        <Trophy size={100} color="#ffd700" />
                                    </motion.div>
                                    <h2 className="share-card-winner">{selectedTrophy.winner}</h2>
                                    <div className="share-card-divider"></div>
                                    <p className="share-card-tournament">{selectedTrophy.name}</p>
                                    <p className="share-card-date">📅 {selectedTrophy.date}</p>
                                    <div className="share-card-footer">
                                        <span>⚽ TEBRİKLER! ⚽</span>
                                    </div>
                                </div>
                            </div>

                            <button className="btn-download-card" onClick={downloadCard}>
                                <Download size={18} /> Görseli İndir
                            </button>
                        </div>

                        {/* Share Text Preview */}
                        <div className="share-text-preview">
                            <h4>Paylaşım Metni:</h4>
                            <div className="share-text-box">
                                {getShareText(selectedTrophy)}
                            </div>
                            <button className={`btn-copy-text ${copied ? 'copied' : ''}`} onClick={copyToClipboard}>
                                <Copy size={16} /> {copied ? 'Kopyalandı!' : 'Metni Kopyala'}
                            </button>
                        </div>

                        {/* Social Share Buttons */}
                        <div className="share-buttons-enhanced">
                            <button className="share-btn-large facebook" onClick={shareToFacebook}>
                                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                Facebook'ta Paylaş
                            </button>
                            <button className="share-btn-large twitter" onClick={shareToTwitter}>
                                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                Twitter'da Paylaş
                            </button>
                            <button className="share-btn-large whatsapp" onClick={shareToWhatsApp}>
                                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                WhatsApp'ta Paylaş
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TrophyCase;
