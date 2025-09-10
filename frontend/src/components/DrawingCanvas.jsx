import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  ButtonGroup,
  Slider,
  Typography,
  Stack,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Brush as BrushIcon,
  Delete as EraseIcon,
  Clear as ClearIcon,
  Undo as UndoIcon,
  Redo as RedoIcon
} from '@mui/icons-material';

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#90EE90', '#FFB6C1'
];

const BRUSH_SIZES = [2, 5, 10, 15, 20, 30];

export default function DrawingCanvas({ 
  onDrawingChange, 
  disabled = false, 
  initialDrawing = null,
  width = 600,
  height = 400
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('brush');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentSize, setCurrentSize] = useState(5);
  const [drawingHistory, setDrawingHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Load initial drawing if provided
    if (initialDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        saveToHistory();
      };
      img.src = initialDrawing;
    } else {
      saveToHistory();
    }
  }, [initialDrawing, width, height]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL();
    setDrawingHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(dataURL);
      return newHistory;
    });
    setHistoryStep(prev => prev + 1);
  }, [historyStep]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (disabled) return;
    
    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;

    const coords = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (currentTool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentSize;
    } else if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = currentSize;
    }

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    saveToHistory();
    
    // Emit drawing change
    if (onDrawingChange) {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL();
      onDrawingChange(dataURL);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    saveToHistory();
    
    if (onDrawingChange) {
      onDrawingChange(canvas.toDataURL());
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(prev => prev - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        if (onDrawingChange) {
          onDrawingChange(canvas.toDataURL());
        }
      };
      img.src = drawingHistory[historyStep - 1];
    }
  };

  const redo = () => {
    if (historyStep < drawingHistory.length - 1) {
      setHistoryStep(prev => prev + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        if (onDrawingChange) {
          onDrawingChange(canvas.toDataURL());
        }
      };
      img.src = drawingHistory[historyStep + 1];
    }
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    startDrawing(mouseEvent);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    draw(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  return (
    <Box>
      {/* Drawing Tools */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          {/* Tool Selection */}
          <ButtonGroup variant="outlined" size="small">
            <Tooltip title="Brush">
              <IconButton
                color={currentTool === 'brush' ? 'primary' : 'default'}
                onClick={() => setCurrentTool('brush')}
                disabled={disabled}
              >
                <BrushIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eraser">
              <IconButton
                color={currentTool === 'eraser' ? 'primary' : 'default'}
                onClick={() => setCurrentTool('eraser')}
                disabled={disabled}
              >
                <EraseIcon />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Color Palette */}
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {COLORS.map((color) => (
              <Box
                key={color}
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: color,
                  border: currentColor === color ? '2px solid #1976d2' : '1px solid #ccc',
                  borderRadius: '50%',
                  cursor: disabled ? 'default' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  '&:hover': disabled ? {} : {
                    transform: 'scale(1.1)'
                  }
                }}
                onClick={() => !disabled && setCurrentColor(color)}
              />
            ))}
          </Stack>

          <Divider orientation="vertical" flexItem />

          {/* Brush Size */}
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="caption" gutterBottom>
              Size: {currentSize}px
            </Typography>
            <Slider
              value={currentSize}
              onChange={(e, value) => setCurrentSize(value)}
              min={1}
              max={50}
              marks={BRUSH_SIZES.map(size => ({ value: size, label: size }))}
              disabled={disabled}
              size="small"
            />
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Action Buttons */}
          <ButtonGroup variant="outlined" size="small">
            <Tooltip title="Undo">
              <IconButton
                onClick={undo}
                disabled={disabled || historyStep <= 0}
              >
                <UndoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo">
              <IconButton
                onClick={redo}
                disabled={disabled || historyStep >= drawingHistory.length - 1}
              >
                <RedoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Canvas">
              <IconButton
                onClick={clearCanvas}
                disabled={disabled}
                color="error"
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
        </Stack>
      </Paper>

      {/* Drawing Canvas */}
      <Paper 
        elevation={3}
        sx={{ 
          display: 'inline-block',
          border: '2px solid #e0e0e0',
          borderRadius: 1,
          overflow: 'hidden',
          maxWidth: '100%'
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: 'block',
            cursor: disabled ? 'default' : (currentTool === 'brush' ? 'crosshair' : 'grab'),
            touchAction: 'none',
            maxWidth: '100%',
            height: 'auto'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </Paper>

      {disabled && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Drawing is disabled
        </Typography>
      )}
    </Box>
  );
}
