import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  CircularProgress,
  Checkbox,
  IconButton,
  FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface Task {
  id: string;
  content: string;
  completed?: boolean;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface BoardData {
  [key: string]: Column;
}

const initialColumns: BoardData = {
  todo: {
    id: 'todo',
    title: 'To Do',
    tasks: []
  },
  inProgress: {
    id: 'inProgress',
    title: 'In Progress',
    tasks: []
  },
  done: {
    id: 'done',
    title: 'Done',
    tasks: []
  }
};

const columnColors = {
  todo: '#fff3e0', // warm orange background
  inProgress: '#e8eaf6', // cool indigo background
  done: '#e0f2f1' // teal background
};

const columnHeaderColors = {
  todo: '#ff9800', // orange
  inProgress: '#3f51b5', // indigo
  done: '#009688' // teal
};

const KanbanBoard = () => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<BoardData>(initialColumns);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'boards', user.uid);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.columns) {
          // Ensure tasks array exists for each column
          const boardData: BoardData = {
            todo: {
              ...initialColumns.todo,
              tasks: Array.isArray(data.columns.todo?.tasks) ? data.columns.todo.tasks : []
            },
            inProgress: {
              ...initialColumns.inProgress,
              tasks: Array.isArray(data.columns.inProgress?.tasks) ? data.columns.inProgress.tasks : []
            },
            done: {
              ...initialColumns.done,
              tasks: Array.isArray(data.columns.done?.tasks) ? data.columns.done.tasks : []
            }
          };
          setColumns(boardData);
        } else {
          setColumns(initialColumns);
        }
      } else {
        // Initialize board for new users
        setDoc(docRef, {
          userId: user.uid,
          columns: initialColumns
        });
        setColumns(initialColumns);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateBoard = async (newColumns: BoardData) => {
    if (!user) return;
    try {
      // Ensure the data structure is clean before saving
      const cleanColumns = Object.keys(newColumns).reduce((acc, key) => {
        acc[key] = {
          id: newColumns[key].id,
          title: newColumns[key].title,
          tasks: newColumns[key].tasks || []
        };
        return acc;
      }, {} as BoardData);

      await setDoc(doc(db, 'boards', user.uid), {
        userId: user.uid,
        columns: cleanColumns
      });
    } catch (error) {
      console.error('Error updating board:', error);
    }
  };

  const moveTask = async (taskId: string, fromColumn: string, toColumn: string) => {
    const newColumns = { ...columns };
    const taskIndex = newColumns[fromColumn].tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
      const [task] = newColumns[fromColumn].tasks.splice(taskIndex, 1);
      newColumns[toColumn].tasks.push(task);
      setColumns(newColumns);
      await updateBoard(newColumns);
    }
  };

  const deleteTask = async (columnId: string, taskId: string) => {
    const newColumns = { ...columns };
    newColumns[columnId].tasks = newColumns[columnId].tasks.filter(task => task.id !== taskId);
    setColumns(newColumns);
    await updateBoard(newColumns);
  };

  const handleAddTask = async () => {
    if (newTask.trim()) {
      const newTaskItem: Task = {
        id: `task-${Date.now()}`,
        content: newTask,
        completed: false
      };
      
      const updatedColumns = {
        ...columns,
        todo: {
          ...columns.todo,
          tasks: [...columns.todo.tasks, newTaskItem]
        }
      };
      
      setColumns(updatedColumns);
      await updateBoard(updatedColumns);
      setNewTask('');
      setIsDialogOpen(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          bgcolor: 'primary.light', 
          color: 'primary.contrastText',
          borderRadius: 2
        }}
      >
        <Typography variant="h4" gutterBottom>
          Task Board
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsDialogOpen(true)}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'grey.100'
            }
          }}
        >
          Add New Task
        </Button>
      </Paper>
      
      <Box sx={{ 
        display: 'flex', 
        gap: 3,
        overflowX: 'auto',
        pb: 2
      }}>
        {Object.entries(columns).map(([columnId, column]) => (
          <Box key={column.id} sx={{ minWidth: 300, width: 300 }}>
            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: columnColors[columnId as keyof typeof columnColors],
                borderRadius: 2,
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s'
                }
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  color: columnHeaderColors[columnId as keyof typeof columnHeaderColors],
                  fontWeight: 'bold',
                  pb: 2,
                  borderBottom: 1,
                  borderColor: 'grey.300'
                }}
              >
                {column.title} ({column.tasks.length})
              </Typography>
              <Box sx={{ 
                minHeight: 500,
                maxHeight: '70vh',
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                }
              }}>
                {column.tasks.map((task) => (
                  <Paper
                    key={task.id}
                    sx={{ 
                      p: 2, 
                      mb: 1, 
                      bgcolor: '#ffffff',
                      display: 'flex', 
                      alignItems: 'center',
                      borderRadius: 1,
                      boxShadow: 1,
                      '&:hover': {
                        boxShadow: 2,
                        bgcolor: '#fafafa'
                      }
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={columnId === 'done'}
                          onChange={() => moveTask(task.id, columnId, columnId === 'done' ? 'todo' : 'done')}
                          sx={{ '&.Mui-checked': { color: columnHeaderColors[columnId as keyof typeof columnHeaderColors] } }}
                        />
                      }
                      label={
                        <Typography 
                          sx={{ 
                            textDecoration: columnId === 'done' ? 'line-through' : 'none',
                            color: columnId === 'done' ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {task.content}
                        </Typography>
                      }
                      sx={{ flexGrow: 1 }}
                    />
                    {columnId !== 'done' && (
                      <IconButton
                        size="small"
                        sx={{ 
                          color: columnHeaderColors[columnId as keyof typeof columnHeaderColors],
                          '&:hover': { bgcolor: `${columnColors[columnId as keyof typeof columnColors]}50` }
                        }}
                        onClick={() => moveTask(task.id, columnId, columnId === 'todo' ? 'inProgress' : 'done')}
                      >
                        <ArrowForwardIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      sx={{ 
                        color: 'error.light',
                        '&:hover': { bgcolor: '#ffebee' }
                      }}
                      onClick={() => deleteTask(columnId, task.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* Enhanced Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Add New Task
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Task Description"
            fullWidth
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setIsDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddTask} 
            variant="contained"
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KanbanBoard;