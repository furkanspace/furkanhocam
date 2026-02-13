const API_URL = import.meta.env.PROD ? '/api/tournaments' : 'http://localhost:5001/api/tournaments';

export const getTournaments = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        return [];
    }
};

export const createTournament = async (tournamentData) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tournamentData),
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error creating tournament:', error);
        throw error;
    }
};

export const updateTournament = async (id, tournamentData) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tournamentData),
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error updating tournament:', error);
        throw error;
    }
};

export const deleteTournament = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete tournament');
        return await response.json();
    } catch (error) {
        console.error('Error deleting tournament:', error);
        throw error;
    }
};

// File API
const FILES_API_URL = import.meta.env.PROD ? '/api/files' : 'http://localhost:5001/api/files';

export const getFiles = async (path) => {
    try {
        const response = await fetch(`${FILES_API_URL}/list?path=${encodeURIComponent(path)}`);
        if (!response.ok) throw new Error('Failed to fetch files');
        return await response.json();
    } catch (error) {
        console.error('Error fetching files:', error);
        throw error;
    }
};

export const uploadFile = async (path, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    try {
        const response = await fetch(`${FILES_API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload file');
        return await response.json();
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const deleteFile = async (path) => {
    try {
        const response = await fetch(`${FILES_API_URL}?path=${encodeURIComponent(path)}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete file');
        return await response.json();
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};
