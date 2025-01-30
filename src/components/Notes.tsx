import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, doc, setDoc, onSnapshot, query, where, deleteDoc, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

// Add this after the existing Note interface
type NoteCategory = 'catatan' | 'akun' | 'link' | 'must-buy' | 'other';

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  category: NoteCategory;
}

// Add this constant for category colors
const categoryColors = {
  'catatan': '#4CAF50',
  'akun': '#2196F3',
  'link': '#9C27B0',
  'must-buy': '#F44336',
  'other': '#FF9800'
};

const categoryIcons = {
  'catatan': '📝',
  'akun': '👤',
  'link': '🔗',
  'must-buy': '🛒',
  'other': '📌'
};

const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [category, setCategory] = useState<NoteCategory>('catatan');
  const [filterCategory, setFilterCategory] = useState<NoteCategory | 'all'>('all');

  useEffect(() => {
    if (!user) return;

    const notesRef = collection(db, 'notes');
    const q = query(
      notesRef, 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')  // Add back the orderBy
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const noteData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        content: doc.data().content,
        category: doc.data().category || 'other',
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      setNotes(noteData);  // Remove the manual sort since Firestore handles it
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddNote = async () => {
    if (!user || !newNote.trim()) return;

    try {
      const noteRef = doc(collection(db, 'notes'));
      await setDoc(noteRef, {
        content: newNote.trim(),
        category: category,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Modify the return JSX
  const filteredNotes = notes.filter(note => 
    filterCategory === 'all' ? true : note.category === filterCategory
  );

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4,
          borderRadius: 2,
          background: 'linear-gradient(145deg, #f5f5f5 0%, #ffffff 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ 
            mb: 4,
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #3f51b5 30%, #2196F3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Notes Manager
        </Typography>

        <Stack spacing={4}>
          {/* Add Note Form */}
          <Paper 
            elevation={0}
            sx={{ 
              bgcolor: '#f8f9fa',
              p: 3,
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ color: '#3f51b5', fontWeight: 500 }}
            >
              Add New Note
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value as NoteCategory)}
                  sx={{ 
                    borderRadius: 1,
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }
                  }}
                >
                  {Object.keys(categoryColors).map((cat) => (
                    <MenuItem 
                      key={cat} 
                      value={cat}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <span>{categoryIcons[cat as NoteCategory]}</span>
                      <span style={{ 
                        color: categoryColors[cat as NoteCategory],
                        fontWeight: 500
                      }}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="New Note"
                placeholder="Write your note here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                multiline
                rows={4}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    bgcolor: 'white'
                  }
                }}
              />

              <Button 
                variant="contained" 
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                sx={{ 
                  alignSelf: 'flex-start',
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: '#3f51b5',
                  '&:hover': {
                    bgcolor: '#303f9f'
                  }
                }}
              >
                Add Note
              </Button>
            </Stack>
          </Paper>

          {/* Filter Section */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: '#f8f9fa'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Filter by:
            </Typography>
            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={filterCategory}
                size="small"
                onChange={(e) => setFilterCategory(e.target.value as NoteCategory | 'all')}
                sx={{ 
                  borderRadius: 1,
                  bgcolor: 'white',
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }
                }}
              >
                <MenuItem value="all">🗂 All Categories</MenuItem>
                {Object.keys(categoryColors).map((cat) => (
                  <MenuItem 
                    key={cat} 
                    value={cat}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <span>{categoryIcons[cat as NoteCategory]}</span>
                    <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Notes List */}
          <Stack spacing={2}>
            {filteredNotes.map((note) => (
              <Paper 
                key={note.id} 
                elevation={0}
                sx={{ 
                  p: 3, 
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  borderLeft: `4px solid ${categoryColors[note.category]}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      flex: 1,
                      mr: 2
                    }}
                  >
                    {note.content}
                  </Typography>
                  <IconButton 
                    onClick={() => handleDeleteNote(note.id)} 
                    size="small"
                    sx={{
                      color: 'grey.400',
                      '&:hover': {
                        color: 'error.main',
                        bgcolor: 'error.light'
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mt: 2
                }}>
                  <Typography 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: categoryColors[note.category],
                      fontWeight: 500
                    }}
                  >
                    <span>{categoryIcons[note.category]}</span>
                    {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {note.createdAt.toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Notes;